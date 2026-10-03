import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Cpu,
  ShieldCheck,
  Lock,
  Activity,
  LineChart,
  FlaskConical,
  ClipboardList,
  Settings,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export type NavItemKey =
  | 'welcome'
  | 'dashboard'
  | 'hospitals'
  | 'training'
  | 'trust'
  | 'aggregation'
  | 'predictions'
  | 'analytics'
  | 'experiments'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const menuItems: { id: NavItemKey; label: string; icon: React.ComponentType<any>; badge?: string }[] = [
    { id: 'welcome', label: 'Welcome & Overview', icon: Sparkles, badge: '3D' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hospitals', label: 'Hospitals', icon: Building2 },
    { id: 'training', label: 'Federated Training', icon: Cpu, badge: 'Live' },
    { id: 'trust', label: 'Trust Management', icon: ShieldCheck, badge: 'Novel' },
    { id: 'aggregation', label: 'Secure Aggregation', icon: Lock, badge: 'SMPC' },
    { id: 'predictions', label: 'AI Predictions', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'experiments', label: 'Experiment Results', icon: FlaskConical },
    { id: 'audit', label: 'Audit Logs', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-navy-950/95 backdrop-blur-md border-r border-navy-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } pt-16 lg:pt-0`}
      >
        {/* Sidebar Header for Desktop */}
        <div className="hidden lg:flex items-center space-x-3 px-6 py-5 border-b border-navy-800/70">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-bold text-sm">
            FL
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Consortium Node</h2>
            <p className="text-[11px] text-teal-400/90 font-mono">Coordinator v1.0</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Federation Architecture
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/80 to-navy-900 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-900/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                        item.badge === 'Novel'
                          ? 'bg-teal-950/80 text-teal-300 border-teal-600/40'
                          : item.badge === 'Live'
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600/40 animate-pulse'
                          : 'bg-navy-800 text-slate-300 border-navy-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Security & Privacy Guarantee Footer */}
        <div className="p-4 m-3 rounded-xl bg-navy-900/80 border border-navy-800 text-[11px]">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Zero-Raw-Data Policy</span>
          </div>
          <p className="text-slate-400 text-[10px] leading-relaxed">
            Patient EHRs remain behind local hospital firewalls. Only SMPC-protected updates leave perimeter.
          </p>
        </div>
      </aside>
    </>
  );
};
