import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Privacy-Preserving Federated Learning for Smart Hospitals"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-smart-hospital-federated-learning-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hospital_fl.db")
    
    # Federated Learning Defaults
    DEFAULT_ROUNDS: int = 10
    DEFAULT_LOCAL_EPOCHS: int = 3
    DEFAULT_LEARNING_RATE: float = 0.005
    DEFAULT_TRUST_LAMBDA: float = 0.90
    DEFAULT_SMPC_THRESHOLD_K: int = 3
    DEFAULT_SMPC_TOTAL_N: int = 5
    
    # CORS
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()
