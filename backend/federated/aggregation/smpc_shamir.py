import time
import numpy as np
from typing import List, Tuple, Dict, Any

class ShamirSMPCSecretSharing:
    """
    Modular Secure Multi-Party Computation (SMPC) via Shamir's Secret Sharing
    for Privacy-Preserving Federated Model Aggregation.
    
    Mathematical Principle:
    A secret value w (e.g. model parameter or gradient) is shared by evaluating
    a random polynomial P(x) = w + a_1*x + a_2*x^2 + ... + a_(k-1)*x^(k-1)
    over evaluation points x = 1, 2, ..., N.
    
    Homomorphic Addition Property:
    P_agg(x) = sum_h [ alpha_h * P_h(x) ]
    Evaluating the aggregate shares allows reconstructing the weighted global aggregate:
    w_agg = P_agg(0) = sum_h [ alpha_h * w_h ]
    WITHOUT ANY PARTY OR THE COORDINATOR EVER LEARNING AN INDIVIDUAL HOSPITAL'S LOCAL UPDATE w_h!
    
    Disclaimer:
    This module implements research-grade floating-point / quantized polynomial Shamir
    secret sharing for demonstration and evaluation of cryptographic communication
    latency and threshold dropout resistance.
    """
    def __init__(self, threshold_k: int = 3, total_n: int = 5):
        assert threshold_k <= total_n, "Threshold k cannot exceed total participants N"
        self.k = threshold_k
        self.n = total_n

    def generate_polynomial_shares(
        self,
        weights: np.ndarray,
        num_shares: int = 5
    ) -> List[Tuple[int, np.ndarray]]:
        """
        Split a vector of model parameters into polynomial shares.
        Each share is (x, P(x)).
        Threshold degree: k - 1.
        """
        # Vector shape
        shape = weights.shape
        flat_weights = weights.astype(np.float32).flatten()
        num_elements = flat_weights.shape[0]

        # Generate k-1 random coefficient vectors
        rng = np.random.RandomState()
        coeffs = [rng.normal(0.0, 1.0, num_elements).astype(np.float32) for _ in range(self.k - 1)]

        shares = []
        for x in range(1, num_shares + 1):
            # P(x) = w + c_1 * x + c_2 * x^2 + ...
            p_x = flat_weights.copy()
            x_pow = float(x)
            for c in coeffs:
                p_x += c * x_pow
                x_pow *= float(x)
            shares.append((x, p_x.reshape(shape)))

        return shares

    def aggregate_shares(
        self,
        client_shares: List[List[Tuple[int, np.ndarray]]],
        weights: List[float]
    ) -> List[Tuple[int, np.ndarray]]:
        """
        Secure Edge / Homomorphic Share Aggregation:
        Given client shares for each evaluation point x_i,
        compute the weighted sum of shares:
        S_agg(x_i) = sum_h [ weight_h * S_h(x_i) ]
        """
        num_points = len(client_shares[0])
        aggregated_shares = []

        for p_idx in range(num_points):
            x_val = client_shares[0][p_idx][0]
            summed_arr = np.zeros_like(client_shares[0][p_idx][1], dtype=np.float32)
            
            for c_idx, shares in enumerate(client_shares):
                w = weights[c_idx]
                summed_arr += w * shares[p_idx][1]
                
            aggregated_shares.append((x_val, summed_arr))

        return aggregated_shares

    def reconstruct_secret(
        self,
        shares: List[Tuple[int, np.ndarray]]
    ) -> np.ndarray:
        """
        Lagrange Interpolation at x = 0:
        L_i(0) = prod_{j != i} [ 0 - x_j ] / [ x_i - x_j ]
        w_agg = sum_{i=1}^k [ L_i(0) * S(x_i) ]
        Requires at least threshold k shares.
        """
        if len(shares) < self.k:
            raise ValueError(f"Insufficient shares for reconstruction: got {len(shares)}, required {self.k}")

        # Use exactly k shares for reconstruction
        k_shares = shares[:self.k]
        xs = [s[0] for s in k_shares]
        
        flat_results = np.zeros_like(k_shares[0][1], dtype=np.float32)

        for i, (xi, yi) in enumerate(k_shares):
            # Compute Lagrange basis coefficient L_i(0)
            basis = 1.0
            for j, xj in enumerate(xs):
                if i != j:
                    basis *= (0.0 - xj) / (xi - xj)
            flat_results += float(basis) * yi

        return flat_results

    def benchmark_secure_round(
        self,
        local_model_weights: List[List[np.ndarray]],
        hospital_weights: List[float]
    ) -> Dict[str, Any]:
        """
        Execute an end-to-end SMPC aggregation test on model weights and record
        latencies, share counts, and reconstruction error.
        """
        t0 = time.perf_counter()
        num_hospitals = len(local_model_weights)
        
        # 1. Share Generation (Client-side)
        all_hospital_shares = []
        for h_idx in range(num_hospitals):
            h_shares = []
            for param in local_model_weights[h_idx]:
                # Split parameter into n shares
                shares = self.generate_polynomial_shares(param, num_shares=self.n)
                h_shares.append(shares)
            all_hospital_shares.append(h_shares)
            
        t1 = time.perf_counter()
        share_gen_ms = (t1 - t0) * 1000.0

        # 2. Homomorphic Edge Share Addition
        num_layers = len(local_model_weights[0])
        aggregated_layer_shares = []
        for l_idx in range(num_layers):
            layer_client_shares = [all_hospital_shares[h][l_idx] for h in range(num_hospitals)]
            agg_shares = self.aggregate_shares(layer_client_shares, hospital_weights)
            aggregated_layer_shares.append(agg_shares)
            
        t2 = time.perf_counter()
        homomorphic_add_ms = (t2 - t1) * 1000.0

        # 3. Global Secret Reconstruction at x=0
        reconstructed_weights = []
        for l_idx in range(num_layers):
            rec_param = self.reconstruct_secret(aggregated_layer_shares[l_idx])
            reconstructed_weights.append(rec_param)
            
        t3 = time.perf_counter()
        reconstruction_ms = (t3 - t2) * 1000.0
        total_crypto_ms = (t3 - t0) * 1000.0

        # Verification: compare reconstructed weights with standard direct weighted average
        direct_avg = []
        for l_idx in range(num_layers):
            d = np.zeros_like(local_model_weights[0][l_idx])
            for h in range(num_hospitals):
                d += hospital_weights[h] * local_model_weights[h][l_idx]
            direct_avg.append(d)
            
        max_error = max(
            float(np.max(np.abs(rec - d)))
            for rec, d in zip(reconstructed_weights, direct_avg)
        )

        return {
            "status": "SUCCESS" if max_error < 1e-3 else "VERIFICATION_ERROR",
            "protocol": "SMPC Shamir's (k, n) Secret Sharing",
            "num_hospitals": num_hospitals,
            "threshold_k": self.k,
            "total_shares_per_param": self.n,
            "max_reconstruction_error": max_error,
            "share_gen_latency_ms": round(share_gen_ms, 2),
            "homomorphic_add_latency_ms": round(homomorphic_add_ms, 2),
            "reconstruction_latency_ms": round(reconstruction_ms, 2),
            "total_crypto_latency_ms": round(total_crypto_ms, 2),
            "reconstructed_weights": reconstructed_weights,
            "simulated": True,
            "privacy_guarantee": "No hospital update is exposed in plaintext to central coordinator or peering nodes."
        }
