import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Shield,
  Activity,
  Server,
  Layers,
  Clock,
  Edit2,
  X,
  Lock,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Hospital } from '../types';
import { hospitalApi } from '../services/api';

export const HospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [hospitalDetails, setHospitalDetails] = useState<any>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states
  const [newHospital, setNewHospital] = useState({
    id: `HOSP-00${Math.floor(Math.random() * 900 + 100)}`,
    name: '',
    region: 'North District',
    local_dataset_size: 1500,
    latency_ms: 45.0,
    communication_reliability: 0.95
  });

  const fetchHospitals = async () => {
    try {
      const data = await hospitalApi.getAll();
      setHospitals(data);
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleSelectHospital = async (h: Hospital) => {
    setSelectedHospital(h);
    setLoadingDetails(true);
    try {
      const details = await hospitalApi.getById(h.id);
      setHospitalDetails(details);
    } catch (err) {
      console.error('Failed to fetch hospital details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await hospitalApi.toggleStatus(id);
      fetchHospitals();
      if (selectedHospital?.id === id) {
        setSelectedHospital(prev => prev ? { ...prev, status: prev.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : null);
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hospitalApi.create(newHospital);
      setShowRegisterModal(false);
      setNewHospital({
        id: `HOSP-00${Math.floor(Math.random() * 900 + 100)}`,
        name: '',
        region: 'North District',
        local_dataset_size: 1500,
        latency_ms: 45.0,
        communication_reliability: 0.95
      });
      fetchHospitals();
    } catch (err) {
      alert('Error registering hospital. Please check the ID is unique.');
    }
  };

  const filteredHospitals = hospitals.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 bg-gradient-to-r from-navy-900 to-navy-850 border-cyan-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
              Hospital Management Node
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Participating Smart Hospital Consortium
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Administer participating clinical nodes, audit technical trust scores, and monitor privacy-isolated local datasets.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-navy-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Hospital</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between glass-panel p-3.5">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hospitals by ID, name, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-navy-950/80 border border-navy-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredHospitals.length} of {hospitals.length} Nodes
        </div>
      </div>

      {/* Hospitals Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-900/90 border-b border-navy-800 text-slate-300 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Hospital ID & Name</th>
                <th className="py-3 px-4 font-semibold">Region</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Local Dataset</th>
                <th className="py-3 px-4 font-semibold text-center">Adaptive Trust (τ)</th>
                <th className="py-3 px-4 font-semibold text-center">Latency</th>
                <th className="py-3 px-4 font-semibold text-center">Rounds</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/60">
              {filteredHospitals.map((h) => {
                const isSelected = selectedHospital?.id === h.id;
                return (
                  <tr
                    key={h.id}
                    onClick={() => handleSelectHospital(h)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400'
                        : 'hover:bg-navy-900/50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-navy-800 border border-navy-700 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{h.name}</p>
                          <span className="font-mono text-[10px] text-cyan-400">{h.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{h.region}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          h.status === 'ACTIVE'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                            : 'bg-rose-950/80 text-rose-400 border-rose-800'
                        }`}
                      >
                        {h.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-200">
                      {h.local_dataset_size.toLocaleString()} records
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-navy-900 border border-navy-700">
                        <Shield className="w-3.5 h-3.5 text-teal-400" />
                        <span className="font-bold text-teal-300">
                          {(h.trust_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-cyan-400">
                      {h.latency_ms} ms
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-200">
                      {h.successful_rounds}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => handleToggleStatus(h.id, e)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          h.status === 'ACTIVE'
                            ? 'bg-rose-950/50 text-rose-300 hover:bg-rose-900/60 border border-rose-800/60'
                            : 'bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/60'
                        }`}
                      >
                        {h.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Hospital Details Drawer / Panel */}
      {selectedHospital && (
        <div className="glass-panel p-5 space-y-4 border-cyan-500/30 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{selectedHospital.name}</h3>
                <p className="text-xs text-slate-400">
                  Node Identifier: <span className="text-cyan-400 font-mono">{selectedHospital.id}</span> | Region: {selectedHospital.region}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedHospital(null)}
              className="p-1 rounded-lg hover:bg-navy-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-navy-900/90 border border-navy-800">
              <span className="text-[11px] text-slate-400">Current Trust Score</span>
              <p className="text-lg font-bold text-teal-400 mt-1">{(selectedHospital.trust_score * 100).toFixed(1)}%</p>
              <span className="text-[10px] text-slate-400">Exponential Moving Avg</span>
            </div>
            <div className="p-3 rounded-xl bg-navy-900/90 border border-navy-800">
              <span className="text-[11px] text-slate-400">Local EHR Cohort</span>
              <p className="text-lg font-bold text-white mt-1">{selectedHospital.local_dataset_size.toLocaleString()}</p>
              <span className="text-[10px] text-cyan-400">Isolated Firewall Storage</span>
            </div>
            <div className="p-3 rounded-xl bg-navy-900/90 border border-navy-800">
              <span className="text-[11px] text-slate-400">Network Latency</span>
              <p className="text-lg font-bold text-cyan-400 mt-1">{selectedHospital.latency_ms} ms</p>
              <span className="text-[10px] text-slate-400">Edge Round Trip</span>
            </div>
            <div className="p-3 rounded-xl bg-navy-900/90 border border-navy-800">
              <span className="text-[11px] text-slate-400">Successful Rounds</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">{selectedHospital.successful_rounds}</p>
              <span className="text-[10px] text-slate-400">Participation 100%</span>
            </div>
          </div>

          {/* Zero-Raw-Data Privacy Notice */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/60 flex items-start space-x-3 text-xs">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-cyan-300">Privacy Compliance & Data Minimization</p>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                By federated design, individual patient health records for {selectedHospital.name} remain inside the hospital's secured local storage. The coordinator receives only cryptographically masked model gradient updates via SMPC Shamir secret shares.
              </p>
            </div>
          </div>

          {/* Recent Participation History Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Recent Federated Round Contributions
            </h4>
            {loadingDetails ? (
              <p className="text-xs text-slate-400 py-3">Loading participation log...</p>
            ) : hospitalDetails?.recent_participations?.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-navy-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-navy-900 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Round</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">U (Consistency)</th>
                      <th className="py-2 px-3">P (Reliability)</th>
                      <th className="py-2 px-3">C (Comm)</th>
                      <th className="py-2 px-3">V (Validation)</th>
                      <th className="py-2 px-3">Round Trust (s)</th>
                      <th className="py-2 px-3">Weight a(h)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-800">
                    {hospitalDetails.recent_participations.map((part: any, idx: number) => (
                      <tr key={idx} className="hover:bg-navy-900/50">
                        <td className="py-2 px-3 font-mono text-cyan-400">R{part.round_id}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            part.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                          }`}>
                            {part.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-mono">{(part.update_consistency_u * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-slate-300 font-mono">{(part.participation_p * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-slate-300 font-mono">{(part.comm_reliability_c * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-slate-300 font-mono">{(part.validation_contrib_v * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-teal-400 font-bold font-mono">{(part.round_trust_s * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-purple-400 font-bold font-mono">{(part.weight_a * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-2">
                No round history recorded yet. Launch a federated training round to generate contribution logs.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Register Hospital Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <span>Register New Smart Hospital Node</span>
              </h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1 rounded-lg hover:bg-navy-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHospital} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Hospital Node ID</label>
                  <input
                    type="text"
                    required
                    value={newHospital.id}
                    onChange={(e) => setNewHospital({ ...newHospital, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Region / Zone</label>
                  <select
                    value={newHospital.region}
                    onChange={(e) => setNewHospital({ ...newHospital, region: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="North District">North District</option>
                    <option value="South District">South District</option>
                    <option value="East District">East District</option>
                    <option value="West District">West District</option>
                    <option value="Central Metro">Central Metro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Hospital Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Memorial Children's Hospital"
                  value={newHospital.name}
                  onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Local Dataset Size (EHR)</label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={newHospital.local_dataset_size}
                    onChange={(e) => setNewHospital({ ...newHospital, local_dataset_size: parseInt(e.target.value) || 1000 })}
                    className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Simulated Latency (ms)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={newHospital.latency_ms}
                    onChange={(e) => setNewHospital({ ...newHospital, latency_ms: parseFloat(e.target.value) || 45 })}
                    className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-navy-950/70 border border-navy-800 text-[11px] text-slate-400">
                New hospitals will automatically be initialized with a neutral technical trust score of <strong>τ = 0.50</strong> and incorporated into upcoming federated learning rounds.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-lg bg-navy-800 text-slate-300 hover:bg-navy-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-navy-950 font-bold shadow-md shadow-cyan-500/20"
                >
                  Register Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
