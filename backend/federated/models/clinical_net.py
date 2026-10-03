import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import List, Tuple, Dict
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, log_loss

class ClinicalSeverityMLP(nn.Module):
    """
    Healthcare Severity Classification Neural Network.
    Predicts In-Hospital Severity Tiers (Low, Moderate, High, Critical)
    from vital signs and laboratory biomarkers.
    """
    def __init__(self, input_dim: int = 10, num_classes: int = 4):
        super(ClinicalSeverityMLP, self).__init__()
        self.fc1 = nn.Linear(input_dim, 64)
        self.bn1 = nn.BatchNorm1d(64)
        self.drop1 = nn.Dropout(0.2)
        
        self.fc2 = nn.Linear(64, 32)
        self.bn2 = nn.BatchNorm1d(32)
        self.drop2 = nn.Dropout(0.2)
        
        self.fc3 = nn.Linear(32, 16)
        self.bn3 = nn.BatchNorm1d(16)
        
        self.out = nn.Linear(16, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # If batch size is 1 during single-patient inference, bypass batchnorm or use eval mode
        if x.shape[0] == 1 and self.training:
            self.eval()
        
        if x.shape[0] > 1 and self.training:
            x = F.relu(self.bn1(self.fc1(x)))
            x = self.drop1(x)
            x = F.relu(self.bn2(self.fc2(x)))
            x = self.drop2(x)
            x = F.relu(self.bn3(self.fc3(x)))
        else:
            x = F.relu(self.fc1(x))
            x = F.relu(self.fc2(x))
            x = F.relu(self.fc3(x))
            
        logits = self.out(x)
        return logits

def get_model_parameters(model: nn.Module) -> List[np.ndarray]:
    """Extract weight and bias tensors as a list of numpy arrays for aggregation."""
    return [val.cpu().detach().numpy().astype(np.float32).copy() for _, val in model.state_dict().items()]

def set_model_parameters(model: nn.Module, parameters: List[np.ndarray]):
    """Assign aggregated weights into model state dictionary."""
    state_dict = model.state_dict()
    for (k, _), param in zip(state_dict.items(), parameters):
        state_dict[k] = torch.tensor(param, dtype=state_dict[k].dtype)
    model.load_state_dict(state_dict)

def evaluate_model(model: nn.Module, X: np.ndarray, y: np.ndarray) -> Dict[str, float]:
    """Calculate accuracy, precision, recall, f1, and cross-entropy loss."""
    model.eval()
    with torch.no_grad():
        x_tensor = torch.tensor(X, dtype=torch.float32)
        logits = model(x_tensor)
        probs = F.softmax(logits, dim=1).numpy()
        preds = np.argmax(probs, axis=1)
        
        # Loss
        loss_fn = nn.CrossEntropyLoss()
        y_tensor = torch.tensor(y, dtype=torch.long)
        loss_val = float(loss_fn(logits, y_tensor).item())
        
        acc = float(accuracy_score(y, preds))
        prec, rec, f1, _ = precision_recall_fscore_support(y, preds, average='weighted', zero_division=0)
        
    return {
        "accuracy": acc,
        "precision": float(prec),
        "recall": float(rec),
        "f1": float(f1),
        "loss": loss_val
    }
