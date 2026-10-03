from fastapi import APIRouter
from pydantic import BaseModel, Field
from federated.coordinator.orchestrator import coordinator

router = APIRouter(prefix="/settings", tags=["Settings"])

class FederationSettingsUpdate(BaseModel):
    trust_lambda: float = Field(default=0.90, ge=0.1, le=0.99)
    smpc_threshold_k: int = Field(default=3, ge=2, le=5)
    default_rounds: int = Field(default=10, ge=1, le=50)
    default_local_epochs: int = Field(default=2, ge=1, le=10)
    default_lr: float = Field(default=0.005, ge=0.0001, le=0.1)
    client_dropout_prob: float = Field(default=0.10, ge=0.0, le=0.8)

@router.get("")
def get_current_settings():
    return {
        "trust_lambda": coordinator.trust_lambda,
        "smpc_threshold_k": coordinator.smpc_threshold_k,
        "default_rounds": coordinator.total_rounds,
        "default_local_epochs": coordinator.local_epochs,
        "default_lr": coordinator.learning_rate,
        "client_dropout_prob": coordinator.client_dropout_prob,
        "aggregation_strategy": coordinator.aggregation_strategy,
        "system_status": "ONLINE",
        "privacy_mode": "SMPC_SHAMIR_SECRET_SHARING"
    }

@router.post("")
def update_settings(update_in: FederationSettingsUpdate):
    coordinator.trust_lambda = update_in.trust_lambda
    coordinator.trust_manager.lambda_decay = update_in.trust_lambda
    coordinator.smpc_threshold_k = update_in.smpc_threshold_k
    coordinator.smpc.k = update_in.smpc_threshold_k
    coordinator.total_rounds = update_in.default_rounds
    coordinator.local_epochs = update_in.default_local_epochs
    coordinator.learning_rate = update_in.default_lr
    coordinator.client_dropout_prob = update_in.client_dropout_prob
    
    return {
        "status": "SUCCESS",
        "message": "Federation parameters updated successfully.",
        "settings": get_current_settings()
    }
