import os
import numpy as np
from typing import Tuple, Dict

FEATURE_NAMES = [
    "age",
    "heart_rate",
    "temperature",
    "oxygen_saturation",
    "systolic_bp",
    "diastolic_bp",
    "respiratory_rate",
    "glucose",
    "wbc_count",
    "creatinine"
]

NUM_FEATURES = len(FEATURE_NAMES)
NUM_CLASSES = 4  # 0: Low, 1: Moderate, 2: High, 3: Critical

# Global baseline means & standard deviations for clinical vitals
CLINICAL_STATS = {
    "age": (58.0, 16.0),
    "heart_rate": (82.0, 18.0),
    "temperature": (37.2, 0.8),
    "oxygen_saturation": (96.5, 3.2),
    "systolic_bp": (128.0, 22.0),
    "diastolic_bp": (80.0, 12.0),
    "respiratory_rate": (18.0, 4.5),
    "glucose": (118.0, 35.0),
    "wbc_count": (8.5, 3.8),
    "creatinine": (1.1, 0.6)
}

def generate_hospital_data(hospital_id: str, num_samples: int = 1200, seed: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic local hospital clinical data with realistic Non-IID distributions.
    Hospital A: ICU/Geriatric - Older, lower SpO2, higher glucose
    Hospital B: Cardiac - Higher blood pressure, elevated heart rate
    Hospital C: Community/Pediatric - Younger demographic, high respiratory rate
    Hospital D: Regional General - Balanced standard distribution
    Hospital E: Emergency/Trauma - Extreme vitals, critical risk skew
    """
    rng = np.random.RandomState(seed)
    
    # Base clinical feature matrix
    X = np.zeros((num_samples, NUM_FEATURES), dtype=np.float32)
    
    for idx, feat in enumerate(FEATURE_NAMES):
        mean, std = CLINICAL_STATS[feat]
        X[:, idx] = rng.normal(mean, std, num_samples)
        
    # Hospital-specific Non-IID shift
    if "001" in hospital_id or "A" in hospital_id:  # ICU / Geriatric
        X[:, 0] += rng.uniform(10, 18, num_samples)  # Age shift
        X[:, 3] -= rng.uniform(2.5, 4.5, num_samples) # SpO2 drop
        X[:, 7] += rng.uniform(20, 50, num_samples)   # High glucose
    elif "002" in hospital_id or "B" in hospital_id: # Cardiac
        X[:, 1] += rng.uniform(12, 25, num_samples)  # High heart rate
        X[:, 4] += rng.uniform(18, 35, num_samples)  # High systolic BP
        X[:, 5] += rng.uniform(10, 18, num_samples)  # High diastolic BP
    elif "003" in hospital_id or "C" in hospital_id: # Pediatric & Community
        X[:, 0] -= rng.uniform(15, 30, num_samples)  # Younger age
        X[:, 6] += rng.uniform(3, 8, num_samples)    # Higher respiratory rate
        X[:, 8] += rng.uniform(2, 5, num_samples)    # Elevated WBC
    elif "005" in hospital_id or "E" in hospital_id: # Emergency Trauma
        X[:, 1] += rng.uniform(15, 35, num_samples)  # Severe tachycardia
        X[:, 4] -= rng.uniform(15, 30, num_samples)  # Hypotension shock risk
        X[:, 9] += rng.uniform(0.6, 1.8, num_samples)# Elevated creatinine
        
    # Boundary clipping for realistic physiological values
    X[:, 0] = np.clip(X[:, 0], 1, 100)      # Age
    X[:, 1] = np.clip(X[:, 1], 40, 210)     # HR
    X[:, 2] = np.clip(X[:, 2], 34.5, 41.5)  # Temp
    X[:, 3] = np.clip(X[:, 3], 65, 100)     # SpO2
    X[:, 4] = np.clip(X[:, 4], 65, 230)     # Systolic BP
    X[:, 5] = np.clip(X[:, 5], 40, 135)     # Diastolic BP
    X[:, 6] = np.clip(X[:, 6], 10, 48)      # RR
    X[:, 7] = np.clip(X[:, 7], 50, 450)     # Glucose
    X[:, 8] = np.clip(X[:, 8], 2.0, 35.0)   # WBC
    X[:, 9] = np.clip(X[:, 9], 0.3, 12.0)   # Creatinine

    # Compute continuous Severity Index (S = weighted physiological deterioration)
    # Lower SpO2, high HR, abnormal BP, high WBC & Creatinine increase severity
    norm_age = (X[:, 0] - 50) / 25
    norm_hr = (np.abs(X[:, 1] - 75)) / 25
    norm_spo2 = (98 - X[:, 3]) / 4
    norm_temp = (np.abs(X[:, 2] - 37.0)) / 1.0
    norm_bp = (np.abs(X[:, 4] - 120)) / 30
    norm_rr = (np.abs(X[:, 6] - 16)) / 6
    norm_wbc = (X[:, 8] - 7) / 4
    norm_creat = (X[:, 9] - 1.0) / 0.8

    severity_score = (
        0.15 * norm_age +
        0.20 * norm_hr +
        0.25 * norm_spo2 +
        0.10 * norm_temp +
        0.10 * norm_bp +
        0.10 * norm_rr +
        0.05 * norm_wbc +
        0.05 * norm_creat +
        rng.normal(0, 0.25, num_samples)
    )

    # Classify into 4 severity tiers:
    # 0: Low Risk (< 0.4)
    # 1: Moderate Risk (0.4 - 1.0)
    # 2: High Risk (1.0 - 1.7)
    # 3: Critical Risk (>= 1.7)
    y = np.zeros(num_samples, dtype=np.int64)
    y[severity_score >= 0.4] = 1
    y[severity_score >= 1.0] = 2
    y[severity_score >= 1.7] = 3

    return X, y

def get_normalized_sample(features: Dict[str, float]) -> np.ndarray:
    """Normalize input feature vector for model prediction inference."""
    vec = np.zeros((1, NUM_FEATURES), dtype=np.float32)
    for i, name in enumerate(FEATURE_NAMES):
        val = features.get(name, CLINICAL_STATS[name][0])
        mean, std = CLINICAL_STATS[name]
        vec[0, i] = (val - mean) / (std + 1e-6)
    return vec
