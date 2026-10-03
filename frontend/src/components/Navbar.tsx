import React, { useState } from 'react';
import {
  Shield,
  Activity,
  Bell,
  LogOut,
  User as UserIcon,
  Wifi,
  Radio,
  ChevronDown
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onSwitchRole: (role: 'ADMIN' | 'OPERATOR' | 'RESEARCHER') => void;
  onNavigateWelcome?: () => void;
  trainingState?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onSwitchRole,
  onNavigateWelcome,
  trainingState = 'IDLE'
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-900/60 text-purple-300 border-purple-500/40';
      case 'OPERATOR':
        return 'bg-blue-900/60 text-blue-300 border-blue-500/40';
      case 'RESEARCHER':
        return 'bg-teal-900/60 text-teal-300 border-teal-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-navy-950/85 backdrop-blur-md border-b border-navy-800/80 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Brand & Project Identity */}
        <button
          onClick={onNavigateWelcome}
          className="flex items-center space-x-3 text-left group transition-transform hover:scale-[1.02]"
          title="Return to 3D Welcome & Overview"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 text-white shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition-shadow">
            <Shield className="w-5 h-5 text-white" />
            <Activity className="w-3.5 h-3.5 text-cyan-200 absolute -bottom-0.5 -right-0.5 bg-navy-950 rounded-full p-0.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-cyan-100 to-teal-200 bg-clip-text text-transparent">
                FedHospital<span className="text-cyan-400 font-extrabold">-AI</span>
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                SMPC + Trust
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Privacy-Preserving Federated Healthcare Intelligence
            </p>
          </div>
        </button>

        {/* System Status Indicators & User Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Live Training Status Badge */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-navy-900/90 border border-navy-700/60 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                trainingState === 'TRAINING'
                  ? 'bg-emerald-400 animate-pulse'
                  : trainingState === 'PAUSED'
                  ? 'bg-amber-400'
                  : 'bg-cyan-500'
              }`}
            />
            <span className="text-slate-300 font-medium">
              Federation: <span className="text-white font-semibold">{trainingState}</span>
            </span>
          </div>

          {/* Secure Live Channel Indicator */}
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40" title="Connected to Edge Coordinator via WebSocket">
            <Wifi className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline font-mono">Live Mesh</span>
          </div>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-slate-300 hover:text-white border border-navy-700/60 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-navy-900 border border-navy-700 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-navy-800">
                  <h4 className="font-semibold text-sm text-white">System Events</h4>
                  <span className="text-xs text-cyan-400">3 Unread</span>
                </div>
                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="p-2 rounded-lg bg-navy-800/80 border-l-2 border-emerald-400">
                    <p className="font-medium text-slate-200">Shamir Secret Sharing Reconstructed</p>
                    <p className="text-slate-400 text-[11px]">Threshold k=3 satisfied. Zero raw patient leaks.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-navy-800/80 border-l-2 border-cyan-400">
                    <p className="font-medium text-slate-200">Hospital B Trust Score Updated</p>
                    <p className="text-slate-400 text-[11px]">Update consistency evaluated at U=0.92.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-navy-800/80 border-l-2 border-amber-400">
                    <p className="font-medium text-slate-200">Dropout Simulation Active</p>
                    <p className="text-slate-400 text-[11px]">Robust aggregation applied to available clients.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 border border-navy-700/60 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-white leading-tight">
                  {user?.full_name || user?.username || 'Administrator'}
                </p>
                <span
                  className={`inline-block text-[10px] font-bold px-1.5 rounded border ${getRoleBadgeColor(
                    user?.role
                  )}`}
                >
                  {user?.role || 'ADMIN'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-navy-900 border border-navy-700 shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-navy-800">
                  <p className="text-xs text-slate-400">Switch Demonstration Role:</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      onSwitchRole('ADMIN');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                      user?.role === 'ADMIN'
                        ? 'bg-purple-950/60 text-purple-300'
                        : 'text-slate-300 hover:bg-navy-800'
                    }`}
                  >
                    <span>Administrator</span>
                    {user?.role === 'ADMIN' && <span className="text-[10px]">● Active</span>}
                  </button>
                  <button
                    onClick={() => {
                      onSwitchRole('OPERATOR');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                      user?.role === 'OPERATOR'
                        ? 'bg-blue-950/60 text-blue-300'
                        : 'text-slate-300 hover:bg-navy-800'
                    }`}
                  >
                    <span>Hospital Operator</span>
                    {user?.role === 'OPERATOR' && <span className="text-[10px]">● Active</span>}
                  </button>
                  <button
                    onClick={() => {
                      onSwitchRole('RESEARCHER');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                      user?.role === 'RESEARCHER'
                        ? 'bg-teal-950/60 text-teal-300'
                        : 'text-slate-300 hover:bg-navy-800'
                    }`}
                  >
                    <span>ML Researcher</span>
                    {user?.role === 'RESEARCHER' && <span className="text-[10px]">● Active</span>}
                  </button>
                </div>
                <div className="pt-1 border-t border-navy-800">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/30 flex items-center space-x-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
