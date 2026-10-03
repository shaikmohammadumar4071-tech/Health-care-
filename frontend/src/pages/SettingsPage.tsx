import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Lock,
  Shield,
  Sliders,
  Server,
  Zap,
  Info
} from 'lucide-react';
import { settingsApi } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    trust_lambda: 0.90,
    smpc_threshold_k: 3,
    default_rounds: 10,
    default_local_epochs: 2,
    default_lr: 0.005,
    client_dropout_prob: 0.10,
    system_status: 'ONLINE',
    privacy_mode: 'SMPC_SHAMIR_SECRET_SHARING'
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.update(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 bg-gradient-to-r from-navy-900 to-navy-850 border-cyan-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
              Consortium Configuration
            </span>
            <span className="text-xs text-slate-400">Hyperparameters & Protocol Defaults</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Federation Architecture Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Configure global trust decay rates, SMPC reconstruction thresholds, and local client hyperparameters.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Parameters Updated & Synchronized</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Adaptive Trust Hyperparameters */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>Adaptive Trust Score Parameters</span>
            </h3>
            <span className="text-[10px] text-teal-400 font-mono">Section 7 Novelty</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-semibold">Trust Temporal Memory (λ):</span>
                <span className="font-mono text-teal-400 font-bold">{settings.trust_lambda}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={settings.trust_lambda}
                onChange={(e) => setSettings({ ...settings, trust_lambda: parseFloat(e.target.value) })}
                className="w-full accent-teal-400"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Controls the exponential moving average decay: τ(t+1) = λ·τ(t) + (1-λ)·s(t). High λ (0.90) dampens transient round noise while penalizing persistent degradation.
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 text-[11px] text-slate-300 space-y-1.5">
              <p className="font-semibold text-white">Trust Component Fixed Coefficients:</p>
              <ul className="space-y-1 font-mono text-[10px] text-slate-400">
                <li>• Update Consistency (U): <strong>30% (0.30)</strong></li>
                <li>• Participation Reliability (P): <strong>25% (0.25)</strong></li>
                <li>• Communication Reliability (C): <strong>20% (0.20)</strong></li>
                <li>• Validation Contribution (V): <strong>25% (0.25)</strong></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cryptographic & Training Parameters */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>SMPC & Training Hyperparameters</span>
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">Security Layer</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-semibold">Default SMPC Threshold (k):</span>
                <span className="font-mono text-cyan-400 font-bold">{settings.smpc_threshold_k} shares</span>
              </div>
              <input
                type="range"
                min="2"
                max="5"
                value={settings.smpc_threshold_k}
                onChange={(e) => setSettings({ ...settings, smpc_threshold_k: parseInt(e.target.value) })}
                className="w-full accent-cyan-400"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Minimum polynomial shares required for Lagrange interpolation without revealing individual updates.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Default Local Epochs</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.default_local_epochs}
                  onChange={(e) => setSettings({ ...settings, default_local_epochs: parseInt(e.target.value) || 2 })}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Default Learning Rate</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.0001"
                  max="0.1"
                  value={settings.default_lr}
                  onChange={(e) => setSettings({ ...settings, default_lr: parseFloat(e.target.value) || 0.005 })}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-navy-950 font-bold shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Apply & Save Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
