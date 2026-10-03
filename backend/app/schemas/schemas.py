from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    hospital_id: Optional[str] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    hospital_id: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    role: str = "ADMIN"  # ADMIN, OPERATOR, RESEARCHER
    hospital_id: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    hospital_id: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Hospital
class HospitalCreate(BaseModel):
    id: str = Field(..., example="HOSP-006")
    name: str = Field(..., example="Memorial Children's Hospital")
    region: str = Field(..., example="East Coast")
    local_dataset_size: int = Field(default=1200, ge=100)
    communication_reliability: float = Field(default=0.95, ge=0.0, le=1.0)
    latency_ms: float = Field(default=45.0, ge=1.0)

class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[str] = None
    status: Optional[str] = None  # ACTIVE, INACTIVE
    local_dataset_size: Optional[int] = None
    communication_reliability: Optional[float] = None
    latency_ms: Optional[float] = None

class HospitalResponse(BaseModel):
    id: str
    name: str
    region: str
    status: str
    local_dataset_size: int
    current_model_version: str
    successful_rounds: int
    participation_rate: float
    communication_reliability: float
    trust_score: float
    latency_ms: float
    last_active: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Federated Learning Training
class FederatedStartRequest(BaseModel):
    rounds: int = Field(default=5, ge=1, le=50)
    local_epochs: int = Field(default=2, ge=1, le=10)
    learning_rate: float = Field(default=0.005, ge=0.0001, le=0.1)
    aggregation_strategy: str = Field(default="Adaptive Trust-Aware FedAvg")
    participating_hospital_ids: Optional[List[str]] = None
    client_dropout_prob: float = Field(default=0.10, ge=0.0, le=0.9)
    trust_lambda: float = Field(default=0.90, ge=0.1, le=0.99)
    smpc_threshold_k: int = Field(default=3, ge=2, le=5)

class FederatedStatusResponse(BaseModel):
    state: str  # IDLE, TRAINING, PAUSED, STOPPED, COMPLETED
    current_round: int
    total_rounds: int
    global_model_version: str
    aggregation_strategy: str
    active_hospitals: List[str]
    training_progress_pct: float
    latest_accuracy: float
    latest_f1_score: float
    latest_loss: float
    latest_latency_ms: float
    latest_comm_overhead_kb: float
    secagg_status: str
    current_logs: List[str]

class HospitalParticipationResponse(BaseModel):
    hospital_id: str
    hospital_name: str
    status: str
    update_consistency_u: float
    participation_p: float
    comm_reliability_c: float
    validation_contrib_v: float
    round_trust_s: float
    cum_trust_tau: float
    weight_a: float
    comm_latency_ms: float
    local_loss: float
    local_accuracy: float

class FederatedRoundResponse(BaseModel):
    round_number: int
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    global_model_version: str
    aggregation_strategy: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    loss: float
    participating_hospitals_count: int
    comm_overhead_kb: float
    latency_ms: float
    secagg_verified: bool
    participations: List[HospitalParticipationResponse] = []

    class Config:
        from_attributes = True

# Trust Management
class TrustScoreItem(BaseModel):
    hospital_id: str
    hospital_name: str
    region: str
    current_trust: float
    update_consistency_u: float
    participation_p: float
    comm_reliability_c: float
    validation_contrib_v: float
    composite_s: float
    weight_a: float
    status: str
    trend: str  # INCREASING, STABLE, DECREASING
    reason: str

class TrustHistoryItemResponse(BaseModel):
    round_number: int
    u_score: float
    p_score: float
    c_score: float
    v_score: float
    composite_score: float
    ema_trust: float
    weight_applied: float
    reason: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Secure Aggregation
class SecureAggStatusResponse(BaseModel):
    protocol: str
    status: str
    total_participants: int
    threshold_k: int
    shares_generated: int
    shares_verified: int
    reconstruction_latency_ms: float
    homomorphic_addition_latency_ms: float
    total_crypto_latency_ms: float
    simulated: bool
    privacy_guarantee: str
    mathematical_basis: str

class SecureAggTestRequest(BaseModel):
    num_clients: int = Field(default=5, ge=3, le=10)
    threshold_k: int = Field(default=3, ge=2, le=5)
    vector_dimension: int = Field(default=128, ge=10, le=1024)

# AI Prediction
class PredictionRequest(BaseModel):
    age: float = Field(..., ge=1, le=110, example=64)
    heart_rate: float = Field(..., ge=30, le=220, example=105)
    temperature: float = Field(..., ge=34.0, le=42.0, example=38.6)
    oxygen_saturation: float = Field(..., ge=60.0, le=100.0, example=91.0)
    systolic_bp: float = Field(..., ge=60.0, le=240.0, example=148.0)
    diastolic_bp: float = Field(..., ge=40.0, le=140.0, example=92.0)
    respiratory_rate: float = Field(..., ge=8.0, le=50.0, example=26.0)
    glucose: float = Field(default=135.0, ge=40.0, le=500.0, example=155.0)
    wbc_count: float = Field(default=11.5, ge=1.0, le=40.0, example=14.2)
    creatinine: float = Field(default=1.4, ge=0.2, le=15.0, example=1.8)

class PredictionResponse(BaseModel):
    predicted_severity_class: str  # Low, Moderate, High, Critical
    severity_level: int            # 0, 1, 2, 3
    confidence: float
    risk_probabilities: Dict[str, float]
    model_version: str
    training_round: int
    timestamp: datetime
    disclaimer: str

# Analytics & Overview
class DashboardOverviewResponse(BaseModel):
    total_hospitals: int
    active_hospitals: int
    inactive_hospitals: int
    current_round: int
    global_model_version: str
    average_trust_score: float
    completed_rounds: int
    model_accuracy: float
    model_precision: float
    model_recall: float
    model_f1: float
    model_loss: float
    total_communication_cost_kb: float
    average_training_latency_ms: float
    secure_aggregation_status: str

# Audit Log
class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    event_type: str
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None
    hospital_id: Optional[str] = None
    details: str
    status: str

    class Config:
        from_attributes = True
