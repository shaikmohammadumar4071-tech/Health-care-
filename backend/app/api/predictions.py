from fastapi import APIRouter
from typing import Dict, Any, List
from app.schemas.schemas import PredictionRequest, PredictionResponse
from federated.coordinator.orchestrator import coordinator

router = APIRouter(prefix="/predictions", tags=["AI Predictions"])

SAMPLE_CLINICAL_CASES = [
    {
        "id": "CASE-01",
        "title": "Normal / Ambulatory Checkup",
        "description": "Stable vitals, normal oxygen saturation, baseline laboratory profile.",
        "expected_class": "Low Risk",
        "features": {
            "age": 34.0,
            "heart_rate": 72.0,
            "temperature": 36.8,
            "oxygen_saturation": 99.0,
            "systolic_bp": 118.0,
            "diastolic_bp": 76.0,
            "respiratory_rate": 14.0,
            "glucose": 95.0,
            "wbc_count": 6.8,
            "creatinine": 0.9
        }
    },
    {
        "id": "CASE-02",
        "title": "Moderate Community-Acquired Infection",
        "description": "Low-grade fever, moderate tachycardia, slightly elevated respiratory rate.",
        "expected_class": "Moderate Risk",
        "features": {
            "age": 52.0,
            "heart_rate": 94.0,
            "temperature": 38.3,
            "oxygen_saturation": 95.0,
            "systolic_bp": 132.0,
            "diastolic_bp": 84.0,
            "respiratory_rate": 22.0,
            "glucose": 138.0,
            "wbc_count": 12.4,
            "creatinine": 1.2
        }
    },
    {
        "id": "CASE-03",
        "title": "Acute Hypertensive Crisis / Cardiac Distress",
        "description": "Severely elevated blood pressure, marked tachycardia, elevated creatinine.",
        "expected_class": "High Risk",
        "features": {
            "age": 68.0,
            "heart_rate": 112.0,
            "temperature": 37.4,
            "oxygen_saturation": 93.0,
            "systolic_bp": 188.0,
            "diastolic_bp": 110.0,
            "respiratory_rate": 24.0,
            "glucose": 185.0,
            "wbc_count": 10.2,
            "creatinine": 2.1
        }
    },
    {
        "id": "CASE-04",
        "title": "ICU Sepsis / Multi-Organ Deterioration",
        "description": "Severe hypoxia, high fever, tachypnea, severe leukocytosis, elevated renal markers.",
        "expected_class": "Critical Risk",
        "features": {
            "age": 74.0,
            "heart_rate": 135.0,
            "temperature": 39.4,
            "oxygen_saturation": 86.0,
            "systolic_bp": 88.0,
            "diastolic_bp": 52.0,
            "respiratory_rate": 34.0,
            "glucose": 260.0,
            "wbc_count": 24.5,
            "creatinine": 3.8
        }
    }
]

@router.get("/sample-cases")
def get_sample_clinical_cases():
    return {"cases": SAMPLE_CLINICAL_CASES}

@router.post("/predict", response_model=PredictionResponse)
def predict_patient_severity(features: PredictionRequest):
    feature_dict = features.dict()
    result = coordinator.predict_severity(feature_dict)
    return result
