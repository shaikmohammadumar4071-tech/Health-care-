from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.entity_models import Hospital, HospitalParticipation, TrustHistory, AuditEvent
from app.schemas.schemas import HospitalResponse, HospitalCreate, HospitalUpdate
from federated.coordinator.orchestrator import coordinator

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

@router.get("", response_model=List[HospitalResponse])
def get_all_hospitals(db: Session = Depends(get_db)):
    coordinator.initialize_default_hospitals()
    hospitals = db.query(Hospital).order_by(Hospital.id).all()
    return hospitals

@router.post("", response_model=HospitalResponse, status_code=status.HTTP_201_CREATED)
def register_hospital(hospital_in: HospitalCreate, db: Session = Depends(get_db)):
    existing = db.query(Hospital).filter(Hospital.id == hospital_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Hospital ID {hospital_in.id} already exists")

    new_h = Hospital(
        id=hospital_in.id,
        name=hospital_in.name,
        region=hospital_in.region,
        status="ACTIVE",
        local_dataset_size=hospital_in.local_dataset_size,
        current_model_version=coordinator.global_model_version,
        trust_score=0.50, # Initial neutral trust score
        communication_reliability=hospital_in.communication_reliability,
        latency_ms=hospital_in.latency_ms
    )
    db.add(new_h)
    
    # Audit log
    audit = AuditEvent(
        event_type="HOSPITAL_REGISTRATION",
        actor_id="ADMIN_USER",
        actor_role="ADMIN",
        hospital_id=hospital_in.id,
        details=f"Registered hospital {hospital_in.name} in region {hospital_in.region}."
    )
    db.add(audit)
    db.commit()
    db.refresh(new_h)

    # Initialize client in coordinator
    from federated.clients.hospital_client import HospitalClient
    coordinator.clients[new_h.id] = HospitalClient(
        hospital_id=new_h.id,
        hospital_name=new_h.name,
        region=new_h.region,
        num_samples=new_h.local_dataset_size,
        baseline_latency_ms=new_h.latency_ms
    )
    return new_h

@router.get("/{id}")
def get_hospital_details(id: str, db: Session = Depends(get_db)):
    h = db.query(Hospital).filter(Hospital.id == id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # Fetch participation history and trust history
    participations = (
        db.query(HospitalParticipation)
        .filter(HospitalParticipation.hospital_id == id)
        .order_by(HospitalParticipation.id.desc())
        .limit(20)
        .all()
    )

    trust_records = (
        db.query(TrustHistory)
        .filter(TrustHistory.hospital_id == id)
        .order_by(TrustHistory.round_number.asc())
        .all()
    )

    return {
        "hospital": h,
        "recent_participations": participations,
        "trust_evolution": trust_records,
        "client_active_in_memory": id in coordinator.clients
    }

@router.patch("/{id}", response_model=HospitalResponse)
def update_hospital(id: str, update_in: HospitalUpdate, db: Session = Depends(get_db)):
    h = db.query(Hospital).filter(Hospital.id == id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")

    update_data = update_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(h, field, val)

    audit = AuditEvent(
        event_type="HOSPITAL_UPDATE",
        actor_id="ADMIN_USER",
        actor_role="ADMIN",
        hospital_id=id,
        details=f"Updated hospital parameters: {', '.join(update_data.keys())}."
    )
    db.add(audit)
    db.commit()
    db.refresh(h)
    return h

@router.post("/{id}/toggle-status")
def toggle_hospital_status(id: str, db: Session = Depends(get_db)):
    h = db.query(Hospital).filter(Hospital.id == id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")

    new_status = "INACTIVE" if h.status == "ACTIVE" else "ACTIVE"
    h.status = new_status
    
    audit = AuditEvent(
        event_type="HOSPITAL_STATUS_TOGGLE",
        actor_id="ADMIN_USER",
        actor_role="ADMIN",
        hospital_id=id,
        details=f"Hospital status changed to {new_status}."
    )
    db.add(audit)
    db.commit()
    return {"id": id, "status": new_status, "message": f"Hospital status is now {new_status}"}
