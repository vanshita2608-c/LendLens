import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  changePct?: number;
  changeLabel?: string;
  isPositiveGood?: boolean;
  tooltip?: string;
  icon?: LucideIcon;
  badge?: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  changePct,
  changeLabel,
  isPositiveGood = true,
  tooltip,
  icon: Icon,
  badge,
}: KpiCardProps) {
  const isPositive = changePct !== undefined && changePct > 0;
  const isNeutral = changePct === undefined || changePct === 0;
  const isGood = isPositive ? isPositiveGood : !isPositiveGood;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {tooltip && (
            <div className="group relative cursor-pointer text-slate-400 hover:text-slate-600">
              <HelpCircle className="w-3.5 h-3.5" />
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-48 p-2 bg-slate-900 text-white text-[11px] rounded shadow-lg z-50 pointer-events-none">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {badge}
          </span>
        )}
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </div>

        {(changePct !== undefined || subtitle) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {changePct !== undefined && (
              <span
                className={`inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded ${
                  isNeutral
                    ? 'bg-slate-100 text-slate-600'
                    : isGood
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {!isNeutral && (
                  isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )
                )}
                {changePct > 0 ? `+${changePct.toFixed(1)}%` : `${changePct.toFixed(1)}%`}
              </span>
            )}
            {changeLabel && <span className="text-slate-500">{changeLabel}</span>}
            {!changeLabel && subtitle && <span className="text-slate-500">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
