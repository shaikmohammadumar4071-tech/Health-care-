from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.models.entity_models import AuditEvent
from app.schemas.schemas import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    hospital_id: Optional[str] = Query(None, description="Filter by hospital ID"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)
    if event_type:
        query = query.filter(AuditEvent.event_type == event_type)
    if hospital_id:
        query = query.filter(AuditEvent.hospital_id == hospital_id)
        
    logs = query.order_by(AuditEvent.timestamp.desc()).limit(limit).all()
    return logs
