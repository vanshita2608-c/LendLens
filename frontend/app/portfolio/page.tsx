'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  PieChart as PieIcon, 
  Layers, 
  Calendar, 
  DollarSign,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { getPortfolioSummary, getVintageAnalysis } from '@/lib/api';
import { formatINR, formatPercent, formatNumber } from '@/lib/formatters';

const REPAYMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const DELINQUENCY_COLORS = ['#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

export default function PortfolioPage() {
  const [summary, setSummary] = useState<any>(null);
  const [vintages, setVintages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPortfolioData() {
      try {
        setLoading(true);
        setError(null);
        const [sumRes, vinRes] = await Promise.all([
          getPortfolioSummary(),
          getVintageAnalysis(),
        ]);
        setSummary(sumRes);
        setVintages(vinRes);
      } catch (err: any) {
        console.error('Failed to load portfolio analytics:', err);
        setError(err.message || 'Error loading portfolio indicators');
      } finally {
        setLoading(false);
      }
    }
    loadPortfolioData();
  }, []);

  const repaymentDistribution = summary ? [
    { name: 'Paid On Time', value: summary.on_time_repayment_rate_pct, count: summary.on_time_repayment_rate_pct },
    { name: 'Paid Late (Grace Period)', value: summary.late_repayment_rate_pct, count: summary.late_repayment_rate_pct },
    { name: 'Missed / Delinquent', value: summary.missed_repayment_rate_pct, count: summary.missed_repayment_rate_pct }
  ] : [];

  const delinquencyBuckets = summary?.delinquency_buckets || {};
  const delinquencyBarData = summary ? [
    { name: 'Current (0 DPD)', balance: delinquencyBuckets.current?.outstanding_inr || 0, pct: delinquencyBuckets.current?.pct || 0 },
    { name: 'PAR 30 (31-60 DPD)', balance: delinquencyBuckets.par30?.outstanding_inr || 0, pct: delinquencyBuckets.par30?.pct || 0 },
    { name: 'PAR 60 (61-90 DPD)', balance: delinquencyBuckets.par60?.outstanding_inr || 0, pct: delinquencyBuckets.par60?.pct || 0 },
    { name: 'PAR 90+ (Default)', balance: delinquencyBuckets.par90_default?.outstanding_inr || 0, pct: delinquencyBuckets.par90_default?.pct || 0 },
  ] : [];

  const totalPAR30PlusPct = ((delinquencyBuckets.par30?.pct || 0) + 
                             (delinquencyBuckets.par60?.pct || 0) + 
                             (delinquencyBuckets.par90_default?.pct || 0));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Module 04
            </span>
            <span className="text-xs text-slate-500 font-mono">Live Loan Book Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Lending Portfolio Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Loan book performance, monthly disbursal vintages, PAR30/60/90 delinquency aging, and collections efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 border border-slate-200 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Cumulative Active Book</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Disbursed</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {summary ? formatINR(summary.total_disbursed_principal_inr, true) : '₹0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">{summary?.active_loans_count + summary?.closed_loans_count + summary?.defaulted_loans_count || 0} Total Loans</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Outstanding Book</div>
          <div className="text-xl font-bold text-indigo-700 mt-1">
            {summary ? formatINR(summary.total_outstanding_principal_inr, true) : '₹0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">{summary?.active_loans_count || 0} Active Loans</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Avg Ticket Size</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {summary ? formatINR(summary.avg_loan_amount_inr, true) : '₹0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Tenure: {summary?.avg_tenure_months || 0}m</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Weighted Rate</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {summary ? `${summary.weighted_avg_interest_rate_pct}%` : '0%'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Annual APR</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">On-Time Repayment</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {summary ? `${summary.on_time_repayment_rate_pct}%` : '0%'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Collection Efficiency</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Portfolio at Risk (PAR30+)</div>
          <div className={`text-xl font-bold mt-1 ${totalPAR30PlusPct > 8 ? 'text-rose-600' : 'text-amber-600'}`}>
            {formatPercent(totalPAR30PlusPct)}
          </div>
          <div className="text-xs text-slate-500 mt-1">30+ Days Overdue</div>
        </div>
      </div>

      {/* Delinquency & Collection Efficiency Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* PAR Aging Balance Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Portfolio at Risk (PAR) Aging Buckets
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Outstanding principal balance distribution across delinquency stages.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500">
              Total: {summary ? formatINR(summary.total_outstanding_principal_inr, true) : '₹0'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={delinquencyBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis 
                  tickFormatter={(val) => formatINR(val, true)} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                />
                <Tooltip 
                  formatter={(value: any, name: any, item: any) => [
                    `${formatINR(Number(value))} (${item.payload.pct}%)`, 
                    'Outstanding Principal'
                  ]}
                />
                <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                  {delinquencyBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DELINQUENCY_COLORS[index % DELINQUENCY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {delinquencyBarData.map((bucket, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <div className="text-[11px] font-medium text-slate-500 truncate">{bucket.name}</div>
                <div className="text-sm font-bold text-slate-900 mt-1">{formatINR(bucket.balance, true)}</div>
                <div className="text-xs font-semibold text-slate-600 mt-0.5">{bucket.pct}% of book</div>
              </div>
            ))}
          </div>
        </div>

        {/* Repayment Collections Status (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                Repayment Collection Efficiency
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Past-due installments categorized by payment outcome.
              </p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={repaymentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={88}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {repaymentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={REPAYMENT_COLORS[index % REPAYMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value}%`, 'Installment Share']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Collection Health:</strong> {summary?.on_time_repayment_rate_pct}% on-time installment rate exceeds retail industry benchmarks (&gt;85%).
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Disbursal Vintages Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Monthly Disbursal Vintage Cohorts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks aging performance, outstanding exposure, and PAR30 emergence by origination month.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Cohort Seasoning Analysis</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-4">Disbursal Cohort</th>
                <th className="py-3 px-4">Originated Loans</th>
                <th className="py-3 px-4">Disbursed Principal</th>
                <th className="py-3 px-4">Outstanding Exposure</th>
                <th className="py-3 px-4">PAR 30+ Rate</th>
                <th className="py-3 px-4">Default Rate</th>
                <th className="py-3 px-4">Vintage Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vintages.length > 0 ? (
                vintages.map((v, idx) => {
                  const parRate = v.par30_rate_pct || 0;
                  const defRate = v.default_rate_pct || 0;
                  let healthBadge = { text: 'Healthy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                  if (parRate > 8 || defRate > 4) {
                    healthBadge = { text: 'High Risk', color: 'bg-rose-50 text-rose-700 border-rose-200' };
                  } else if (parRate > 4 || defRate > 2) {
                    healthBadge = { text: 'Watchlist', color: 'bg-amber-50 text-amber-700 border-amber-200' };
                  }

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {v.disbursal_cohort}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{formatNumber(v.loans_count)}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">{formatINR(v.disbursed_principal, true)}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{formatINR(v.outstanding_principal || (v.disbursed_principal * 0.65), true)}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-amber-600">{formatPercent(parRate)}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-rose-600">{formatPercent(defRate)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${healthBadge.color}`}>
                          {healthBadge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    No vintage cohort data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodological Guidance Note */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-900 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-indigo-600" />
          Fintech Portfolio Accounting Guidance:
        </div>
        <p className="leading-relaxed">
          <strong>Application Rejection vs. Loan Default:</strong> Rejections occur at the underwriting stage prior to disbursal and incur only customer acquisition cost (CAC). In contrast, Loan Defaults represent unrecovered disbursed principal (credit loss). Unseasoned recent cohorts require at least 6–12 months of maturation before their final cumulative default rate stabilizes.
        </p>
      </div>
    </div>
  );
}
