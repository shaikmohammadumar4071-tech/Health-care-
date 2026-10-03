import React, { useState } from 'react';
import {
  Shield,
  Activity,
  Lock,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  Key,
  Building2,
  FlaskConical,
  ShieldAlert
} from 'lucide-react';
import { authApi } from '../services/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        await authApi.register({
          username,
          email,
          password,
          role,
          full_name: `${username.toUpperCase()} User`
        });
      }

      const res = await authApi.login({ username, password });
      localStorage.setItem('fed_token', res.access_token);
      
      const userObj: User = {
        id: 1,
        username: res.username,
        email: `${res.username}@hospital-fl.org`,
        role: res.role,
        hospital_id: res.hospital_id,
        is_active: true
      };
      
      onLoginSuccess(userObj, res.access_token);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (roleType: 'admin' | 'operator' | 'researcher') => {
    setIsRegisterMode(false);
    setErrorMsg('');
    if (roleType === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (roleType === 'operator') {
      setUsername('operator_hospA');
      setPassword('operator123');
    } else {
      setUsername('researcher');
      setPassword('researcher123');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-navy-950 relative overflow-hidden">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Project Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 text-white shadow-xl shadow-cyan-500/25 mb-1">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            FedHospital<span className="text-cyan-400">-AI</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Privacy-Preserving Federated Learning for Smart Hospitals with Adaptive Trust & SMPC Shamir Aggregation
          </p>
        </div>

        {/* Authentication Card */}
        <div className="glass-panel p-6 sm:p-8 space-y-5 border-cyan-500/30">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {isRegisterMode ? 'Register Consortium Account' : 'Consortium Secure Sign In'}
            </h2>
            <span className="text-[10px] text-cyan-400 font-mono">TLS / JWT Auth</span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs animate-in fade-in">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Username</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="physician@hospital-fl.org"
                    className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Consortium Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ADMIN">Administrator (Full Control)</option>
                    <option value="OPERATOR">Hospital Operator (Node Management)</option>
                    <option value="RESEARCHER">ML Researcher (Model Benchmarks)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-950 border border-navy-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-navy-950 font-bold shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : isRegisterMode ? 'Create Account' : 'Authenticate & Enter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* One-Click Role Autofill Demo Buttons */}
          <div className="pt-3 border-t border-navy-800 space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block text-center">
              Quick Demonstration Roles:
            </span>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => setDemoRole('admin')}
                className="p-2 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 text-purple-300 font-semibold transition-colors flex flex-col items-center space-y-1"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoRole('operator')}
                className="p-2 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 text-blue-300 font-semibold transition-colors flex flex-col items-center space-y-1"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Operator</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoRole('researcher')}
                className="p-2 rounded-lg bg-teal-950/40 hover:bg-teal-900/60 border border-teal-800/60 text-teal-300 font-semibold transition-colors flex flex-col items-center space-y-1"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Researcher</span>
              </button>
            </div>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg('');
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline"
            >
              {isRegisterMode ? 'Already have an account? Sign In' : 'Need to register a new clinical node? Register'}
            </button>
          </div>
        </div>

        {/* Security Policy Footer */}
        <p className="text-center text-[11px] text-slate-400">
          Federated Smart Hospital Consortium Protocol • Non-IID Robust
        </p>
      </div>
    </div>
  );
};
