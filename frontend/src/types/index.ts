export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: 'ADMIN' | 'OPERATOR' | 'RESEARCHER';
  hospital_id?: string;
  is_active: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  region: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TRAINING' | 'OFFLINE';
  local_dataset_size: number;
  current_model_version: string;
  successful_rounds: number;
  participation_rate: number;
  communication_reliability: number;
  trust_score: number;
  latency_ms: number;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface HospitalParticipation {
  hospital_id: string;
  hospital_name: string;
  status: string;
  update_consistency_u: number;
  participation_p: number;
  comm_reliability_c: number;
  validation_contrib_v: number;
  round_trust_s: number;
  cum_trust_tau: number;
  weight_a: number;
  comm_latency_ms: number;
  local_loss: number;
  local_accuracy: number;
}

export interface FederatedRound {
  round_number: number;
  status: string;
  start_time: string;
  end_time?: string;
  global_model_version: string;
  aggregation_strategy: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  loss: number;
  participating_hospitals_count: number;
  comm_overhead_kb: number;
  latency_ms: number;
  secagg_verified: boolean;
  participations: HospitalParticipation[];
}

export interface FederatedStatus {
  state: 'IDLE' | 'TRAINING' | 'PAUSED' | 'STOPPED' | 'COMPLETED';
  current_round: number;
  total_rounds: number;
  global_model_version: string;
  aggregation_strategy: string;
  active_hospitals: string[];
  training_progress_pct: number;
  latest_accuracy: number;
  latest_f1_score: number;
  latest_loss: number;
  latest_latency_ms: number;
  latest_comm_overhead_kb: number;
  secagg_status: string;
  current_logs: string[];
}

export interface TrustScoreItem {
  hospital_id: string;
  hospital_name: string;
  region: string;
  current_trust: number;
  update_consistency_u: number;
  participation_p: number;
  comm_reliability_c: number;
  validation_contrib_v: number;
  composite_s: number;
  weight_a: number;
  status: string;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  reason: string;
}

export interface TrustHistoryItem {
  round_number: number;
  u_score: number;
  p_score: number;
  c_score: number;
  v_score: number;
  composite_score: number;
  ema_trust: number;
  weight_applied: number;
  reason?: string;
  timestamp: string;
}

export interface SecureAggStatus {
  protocol: string;
  status: string;
  total_participants: number;
  threshold_k: number;
  shares_generated_per_round: number;
  shares_verified_per_round: number;
  reconstruction_latency_ms: number;
  homomorphic_addition_latency_ms: number;
  total_crypto_latency_ms: number;
  simulated: boolean;
  privacy_guarantee: string;
  mathematical_basis: string;
}

export interface PredictionFeatures {
  age: number;
  heart_rate: number;
  temperature: number;
  oxygen_saturation: number;
  systolic_bp: number;
  diastolic_bp: number;
  respiratory_rate: number;
  glucose: number;
  wbc_count: number;
  creatinine: number;
}

export interface PredictionResult {
  predicted_severity_class: string;
  severity_level: number;
  confidence: number;
  risk_probabilities: Record<string, number>;
  model_version: string;
  training_round: number;
  timestamp: string;
  disclaimer: string;
}

export interface DashboardOverview {
  total_hospitals: number;
  active_hospitals: number;
  inactive_hospitals: number;
  current_round: number;
  global_model_version: string;
  average_trust_score: number;
  completed_rounds: number;
  model_accuracy: number;
  model_precision: number;
  model_recall: number;
  model_f1: number;
  model_loss: number;
  total_communication_cost_kb: number;
  average_training_latency_ms: number;
  secure_aggregation_status: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  event_type: string;
  actor_id?: string;
  actor_role?: string;
  hospital_id?: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILURE';
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  scenario: string;
  aggregation_strategy: string;
  total_rounds: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED';
  created_at: string;
}
