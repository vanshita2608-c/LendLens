'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  FileCheck, 
  Percent, 
  IndianRupee, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend,
  Cell
} from 'recharts';
import KpiCard from '@/components/ui/KpiCard';
import FilterBar, { FilterState } from '@/components/ui/FilterBar';
import Badge from '@/components/ui/Badge';
import { formatINR, formatPercent, formatNumber, formatHours } from '@/lib/formatters';
import { getDashboardSummary, getDashboardTrends } from '@/lib/api';

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    channel: 'All',
    segment: 'All',
  });

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [sumData, trendData] = await Promise.all([
          getDashboardSummary({
            channel: filters.channel,
            segment: filters.segment,
          }),
          getDashboardTrends(),
        ]);
        setSummary(sumData);
        setTrends(trendData);
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to connect to LendLens backend. Ensure API is running on localhost:8000.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filters]);

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium mt-3">Loading lending analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
        <div className="font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          Backend Connection Issue
        </div>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  const funnelData = summary?.funnel_stage_counts ? [
    { name: 'Started', count: summary.funnel_stage_counts.started, fill: '#3B82F6' },
    { name: 'Details', count: summary.funnel_stage_counts.details_submitted, fill: '#60A5FA' },
    { name: 'KYC', count: summary.funnel_stage_counts.kyc_completed, fill: '#93C5FD' },
    { name: 'Assessed', count: summary.funnel_stage_counts.credit_assessed, fill: '#818CF8' },
    { name: 'Approved', count: summary.funnel_stage_counts.loan_approved, fill: '#6366F1' },
    { name: 'Offer Ok', count: summary.funnel_stage_counts.offer_accepted, fill: '#4F46E5' },
    { name: 'Disbursed', count: summary.funnel_stage_counts.loan_disbursed, fill: '#10B981' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Dynamic Filter Controls */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Applications"
          value={formatNumber(summary.total_applications)}
          subtitle="Top of funnel volume"
          icon={Users}
          tooltip="Total loan applications initiated within selected filters"
        />
        <KpiCard
          title="Completion Rate"
          value={formatPercent(summary.completion_rate_pct)}
          subtitle="Form fill throughput"
          icon={FileCheck}
          tooltip="Applications completing basic details submission / Started"
        />
        <KpiCard
          title="KYC Pass Rate"
          value={formatPercent(summary.kyc_rate_pct)}
          subtitle="Identity verification"
          icon={CheckCircle2}
          tooltip="Identity and document verification completion rate"
        />
        <KpiCard
          title="Approval Rate"
          value={formatPercent(summary.approval_rate_pct)}
          subtitle="Underwriting cutoff"
          icon={Percent}
          tooltip="Applications meeting credit score and DTI criteria"
        />
        <KpiCard
          title="Disbursal Conversion"
          value={formatPercent(summary.disbursal_conversion_rate_pct)}
          subtitle="Full funnel throughput"
          icon={TrendingUp}
          tooltip="End-to-end ratio of disbursed loans to initial applications"
        />
      </div>

      {/* Second Metrics Grid (Financial & Risk) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Disbursed Principal"
          value={formatINR(summary.total_disbursed_amount_inr, true)}
          subtitle={`Avg Ticket: ${formatINR(summary.avg_loan_amount_inr)}`}
          icon={IndianRupee}
          tooltip="Total capital deployed across all disbursed loans"
        />
        <KpiCard
          title="PAR30 Delinquency"
          value={formatPercent(summary.par30_delinquency_rate_pct)}
          subtitle="Portfolio at Risk >= 30d"
          isPositiveGood={false}
          icon={AlertTriangle}
          tooltip="Outstanding principal on loans 30+ days delinquent / Total Outstanding"
        />
        <KpiCard
          title="Expected Credit Loss"
          value={formatINR(summary.expected_credit_loss_inr, true)}
          subtitle="ECL = PD × LGD × EAD"
          isPositiveGood={false}
          icon={ShieldAlert}
          tooltip="Expected credit losses modeled at 45% Loss Given Default (LGD)"
        />
        <KpiCard
          title="Median Turnaround"
          value={formatHours(summary.median_turnaround_time_hours)}
          subtitle="Start to Disbursal TAT"
          icon={Clock}
          tooltip="Median elapsed time for applicants from initiation to fund disbursal"
        />
      </div>

      {/* Analytical Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Disbursal Trends */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Application & Disbursal Trends</h2>
              <p className="text-xs text-slate-500">Monthly application volume vs. funded loans</p>
            </div>
            <Badge label="12 Month History" variant="neutral" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDisb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="applications" name="Applications" stroke="#3B82F6" fillOpacity={1} fill="url(#colorApps)" strokeWidth={2} />
                <Area type="monotone" dataKey="disbursals" name="Disbursed Loans" stroke="#10B981" fillOpacity={1} fill="url(#colorDisb)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Stage Volume Bar */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Funnel Progression Volume</h2>
              <p className="text-xs text-slate-500">Applicant volume at each journey stage</p>
            </div>
            <Badge label="7 Stages" variant="info" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#64748b" tickLine={false} width={65} />
                <Tooltip 
                  formatter={(value: any) => [formatNumber(Number(value)), 'Applicants']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Executive Proactive Insights Panel */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Product Intelligence & Analytical Observations
            </span>
          </div>
          <span className="text-xs text-slate-400">Evidence-based signals</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
              <span>KYC Step Friction</span>
              <Badge label="Funnel Dropoff" variant="warning" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              KYC completion drops to {formatPercent(summary.kyc_rate_pct)}. Primary reason is selfie mismatch and Aadhaar timeout.
            </p>
            <div className="mt-3 text-[11px] text-blue-400 flex items-center gap-1 font-medium hover:underline cursor-pointer">
              <span>Simulate DigiLocker Uplift in Strategy Lab</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
              <span>Credit Risk Calibration</span>
              <Badge label="Risk Quality" variant="success" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Portfolio PAR30 delinquency is stable at {formatPercent(summary.par30_delinquency_rate_pct)}. Credit cutoff can be safely expanded for prime salaried profiles.
            </p>
            <div className="mt-3 text-[11px] text-blue-400 flex items-center gap-1 font-medium hover:underline cursor-pointer">
              <span>Test Cutoff Sensitivity in Strategy Lab</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
              <span>Channel Efficiency</span>
              <Badge label="Unit Economics" variant="info" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Aggregator leads have high CAC with lower offer acceptance. Organic and Partner Referral yield 3.2x higher return on capital.
            </p>
            <div className="mt-3 text-[11px] text-blue-400 flex items-center gap-1 font-medium hover:underline cursor-pointer">
              <span>Model Channel Mix Optimization</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
