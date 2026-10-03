import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.database.session import get_db
from app.models.entity_models import Experiment, ExperimentMetric, AuditEvent
from experiments.benchmark_runner import BenchmarkRunner, SCENARIOS, ALGORITHMS

router = APIRouter(prefix="/experiments", tags=["Experiments"])

class ExperimentCreate(BaseModel):
    name: str = Field(..., example="Non-IID Stress Benchmark")
    description: Optional[str] = "Benchmarking adaptive trust under severe Non-IID clinical label shifts"
    scenario: str = Field(default="Severe Non-IID Data", example="Severe Non-IID Data")
    total_rounds: int = Field(default=8, ge=3, le=20)

@router.get("/scenarios")
def get_available_scenarios():
    return {
        "scenarios": SCENARIOS,
        "algorithms": ALGORITHMS
    }

@router.get("")
def list_experiments(db: Session = Depends(get_db)):
    experiments = db.query(Experiment).order_by(Experiment.created_at.desc()).all()
    # Pre-seed default experiments if empty
    if not experiments:
        default_exp = Experiment(
            id="EXP-BENCH-001",
            name="Baseline vs Adaptive Trust on Non-IID Clinical Data",
            description="Comprehensive benchmark comparing 5 aggregation strategies under severe Non-IID label shifts across 5 smart hospitals.",
            scenario="Severe Non-IID Data",
            aggregation_strategy="Multi-Architecture Comparison",
            total_rounds=8,
            status="COMPLETED"
        )
        db.add(default_exp)
        db.commit()
        BenchmarkRunner.run_benchmark_experiment("EXP-BENCH-001", "Severe Non-IID Data", total_rounds=8)
        experiments = db.query(Experiment).all()

    results = []
    for exp in experiments:
        results.append({
            "id": exp.id,
            "name": exp.name,
            "description": exp.description,
            "scenario": exp.scenario,
            "aggregation_strategy": exp.aggregation_strategy,
            "total_rounds": exp.total_rounds,
            "status": exp.status,
            "created_at": exp.created_at
        })
    return results

@router.post("")
def create_and_run_experiment(exp_in: ExperimentCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    exp_id = f"EXP-{str(uuid.uuid4())[:8].upper()}"
    new_exp = Experiment(
        id=exp_id,
        name=exp_in.name,
        description=exp_in.description,
        scenario=exp_in.scenario,
        aggregation_strategy="Multi-Algorithm Comparison",
        total_rounds=exp_in.total_rounds,
        status="RUNNING"
    )
    db.add(new_exp)
    
    audit = AuditEvent(
        event_type="EXPERIMENT_LAUNCHED",
        actor_id="RESEARCHER",
        actor_role="RESEARCHER",
        details=f"Launched experiment {exp_id} ({exp_in.scenario}) for {exp_in.total_rounds} rounds."
    )
    db.add(audit)
    db.commit()

    # Run in background task
    background_tasks.add_task(
        BenchmarkRunner.run_benchmark_experiment,
        exp_id,
        exp_in.scenario,
        exp_in.total_rounds
    )

    return {
        "id": exp_id,
        "name": exp_in.name,
        "status": "RUNNING",
        "message": f"Experiment {exp_id} launched in background."
    }

@router.get("/{id}")
def get_experiment_details(id: str, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    metrics_rows = (
        db.query(ExperimentMetric)
        .filter(ExperimentMetric.experiment_id == id)
        .order_by(ExperimentMetric.round_number.asc())
        .all()
    )

    parsed_results = json.loads(exp.results_json) if exp.results_json else {}

    return {
        "id": exp.id,
        "name": exp.name,
        "description": exp.description,
        "scenario": exp.scenario,
        "total_rounds": exp.total_rounds,
        "status": exp.status,
        "created_at": exp.created_at,
        "results": parsed_results
    }
