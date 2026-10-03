# Privacy-Preserving Federated Learning for Smart Hospitals
### Adaptive Trust-Aware Collaborative Healthcare AI without Sharing Patient Data

[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com/)
[![React Vite](https://img.shields.io/badge/React-18.3+-cyan.svg)](https://react.dev/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-orange.svg)](https://pytorch.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Project Overview & Core Novelty

This repository implements a full-stack, enterprise-grade, privacy-preserving federated learning platform designed for smart hospitals and healthcare consortia. Multiple medical centers collaboratively train deep learning models on sensitive patient electronic health records (EHR) **without centralizing, uploading, or sharing raw patient data**.

### Theoretical Basis & Research Reference
Based on the research framework:
> **"Adaptive Trust-Aware Federated Learning for Privacy-Preserving Smart Hospitals: Secure and Reliable Collaborative AI Without Sharing Patient Data"**

### Primary Architectural Pillars:
1. **Decentralized Local Training**: Hospital datasets remain completely isolated behind local institutional firewalls. Only model weight updates leave the hospital perimeter.
2. **Secure Multi-Party Computation (SMPC)**: Implements polynomial secret sharing (Shamir's $(k, n)$ scheme) with homomorphic share aggregation. The edge coordinator reconstructs only the combined aggregate weight vector, never any hospital's individual weights.
3. **Adaptive Trust Management (Core Novelty)**: A four-component telemetry engine that dynamically evaluates client consistency and computes trust-adjusted aggregation weights.
4. **Resilience to Non-IID & Dropouts**: Employs soft trust weighting rather than harsh exclusion, preserving valuable non-IID epidemiological insights while penalizing persistent network timeouts and gradient corruption.

---

## 2. Mathematical Formulations

### A. Four-Component Trust Scoring
For each hospital $h$ in round $t$, a technical reliability score $s(t)$ is computed from four normalized $[0, 1]$ components:

$$s(t) = 0.30 \cdot U(t) + 0.25 \cdot P(t) + 0.20 \cdot C(t) + 0.25 \cdot V(t)$$

Where:
* **$U$ (Update Consistency, 30%)**: Cosine similarity between the hospital's local gradient delta and the reference median update vector:
  $$U = \frac{\Delta w_h \cdot \Delta w_{\text{ref}}}{\|\Delta w_h\| \|\Delta w_{\text{ref}}\|}$$
* **$P$ (Participation Reliability, 25%)**: Ratio of successful round completions to scheduled training selections.
* **$C$ (Communication Reliability, 20%)**: Latency and network stability metric penalizing packet loss and transmission delays $> 80\text{ms}$.
* **$V$ (Validation Contribution, 25%)**: Empirical loss reduction and accuracy improvement evaluated on a reference validation set.

### B. Exponential Moving Average (EMA) Trust Memory
To prevent transient network jitter from destabilizing hospital standing while penalizing persistent degradation, trust is updated temporally:

$$\tau(t+1) = \lambda \cdot \tau(t) + (1 - \lambda) \cdot s(t)$$

* Configurable parameter: $\lambda = 0.90$
* All trust scores $\tau \in [0.0, 1.0]$
* Newly enrolled hospitals initialize with neutral trust $\tau_0 = 0.50$.

### C. Trust-Adjusted Aggregation Weighting
Unlike standard FedAvg which weights purely by sample count, the proposed scheme dynamically combines local sample contribution $q(h) = \frac{n_h}{N}$ with trust score $\tau(h)$:

$$a(h) = \frac{q(h) \times \tau(h)}{\sum_{j=1}^M \left[ q(j) \times \tau(j) \right]}$$

Guaranteed invariant: $\sum_{h} a(h) = 1.0$ for all accepted, eligible hospitals.

### D. Shamir's Secret Sharing $(k, n)$ Secure Aggregation
Model update parameters $w_h$ are protected by evaluating a random degree-$(k-1)$ polynomial:

$$P_h(x) = w_h + c_1 \cdot x + c_2 \cdot x^2 + \dots + c_{k-1} \cdot x^{k-1}$$

Exploiting the homomorphic linearity of polynomial evaluation:

$$S_{\text{agg}}(x) = \sum_{h=1}^M a(h) \cdot P_h(x)$$

Once at least $k$ shares are collected, the global aggregate is reconstructed at $x = 0$ via Lagrange interpolation:

$$w_{\text{agg}} = P_{\text{agg}}(0) = \sum_{i=1}^k \left( \prod_{j \neq i} \frac{-x_j}{x_i - x_j} \right) S_{\text{agg}}(x_i)$$

Zero raw model weights or patient records are exposed in plaintext to the coordinator or peer hospitals.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Axios |
| **Backend API** | Python 3.11, FastAPI, Pydantic v2, SQLAlchemy, Uvicorn, WebSockets |
| **AI / Machine Learning** | PyTorch, NumPy, Pandas, Scikit-learn, SciPy |
| **Cryptography** | Shamir's Secret Sharing SMPC module, Cryptography, PBKDF2-SHA256 |
| **Database** | SQLite (development) / PostgreSQL (production) |
| **Containerization** | Docker, Docker Compose, Nginx Reverse Proxy |

---

## 4. System Architecture & Folder Structure

```
smart-hospital-fl/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST & WebSocket routers
│   │   │   ├── auth.py
│   │   │   ├── hospitals.py
│   │   │   ├── federated.py
│   │   │   ├── trust.py
│   │   │   ├── aggregation.py
│   │   │   ├── predictions.py
│   │   │   ├── analytics.py
│   │   │   ├── experiments.py
│   │   │   ├── audit_logs.py
│   │   │   └── settings_api.py
│   │   ├── core/            # Config & JWT / PBKDF2 security
│   │   ├── database/        # Engine & SessionLocal
│   │   ├── models/          # SQLAlchemy entity models
│   │   └── schemas/         # Pydantic validation schemas
│   ├── federated/
│   │   ├── aggregation/     # SMPC Shamir secret sharing & strategies
│   │   ├── clients/         # Hospital local client trainers
│   │   ├── coordinator/     # Global round loop orchestrator
│   │   ├── models/          # PyTorch ClinicalSeverityMLP
│   │   └── trust/           # AdaptiveTrustManager engine
│   ├── datasets/synthetic/  # Non-IID clinical vitals generator
│   ├── experiments/         # Benchmark runner across 6 stress scenarios
│   ├── tests/               # Pytest automated test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, StatCards, Modals
│   │   ├── pages/           # 10 dedicated application pages
│   │   ├── services/        # Axios API client
│   │   └── types/           # TypeScript interfaces
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── start_app.bat            # Windows 1-click startup batch script
├── .env.example
└── README.md
```

---

## 5. Demonstration User Roles & Credentials

The application includes pre-seeded accounts for three distinct healthcare roles:

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full access: hospital management, training orchestration, hyperparameter settings, audit logs. |
| **Hospital Operator** | `operator_hospA` | `operator123` | Node view: local training configuration, participation history, local trust score. |
| **ML Researcher** | `researcher` | `researcher123` | Research view: strategy benchmarks, stress experiments, convergence analytics. |

*(Quick-switch between roles is also available in the Top Navbar).*

---

## 6. Implemented vs. Simulated Features

To maintain scientific integrity as mandated by research standards:

| Feature Component | Status | Implementation Detail |
| :--- | :--- | :--- |
| **Local PyTorch Model Training** | **Implemented (Real)** | Real neural network training with PyTorch (`ClinicalSeverityMLP`), backpropagation, cross-entropy loss, and Adam optimizer. |
| **Adaptive Trust Management** | **Implemented (Real)** | Exact mathematical implementation of $s = 0.3U + 0.25P + 0.2C + 0.25V$ and exponential moving average $\tau(t+1) = \lambda\tau(t) + (1-\lambda)s(t)$. |
| **Aggregation Weight Normalization** | **Implemented (Real)** | Dynamic calculation guaranteeing $\sum a(h) = 1.0$ across active eligible clients. |
| **Shamir's Secret Sharing & Lagrange Interpolation** | **Implemented (Real Math)** | Real polynomial share generation, homomorphic addition, and Lagrange interpolation evaluated at $x = 0$. |
| **Network Channels & Dropout** | **Simulated** | Network latency, packet jitter, and hospital dropouts are realistically simulated in software rather than physical multi-datacenter hardware. |
| **Patient Clinical Records** | **Simulated Synthetic** | Real physiological feature distributions (Age, HR, SpO2, BP, Glucose, WBC, Creatinine) generated synthetically to protect patient privacy without requiring clinical HIPAA data access. |

---

## 7. Installation & Quick Start Guide

### Prerequisites
* **Python 3.11+**
* **Node.js v20+** & **npm**
* *(Optional)* Docker & Docker Compose

### Option A: Local Execution (Windows / macOS / Linux)

#### 1. Clone & Enter Directory
```bash
git clone https://github.com/shaikmohammadumar4071-tech/Health-care-.git
cd Health-care-
```

#### 2. Start the Backend API
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend API available at: `http://localhost:8000`*
*Interactive Swagger Documentation: `http://localhost:8000/docs`*

#### 3. Start the Frontend Application (in a separate terminal)
```bash
cd frontend
npm install
npm run dev
```
*Frontend interface available at: `http://localhost:3000`*

#### 4. Windows One-Click Quick Launch
Double-click `start_app.bat` in the root folder to automatically boot both servers.

---

### Option B: Docker Compose Deployment

```bash
docker-compose up --build
```
* Frontend: `http://localhost:3000`
* Backend API: `http://localhost:8000`
* PostgreSQL: `localhost:5432`

---

## 8. Running the Automated Test Suite

A comprehensive test suite validates trust score formulas, SMPC reconstruction, API endpoints, and client privacy bounds:

```bash
cd backend
pytest tests/test_federated_system.py -v
```

### Verified Test Cases:
* `test_health_endpoint`: API availability and coordinator heartbeat.
* `test_trust_score_bounds_and_formula`: Validates mathematical formula and $[0, 1]$ bounds.
* `test_aggregation_weights_sum_to_one`: Proves $\sum a(h) = 1.0$.
* `test_smpc_shamir_secret_sharing_reconstruction`: Verifies Lagrange interpolation precision $< 10^{-4}$ vs direct weighted sum.
* `test_client_local_data_isolation`: Confirms raw patient records are never returned in network updates.
* `test_hospitals_api`: Verifies registration, listing, and status toggles.
* `test_trust_scores_api`: Checks component breakdown and trend calculations.
* `test_ai_prediction_api`: Validates severity classification and confidence scoring.
* `test_experiments_api`: Verifies multi-scenario benchmark generation.

---

## 9. API Documentation Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| `POST` | `/api/auth/register` | Register new consortium user |
| `GET` | `/api/hospitals` | List registered smart hospitals |
| `POST` | `/api/hospitals` | Enroll new hospital node |
| `GET` | `/api/hospitals/{id}` | Detailed hospital participation history |
| `POST` | `/api/hospitals/{id}/toggle-status` | Activate/Deactivate hospital node |
| `GET` | `/api/federated/status` | Current round and training status |
| `POST` | `/api/federated/start` | Launch federated training session |
| `POST` | `/api/federated/pause` | Pause training loop |
| `POST` | `/api/federated/resume` | Resume training loop |
| `POST` | `/api/federated/stop` | Terminate training loop |
| `GET` | `/api/federated/rounds` | Historical round metrics and participations |
| `WS` | `/ws` | Real-time WebSocket training telemetry & logs |
| `GET` | `/api/trust/scores` | 4-component trust breakdown and weights |
| `GET` | `/api/trust/history/{id}` | Round-by-round trust trajectory for hospital |
| `GET` | `/api/aggregation/status` | SMPC Shamir configuration and latencies |
| `POST` | `/api/aggregation/test-run` | Live SMPC cryptographic benchmark |
| `POST` | `/api/predictions/predict` | Compute clinical patient severity class |
| `GET` | `/api/predictions/sample-cases` | Load authorized sample clinical cases |
| `GET` | `/api/analytics/overview` | High-level KPI summary cards |
| `GET` | `/api/analytics/charts` | Accuracy, loss, trust, and latency chart data |
| `GET` | `/api/experiments` | List completed and running stress experiments |
| `POST` | `/api/experiments` | Launch new stress scenario experiment |
| `GET` | `/api/audit-logs` | Filterable compliance and security audit trail |
| `GET` | `/api/settings` | Get consortium hyperparameters |
| `POST` | `/api/settings` | Update trust decay $\lambda$ and SMPC threshold $k$ |

---

## 10. Research Experiment Scenarios

The platform evaluates federated performance under six demanding clinical scenarios:
1. **Clean Participation**: Baseline IID data across all 5 hospitals.
2. **Mild Non-IID Data**: Demographic and covariate shift between regional hospitals.
3. **Severe Non-IID Data**: Significant label distribution shifts (ICU vs Pediatric vs Trauma).
4. **Random Hospital Dropout**: 30% random client disconnection probability simulating edge outages.
5. **Persistent Communication Failures**: High round latency (> 120ms) and intermittent packet drops.
6. **Noisy Client Updates**: Corrupted gradient updates simulating Byzantine client behaviors.

---

## 11. Final-Year Project Defense Highlights

When presenting this project:
1. **Highlight the Research Problem**: Centralized hospital data sharing is prohibited by HIPAA/GDPR. Traditional FedAvg fails under non-IID healthcare distributions and rogue client dropouts.
2. **Demonstrate the Adaptive Trust Novelty**: Show how the 4-component trust formula ($s = 0.3U + 0.25P + 0.2C + 0.25V$) and EMA memory ($\lambda = 0.90$) maintain system stability without discarding unique regional medical insights.
3. **Demonstrate Zero Data Exposure**: Show the Secure Aggregation page proving that polynomial shares prevent any eavesdropper or central coordinator from reconstructing private patient weights.
4. **Live Training Demo**: Use the Federated Training page to run 5 rounds in real-time, observing the live terminal logs and the convergence of model accuracy from ~48% to >92%.
5. **Interactive Prediction**: Run a patient severity classification on the AI Predictions page with real clinical vital signs.
