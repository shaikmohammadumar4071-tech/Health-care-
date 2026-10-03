from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.session import get_db
from app.models.entity_models import Hospital, TrustHistory, HospitalParticipation
from app.schemas.schemas import TrustScoreItem, TrustHistoryItemResponse
from federated.coordinator.orchestrator import coordinator

router = APIRouter(prefix="/trust", tags=["Trust Management"])

@router.get("/scores", response_model=List[TrustScoreItem])
def get_current_trust_scores(db: Session = Depends(get_db)):
    coordinator.initialize_default_hospitals()
    hospitals = db.query(Hospital).order_by(Hospital.id).all()
    
    # Calculate aggregation weights across active hospitals
    active_hids = [h.id for h in hospitals if h.status == "ACTIVE"]
    samples_dict = {h.id: h.local_dataset_size for h in hospitals if h.status == "ACTIVE"}
    trust_dict = {h.id: h.trust_score for h in hospitals if h.status == "ACTIVE"}
    
    weights_dict = coordinator.trust_manager.compute_aggregation_weights(
        samples_dict,
        trust_dict,
        active_hids
    )

    results = []
    for h in hospitals:
        # Get latest trust history item
        latest_hist = (
            db.query(TrustHistory)
            .filter(TrustHistory.hospital_id == h.id)
            .order_by(TrustHistory.round_number.desc())
            .first()
        )

        prev_hist = (
            db.query(TrustHistory)
            .filter(TrustHistory.hospital_id == h.id)
            .order_by(TrustHistory.round_number.desc())
            .offset(1)
            .first()
        )

        trend = "STABLE"
        if latest_hist and prev_hist:
            if latest_hist.ema_trust > prev_hist.ema_trust + 0.005:
                trend = "INCREASING"
            elif latest_hist.ema_trust < prev_hist.ema_trust - 0.005:
                trend = "DECREASING"

        u = latest_hist.u_score if latest_hist else 0.85
        p = latest_hist.p_score if latest_hist else 1.0
        c = latest_hist.c_score if latest_hist else 0.95
        v = latest_hist.v_score if latest_hist else 0.80
        s = latest_hist.composite_score if latest_hist else 0.85
        reason = latest_hist.reason if latest_hist else "Initial baseline evaluation. Nominal participation profile."

        results.append({
            "hospital_id": h.id,
            "hospital_name": h.name,
            "region": h.region,
            "current_trust": round(h.trust_score, 4),
            "update_consistency_u": round(u, 4),
            "participation_p": round(p, 4),
            "comm_reliability_c": round(c, 4),
            "validation_contrib_v": round(v, 4),
            "composite_s": round(s, 4),
            "weight_a": round(weights_dict.get(h.id, 0.0), 4),
            "status": h.status,
            "trend": trend,
            "reason": reason
        })

    return results

@router.get("/history/{hospital_id}", response_model=List[TrustHistoryItemResponse])
def get_hospital_trust_history(hospital_id: str, db: Session = Depends(get_db)):
    h = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not h:
        raise HTTPException(status_code=404, detail=f"Hospital {hospital_id} not found")

    history = (
        db.query(TrustHistory)
        .filter(TrustHistory.hospital_id == hospital_id)
        .order_by(TrustHistory.round_number.asc())
        .all()
    )
    return history
