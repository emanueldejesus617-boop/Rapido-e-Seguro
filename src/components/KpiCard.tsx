'use client';

import React from 'react';
import { formatKz } from '@/lib/utils';
import { LucideIcon, Info } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'cyan' | 'accounting';
  isCurrency?: boolean;
  tooltip?: string;
  badge?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  isCurrency = true,
  tooltip,
  badge,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          bg: 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400',
          iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          glow: 'from-emerald-500/10',
          valueColor: 'text-emerald-400',
        };
      case 'blue':
        return {
          bg: 'bg-blue-950/20 border-blue-800/40 text-blue-400',
          iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          glow: 'from-blue-500/10',
          valueColor: 'text-blue-400',
        };
      case 'purple':
        return {
          bg: 'bg-purple-950/20 border-purple-800/40 text-purple-400',
          iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          glow: 'from-purple-500/10',
          valueColor: 'text-purple-400',
        };
      case 'amber':
        return {
          bg: 'bg-amber-950/20 border-amber-800/40 text-amber-400',
          iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          glow: 'from-amber-500/10',
          valueColor: 'text-amber-400',
        };
      case 'rose':
        return {
          bg: 'bg-rose-950/20 border-rose-800/40 text-rose-400',
          iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          glow: 'from-rose-500/10',
          valueColor: 'text-rose-400',
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-950/20 border-cyan-800/40 text-cyan-400',
          iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          glow: 'from-cyan-500/10',
          valueColor: 'text-cyan-400',
        };
      case 'accounting':
        return {
          bg: 'bg-slate-900/80 border-dashed border-amber-500/40 text-amber-300',
          iconBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          glow: 'from-amber-500/5',
          valueColor: 'text-amber-300',
        };
      default:
        return {
          bg: 'bg-slate-900/60 border-slate-800 text-slate-300',
          iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
          glow: 'from-slate-700/10',
          valueColor: 'text-white',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${styles.bg}`}
    >
      {/* Background Gradient Glow */}
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${styles.glow} to-transparent blur-xl pointer-events-none`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {title}
            </span>
            {tooltip && (
              <span title={tooltip} className="cursor-help text-slate-500 hover:text-slate-300 transition-colors">
                <Info size={13} />
              </span>
            )}
          </div>
          {badge && (
            <span className="inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/30">
              {badge}
            </span>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border shadow-inner ${styles.iconBg}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="mt-4">
        <div className={`text-2xl font-bold tracking-tight ${styles.valueColor}`}>
          {isCurrency ? formatKz(value as number) : value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
