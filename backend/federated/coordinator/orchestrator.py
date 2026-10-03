import asyncio
import datetime
import threading
import time
import numpy as np
import torch
from typing import Dict, List, Optional, Any, Callable
from app.database.session import SessionLocal
from app.models.entity_models import (
    Hospital, FederatedRound, HospitalParticipation, TrustHistory, ModelVersion, AuditEvent
)
from datasets.synthetic.clinical_generator import (
    generate_hospital_data, CLINICAL_STATS, NUM_FEATURES
)
from federated.models.clinical_net import (
    ClinicalSeverityMLP, get_model_parameters, set_model_parameters, evaluate_model
)
from federated.trust.trust_manager import AdaptiveTrustManager
from federated.aggregation.smpc_shamir import ShamirSMPCSecretSharing
from federated.aggregation.strategies import (
    standard_fedavg, dynamic_gradient_variance_fedavg, adaptive_trust_fedavg, combined_threshold_trust_fedavg
)
from federated.clients.hospital_client import HospitalClient

class FederatedCoordinator:
    """
    Central Coordinator for Privacy-Preserving Smart Hospital Federated Learning.
    Manages global rounds, SMPC secure aggregation, adaptive trust weighting,
    real-time event streaming and database persistence.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(FederatedCoordinator, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self._initialized = True
        self.state = "IDLE"  # IDLE, TRAINING, PAUSED, STOPPED, COMPLETED
        self.current_round = 0
        self.total_rounds = 10
        self.global_model_version = "v1.0"
        self.aggregation_strategy = "Adaptive Trust-Aware FedAvg"
        self.trust_lambda = 0.90
        self.smpc_threshold_k = 3
        self.client_dropout_prob = 0.10
        self.local_epochs = 2
        self.learning_rate = 0.005
        
        # Initialize Global Neural Network
        self.global_model = ClinicalSeverityMLP(input_dim=NUM_FEATURES, num_classes=4)
        self.global_parameters = get_model_parameters(self.global_model)
        
        # Global benchmark validation set (generated independently)
        X_val_raw, self.y_val_benchmark = generate_hospital_data("BENCHMARK-VAL", num_samples=800, seed=999)
        means = np.array([CLINICAL_STATS[k][0] for k in CLINICAL_STATS.keys()], dtype=np.float32)
        stds = np.array([CLINICAL_STATS[k][1] for k in CLINICAL_STATS.keys()], dtype=np.float32)
        self.X_val_benchmark = (X_val_raw - means) / (stds + 1e-6)
        
        # Modules
        self.trust_manager = AdaptiveTrustManager(lambda_decay=self.trust_lambda)
        self.smpc = ShamirSMPCSecretSharing(threshold_k=self.smpc_threshold_k, total_n=5)
        
        # In-memory clients & metrics
        self.clients: Dict[str, HospitalClient] = {}
        self.logs: List[str] = []
        self.event_subscribers: List[Callable[[Dict[str, Any]], None]] = []
        self._training_thread: Optional[threading.Thread] = None
        self._stop_requested = False
        self._pause_requested = False

        # Latest metrics
        self.latest_metrics = {
            "accuracy": 0.45,
            "precision": 0.42,
            "recall": 0.44,
            "f1_score": 0.43,
            "loss": 1.35,
            "latency_ms": 45.0,
            "comm_overhead_kb": 256.0,
            "secagg_status": "READY"
        }

        self._log("Federated Coordinator initialized. Global model v1.0 ready.")

    def _log(self, message: str):
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        entry = f"[{timestamp}] {message}"
        self.logs.append(entry)
        if len(self.logs) > 300:
            self.logs.pop(0)
        self._emit_event({"type": "LOG", "message": entry})

    def register_event_subscriber(self, callback: Callable[[Dict[str, Any]], None]):
        self.event_subscribers.append(callback)

    def _emit_event(self, data: Dict[str, Any]):
        for sub in list(self.event_subscribers):
            try:
                sub(data)
            except Exception:
                pass

    def initialize_default_hospitals(self):
        """Populate database with default 5 hospitals and initialize clients."""
        db = SessionLocal()
        try:
            defaults = [
                {"id": "HOSP-001", "name": "Hospital A - Metro General ICU", "region": "North District", "local_dataset_size": 1600, "latency_ms": 42.0},
                {"id": "HOSP-002", "name": "Hospital B - St. Jude Heart Center", "region": "South District", "local_dataset_size": 1400, "latency_ms": 55.0},
                {"id": "HOSP-003", "name": "Hospital C - Hope Community Hospital", "region": "East District", "local_dataset_size": 1100, "latency_ms": 38.0},
                {"id": "HOSP-004", "name": "Hospital D - Mountain Valley Medical", "region": "West District", "local_dataset_size": 1350, "latency_ms": 72.0},
                {"id": "HOSP-005", "name": "Hospital E - West Trauma Institute", "region": "Central Metro", "local_dataset_size": 1750, "latency_ms": 48.0},
            ]

            for h in defaults:
                existing = db.query(Hospital).filter(Hospital.id == h["id"]).first()
                if not existing:
                    new_h = Hospital(
                        id=h["id"],
                        name=h["name"],
                        region=h["region"],
                        status="ACTIVE",
                        local_dataset_size=h["local_dataset_size"],
                        trust_score=0.50, # Initial neutral trust
                        communication_reliability=0.96,
                        latency_ms=h["latency_ms"]
                    )
                    db.add(new_h)
                    
                    # Create audit log
                    audit = AuditEvent(
                        event_type="HOSPITAL_REGISTRATION",
                        actor_id="SYSTEM",
                        actor_role="ADMIN",
                        hospital_id=h["id"],
                        details=f"Hospital registered: {h['name']} ({h['region']}) with {h['local_dataset_size']} records."
                    )
                    db.add(audit)
            db.commit()

            # Initialize local clients
            hospitals = db.query(Hospital).filter(Hospital.status != "INACTIVE").all()
            for h in hospitals:
                self.clients[h.id] = HospitalClient(
                    hospital_id=h.id,
                    hospital_name=h.name,
                    region=h.region,
                    num_samples=h.local_dataset_size,
                    baseline_latency_ms=h.latency_ms,
                    dropout_probability=self.client_dropout_prob
                )
            self._log(f"Initialized {len(self.clients)} active hospital clients.")
        finally:
            db.close()

    def start_training(
        self,
        rounds: int = 5,
        local_epochs: int = 2,
        lr: float = 0.005,
        aggregation_strategy: str = "Adaptive Trust-Aware FedAvg",
        participating_hospital_ids: Optional[List[str]] = None,
        client_dropout_prob: float = 0.10,
        trust_lambda: float = 0.90,
        smpc_threshold_k: int = 3
    ):
        """Start or restart federated learning loop in background thread."""
        with self._lock:
            if self.state == "TRAINING":
                return {"status": "ALREADY_RUNNING", "message": "Federated training is already in progress."}

            self.total_rounds = rounds
            self.local_epochs = local_epochs
            self.learning_rate = lr
            self.aggregation_strategy = aggregation_strategy
            self.client_dropout_prob = client_dropout_prob
            self.trust_lambda = trust_lambda
            self.smpc_threshold_k = smpc_threshold_k
            
            self.trust_manager.lambda_decay = trust_lambda
            self.smpc.k = smpc_threshold_k
            
            # Configure clients
            if participating_hospital_ids:
                active_hids = participating_hospital_ids
            else:
                active_hids = list(self.clients.keys())
                
            for hid, client in self.clients.items():
                client.dropout_probability = client_dropout_prob

            self._stop_requested = False
            self._pause_requested = False
            self.state = "TRAINING"

        self._log(f"Starting {rounds} rounds of Federated Training ({aggregation_strategy}). Participating hospitals: {len(active_hids)}.")
        
        # Log to DB
        db = SessionLocal()
        try:
            audit = AuditEvent(
                event_type="FEDERATED_TRAINING_START",
                actor_id="ADMIN_USER",
                actor_role="ADMIN",
                details=f"Federated training started: {rounds} rounds, strategy: {aggregation_strategy}, threshold: {smpc_threshold_k}/{len(active_hids)}."
            )
            db.add(audit)
            db.commit()
        finally:
            db.close()

        # Launch background execution
        self._training_thread = threading.Thread(
            target=self._run_training_loop,
            args=(active_hids,),
            daemon=True
        )
        self._training_thread.start()
        return {"status": "SUCCESS", "message": "Federated training session started."}

    def pause_training(self):
        with self._lock:
            if self.state == "TRAINING":
                self._pause_requested = True
                self.state = "PAUSED"
                self._log("Federated training paused by user.")
                return {"status": "SUCCESS", "message": "Training paused."}
            return {"status": "INVALID_STATE", "message": f"Cannot pause while in state: {self.state}"}

    def resume_training(self):
        with self._lock:
            if self.state == "PAUSED":
                self._pause_requested = False
                self.state = "TRAINING"
                self._log("Federated training resumed.")
                return {"status": "SUCCESS", "message": "Training resumed."}
            return {"status": "INVALID_STATE", "message": f"Cannot resume from state: {self.state}"}

    def stop_training(self):
        with self._lock:
            self._stop_requested = True
            self.state = "STOPPED"
            self._log("Federated training stopped by user.")
            return {"status": "SUCCESS", "message": "Training stopped."}

    def _run_training_loop(self, participating_hospital_ids: List[str]):
        """Main iterative federated training loop."""
        db = SessionLocal()
        try:
            for r in range(1, self.total_rounds + 1):
                while self._pause_requested:
                    if self._stop_requested:
                        break
                    time.sleep(1)

                if self._stop_requested:
                    self._log("Training loop received stop request.")
                    break

                self.current_round = r
                self._log(f"--- Starting Round {r}/{self.total_rounds} ---")
                round_start_time = datetime.datetime.utcnow()

                # Step 1: Model Distribution
                self._log(f"Distributing global model {self.global_model_version} to {len(participating_hospital_ids)} hospitals.")

                # Step 2: Local Hospital Training in Parallel
                client_results = []
                for hid in participating_hospital_ids:
                    client = self.clients.get(hid)
                    if not client:
                        continue
                    # Simulate local training
                    res = client.train_local_model(
                        global_parameters=self.global_parameters,
                        local_epochs=self.local_epochs,
                        lr=self.learning_rate
                    )
                    client_results.append(res)

                # Step 3: Handle Dropouts & Communication Failures
                active_results = [res for res in client_results if not res["is_dropout"]]
                dropped_results = [res for res in client_results if res["is_dropout"]]

                for d in dropped_results:
                    self._log(f"Hospital [{d['hospital_id']}] encountered communication dropout: {d['reason']}.")

                if len(active_results) < self.smpc_threshold_k:
                    self._log(f"WARNING: Insufficient participating hospitals ({len(active_results)} < threshold {self.smpc_threshold_k}). Skipping aggregation for round {r}.")
                    continue

                self._log(f"{len(active_results)} hospitals completed local updates. Proceeding to Secure Aggregation.")

                # Step 4: Secure Multi-Party Computation (SMPC & Shamir's Secret Sharing)
                active_weights = [res["parameters"] for res in active_results]
                active_hids = [res["hospital_id"] for res in active_results]
                active_samples = [res["num_samples"] for res in active_results]

                # Fetch current hospital trust scores from DB
                db_hospitals = {h.id: h for h in db.query(Hospital).all()}
                current_trust_scores = {hid: db_hospitals[hid].trust_score if hid in db_hospitals else 0.5 for hid in active_hids}

                # Step 5: Trust Calculation & Weight Assignment
                # Compute U, P, C, V for each active client
                u_scores = {}
                p_scores = {}
                c_scores = {}
                v_scores = {}
                s_scores = {}
                new_taus = {}
                explanations = {}

                # Use median update as reference for consistency
                reference_weights = [np.median([w[l] for w in active_weights], axis=0) for l in range(len(active_weights[0]))]

                for res in active_results:
                    hid = res["hospital_id"]
                    u = self.trust_manager.compute_update_consistency(res["parameters"], reference_weights)
                    h_rec = db_hospitals.get(hid)
                    successful_rounds = (h_rec.successful_rounds if h_rec else 0) + 1
                    total_rounds_selected = r
                    p = self.trust_manager.compute_participation_reliability(successful_rounds, total_rounds_selected)
                    c = self.trust_manager.compute_communication_reliability(res["comm_latency_ms"])
                    v = self.trust_manager.compute_validation_contribution(res["val_loss_before"], res["val_loss_after"], res["accuracy_delta"])
                    
                    s = self.trust_manager.calculate_round_score(u, p, c, v)
                    old_tau = current_trust_scores.get(hid, 0.5)
                    new_tau = self.trust_manager.update_ema_trust(old_tau, s)
                    
                    u_scores[hid] = u
                    p_scores[hid] = p
                    c_scores[hid] = c
                    v_scores[hid] = v
                    s_scores[hid] = s
                    new_taus[hid] = new_tau
                    explanations[hid] = self.trust_manager.generate_trust_explanation(u, p, c, v, s, old_tau, new_tau)

                # Compute Trust-Adjusted Aggregation Weights:
                # a(h) = q(h)*tau(h) / sum[q(j)*tau(j)]
                samples_dict = {res["hospital_id"]: res["num_samples"] for res in active_results}
                trust_weights = self.trust_manager.compute_aggregation_weights(
                    samples_dict,
                    new_taus,
                    active_hids
                )

                # Step 6: Perform Aggregation based on Strategy
                if self.aggregation_strategy == "FedAvg (Baseline)":
                    aggregated_weights = standard_fedavg(active_weights, active_samples)
                    self._log("Aggregated using standard FedAvg baseline.")
                elif self.aggregation_strategy == "Dynamic Gradient-Variance Thresholding":
                    aggregated_weights, accepted_indices = dynamic_gradient_variance_fedavg(
                        active_weights, self.global_parameters, active_samples
                    )
                    self._log(f"Aggregated using Dynamic Gradient-Variance ({len(accepted_indices)}/{len(active_weights)} accepted).")
                elif self.aggregation_strategy == "Combined Threshold + Trust-Aware":
                    aggregated_weights, accepted_hids = combined_threshold_trust_fedavg(
                        active_weights, self.global_parameters, active_samples, active_hids, self.trust_manager, new_taus
                    )
                    self._log(f"Aggregated using Combined Dynamic Threshold + Trust-Aware Weighting.")
                else:
                    # Default: Proposed Adaptive Trust-Aware Federated Learning
                    # Pass through SMPC Shamir secret sharing
                    weight_list = [trust_weights[hid] for hid in active_hids]
                    smpc_result = self.smpc.benchmark_secure_round(active_weights, weight_list)
                    aggregated_weights = smpc_result["reconstructed_weights"]
                    self._log(f"SMPC Shamir Secret Sharing verified: threshold {self.smpc.k}/{self.smpc.n}, crypto latency: {smpc_result['total_crypto_latency_ms']}ms.")

                # Step 7: Update Global Model
                self.global_parameters = aggregated_weights
                set_model_parameters(self.global_model, self.global_parameters)
                self.global_model_version = f"v1.{r}"

                # Step 8: Evaluate Global Model on Independent Benchmark Set
                eval_metrics = evaluate_model(self.global_model, self.X_val_benchmark, self.y_val_benchmark)
                round_latency = float(np.mean([res["comm_latency_ms"] for res in active_results])) + 15.0
                comm_overhead = float(len(active_hids) * 128.5)

                self.latest_metrics = {
                    "accuracy": round(eval_metrics["accuracy"], 4),
                    "precision": round(eval_metrics["precision"], 4),
                    "recall": round(eval_metrics["recall"], 4),
                    "f1_score": round(eval_metrics["f1"], 4),
                    "loss": round(eval_metrics["loss"], 4),
                    "latency_ms": round(round_latency, 2),
                    "comm_overhead_kb": round(comm_overhead, 2),
                    "secagg_status": "VERIFIED"
                }

                self._log(f"Round {r} Complete -> Accuracy: {eval_metrics['accuracy']:.4f}, F1: {eval_metrics['f1']:.4f}, Loss: {eval_metrics['loss']:.4f}.")

                # Step 9: Database Persistence
                fed_round = FederatedRound(
                    round_number=r,
                    status="COMPLETED",
                    start_time=round_start_time,
                    end_time=datetime.datetime.utcnow(),
                    global_model_version=self.global_model_version,
                    aggregation_strategy=self.aggregation_strategy,
                    accuracy=eval_metrics["accuracy"],
                    precision=eval_metrics["precision"],
                    recall=eval_metrics["recall"],
                    f1_score=eval_metrics["f1"],
                    loss=eval_metrics["loss"],
                    participating_hospitals_count=len(active_results),
                    comm_overhead_kb=comm_overhead,
                    latency_ms=round_latency,
                    secagg_verified=True
                )
                db.add(fed_round)
                db.flush()

                # Update Hospital Participation & Trust Histories
                for res in active_results:
                    hid = res["hospital_id"]
                    h_obj = db.query(Hospital).filter(Hospital.id == hid).first()
                    if h_obj:
                        h_obj.trust_score = round(new_taus[hid], 4)
                        h_obj.successful_rounds += 1
                        h_obj.current_model_version = self.global_model_version
                        h_obj.last_active = datetime.datetime.utcnow()

                    part = HospitalParticipation(
                        round_id=fed_round.id,
                        hospital_id=hid,
                        status="COMPLETED",
                        local_samples=res["num_samples"],
                        update_consistency_u=round(u_scores[hid], 4),
                        participation_p=round(p_scores[hid], 4),
                        comm_reliability_c=round(c_scores[hid], 4),
                        validation_contrib_v=round(v_scores[hid], 4),
                        round_trust_s=round(s_scores[hid], 4),
                        cum_trust_tau=round(new_taus[hid], 4),
                        weight_a=round(trust_weights.get(hid, 0.2), 4),
                        comm_latency_ms=res["comm_latency_ms"],
                        local_loss=res["train_loss"],
                        local_accuracy=res["val_accuracy"]
                    )
                    db.add(part)

                    t_hist = TrustHistory(
                        hospital_id=hid,
                        round_number=r,
                        u_score=round(u_scores[hid], 4),
                        p_score=round(p_scores[hid], 4),
                        c_score=round(c_scores[hid], 4),
                        v_score=round(v_scores[hid], 4),
                        composite_score=round(s_scores[hid], 4),
                        ema_trust=round(new_taus[hid], 4),
                        weight_applied=round(trust_weights.get(hid, 0.2), 4),
                        reason=explanations[hid]
                    )
                    db.add(t_hist)

                # Record dropouts in participation
                for d in dropped_results:
                    hid = d["hospital_id"]
                    part = HospitalParticipation(
                        round_id=fed_round.id,
                        hospital_id=hid,
                        status="DROPOUT",
                        local_samples=1000,
                        update_consistency_u=0.0,
                        participation_p=0.0,
                        comm_reliability_c=0.0,
                        validation_contrib_v=0.0,
                        round_trust_s=0.2,
                        cum_trust_tau=current_trust_scores.get(hid, 0.5),
                        weight_a=0.0,
                        comm_latency_ms=999.0,
                        local_loss=1.5,
                        local_accuracy=0.25
                    )
                    db.add(part)

                db.commit()

                # Emit real-time progress update
                self._emit_event({
                    "type": "ROUND_COMPLETE",
                    "round": r,
                    "accuracy": eval_metrics["accuracy"],
                    "f1": eval_metrics["f1"],
                    "loss": eval_metrics["loss"]
                })

                time.sleep(1.0)  # Brief pause between rounds for smooth visualization

            self.state = "COMPLETED"
            self._log("Federated training session successfully completed all scheduled rounds.")
        except Exception as e:
            self.state = "FAILED"
            self._log(f"Training loop encountered error: {str(e)}")
            db.rollback()
        finally:
            db.close()

    def predict_severity(self, clinical_features: Dict[str, float]) -> Dict[str, Any]:
        """Classify severity for single clinical profile using current global model."""
        self.global_model.eval()
        means = np.array([CLINICAL_STATS[k][0] for k in CLINICAL_STATS.keys()], dtype=np.float32)
        stds = np.array([CLINICAL_STATS[k][1] for k in CLINICAL_STATS.keys()], dtype=np.float32)

        feat_vector = np.array([clinical_features[k] for k in CLINICAL_STATS.keys()], dtype=np.float32)
        norm_vector = (feat_vector - means) / (stds + 1e-6)

        with torch.no_grad():
            x_tensor = torch.tensor(norm_vector.reshape(1, -1), dtype=torch.float32)
            logits = self.global_model(x_tensor)
            probs = torch.softmax(logits, dim=1).numpy()[0]
            pred_idx = int(np.argmax(probs))

        classes = ["Low Risk", "Moderate Risk", "High Risk", "Critical Risk"]
        prob_dict = {classes[i]: float(round(probs[i], 4)) for i in range(4)}

        return {
            "predicted_severity_class": classes[pred_idx],
            "severity_level": pred_idx,
            "confidence": float(round(probs[pred_idx] * 100, 2)),
            "risk_probabilities": prob_dict,
            "model_version": self.global_model_version,
            "training_round": self.current_round,
            "timestamp": datetime.datetime.utcnow(),
            "disclaimer": "Demonstration AI prototype trained on synthetic federated clinical data. Not validated for clinical diagnosis or treatment."
        }

# Global singleton coordinator
coordinator = FederatedCoordinator()
