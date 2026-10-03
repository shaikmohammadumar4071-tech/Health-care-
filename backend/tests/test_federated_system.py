import pytest
import numpy as np
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from federated.trust.trust_manager import AdaptiveTrustManager
from federated.aggregation.smpc_shamir import ShamirSMPCSecretSharing
from federated.clients.hospital_client import HospitalClient
from federated.coordinator.orchestrator import coordinator

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "HEALTHY"

def test_trust_score_bounds_and_formula():
    """Verify trust score s = 0.30U + 0.25P + 0.20C + 0.25V and bounded in [0, 1]."""
    tm = AdaptiveTrustManager(lambda_decay=0.90)
    
    # Test nominal inputs
    u, p, c, v = 0.8, 1.0, 0.9, 0.7
    expected_s = 0.30 * 0.8 + 0.25 * 1.0 + 0.20 * 0.9 + 0.25 * 0.7
    computed_s = tm.calculate_round_score(u, p, c, v)
    assert abs(computed_s - expected_s) < 1e-5
    assert 0.0 <= computed_s <= 1.0

    # Test extreme boundary inputs
    assert tm.calculate_round_score(0.0, 0.0, 0.0, 0.0) == 0.0
    assert tm.calculate_round_score(1.0, 1.0, 1.0, 1.0) == 1.0

    # Test EMA update: tau(t+1) = lambda*tau(t) + (1-lambda)*s
    prev_tau = 0.50
    new_tau = tm.update_ema_trust(prev_tau, computed_s)
    expected_tau = 0.90 * 0.50 + 0.10 * computed_s
    assert abs(new_tau - expected_tau) < 1e-5
    assert 0.0 <= new_tau <= 1.0

def test_aggregation_weights_sum_to_one():
    """Verify that trust-adjusted aggregation weights sum to 1.0."""
    tm = AdaptiveTrustManager(lambda_decay=0.90)
    samples = {"HOSP-001": 1500, "HOSP-002": 1200, "HOSP-003": 800, "HOSP-004": 2000, "HOSP-005": 1000}
    trust_scores = {"HOSP-001": 0.85, "HOSP-002": 0.92, "HOSP-003": 0.60, "HOSP-004": 0.78, "HOSP-005": 0.88}
    eligible_hids = list(samples.keys())

    weights = tm.compute_aggregation_weights(samples, trust_scores, eligible_hids)
    
    total_weight = sum(weights.values())
    assert abs(total_weight - 1.0) < 1e-5
    for hid in eligible_hids:
        assert weights[hid] > 0.0

def test_smpc_shamir_secret_sharing_reconstruction():
    """Verify SMPC Shamir (k, n) secret sharing reconstructs correct aggregate."""
    smpc = ShamirSMPCSecretSharing(threshold_k=3, total_n=5)
    
    # 5 dummy hospital parameter vectors of size 10
    rng = np.random.RandomState(42)
    weights_list = [rng.normal(0, 1, (10,)).astype(np.float32) for _ in range(5)]
    hospital_weights = [0.2, 0.25, 0.15, 0.2, 0.2]
    
    # Expected direct weighted sum
    expected_aggregate = sum(w * p for w, p in zip(hospital_weights, weights_list))

    result = smpc.benchmark_secure_round([ [w] for w in weights_list], hospital_weights)
    assert result["status"] == "SUCCESS"
    reconstructed = result["reconstructed_weights"][0]
    
    # Check numerical reconstruction precision
    diff = np.max(np.abs(reconstructed - expected_aggregate))
    assert diff < 1e-3
    assert result["threshold_k"] == 3

def test_client_local_data_isolation():
    """Verify hospital client trains locally without sharing raw patient records."""
    client_a = HospitalClient(
        hospital_id="HOSP-001",
        hospital_name="Hospital A",
        region="North",
        num_samples=500
    )
    # Check that client holds local data
    assert hasattr(client_a, "X_train")
    assert len(client_a.X_train) > 0

    # Run local training
    res = client_a.train_local_model(coordinator.global_parameters, local_epochs=1)
    assert not res["is_dropout"]
    # Verify raw patient records are NOT in returned result payload!
    assert "X_train" not in res
    assert "y_train" not in res
    assert "raw_patients" not in res
    assert "parameters" in res

def test_hospitals_api():
    response = client.get("/api/hospitals")
    assert response.status_code == 200
    hospitals = response.json()
    assert len(hospitals) >= 5
    assert any(h["id"] == "HOSP-001" for h in hospitals)

def test_trust_scores_api():
    response = client.get("/api/trust/scores")
    assert response.status_code == 200
    scores = response.json()
    assert len(scores) >= 5
    for item in scores:
        assert 0.0 <= item["current_trust"] <= 1.0

def test_ai_prediction_api():
    payload = {
        "age": 65.0,
        "heart_rate": 105.0,
        "temperature": 38.5,
        "oxygen_saturation": 91.0,
        "systolic_bp": 145.0,
        "diastolic_bp": 92.0,
        "respiratory_rate": 26.0,
        "glucose": 160.0,
        "wbc_count": 14.5,
        "creatinine": 1.9
    }
    response = client.post("/api/predictions/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_severity_class" in data
    assert "confidence" in data
    assert data["severity_level"] in [0, 1, 2, 3]

def test_experiments_api():
    response = client.get("/api/experiments")
    assert response.status_code == 200
    exps = response.json()
    assert len(exps) >= 1
