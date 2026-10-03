import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Filter,
  Search,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Building2,
  Lock
} from 'lucide-react';
import { AuditLog } from '../types';
import { auditApi } from '../services/api';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedEventType) params.event_type = selectedEventType;
      if (selectedHospital) params.hospital_id = selectedHospital;
      const data = await auditApi.getAll(params);
      setLogs(data);
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedEventType, selectedHospital]);

  const filteredLogs = logs.filter(l =>
    l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.actor_id && l.actor_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'WARNING':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'FAILURE':
        return 'bg-rose-950 text-rose-400 border-rose-800';
      default:
        return 'bg-navy-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 bg-gradient-to-r from-navy-900 to-navy-850 border-cyan-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
              Regulatory Audit Trail
            </span>
            <span className="text-xs text-slate-400">Section 11 • Compliance & Provenance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Consortium Security & Training Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Immutable system provenance verifying model versions, SMPC secret sharing rounds, trust score transitions, and administrator actions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white border border-navy-700 transition-colors self-start sm:self-auto"
          title="Refresh Log Records"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Strip */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
            />
          </div>

          <div>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Event Types</option>
              <option value="HOSPITAL_REGISTRATION">Hospital Registration</option>
              <option value="FEDERATED_TRAINING_START">Training Start</option>
              <option value="USER_LOGIN">User Login</option>
              <option value="HOSPITAL_STATUS_TOGGLE">Hospital Status Toggle</option>
              <option value="EXPERIMENT_COMPLETED">Experiment Completed</option>
            </select>
          </div>

          <div>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Hospitals</option>
              <option value="HOSP-001">Hospital A (ICU)</option>
              <option value="HOSP-002">Hospital B (Cardiac)</option>
              <option value="HOSP-003">Hospital C (Community)</option>
              <option value="HOSP-004">Hospital D (Regional)</option>
              <option value="HOSP-005">Hospital E (Trauma)</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400 font-mono">
          {filteredLogs.length} Records Verified
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-900/90 border-b border-navy-800 text-slate-300 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Event Type</th>
                <th className="py-3 px-4 font-semibold">Actor</th>
                <th className="py-3 px-4 font-semibold">Target Hospital</th>
                <th className="py-3 px-4 font-semibold">Event Details</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/60 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-navy-900/40">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-sans font-bold text-cyan-400">
                      {log.event_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {log.actor_id || 'SYSTEM'} <span className="text-[10px] text-slate-500 font-sans">({log.actor_role || 'CORE'})</span>
                  </td>
                  <td className="py-3 px-4 text-teal-300">
                    {log.hospital_id || '—'}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-300 max-w-md truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
