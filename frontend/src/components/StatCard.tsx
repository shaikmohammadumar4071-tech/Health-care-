import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme?: 'cyan' | 'teal' | 'green' | 'orange' | 'purple' | 'red';
  badge?: {
    text: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'cyan',
  badge,
}) => {
  const getSchemeStyles = () => {
    switch (colorScheme) {
      case 'teal':
        return {
          bg: 'from-teal-500/20 to-teal-500/5',
          border: 'border-teal-500/20',
          iconColor: 'text-teal-400',
          iconBg: 'bg-teal-500/10 border-teal-500/30',
        };
      case 'green':
        return {
          bg: 'from-emerald-500/20 to-emerald-500/5',
          border: 'border-emerald-500/20',
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-500/10 border-emerald-500/30',
        };
      case 'orange':
        return {
          bg: 'from-amber-500/20 to-amber-500/5',
          border: 'border-amber-500/20',
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-500/10 border-amber-500/30',
        };
      case 'purple':
        return {
          bg: 'from-purple-500/20 to-purple-500/5',
          border: 'border-purple-500/20',
          iconColor: 'text-purple-400',
          iconBg: 'bg-purple-500/10 border-purple-500/30',
        };
      case 'red':
        return {
          bg: 'from-rose-500/20 to-rose-500/5',
          border: 'border-rose-500/20',
          iconColor: 'text-rose-400',
          iconBg: 'bg-rose-500/10 border-rose-500/30',
        };
      case 'cyan':
      default:
        return {
          bg: 'from-cyan-500/20 to-cyan-500/5',
          border: 'border-cyan-500/20',
          iconColor: 'text-cyan-400',
          iconBg: 'bg-cyan-500/10 border-cyan-500/30',
        };
    }
  };

  const scheme = getSchemeStyles();

  return (
    <div
      className={`glass-panel glass-panel-hover p-4 sm:p-5 relative overflow-hidden bg-gradient-to-br ${scheme.bg} ${scheme.border}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-300 tracking-wide uppercase">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${scheme.iconBg}`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${scheme.iconColor}`} />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {value}
        </h3>
        {badge && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              badge.isPositive !== false
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-600/40'
                : 'bg-amber-950/70 text-amber-400 border-amber-600/40'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400 font-mono truncate">{subtitle}</p>
      )}
    </div>
  );
};
