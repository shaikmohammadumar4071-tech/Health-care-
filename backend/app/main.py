import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import Base, engine, SessionLocal
from app.models.entity_models import User, Hospital, FederatedRound, AuditEvent
from app.core.security import hash_password
from federated.coordinator.orchestrator import coordinator

# Import API Routers
from app.api.auth import router as auth_router
from app.api.hospitals import router as hospitals_router
from app.api.federated import router as federated_router
from app.api.trust import router as trust_router
from app.api.aggregation import router as aggregation_router
from app.api.predictions import router as predictions_router
from app.api.analytics import router as analytics_router
from app.api.experiments import router as experiments_router
from app.api.audit_logs import router as audit_logs_router
from app.api.settings_api import router as settings_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Privacy-Preserving Federated Learning for Smart Hospitals with Adaptive Trust-Aware Aggregation and SMPC Shamir Secret Sharing."
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed initial users & default hospitals on startup
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Default Admin User
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@hospital-fl.org",
                full_name="Chief Medical AI Officer",
                hashed_password=hash_password("admin123"),
                role="ADMIN"
            )
            db.add(admin_user)

        # Default Hospital Operator User
        operator_user = db.query(User).filter(User.username == "operator_hospA").first()
        if not operator_user:
            operator_user = User(
                username="operator_hospA",
                email="operator@metro-general.org",
                full_name="Hospital A Lead Administrator",
                hashed_password=hash_password("operator123"),
                role="OPERATOR",
                hospital_id="HOSP-001"
            )
            db.add(operator_user)

        # Default Researcher User
        researcher_user = db.query(User).filter(User.username == "researcher").first()
        if not researcher_user:
            researcher_user = User(
                username="researcher",
                email="researcher@fl-consortium.org",
                full_name="Senior ML Research Scientist",
                hashed_password=hash_password("researcher123"),
                role="RESEARCHER"
            )
            db.add(researcher_user)

        db.commit()

        # Initialize Default Hospitals
        coordinator.initialize_default_hospitals()
    finally:
        db.close()

# Mount API Routers under /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(hospitals_router, prefix=settings.API_V1_STR)
app.include_router(federated_router, prefix=settings.API_V1_STR)
app.include_router(trust_router, prefix=settings.API_V1_STR)
app.include_router(aggregation_router, prefix=settings.API_V1_STR)
app.include_router(predictions_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(experiments_router, prefix=settings.API_V1_STR)
app.include_router(audit_logs_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "status": "ONLINE",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
def health_check():
    return {"status": "HEALTHY", "coordinator_state": coordinator.state}
