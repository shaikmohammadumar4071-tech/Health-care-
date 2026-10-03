import time
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from datasets.synthetic.clinical_generator import generate_hospital_data, CLINICAL_STATS, NUM_FEATURES
from federated.models.clinical_net import ClinicalSeverityMLP, get_model_parameters, set_model_parameters, evaluate_model

class HospitalClient:
    """
    Local Smart Hospital Federated Learning Client.
    Holds local private patient records in isolated memory/storage.
    Trains model locally and produces protected parameter updates.
    """
    def __init__(
        self,
        hospital_id: str,
        hospital_name: str,
        region: str,
        num_samples: int = 1200,
        baseline_latency_ms: float = 45.0,
        dropout_probability: float = 0.0,
        noise_level: float = 0.0
    ):
        self.hospital_id = hospital_id
        self.hospital_name = hospital_name
        self.region = region
        self.num_samples = num_samples
        self.baseline_latency_ms = baseline_latency_ms
        self.dropout_probability = dropout_probability
        self.noise_level = noise_level
        
        # Load local private clinical data (never transmitted over network!)
        self._load_local_data()

    def _load_local_data(self):
        """Generate/load hospital's private Non-IID clinical cohort."""
        seed = abs(hash(self.hospital_id)) % 10000
        X_raw, y_raw = generate_hospital_data(self.hospital_id, num_samples=self.num_samples, seed=seed)
        
        # Train/validation split locally
        split_idx = int(0.85 * len(X_raw))
        self.X_train_raw, self.y_train = X_raw[:split_idx], y_raw[:split_idx]
        self.X_val_raw, self.y_val = X_raw[split_idx:], y_raw[split_idx:]

        # Normalize features
        means = np.array([CLINICAL_STATS[k][0] for k in CLINICAL_STATS.keys()], dtype=np.float32)
        stds = np.array([CLINICAL_STATS[k][1] for k in CLINICAL_STATS.keys()], dtype=np.float32)
        
        self.X_train = (self.X_train_raw - means) / (stds + 1e-6)
        self.X_val = (self.X_val_raw - means) / (stds + 1e-6)

        # PyTorch Dataset
        tensor_x = torch.tensor(self.X_train, dtype=torch.float32)
        tensor_y = torch.tensor(self.y_train, dtype=torch.long)
        self.train_dataset = TensorDataset(tensor_x, tensor_y)

    def train_local_model(
        self,
        global_parameters: List[np.ndarray],
        local_epochs: int = 2,
        lr: float = 0.005,
        batch_size: int = 32
    ) -> Dict[str, Any]:
        """
        Execute local model training on private patient records.
        Returns:
            - updated_parameters (or delta)
            - training_loss
            - validation metrics
            - comm_latency_ms
            - is_dropout
        """
        # Check simulated dropout / network failure
        if np.random.rand() < self.dropout_probability:
            return {
                "hospital_id": self.hospital_id,
                "is_dropout": True,
                "reason": "Simulated network timeout or client disconnected"
            }

        # Simulate network latency with jitter
        jitter = np.random.normal(0, 10.0)
        actual_latency_ms = max(10.0, self.baseline_latency_ms + jitter)

        # Initialize local model with global parameters
        local_model = ClinicalSeverityMLP(input_dim=NUM_FEATURES, num_classes=4)
        set_model_parameters(local_model, global_parameters)

        # Evaluate initial state before training
        eval_before = evaluate_model(local_model, self.X_val, self.y_val)

        # PyTorch Local Training Loop
        local_model.train()
        optimizer = optim.Adam(local_model.parameters(), lr=lr, weight_decay=1e-4)
        criterion = nn.CrossEntropyLoss()
        data_loader = DataLoader(self.train_dataset, batch_size=batch_size, shuffle=True)

        epoch_losses = []
        for epoch in range(local_epochs):
            running_loss = 0.0
            for batch_x, batch_y in data_loader:
                optimizer.zero_grad()
                outputs = local_model(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()
                running_loss += loss.item() * batch_x.size(0)
            epoch_losses.append(running_loss / len(self.train_dataset))

        # Evaluate after training
        eval_after = evaluate_model(local_model, self.X_val, self.y_val)
        updated_params = get_model_parameters(local_model)

        # If noise injection is configured (for Byzantine/noisy client experiments)
        if self.noise_level > 0.0:
            for p in updated_params:
                p += np.random.normal(0, self.noise_level, p.shape).astype(np.float32)

        return {
            "hospital_id": self.hospital_id,
            "hospital_name": self.hospital_name,
            "is_dropout": False,
            "parameters": updated_params,
            "num_samples": len(self.X_train),
            "train_loss": float(epoch_losses[-1]) if epoch_losses else 0.35,
            "val_loss_before": eval_before["loss"],
            "val_loss_after": eval_after["loss"],
            "val_accuracy": eval_after["accuracy"],
            "val_f1": eval_after["f1"],
            "accuracy_delta": eval_after["accuracy"] - eval_before["accuracy"],
            "comm_latency_ms": round(actual_latency_ms, 2)
        }
