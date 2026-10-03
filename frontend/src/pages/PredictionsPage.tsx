import React, { useState, useEffect } from 'react';
import {
  Activity,
  Heart,
  Thermometer,
  Gauge,
  Droplet,
  FlaskConical,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Sparkles,
  Layers
} from 'lucide-react';
import { PredictionFeatures, PredictionResult } from '../types';
import { predictionApi } from '../services/api';

export const PredictionsPage: React.FC = () => {
  const [features, setFeatures] = useState<PredictionFeatures>({
    age: 65,
    heart_rate: 98,
    temperature: 38.2,
    oxygen_saturation: 93,
    systolic_bp: 142,
    diastolic_bp: 88,
    respiratory_rate: 22,
    glucose: 145,
    wbc_count: 12.8,
    creatinine: 1.5
  });

  const [sampleCases, setSampleCases] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSampleCases();
  }, []);

  const fetchSampleCases = async () => {
    try {
      const data = await predictionApi.getSampleCases();
      setSampleCases(data.cases || []);
    } catch (e) {
      console.error('Failed to load sample cases:', e);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await predictionApi.predict(features);
      setPrediction(res);
    } catch (err) {
      alert('Prediction request failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadCase = (c: any) => {
    setFeatures({ ...c.features });
    setPrediction(null);
  };

  const getSeverityBadge = (cls?: string) => {
    switch (cls) {
      case 'Low Risk':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
      case 'Moderate Risk':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      case 'High Risk':
        return 'bg-amber-950/80 text-amber-400 border-amber-800';
      case 'Critical Risk':
        return 'bg-rose-950/80 text-rose-400 border-rose-800 animate-pulse';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border-cyan-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
              Federated Inference Engine
            </span>
            <span className="text-xs text-slate-400">Section 9 • Clinical Severity Classification</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Clinical Patient Severity Assessment Model
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Test the collaborative global model trained across smart hospital silos without raw patient data exposure.
          </p>
        </div>

        <div className="px-3 py-2 rounded-xl bg-navy-900 border border-navy-700 text-xs self-start sm:self-auto font-mono">
          <span className="text-slate-400">Target Task:</span>
          <p className="text-cyan-400 font-bold">In-Hospital Acuity Tiering</p>
        </div>
      </div>

      {/* Prominent Research Disclaimer (Section 9 Requirement) */}
      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-600/40 text-xs text-amber-200 flex items-start space-x-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-300">Research & Demonstration Disclaimer</p>
          <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
            This AI prediction module was trained collaboratively on synthetic non-IID clinical vitals and laboratory biomarkers. It is built strictly for computer science research, privacy-preserving protocol demonstration, and final-year software engineering evaluation. It is <strong>not clinically validated</strong> and must not be used for diagnosis or treatment decisions.
          </p>
        </div>
      </div>

      {/* One-Click Sample Clinical Profiles (Section 9 Requirement) */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-navy-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Authorized Sample Patient Profiles</span>
          </h3>
          <span className="text-[10px] text-slate-400">Synthetic De-identified Cohorts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sampleCases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => loadCase(c)}
              className="p-3 rounded-xl bg-navy-950/80 hover:bg-navy-900 border border-navy-800 hover:border-cyan-500/50 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-cyan-400">{c.id}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getSeverityBadge(c.expected_class)}`}>
                  {c.expected_class}
                </span>
              </div>
              <h4 className="font-bold text-white text-xs mt-1 group-hover:text-cyan-300 transition-colors">
                {c.title}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {c.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Inference Form & Output Result Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <form onSubmit={handlePredict} className="glass-panel p-5 space-y-4 lg:col-span-2 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Physiological Vitals & Laboratory Features</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">10 Normalized Predictors</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1.5">
                <span>Patient Age (years)</span>
              </label>
              <input
                type="number"
                min="1"
                max="105"
                required
                value={features.age}
                onChange={(e) => setFeatures({ ...features, age: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Heart Rate (bpm)</span>
              </label>
              <input
                type="number"
                min="30"
                max="220"
                required
                value={features.heart_rate}
                onChange={(e) => setFeatures({ ...features, heart_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>Body Temperature (°C)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="33.0"
                max="43.0"
                required
                value={features.temperature}
                onChange={(e) => setFeatures({ ...features, temperature: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1.5">
                <span>SpO2 Oxygen Saturation (%)</span>
              </label>
              <input
                type="number"
                min="60"
                max="100"
                required
                value={features.oxygen_saturation}
                onChange={(e) => setFeatures({ ...features, oxygen_saturation: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>Systolic Blood Pressure (mmHg)</span>
              </label>
              <input
                type="number"
                min="60"
                max="240"
                required
                value={features.systolic_bp}
                onChange={(e) => setFeatures({ ...features, systolic_bp: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>Diastolic Blood Pressure (mmHg)</span>
              </label>
              <input
                type="number"
                min="40"
                max="150"
                required
                value={features.diastolic_bp}
                onChange={(e) => setFeatures({ ...features, diastolic_bp: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1.5">
                <span>Respiratory Rate (breaths/min)</span>
              </label>
              <input
                type="number"
                min="8"
                max="60"
                required
                value={features.respiratory_rate}
                onChange={(e) => setFeatures({ ...features, respiratory_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1.5">
                <Droplet className="w-3.5 h-3.5 text-rose-400" />
                <span>Blood Glucose (mg/dL)</span>
              </label>
              <input
                type="number"
                min="40"
                max="600"
                required
                value={features.glucose}
                onChange={(e) => setFeatures({ ...features, glucose: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                <span>WBC Count (×10³/µL)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="50.0"
                required
                value={features.wbc_count}
                onChange={(e) => setFeatures({ ...features, wbc_count: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold flex items-center space-x-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-teal-400" />
                <span>Serum Creatinine (mg/dL)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.2"
                max="15.0"
                required
                value={features.creatinine}
                onChange={(e) => setFeatures({ ...features, creatinine: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-navy-800">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-navy-950 font-bold shadow-lg shadow-cyan-500/25 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Evaluating Model...' : 'Compute Federated Prediction'}</span>
            </button>
          </div>
        </form>

        {/* Prediction Results Panel */}
        <div className="glass-panel p-5 space-y-4 lg:col-span-1">
          <div className="pb-3 border-b border-navy-800">
            <h3 className="text-sm font-bold text-white">Inference Classification Result</h3>
            <p className="text-xs text-slate-400">Evaluated on federated global neural network</p>
          </div>

          {prediction ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 text-center">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Predicted Acuity Class
                </span>
                <div className="mt-2">
                  <span className={`inline-block px-3.5 py-1.5 rounded-full text-base font-extrabold border ${getSeverityBadge(prediction.predicted_severity_class)}`}>
                    {prediction.predicted_severity_class}
                  </span>
                </div>
                <p className="mt-2 text-xs font-mono text-cyan-400 font-bold">
                  Confidence: {prediction.confidence}%
                </p>
              </div>

              {/* Class Probability Distribution */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2">Class Probability Distribution</h4>
                <div className="space-y-2 text-xs">
                  {Object.entries(prediction.risk_probabilities).map(([cName, pVal]) => (
                    <div key={cName}>
                      <div className="flex justify-between text-[11px] mb-0.5 text-slate-300">
                        <span>{cName}</span>
                        <span className="font-mono font-bold text-cyan-400">{(pVal * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-navy-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full"
                          style={{ width: `${pVal * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Provenance Metadata */}
              <div className="p-3 rounded-xl bg-navy-950/70 border border-navy-800 text-[11px] text-slate-400 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Model Tag:</span>
                  <span className="text-white font-bold">{prediction.model_version}</span>
                </div>
                <div className="flex justify-between">
                  <span>Training Round:</span>
                  <span className="text-cyan-400">Round {prediction.training_round}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span>{new Date(prediction.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Fill in the patient's vitals or click one of the pre-configured sample profiles above and select <strong>"Compute Federated Prediction"</strong>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
