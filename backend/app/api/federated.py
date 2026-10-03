import asyncio
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.session import get_db
from app.models.entity_models import FederatedRound, HospitalParticipation, Hospital
from app.schemas.schemas import FederatedStartRequest, FederatedStatusResponse, FederatedRoundResponse
from federated.coordinator.orchestrator import coordinator

router = APIRouter(prefix="/federated", tags=["Federated Learning"])

@router.get("/status")
def get_training_status(db: Session = Depends(get_db)):
    coordinator.initialize_default_hospitals()
    
    # Calculate progress %
    total = max(1, coordinator.total_rounds)
    curr = coordinator.current_round
    progress_pct = round((curr / total) * 100, 1) if coordinator.state != "IDLE" else 0.0

    return {
        "state": coordinator.state,
        "current_round": coordinator.current_round,
        "total_rounds": coordinator.total_rounds,
        "global_model_version": coordinator.global_model_version,
        "aggregation_strategy": coordinator.aggregation_strategy,
        "active_hospitals": list(coordinator.clients.keys()),
        "training_progress_pct": progress_pct,
        "latest_accuracy": coordinator.latest_metrics["accuracy"],
        "latest_f1_score": coordinator.latest_metrics["f1_score"],
        "latest_loss": coordinator.latest_metrics["loss"],
        "latest_latency_ms": coordinator.latest_metrics["latency_ms"],
        "latest_comm_overhead_kb": coordinator.latest_metrics["comm_overhead_kb"],
        "secagg_status": coordinator.latest_metrics["secagg_status"],
        "current_logs": coordinator.logs[-30:]
    }

@router.post("/start")
def start_federated_training(req: FederatedStartRequest, db: Session = Depends(get_db)):
    coordinator.initialize_default_hospitals()
    res = coordinator.start_training(
        rounds=req.rounds,
        local_epochs=req.local_epochs,
        lr=req.learning_rate,
        aggregation_strategy=req.aggregation_strategy,
        participating_hospital_ids=req.participating_hospital_ids,
        client_dropout_prob=req.client_dropout_prob,
        trust_lambda=req.trust_lambda,
        smpc_threshold_k=req.smpc_threshold_k
    )
    if res.get("status") == "ALREADY_RUNNING":
        raise HTTPException(status_code=400, detail=res["message"])
    return res

@router.post("/pause")
def pause_training():
    return coordinator.pause_training()

@router.post("/resume")
def resume_training():
    return coordinator.resume_training()

@router.post("/stop")
def stop_training():
    return coordinator.stop_training()

@router.get("/rounds")
def get_all_rounds(db: Session = Depends(get_db)):
    rounds = db.query(FederatedRound).order_by(FederatedRound.round_number.asc()).all()
    results = []
    for r in rounds:
        participations = (
            db.query(HospitalParticipation)
            .filter(HospitalParticipation.round_id == r.id)
            .all()
        )
        p_list = []
        for p in participations:
            h_name = p.hospital.name if p.hospital else p.hospital_id
            p_list.append({
                "hospital_id": p.hospital_id,
                "hospital_name": h_name,
                "status": p.status,
                "update_consistency_u": p.update_consistency_u,
                "participation_p": p.participation_p,
                "comm_reliability_c": p.comm_reliability_c,
                "validation_contrib_v": p.validation_contrib_v,
                "round_trust_s": p.round_trust_s,
                "cum_trust_tau": p.cum_trust_tau,
                "weight_a": p.weight_a,
                "comm_latency_ms": p.comm_latency_ms,
                "local_loss": p.local_loss,
                "local_accuracy": p.local_accuracy
            })

        results.append({
            "round_number": r.round_number,
            "status": r.status,
            "start_time": r.start_time,
            "end_time": r.end_time,
            "global_model_version": r.global_model_version,
            "aggregation_strategy": r.aggregation_strategy,
            "accuracy": r.accuracy,
            "precision": r.precision,
            "recall": r.recall,
            "f1_score": r.f1_score,
            "loss": r.loss,
            "participating_hospitals_count": r.participating_hospitals_count,
            "comm_overhead_kb": r.comm_overhead_kb,
            "latency_ms": r.latency_ms,
            "secagg_verified": r.secagg_verified,
            "participations": p_list
        })
    return results

@router.get("/logs")
def get_logs():
    return {"logs": coordinator.logs}

# WebSocket for live training updates & log stream
@router.websocket("/ws")
async def websocket_training_stream(websocket: WebSocket):
    await websocket.accept()
    queue = asyncio.Queue()

    def subscriber(data):
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.run_coroutine_threadsafe(queue.put(data), loop)
        except Exception:
            pass

    coordinator.register_event_subscriber(subscriber)
    try:
        # Send initial status
        await websocket.send_json({
            "type": "INITIAL_STATUS",
            "state": coordinator.state,
            "round": coordinator.current_round,
            "total_rounds": coordinator.total_rounds,
            "metrics": coordinator.latest_metrics,
            "logs": coordinator.logs[-20:]
        })

        while True:
            data = await queue.get()
            await websocket.send_json(data)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
