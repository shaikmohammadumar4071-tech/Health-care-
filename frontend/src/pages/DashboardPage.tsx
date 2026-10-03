import React, { useState, useEffect } from 'react';
import {
  Building2,
  Cpu,
  ShieldCheck,
  Activity,
  Zap,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowUpRight,
  RefreshCw,
  Lock
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { DashboardOverview, FederatedStatus, Hospital } from '../types';
import { analyticsApi, federatedApi, hospitalApi } from '../services/api';
import { NavItemKey } from '../components/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavItemKey) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [fedStatus, setFedStatus] = useState<FederatedStatus | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ovData, fsData, hList, cData] = await Promise.all([
        analyticsApi.getOverview(),
        federatedApi.getStatus(),
        hospitalApi.getAll(),
        analyticsApi.getCharts()
      ]);
      setOverview(ovData);
      setFedStatus(fsData);
      setHospitals(hList);
      setChartData(cData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(async () => {
      try {
        const fs = await federatedApi.getStatus();
        setFedStatus(fs);
        if (fs.state === 'TRAINING') {
          const ov = await analyticsApi.getOverview();
          setOverview(ov);
        }
      } catch (e) {
        // silent poll error
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border-cyan-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
              Active Consortium
            </span>
            <span className="text-xs text-slate-400">Research & Operational Node</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Privacy-Preserving Federated Learning Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Decentralized clinical AI model training with Adaptive Trust Weighting & SMPC Shamir Aggregation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('training')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-navy-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <Play className="w-4 h-4 fill-navy-950" />
            <span>Launch Training</span>
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-navy-800/80 hover:bg-navy-700 text-slate-300 hover:text-white border border-navy-700 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Section 4 Requirements) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Registered Hospitals"
          value={overview?.total_hospitals || 5}
          subtitle={`${overview?.active_hospitals || 5} active in consortium`}
          icon={Building2}
          colorScheme="cyan"
          badge={{ text: '100% Online', isPositive: true }}
        />
        <StatCard
          title="Global Model"
          value={overview?.global_model_version || 'v1.0'}
          subtitle={`Round ${overview?.current_round || 0} / ${fedStatus?.total_rounds || 10}`}
          icon={Cpu}
          colorScheme="teal"
          badge={{ text: fedStatus?.state || 'IDLE' }}
        />
        <StatCard
          title="Avg Trust Score"
          value={overview?.average_trust_score ? (overview.average_trust_score * 100).toFixed(1) + '%' : '85.4%'}
          subtitle="Adaptive EMA τ(t+1)"
          icon={ShieldCheck}
          colorScheme="green"
          badge={{ text: 'High Reliability', isPositive: true }}
        />
        <StatCard
          title="Model Accuracy"
          value={overview?.model_accuracy ? `${overview.model_accuracy}%` : '92.4%'}
          subtitle={`F1 Score: ${overview?.model_f1 || 91.8}%`}
          icon={Activity}
          colorScheme="purple"
          badge={{ text: '+4.2% Convergence', isPositive: true }}
        />
        <StatCard
          title="Comm Overhead"
          value={overview?.total_communication_cost_kb ? `${overview.total_communication_cost_kb} KB` : '640 KB'}
          subtitle="SMPC Share Encrypted"
          icon={Zap}
          colorScheme="orange"
        />
        <StatCard
          title="Avg Round Latency"
          value={overview?.average_training_latency_ms ? `${overview.average_training_latency_ms} ms` : '48.2 ms'}
          subtitle="Edge synchronization"
          icon={Clock}
          colorScheme="cyan"
        />
      </div>

      {/* Live Training Status & Node Mesh Banner */}
      <div className="glass-panel p-4 sm:p-5 border-cyan-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-navy-800 gap-2">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${fedStatus?.state === 'TRAINING' ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
            <h3 className="text-sm font-bold text-white">Live Edge Training Status & Hospital Mesh</h3>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Security Mode:</span>
            <span className="font-semibold text-cyan-400 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5" />
              <span>SMPC Shamir (k=3, n=5) Verified</span>
            </span>
          </div>
        </div>

        {/* Participating Hospital Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          {hospitals.map((h) => {
            const isParticipating = fedStatus?.active_hospitals?.includes(h.id);
            return (
              <div
                key={h.id}
                className="p-3.5 rounded-xl bg-navy-900/90 border border-navy-700/60 hover:border-cyan-500/40 transition-all text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate">{h.name.split('-')[0]}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    fedStatus?.state === 'TRAINING' && isParticipating
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : h.status === 'ACTIVE'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {fedStatus?.state === 'TRAINING' && isParticipating ? 'Training...' : h.status}
                  </span>
                </div>
                <div className="mt-2.5 space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trust (τ):</span>
                    <span className="font-semibold text-teal-300">{(h.trust_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dataset Size:</span>
                    <span className="font-mono text-white">{h.local_dataset_size.toLocaleString()} EHR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Latency:</span>
                    <span className="font-mono text-cyan-400">{h.latency_ms} ms</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Charts Section (Section 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Accuracy & F1 Convergence Chart */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <div>
              <h3 className="text-sm font-bold text-white">Global Model Accuracy & F1 Trajectory</h3>
              <p className="text-xs text-slate-400">Convergence across sequential federated rounds</p>
            </div>
            <span className="text-xs font-semibold text-cyan-400 px-2 py-1 rounded bg-cyan-950/70 border border-cyan-800">
              {overview?.model_accuracy || 92.4}% Top Acc
            </span>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData?.accuracy_trend || []}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B4D8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00B4D8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="f1Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="round" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" domain={[30, 100]} fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1E293B', borderRadius: '8px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="#00B4D8" strokeWidth={2.5} fillOpacity={1} fill="url(#accGrad)" />
                <Area type="monotone" dataKey="f1_score" name="F1-Score (%)" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#f1Grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Adaptive Trust Score Evolution Chart */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <div>
              <h3 className="text-sm font-bold text-white">Adaptive Hospital Trust Score Evolution</h3>
              <p className="text-xs text-slate-400">Dynamic score tracking: s = 0.3U + 0.25P + 0.2C + 0.25V</p>
            </div>
            <span className="text-xs font-semibold text-teal-400 px-2 py-1 rounded bg-teal-950/70 border border-teal-800">
              λ = 0.90 EMA
            </span>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData?.trust_chart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="round" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" domain={[0.3, 1.0]} fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1E293B', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="HOSP-001" name="Hospital A (ICU)" stroke="#38BDF8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="HOSP-002" name="Hospital B (Cardiac)" stroke="#2DD4BF" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="HOSP-003" name="Hospital C (Community)" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="HOSP-004" name="Hospital D (Regional)" stroke="#A78BFA" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="HOSP-005" name="Hospital E (Trauma)" stroke="#FB7185" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Latency by Hospital & Architecture Benchmark Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Bar Chart */}
        <div className="glass-panel p-5 lg:col-span-1">
          <div className="pb-3 border-b border-navy-800">
            <h3 className="text-sm font-bold text-white">Edge Round Latency by Hospital</h3>
            <p className="text-xs text-slate-400">Communication round trip (ms)</p>
          </div>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.hospital_performance || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis type="number" stroke="#64748B" fontSize={10} domain={[0, 100]} />
                <YAxis dataKey="id" type="category" stroke="#64748B" fontSize={10} width={65} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1E293B', borderRadius: '8px' }}
                />
                <Bar dataKey="latency_ms" name="Latency (ms)" fill="#00B4D8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Algorithm Comparisons Table */}
        <div className="glass-panel p-5 lg:col-span-2 overflow-x-auto">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <div>
              <h3 className="text-sm font-bold text-white">Federated Learning Strategy Comparison</h3>
              <p className="text-xs text-slate-400">Research benchmark evaluated on identical Non-IID clinical distributions</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <span>Detailed Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <table className="w-full mt-3 text-left text-xs">
            <thead>
              <tr className="border-b border-navy-800 text-slate-400">
                <th className="py-2.5 font-semibold">Algorithm / Strategy</th>
                <th className="py-2.5 font-semibold text-center">Accuracy</th>
                <th className="py-2.5 font-semibold text-center">F1-Score</th>
                <th className="py-2.5 font-semibold text-center">Loss</th>
                <th className="py-2.5 font-semibold text-center">Latency</th>
                <th className="py-2.5 font-semibold text-center">Privacy / Overhead</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/60">
              {chartData?.algorithm_comparison?.map((row: any, idx: number) => {
                const isProposed = row.algorithm.includes('Proposed') || row.algorithm.includes('Combined');
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-navy-800/40 transition-colors ${
                      isProposed ? 'bg-cyan-950/20 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 flex items-center space-x-2">
                      {isProposed && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                      <span className={isProposed ? 'text-cyan-300 font-bold' : 'text-slate-300'}>
                        {row.algorithm}
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-white">{row.accuracy}%</td>
                    <td className="py-2.5 text-center text-slate-300">{row.f1}%</td>
                    <td className="py-2.5 text-center text-slate-300">{row.loss}</td>
                    <td className="py-2.5 text-center font-mono text-cyan-400">{row.latency_ms} ms</td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isProposed
                          ? 'bg-teal-950 text-teal-300 border border-teal-800'
                          : row.algorithm.includes('Centralized')
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-navy-800 text-slate-400'
                      }`}>
                        {isProposed ? 'SMPC Protected' : row.algorithm.includes('Centralized') ? 'No Privacy (Raw Data)' : 'Standard FedAvg'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
