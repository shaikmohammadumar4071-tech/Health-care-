import numpy as np
from typing import Dict, List, Tuple, Any

class AdaptiveTrustManager:
    """
    Adaptive Trust-Aware Management for Smart Hospitals in Federated Learning.
    Based on research:
    s = 0.30*U + 0.25*P + 0.20*C + 0.25*V
    tau(t+1) = lambda * tau(t) + (1 - lambda) * s(t)
    a(h) = q(h) * tau(h) / sum(q(j) * tau(j))
    """
    def __init__(self, lambda_decay: float = 0.90):
        self.lambda_decay = lambda_decay
        self.weights = {
            "U": 0.30,  # Update Consistency
            "P": 0.25,  # Participation Reliability
            "C": 0.20,  # Communication Reliability
            "V": 0.25   # Validation Contribution
        }

    def compute_update_consistency(
        self,
        local_weights: List[np.ndarray],
        reference_weights: List[np.ndarray]
    ) -> float:
        """
        Compute Update Consistency (U) via cosine similarity between
        local model update gradient and reference/median update vector.
        """
        try:
            # Flatten local and reference weight differences
            loc_vec = np.concatenate([w.flatten() for w in local_weights])
            ref_vec = np.concatenate([w.flatten() for w in reference_weights])
            
            # Check for NaNs or Inf
            if np.isnan(loc_vec).any() or np.isinf(loc_vec).any():
                return 0.0
                
            norm_loc = np.linalg.norm(loc_vec)
            norm_ref = np.linalg.norm(ref_vec)
            
            if norm_loc == 0 or norm_ref == 0:
                return 0.5
                
            cos_sim = float(np.dot(loc_vec, ref_vec) / (norm_loc * norm_ref))
            # Map cosine similarity [-1, 1] to normalized [0, 1]
            u_score = float(np.clip((cos_sim + 1.0) / 2.0, 0.0, 1.0))
            return u_score
        except Exception:
            return 0.5

    def compute_participation_reliability(
        self,
        rounds_completed: int,
        rounds_selected: int
    ) -> float:
        """P: Ratio of successful rounds to scheduled selection rounds."""
        if rounds_selected == 0:
            return 1.0
        return float(np.clip(rounds_completed / rounds_selected, 0.0, 1.0))

    def compute_communication_reliability(
        self,
        latency_ms: float,
        packet_loss_rate: float = 0.0,
        target_latency: float = 80.0
    ) -> float:
        """
        C: Network stability score. Penalizes latency > 80ms and packet loss.
        """
        latency_factor = 1.0 / (1.0 + max(0.0, latency_ms - target_latency) / 100.0)
        comm_score = latency_factor * (1.0 - np.clip(packet_loss_rate, 0.0, 1.0))
        return float(np.clip(comm_score, 0.0, 1.0))

    def compute_validation_contribution(
        self,
        loss_before: float,
        loss_after: float,
        accuracy_delta: float
    ) -> float:
        """
        V: Validation contribution measuring improvement on reference validation set.
        """
        loss_improvement = max(0.0, loss_before - loss_after)
        # Normalized score
        v_score = 0.5 + (0.3 * np.tanh(loss_improvement * 5.0)) + (0.2 * np.tanh(accuracy_delta * 5.0))
        return float(np.clip(v_score, 0.0, 1.0))

    def calculate_round_score(
        self,
        u: float,
        p: float,
        c: float,
        v: float
    ) -> float:
        """s = 0.30*U + 0.25*P + 0.20*C + 0.25*V"""
        s = (
            self.weights["U"] * u +
            self.weights["P"] * p +
            self.weights["C"] * c +
            self.weights["V"] * v
        )
        return float(np.clip(s, 0.0, 1.0))

    def update_ema_trust(self, previous_trust: float, round_score: float) -> float:
        """tau(t+1) = lambda * tau(t) + (1 - lambda) * s(t)"""
        new_trust = (self.lambda_decay * previous_trust) + ((1.0 - self.lambda_decay) * round_score)
        return float(np.clip(new_trust, 0.0, 1.0))

    def compute_aggregation_weights(
        self,
        hospital_samples: Dict[str, int],
        hospital_trust: Dict[str, float],
        eligible_hospital_ids: List[str]
    ) -> Dict[str, float]:
        """
        Compute trust-adjusted aggregation weights:
        a(h) = [q(h) * tau(h)] / sum_j [q(j) * tau(j)]
        Guaranteed: sum_h a(h) == 1.0 for all accepted, eligible hospitals.
        """
        if not eligible_hospital_ids:
            return {}

        total_samples = sum(hospital_samples.get(hid, 1000) for hid in eligible_hospital_ids)
        if total_samples == 0:
            total_samples = 1

        unnormalized_weights = {}
        for hid in eligible_hospital_ids:
            # Normalized sample proportion q(h)
            q_h = hospital_samples.get(hid, 1000) / total_samples
            tau_h = max(0.01, hospital_trust.get(hid, 0.5))  # Minimum epsilon to avoid zero division
            unnormalized_weights[hid] = q_h * tau_h

        sum_weighted = sum(unnormalized_weights.values())
        if sum_weighted == 0:
            equal_w = 1.0 / len(eligible_hospital_ids)
            return {hid: equal_w for hid in eligible_hospital_ids}

        # Normalize so weights sum to exactly 1.0
        normalized_weights = {
            hid: float(unnormalized_weights[hid] / sum_weighted)
            for hid in eligible_hospital_ids
        }
        return normalized_weights

    def generate_trust_explanation(
        self,
        u: float,
        p: float,
        c: float,
        v: float,
        s: float,
        old_tau: float,
        new_tau: float
    ) -> str:
        """Auditable rationale explaining technical reliability shift."""
        delta = new_tau - old_tau
        reasons = []
        if u < 0.6:
            reasons.append("divergent gradient trajectory detected")
        elif u > 0.85:
            reasons.append("high model update alignment")
            
        if p < 0.9:
            reasons.append("intermittent round dropout observed")
        if c < 0.7:
            reasons.append("elevated round latency (>120ms)")
        if v > 0.8:
            reasons.append("strong global loss reduction")
            
        direction = "improved" if delta > 0.01 else ("declined" if delta < -0.01 else "remained stable")
        details = ", ".join(reasons) if reasons else "nominal technical metrics"
        return f"Trust score {direction} by {abs(delta):.3f} (Round score: {s:.3f}, U:{u:.2f}, P:{p:.2f}, C:{c:.2f}, V:{v:.2f}). Primary factors: {details}."
