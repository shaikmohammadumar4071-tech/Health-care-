import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    full_name = Column(String(128), nullable=True)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), default="ADMIN", nullable=False)  # ADMIN, OPERATOR, RESEARCHER
    hospital_id = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(String(64), primary_key=True, index=True)  # e.g., "HOSP-001"
    name = Column(String(128), nullable=False)              # e.g., "Hospital A - Metro Health"
    region = Column(String(64), nullable=False)            # e.g., "North America"
    status = Column(String(32), default="ACTIVE")          # ACTIVE, INACTIVE, TRAINING, OFFLINE
    local_dataset_size = Column(Integer, default=1500)
    current_model_version = Column(String(32), default="v1.0")
    successful_rounds = Column(Integer, default=0)
    participation_rate = Column(Float, default=1.0)
    communication_reliability = Column(Float, default=0.95)
    trust_score = Column(Float, default=0.50)              # Initialized to neutral 0.5
    latency_ms = Column(Float, default=45.0)
    last_active = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    participations = relationship("HospitalParticipation", back_populates="hospital")
    trust_histories = relationship("TrustHistory", back_populates="hospital")

class FederatedRound(Base):
    __tablename__ = "federated_rounds"

    id = Column(Integer, primary_key=True, index=True)
    round_number = Column(Integer, unique=True, index=True, nullable=False)
    status = Column(String(32), default="COMPLETED")       # RUNNING, COMPLETED, FAILED, PAUSED
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    global_model_version = Column(String(32), default="v1.0")
    aggregation_strategy = Column(String(64), default="Adaptive Trust-Aware FedAvg")
    accuracy = Column(Float, default=0.0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    loss = Column(Float, default=0.0)
    participating_hospitals_count = Column(Integer, default=0)
    comm_overhead_kb = Column(Float, default=0.0)
    latency_ms = Column(Float, default=0.0)
    secagg_verified = Column(Boolean, default=True)

    participations = relationship("HospitalParticipation", back_populates="round")

class HospitalParticipation(Base):
    __tablename__ = "hospital_participations"

    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("federated_rounds.id"), nullable=False)
    hospital_id = Column(String(64), ForeignKey("hospitals.id"), nullable=False)
    status = Column(String(32), default="COMPLETED")       # COMPLETED, DROPOUT, REJECTED
    local_samples = Column(Integer, default=1000)
    update_consistency_u = Column(Float, default=0.85)     # U: 30%
    participation_p = Column(Float, default=1.0)           # P: 25%
    comm_reliability_c = Column(Float, default=0.95)       # C: 20%
    validation_contrib_v = Column(Float, default=0.80)     # V: 25%
    round_trust_s = Column(Float, default=0.85)
    cum_trust_tau = Column(Float, default=0.85)
    weight_a = Column(Float, default=0.20)
    comm_latency_ms = Column(Float, default=50.0)
    local_loss = Column(Float, default=0.35)
    local_accuracy = Column(Float, default=0.88)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    round = relationship("FederatedRound", back_populates="participations")
    hospital = relationship("Hospital", back_populates="participations")

class TrustHistory(Base):
    __tablename__ = "trust_histories"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(String(64), ForeignKey("hospitals.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    u_score = Column(Float, default=0.85)
    p_score = Column(Float, default=1.0)
    c_score = Column(Float, default=0.95)
    v_score = Column(Float, default=0.80)
    composite_score = Column(Float, default=0.85)          # s = 0.3U + 0.25P + 0.2C + 0.25V
    ema_trust = Column(Float, default=0.85)                # tau
    weight_applied = Column(Float, default=0.20)           # a(h)
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    hospital = relationship("Hospital", back_populates="trust_histories")

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_tag = Column(String(32), unique=True, index=True)
    round_number = Column(Integer, default=0)
    architecture = Column(String(64), default="ClinicalSeverityMLP")
    accuracy = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    loss = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    scenario = Column(String(64), nullable=False)          # Clean, Mild Non-IID, Severe Non-IID, Random Dropout, etc.
    aggregation_strategy = Column(String(64), nullable=False)
    total_rounds = Column(Integer, default=10)
    status = Column(String(32), default="COMPLETED")       # PENDING, RUNNING, COMPLETED
    results_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ExperimentMetric(Base):
    __tablename__ = "experiment_metrics"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(String(64), ForeignKey("experiments.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    algorithm = Column(String(64), nullable=False)
    accuracy = Column(Float, default=0.0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    loss = Column(Float, default=0.0)
    comm_overhead_kb = Column(Float, default=0.0)
    latency_ms = Column(Float, default=0.0)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    event_type = Column(String(64), nullable=False, index=True) # HOSPITAL_REGISTRATION, TRAINING_START, TRUST_UPDATE, etc.
    actor_id = Column(String(64), nullable=True)
    actor_role = Column(String(32), nullable=True)
    hospital_id = Column(String(64), nullable=True, index=True)
    details = Column(Text, nullable=False)
    status = Column(String(32), default="SUCCESS")         # SUCCESS, WARNING, FAILURE
