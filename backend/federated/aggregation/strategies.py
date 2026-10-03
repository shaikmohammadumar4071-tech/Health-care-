import numpy as np
from typing import List, Dict, Tuple, Any

def standard_fedavg(
    local_weights: List[List[np.ndarray]],
    sample_sizes: List[int]
) -> List[np.ndarray]:
    """Standard McMahan et al. FedAvg baseline."""
    total_samples = sum(sample_sizes)
    num_layers = len(local_weights[0])
    aggregated = []
    
    for l in range(num_layers):
        layer_sum = np.zeros_like(local_weights[0][l], dtype=np.float32)
        for h_idx in range(len(local_weights)):
            w = sample_sizes[h_idx] / total_samples
            layer_sum += w * local_weights[h_idx][l]
        aggregated.append(layer_sum)
        
    return aggregated

def dynamic_gradient_variance_fedavg(
    local_weights: List[List[np.ndarray]],
    global_weights: List[np.ndarray],
    sample_sizes: List[int],
    threshold_factor: float = 1.5
) -> Tuple[List[np.ndarray], List[int]]:
    """
    Dynamic Gradient-Variance Thresholding:
    Computes update norms and rejects outliers deviating > mean + factor * std.
    """
    # Compute update delta norms
    norms = []
    for h_idx in range(len(local_weights)):
        delta_vec = []
        for l in range(len(global_weights)):
            delta_vec.append((local_weights[h_idx][l] - global_weights[l]).flatten())
        full_delta = np.concatenate(delta_vec)
        norms.append(float(np.linalg.norm(full_delta)))

    mean_norm = float(np.mean(norms))
    std_norm = float(np.std(norms))
    thresh = mean_norm + threshold_factor * (std_norm + 1e-6)

    accepted_indices = [i for i, norm in enumerate(norms) if norm <= thresh]
    if not accepted_indices:
        accepted_indices = [int(np.argmin(norms))]  # Keep at least closest

    filtered_weights = [local_weights[i] for i in accepted_indices]
    filtered_samples = [sample_sizes[i] for i in accepted_indices]

    return standard_fedavg(filtered_weights, filtered_samples), accepted_indices

def adaptive_trust_fedavg(
    local_weights: List[List[np.ndarray]],
    trust_weights: Dict[str, float],
    hospital_ids: List[str]
) -> List[np.ndarray]:
    """
    Proposed Adaptive Trust-Aware Federated Aggregation:
    w_{global} = sum_{h} a(h) * w_h
    where a(h) is normalized trust-adjusted contribution weight.
    """
    num_layers = len(local_weights[0])
    aggregated = []

    for l in range(num_layers):
        layer_sum = np.zeros_like(local_weights[0][l], dtype=np.float32)
        for h_idx, hid in enumerate(hospital_ids):
            a_h = trust_weights.get(hid, 1.0 / len(hospital_ids))
            layer_sum += a_h * local_weights[h_idx][l]
        aggregated.append(layer_sum)

    return aggregated

def combined_threshold_trust_fedavg(
    local_weights: List[List[np.ndarray]],
    global_weights: List[np.ndarray],
    sample_sizes: List[int],
    hospital_ids: List[str],
    trust_manager: Any,
    hospital_trust_scores: Dict[str, float]
) -> Tuple[List[np.ndarray], List[str]]:
    """
    Combined Dynamic Thresholding + Adaptive Trust Weighting:
    Filter out severe protocol violations, then trust-weight remaining clients.
    """
    norms = []
    for h_idx in range(len(local_weights)):
        delta_vec = []
        for l in range(len(global_weights)):
            delta_vec.append((local_weights[h_idx][l] - global_weights[l]).flatten())
        full_delta = np.concatenate(delta_vec)
        norms.append(float(np.linalg.norm(full_delta)))

    mean_norm = float(np.mean(norms))
    std_norm = float(np.std(norms))
    thresh = mean_norm + 2.0 * (std_norm + 1e-6)

    accepted_indices = [i for i, norm in enumerate(norms) if norm <= thresh]
    if not accepted_indices:
        accepted_indices = list(range(len(hospital_ids)))

    accepted_hids = [hospital_ids[i] for i in accepted_indices]
    accepted_weights = [local_weights[i] for i in accepted_indices]
    
    samples_dict = {hospital_ids[i]: sample_sizes[i] for i in accepted_indices}
    norm_trust_weights = trust_manager.compute_aggregation_weights(
        samples_dict,
        hospital_trust_scores,
        accepted_hids
    )

    agg = adaptive_trust_fedavg(accepted_weights, norm_trust_weights, accepted_hids)
    return agg, accepted_hids
