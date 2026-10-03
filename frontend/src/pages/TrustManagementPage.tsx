import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  ArrowRight,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { TrustScoreItem } from '../types';
import { trustApi } from '../services/api';

export const TrustManagementPage: React.FC = () => {
  const [trustScores, setTrustScores] = useState<TrustScoreItem[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('HOSP-001');
  const [loading, setLoading] = useState(true);

  const fetchTrustData = async () => {
    try {
      setLoading(true);
      const data = await trustApi.getScores();
      setTrustScores(data);
    } catch (err) {
      console.error('Failed to fetch trust scores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrustData();
  }, []);

  const selectedItem = trustScores.find(h => h.hospital_id === selectedHospitalId) || trustScores[0];

  // Radar chart data for the selected hospital's 4 components
  const radarData = selectedItem
    ? [
        { subject: 'Consistency (U: 30%)', value: Math.round(selectedItem.update_consistency_u * 100), fullMark: 100 },
        { subject: 'Participation (P: 25%)', value: Math.round(selectedItem.participation_p * 100), fullMark: 100 },
        { subject: 'Comm Reliability (C: 20%)', value: Math.round(selectedItem.comm_reliability_c * 100), fullMark: 100 },
        { subject: 'Validation Contrib (V: 25%)', value: Math.round(selectedItem.validation_contrib_v * 100), fullMark: 100 },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Novelty Spotlight Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 bg-gradient-to-r from-navy-900 via-navy-850 to-teal-950/40 border-teal-500/30">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-950 text-teal-300 border border-teal-800">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Core Research Novelty</span>
            </span>
            <span className="text-xs text-slate-400">Section 7 • Adaptive Trust Framework</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Adaptive Trust-Aware Hospital Reliability Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Dynamic weighting of hospital contributions via 4 technical reliability components and Exponential Moving Average.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-navy-900/90 border border-navy-700/80 text-right self-start sm:self-auto font-mono text-xs">
          <span className="text-slate-400">Decay Constant (λ):</span>
          <p className="text-teal-400 font-bold text-sm">λ = 0.90</p>
        </div>
      </div>

      {/* Mathematical Formulation Explainer Card (Section 7) */}
      <div className="glass-panel p-5 border-teal-500/20 bg-navy-900/60">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2 pb-2 border-b border-navy-800">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Research Formulation & Dynamic Weighting Equations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs">
          <div className="p-3 rounded-xl bg-navy-950/80 border border-navy-800">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wide">1. Round Trust Score (s)</span>
            <p className="font-mono text-white text-sm mt-1 font-semibold">
              s = 0.30·U + 0.25·P + 0.20·C + 0.25·V
            </p>
            <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed">
              Synthesizes gradient consistency (U), round attendance (P), edge network latency (C), and global validation loss reduction (V).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-navy-950/80 border border-navy-800">
            <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wide">2. Exponential Moving Average (τ)</span>
            <p className="font-mono text-white text-sm mt-1 font-semibold">
              τ(t+1) = λ·τ(t) + (1 − λ)·s(t)
            </p>
            <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed">
              Maintains temporal continuity across rounds. New smart hospitals initialize at neutral τ = 0.50. Bounded strictly in [0, 1].
            </p>
          </div>

          <div className="p-3 rounded-xl bg-navy-950/80 border border-navy-800">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wide">3. Trust-Adjusted Weight a(h)</span>
            <p className="font-mono text-white text-sm mt-1 font-semibold">
              a(h) = [q(h)·τ(h)] / Σ [q(j)·τ(j)]
            </p>
            <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed">
              Harmonizes sample proportion q(h) with technical reliability τ(h). Soft weighting protects valuable non-IID patient insights.
            </p>
          </div>
        </div>
      </div>

      {/* Hospital Trust Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {trustScores.map((item) => {
          const isSelected = selectedHospitalId === item.hospital_id;
          return (
            <div
              key={item.hospital_id}
              onClick={() => setSelectedHospitalId(item.hospital_id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-teal-950/60 to-navy-900 border-teal-400/60 shadow-lg shadow-teal-950'
                  : 'bg-navy-900/70 border-navy-800 hover:border-navy-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400">{item.hospital_id}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-1 ${
                  item.trend === 'INCREASING'
                    ? 'bg-emerald-950 text-emerald-400'
                    : item.trend === 'DECREASING'
                    ? 'bg-rose-950 text-rose-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.trend === 'INCREASING' && <TrendingUp className="w-2.5 h-2.5" />}
                  {item.trend === 'DECREASING' && <TrendingDown className="w-2.5 h-2.5" />}
                  <span>{item.trend}</span>
                </span>
              </div>

              <h4 className="font-bold text-white text-xs mt-2 truncate">{item.hospital_name.split('-')[0]}</h4>

              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-teal-300">
                    {(item.current_trust * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-purple-300 font-mono">
                    Weight: {(item.weight_a * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Trust bar */}
                <div className="w-full h-1.5 bg-navy-950 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full"
                    style={{ width: `${item.current_trust * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Hospital Detailed Radar & 4-Component Breakdown */}
      {selectedItem && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Radar Chart */}
          <div className="glass-panel p-5 lg:col-span-1">
            <div className="pb-3 border-b border-navy-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Award className="w-4 h-4 text-teal-400" />
                <span>Component Radar ({selectedItem.hospital_id})</span>
              </h3>
              <p className="text-xs text-slate-400">{selectedItem.hospital_name}</p>
            </div>

            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1E293B" />
                  <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                  <Radar
                    name="Score (%)"
                    dataKey="value"
                    stroke="#14B8A6"
                    fill="#14B8A6"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1E293B', borderRadius: '8px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Component Metrics Progress Bars & Audit Rationale */}
          <div className="glass-panel p-5 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <div>
                <h3 className="text-sm font-bold text-white">4 Normalized Technical Components</h3>
                <p className="text-xs text-slate-400">Audit trail verifying technical reliability without evaluating clinical quality</p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-teal-950 text-teal-300 border border-teal-800 font-bold">
                Round Score s: {(selectedItem.composite_s * 100).toFixed(1)}%
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-semibold">Update Consistency (U: 30% weight)</span>
                  <span className="font-mono text-cyan-400">{(selectedItem.update_consistency_u * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-navy-950 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${selectedItem.update_consistency_u * 100}%` }} />
                </div>
                <span className="text-[10px] text-slate-400">Evaluated via cosine similarity between local gradient trajectory and reference median.</span>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-semibold">Participation Reliability (P: 25% weight)</span>
                  <span className="font-mono text-teal-400">{(selectedItem.participation_p * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-navy-950 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400 rounded-full" style={{ width: `${selectedItem.participation_p * 100}%` }} />
                </div>
                <span className="text-[10px] text-slate-400">Ratio of successfully uploaded round checkpoints vs scheduled training selections.</span>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-semibold">Communication Reliability (C: 20% weight)</span>
                  <span className="font-mono text-amber-400">{(selectedItem.comm_reliability_c * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-navy-950 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${selectedItem.comm_reliability_c * 100}%` }} />
                </div>
                <span className="text-[10px] text-slate-400">Network latency stability, connection jitter, and transmission success rate.</span>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-300 font-semibold">Validation Contribution (V: 25% weight)</span>
                  <span className="font-mono text-emerald-400">{(selectedItem.validation_contrib_v * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-navy-950 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${selectedItem.validation_contrib_v * 100}%` }} />
                </div>
                <span className="text-[10px] text-slate-400">Empirical loss reduction and accuracy improvement on reference validation cohorts.</span>
              </div>
            </div>

            {/* Auditable Rationale Explanation Box */}
            <div className="p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 text-xs mt-3">
              <span className="font-semibold text-teal-300 flex items-center space-x-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Auditable Decision Rationale:</span>
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {selectedItem.reason}
              </p>
              <div className="mt-2 text-[10px] text-slate-400 border-t border-navy-800/80 pt-1.5">
                Note: Trust scores quantify technical telemetry and model alignment only, never clinical competence or patient quality of care.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
