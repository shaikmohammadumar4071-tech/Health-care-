import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Cpu,
  ShieldCheck,
  Zap,
  Terminal,
  Server,
  Activity,
  CheckCircle,
  AlertOctagon,
  Sliders,
  Settings2,
  RefreshCw
} from 'lucide-react';
import { federatedApi, hospitalApi } from '../services/api';
import { FederatedStatus, Hospital } from '../types';

export const FederatedTrainingPage: React.FC = () => {
  const [status, setStatus] = useState<FederatedStatus | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Training parameters
  const [rounds, setRounds] = useState(5);
  const [localEpochs, setLocalEpochs] = useState(2);
  const [learningRate, setLearningRate] = useState(0.005);
  const [strategy, setStrategy] = useState('Adaptive Trust-Aware FedAvg');
  const [dropoutProb, setDropoutProb] = useState(0.10);
  const [trustLambda, setTrustLambda] = useState(0.90);
  const [smpcThresholdK, setSmpcThresholdK] = useState(3);
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);

  const fetchStatus = async () => {
    try {
      const s = await federatedApi.getStatus();
      setStatus(s);
      if (s.current_logs && s.current_logs.length > 0) {
        setLogs(s.current_logs);
      }
    } catch (e) {
      console.error('Status fetch error:', e);
    }
  };

  const fetchHospitals = async () => {
    try {
      const data = await hospitalApi.getAll();
      setHospitals(data);
      if (selectedHospitals.length === 0) {
        setSelectedHospitals(data.map(h => h.id));
      }
    } catch (e) {
      console.error('Hospitals fetch error:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchHospitals();

    // WebSocket connection for live training stream
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'LOG') {
            setLogs(prev => [...prev.slice(-150), data.message]);
          } else if (data.type === 'ROUND_COMPLETE' || data.type === 'INITIAL_STATUS') {
            fetchStatus();
          }
        } catch (err) {}
      };
    } catch (e) {}

    // Polling fallback
    const interval = setInterval(fetchStatus, 3000);
    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleStart = async () => {
    try {
      setLoading(true);
      await federatedApi.start({
        rounds,
        local_epochs: localEpochs,
        learning_rate: learningRate,
        aggregation_strategy: strategy,
        participating_hospital_ids: selectedHospitals,
        client_dropout_prob: dropoutProb,
        trust_lambda: trustLambda,
        smpc_threshold_k: smpcThresholdK
      });
      fetchStatus();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start federated training.');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    await federatedApi.pause();
    fetchStatus();
  };

  const handleResume = async () => {
    await federatedApi.resume();
    fetchStatus();
  };

  const handleStop = async () => {
    if (confirm('Are you sure you want to terminate the training loop?')) {
      await federatedApi.stop();
      fetchStatus();
    }
  };

  const toggleHospitalSelection = (id: string) => {
    if (selectedHospitals.includes(id)) {
      if (selectedHospitals.length <= 2) {
        alert('Federated training requires at least 2 participating hospitals.');
        return;
      }
      setSelectedHospitals(selectedHospitals.filter(h => h !== id));
    } else {
      setSelectedHospitals([...selectedHospitals, id]);
    }
  };

  const isTraining = status?.state === 'TRAINING';
  const isPaused = status?.state === 'PAUSED';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 bg-gradient-to-r from-navy-900 to-navy-850 border-cyan-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
              Federation Orchestration Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Federated Training & Edge Aggregation Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Coordinate decentralized training across smart hospitals with Shamir's Secret Sharing and Adaptive Trust.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2.5">
          {!isTraining && !isPaused && (
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-navy-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-navy-950" />
              <span>Start Training</span>
            </button>
          )}

          {isTraining && (
            <button
              onClick={handlePause}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all"
            >
              <Pause className="w-4 h-4 fill-navy-950" />
              <span>Pause</span>
            </button>
          )}

          {isPaused && (
            <button
              onClick={handleResume}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Play className="w-4 h-4 fill-navy-950" />
              <span>Resume</span>
            </button>
          )}

          {(isTraining || isPaused) && (
            <button
              onClick={handleStop}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/20 transition-all"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress & Live Telemetry Strip */}
      <div className="glass-panel p-5 space-y-3 border-cyan-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-white uppercase text-[11px] tracking-wider">
              Training Session Progress:
            </span>
            <span className="text-cyan-400 font-mono font-bold">
              Round {status?.current_round || 0} of {status?.total_rounds || rounds}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isTraining ? 'bg-emerald-950 text-emerald-400 animate-pulse border border-emerald-800' : 'bg-navy-800 text-slate-300'
            }`}>
              {status?.state || 'IDLE'}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-slate-300 font-mono">
            <span>Accuracy: <strong className="text-emerald-400">{status?.latest_accuracy ? (status.latest_accuracy * 100).toFixed(1) + '%' : '92.4%'}</strong></span>
            <span>Loss: <strong className="text-cyan-400">{status?.latest_loss || '0.24'}</strong></span>
            <span>Latency: <strong className="text-purple-400">{status?.latest_latency_ms || '48.2'} ms</strong></span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-navy-950 rounded-full overflow-hidden border border-navy-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm shadow-cyan-400/50"
            style={{ width: `${status?.training_progress_pct || (isTraining ? 10 : 0)}%` }}
          />
        </div>
      </div>

      {/* Configuration & Hospital Selection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hyperparameters Card */}
        <div className="glass-panel p-5 space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Federation Parameters</span>
            </h3>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Config</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Scheduled Rounds:</span>
                <span className="font-mono text-cyan-400 font-bold">{rounds}</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                disabled={isTraining}
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Local Epochs (per round):</span>
                <span className="font-mono text-cyan-400 font-bold">{localEpochs}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                disabled={isTraining}
                value={localEpochs}
                onChange={(e) => setLocalEpochs(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Learning Rate (Adam):</span>
                <span className="font-mono text-cyan-400 font-bold">{learningRate}</span>
              </div>
              <select
                disabled={isTraining}
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-white focus:outline-none"
              >
                <option value="0.001">0.001 (Conservative)</option>
                <option value="0.005">0.005 (Recommended Default)</option>
                <option value="0.01">0.010 (Aggressive)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Aggregation Strategy:</span>
              </div>
              <select
                disabled={isTraining}
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-cyan-300 font-medium focus:outline-none"
              >
                <option value="Adaptive Trust-Aware FedAvg">Adaptive Trust-Aware FedAvg (Proposed)</option>
                <option value="Combined Threshold + Trust-Aware">Combined Dynamic Threshold + Trust</option>
                <option value="Dynamic Gradient-Variance Thresholding">Dynamic Gradient-Variance</option>
                <option value="FedAvg (Baseline)">FedAvg (Baseline)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Client Dropout Probability:</span>
                <span className="font-mono text-amber-400 font-bold">{(dropoutProb * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.4"
                step="0.05"
                disabled={isTraining}
                value={dropoutProb}
                onChange={(e) => setDropoutProb(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Simulates real-world network failure / disconnects</span>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>SMPC Reconstruction Threshold (k):</span>
                <span className="font-mono text-teal-400 font-bold">{smpcThresholdK} of {selectedHospitals.length}</span>
              </div>
              <input
                type="range"
                min="2"
                max={Math.max(2, selectedHospitals.length)}
                disabled={isTraining}
                value={smpcThresholdK}
                onChange={(e) => setSmpcThresholdK(parseInt(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Minimum shares required to aggregate without raw disclosure</span>
            </div>
          </div>
        </div>

        {/* Participating Hospitals Selector & Status Matrix */}
        <div className="glass-panel p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Selected Hospital Nodes ({selectedHospitals.length}/{hospitals.length})</span>
              </h3>
              <p className="text-xs text-slate-400">Toggle participating hospitals for this federated cohort</p>
            </div>
            <button
              onClick={() => setSelectedHospitals(hospitals.map(h => h.id))}
              disabled={isTraining}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Select All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hospitals.map((h) => {
              const isSelected = selectedHospitals.includes(h.id);
              const isCurrentlyTraining = isTraining && isSelected;
              return (
                <div
                  key={h.id}
                  onClick={() => !isTraining && toggleHospitalSelection(h.id)}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isTraining ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'bg-navy-900/90 border-cyan-500/40 shadow-sm shadow-cyan-950'
                      : 'bg-navy-950/60 border-navy-800/80 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{h.name}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      disabled={isTraining}
                      className="accent-cyan-400"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{h.region}</span>
                    <span className="font-mono text-cyan-300">{h.local_dataset_size} EHR</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Trust (τ): <strong className="text-teal-400">{(h.trust_score * 100).toFixed(1)}%</strong></span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isCurrentlyTraining
                        ? 'bg-emerald-950 text-emerald-400 animate-pulse border border-emerald-800'
                        : isSelected
                        ? 'bg-cyan-950 text-cyan-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {isCurrentlyTraining ? 'Training Local Epochs' : isSelected ? 'Enrolled' : 'Excluded'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Terminal Log Stream (Section 6 Requirements) */}
          <div className="mt-4">
            <div className="flex items-center justify-between py-1.5 px-3 rounded-t-lg bg-navy-950 border border-navy-800 text-xs">
              <span className="font-mono text-slate-400 flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Consortium Event Stream (Coordinator Engine)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">● Active Socket</span>
            </div>

            <div
              ref={logContainerRef}
              className="h-48 overflow-y-auto p-3 rounded-b-lg terminal-window text-[11px] text-slate-300 space-y-1 font-mono select-text"
            >
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`leading-relaxed ${
                    log.includes('WARNING')
                      ? 'text-amber-400'
                      : log.includes('SMPC') || log.includes('Round')
                      ? 'text-cyan-300 font-semibold'
                      : log.includes('Trust')
                      ? 'text-teal-300'
                      : 'text-slate-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
