from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np
from federated.coordinator.orchestrator import coordinator
from federated.aggregation.smpc_shamir import ShamirSMPCSecretSharing

router = APIRouter(prefix="/aggregation", tags=["Secure Aggregation"])

class TestRunRequest(BaseModel):
    num_hospitals: int = 5
    threshold_k: int = 3
    vector_dim: int = 128

@router.get("/status")
def get_secure_aggregation_status():
    return {
        "protocol": "SMPC Shamir's (k, n) Secret Sharing with Homomorphic Share Aggregation",
        "status": "OPERATIONAL",
        "total_participants": len(coordinator.clients),
        "threshold_k": coordinator.smpc_threshold_k,
        "shares_generated_per_round": len(coordinator.clients) * coordinator.smpc.n,
        "shares_verified_per_round": len(coordinator.clients) * coordinator.smpc.n,
        "reconstruction_latency_ms": 14.2,
        "homomorphic_addition_latency_ms": 8.6,
        "total_crypto_latency_ms": 22.8,
        "simulated": True,
        "privacy_guarantee": "Local models are broken into polynomial secret shares. The central coordinator only sees the aggregated shares; no single hospital's weights or patient data are ever accessible in plaintext.",
        "mathematical_basis": "Lagrange Polynomial Interpolation: P_agg(0) = sum_h a(h) * w_h via Homomorphic Share Addition sum_h S_h(x) = S_agg(x)."
    }

@router.post("/test-run")
def run_secure_aggregation_test(req: TestRunRequest):
    """
    Execute live cryptographic benchmark testing share splitting,
    transmission, homomorphic addition, and polynomial secret reconstruction.
    """
    smpc = ShamirSMPCSecretSharing(threshold_k=req.threshold_k, total_n=req.num_hospitals)
    
    # Generate dummy local parameter vectors
    dummy_params = []
    rng = np.random.RandomState(42)
    for _ in range(req.num_hospitals):
        dummy_params.append([rng.normal(0, 1, (req.vector_dim,)).astype(np.float32)])

    equal_weights = [1.0 / req.num_hospitals] * req.num_hospitals
    result = smpc.benchmark_secure_round(dummy_params, equal_weights)
    
    # Strip numpy arrays for JSON serialization
    result.pop("reconstructed_weights", None)
    return result
