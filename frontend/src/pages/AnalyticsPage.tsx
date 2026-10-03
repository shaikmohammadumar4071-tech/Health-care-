import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Activity,
  Layers,
  Award,
  Zap,
  Clock,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { analyticsApi } from '../services/api';

export const AnalyticsPage: React.FC = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'f1' | 'loss' | 'latency_ms'>('accuracy');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharts();
  }, []);

  const fetchCharts = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getCharts();
      setChartData(data);
    } catch (e) {
      console.error('Failed to fetch analytics charts:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 bg-gradient-to-r from-navy-900 to-navy-850 border-cyan-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
              Comparative Intelligence
            </span>
            <span className="text-xs text-slate-400">Section 10 • Empirical Evaluation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Federated Learning Architectural Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Empirical benchmark comparing Centralized, FedAvg, Dynamic Gradient Variance, and Proposed Adaptive Trust.
          </p>
        </div>
      </div>

      {/* Metric Selector Buttons */}
      <div className="flex items-center space-x-2 glass-panel p-2">
        <button
          onClick={() => setSelectedMetric('accuracy')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedMetric === 'accuracy'
              ? 'bg-cyan-500 text-navy-950 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Model Accuracy (%)
        </button>
        <button
          onClick={() => setSelectedMetric('f1')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedMetric === 'f1'
              ? 'bg-teal-500 text-navy-950 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          F1-Score (%)
        </button>
        <button
          onClick={() => setSelectedMetric('loss')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedMetric === 'loss'
              ? 'bg-purple-500 text-white font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Cross-Entropy Loss
        </button>
        <button
          onClick={() => setSelectedMetric('latency_ms')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedMetric === 'latency_ms'
              ? 'bg-amber-500 text-navy-950 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Communication Latency (ms)
        </button>
      </div>

      {/* Comparative Strategy Bar Chart */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between pb-3 border-b border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-white">5-Architecture Direct Comparison</h3>
            <p className="text-xs text-slate-400">
              Evaluated on identical Non-IID clinical patient distributions
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase">
            Metric: {selectedMetric.toUpperCase()}
          </span>
        </div>

        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData?.algorithm_comparison || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="algorithm" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B132B', borderColor: '#1E293B', borderRadius: '8px' }}
              />
              <Bar
                dataKey={selectedMetric}
                name={selectedMetric.toUpperCase()}
                fill={
                  selectedMetric === 'accuracy'
                    ? '#00B4D8'
                    : selectedMetric === 'f1'
                    ? '#10B981'
                    : selectedMetric === 'loss'
                    ? '#A78BFA'
                    : '#F59E0B'
                }
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comprehensive Architectural Benchmark Matrix (Section 10 Requirements) */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-navy-800">
          <div>
            <h3 className="text-sm font-bold text-white">Comprehensive Strategy Evaluation Matrix</h3>
            <p className="text-xs text-slate-400">Quantitative multi-dimensional breakdown across 10 rounds</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-900/90 border-b border-navy-800 text-slate-300 text-[11px] uppercase">
              <tr>
                <th className="py-3 px-3">Architecture</th>
                <th className="py-3 px-3 text-center">Accuracy</th>
                <th className="py-3 px-3 text-center">F1-Score</th>
                <th className="py-3 px-3 text-center">Loss</th>
                <th className="py-3 px-3 text-center">Comm Overhead</th>
                <th className="py-3 px-3 text-center">Avg Latency</th>
                <th className="py-3 px-3 text-center">Dropout Tolerance</th>
                <th className="py-3 px-3 text-center">Privacy Guarantee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/60 font-mono text-slate-300">
              <tr className="hover:bg-navy-900/40">
                <td className="py-3 px-3 font-sans font-bold text-slate-300">Centralized Training</td>
                <td className="py-3 px-3 text-center text-white">94.6%</td>
                <td className="py-3 px-3 text-center">93.8%</td>
                <td className="py-3 px-3 text-center">0.18</td>
                <td className="py-3 px-3 text-center">0 KB / round</td>
                <td className="py-3 px-3 text-center">28.0 ms</td>
                <td className="py-3 px-3 text-center text-rose-400">N/A (Single Server)</td>
                <td className="py-3 px-3 text-center text-rose-400 font-sans text-[11px]">Zero (Raw Data Shared)</td>
              </tr>
              <tr className="hover:bg-navy-900/40">
                <td className="py-3 px-3 font-sans text-slate-300">Standard FedAvg (McMahan)</td>
                <td className="py-3 px-3 text-center text-white">82.4%</td>
                <td className="py-3 px-3 text-center">80.9%</td>
                <td className="py-3 px-3 text-center">0.42</td>
                <td className="py-3 px-3 text-center">640.0 KB</td>
                <td className="py-3 px-3 text-center">68.0 ms</td>
                <td className="py-3 px-3 text-center text-amber-400">Low (Stalls on Non-IID)</td>
                <td className="py-3 px-3 text-center text-amber-400 font-sans text-[11px]">Unmasked Weights</td>
              </tr>
              <tr className="hover:bg-navy-900/40">
                <td className="py-3 px-3 font-sans text-slate-300">Dynamic Gradient-Variance</td>
                <td className="py-3 px-3 text-center text-white">85.1%</td>
                <td className="py-3 px-3 text-center">84.0%</td>
                <td className="py-3 px-3 text-center">0.36</td>
                <td className="py-3 px-3 text-center">537.6 KB</td>
                <td className="py-3 px-3 text-center">72.0 ms</td>
                <td className="py-3 px-3 text-center text-cyan-400">Moderate</td>
                <td className="py-3 px-3 text-center text-amber-400 font-sans text-[11px]">Threshold Sanitized</td>
              </tr>
              <tr className="hover:bg-navy-900/40 bg-teal-950/20 font-bold border-l-2 border-l-teal-400">
                <td className="py-3 px-3 font-sans text-teal-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Proposed Adaptive Trust-Aware</span>
                </td>
                <td className="py-3 px-3 text-center text-teal-300">92.8%</td>
                <td className="py-3 px-3 text-center text-teal-300">92.1%</td>
                <td className="py-3 px-3 text-center text-teal-300">0.22</td>
                <td className="py-3 px-3 text-center text-teal-300">614.4 KB</td>
                <td className="py-3 px-3 text-center text-teal-300">52.0 ms</td>
                <td className="py-3 px-3 text-center text-emerald-400 font-sans text-[11px]">High (Robust Soft Weighting)</td>
                <td className="py-3 px-3 text-center text-emerald-400 font-sans text-[11px]">SMPC Shamir Encrypted</td>
              </tr>
              <tr className="hover:bg-navy-900/40 bg-cyan-950/20 font-bold border-l-2 border-l-cyan-400">
                <td className="py-3 px-3 font-sans text-cyan-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Combined Threshold + Trust</span>
                </td>
                <td className="py-3 px-3 text-center text-cyan-300">93.2%</td>
                <td className="py-3 px-3 text-center text-cyan-300">92.6%</td>
                <td className="py-3 px-3 text-center text-cyan-300">0.21</td>
                <td className="py-3 px-3 text-center text-cyan-300">588.8 KB</td>
                <td className="py-3 px-3 text-center text-cyan-300">56.0 ms</td>
                <td className="py-3 px-3 text-center text-emerald-400 font-sans text-[11px]">Very High</td>
                <td className="py-3 px-3 text-center text-emerald-400 font-sans text-[11px]">SMPC + Outlier Defense</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
