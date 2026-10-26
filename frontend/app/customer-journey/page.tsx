'use client';

import React, { useEffect, useState } from 'react';
import { 
  GitMerge, 
  ArrowRight, 
  Clock, 
  AlertCircle, 
  Lightbulb, 
  TrendingDown, 
  Layers,
  CheckCircle2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell
} from 'recharts';
import FilterBar, { FilterState } from '@/components/ui/FilterBar';
import Badge from '@/components/ui/Badge';
import { formatNumber, formatPercent } from '@/lib/formatters';
import { 
  getFunnelOverview, 
  getFunnelDropoffs, 
  getStageTiming, 
  getChannelPerformance 
} from '@/lib/api';
import Link from 'next/link';

export default function CustomerJourneyPage() {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    channel: 'All',
    segment: 'All',
  });

  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<any>(null);
  const [dropoffs, setDropoffs] = useState<any[]>([]);
  const [timings, setTimings] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('KYC_COMPLETED');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFunnelData() {
      setLoading(true);
      setError(null);
      try {
        const [funnelData, dropoffData, timingData, channelData] = await Promise.all([
          getFunnelOverview({ channel: filters.channel, segment: filters.segment }),
          getFunnelDropoffs(),
          getStageTiming(),
          getChannelPerformance(),
        ]);
        setFunnel(funnelData);
        setDropoffs(dropoffData);
        setTimings(timingData);
        setChannels(channelData);
      } catch (err: any) {
        console.error('Failed to load funnel data:', err);
        setError('Failed to connect to LendLens backend.');
      } finally {
        setLoading(false);
      }
    }
    loadFunnelData();
  }, [filters]);

  if (loading && !funnel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium mt-3">Analyzing customer journey funnel...</p>
      </div>
    );
  }

  const selectedDropoff = dropoffs.find(d => d.stage_name === selectedStage);
  const selectedTiming = timings.find(t => t.stage_name === selectedStage);
  const currentStageObj = funnel?.stages?.find((s: any) => s.stage_key === selectedStage);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Funnel Overview Summary Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              End-to-End Funnel Health
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-2xl font-bold text-slate-900">
                {formatPercent(funnel.overall_funnel_conversion_pct)}
              </span>
              <span className="text-xs text-slate-500">
                Overall Conversion ({formatNumber(funnel.disbursed_loans_count)} of {formatNumber(funnel.cohort_total_applications)} Applications)
              </span>
            </div>
          </div>

          {funnel.primary_bottleneck && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-semibold text-amber-900">Primary Bottleneck Stage: </span>
                <span className="font-bold text-amber-950">{funnel.primary_bottleneck.stage_label}</span>
                <span className="text-amber-700 ml-1">
                  ({formatNumber(funnel.primary_bottleneck.drop_off_count)} drop-offs, {formatPercent(funnel.primary_bottleneck.drop_off_rate_pct)} loss rate)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Visual Funnel Step Flow */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mt-6 pt-6 border-t border-slate-100">
          {funnel?.stages?.map((stage: any) => {
            const isSelected = stage.stage_key === selectedStage;
            return (
              <button
                key={stage.stage_key}
                onClick={() => setSelectedStage(stage.stage_key)}
                className={`p-3 rounded-lg border text-left transition-all relative ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                  <span>Step {stage.stage_order}</span>
                  {stage.drop_off_rate_pct > 20 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500" title="High Drop-off" />
                  )}
                </div>
                <div className="font-semibold text-xs text-slate-900 line-clamp-1">
                  {stage.stage_label}
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {formatNumber(stage.entered_count)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {stage.stage_order === 1 ? '100% Start' : `${formatPercent(stage.step_conversion_rate_pct)} step`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Investigation & Diagnostics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Selected Stage Investigation Deep Dive */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {currentStageObj?.stage_label || selectedStage} Investigation
                </h2>
                <Badge label={`Step ${currentStageObj?.stage_order || 1}`} variant="info" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Root-cause friction diagnostics and supporting evidence
              </p>
            </div>

            <Link
              href={`/strategy-lab?stage=${selectedStage}`}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Simulate in Strategy Lab
            </Link>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Step Conversion</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {formatPercent(currentStageObj?.step_conversion_rate_pct || 0)}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Drop-off Volume</span>
              <div className="text-lg font-bold text-rose-600 mt-0.5">
                {formatNumber(currentStageObj?.drop_off_count || 0)}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Median Processing TAT</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {selectedTiming ? `${selectedTiming.median_minutes}m` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Drop-off Reasons Distribution */}
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
              Reported Drop-off Reasons & Friction Drivers
            </h3>
            {selectedDropoff && selectedDropoff.reasons.length > 0 ? (
              <div className="space-y-2">
                {selectedDropoff.reasons.map((r: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{r.reason}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">{formatNumber(r.count)} drops</span>
                      <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {formatPercent(r.pct_of_stage_dropoff)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 text-xs text-slate-500 text-center">
                No drop-off events recorded for this initial stage.
              </div>
            )}
          </div>

          {/* Product Opportunity Proposal */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-1">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                Proposed Product Hypothesis & Action
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                Target intervention: Deploy instant pre-fill and optimize verification latency for this stage.
                Projected to recover up to 15% of drop-off applicants without degrading credit quality.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <Link
                href={`/strategy-lab?stage=${selectedStage}`}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate in Strategy Lab</span>
              </Link>
              <Link
                href="/experiments"
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Track in Experiments</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Channel Conversion Performance Comparison */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Channel Funnel Throughput</h2>
            <p className="text-xs text-slate-500">Comparison of disbursal conversion across acquisition channels</p>
          </div>

          <div className="space-y-3">
            {channels.map((ch: any) => (
              <div key={ch.channel} className="p-3 rounded-lg border border-slate-200 bg-slate-50/40">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 mb-1.5">
                  <span>{ch.channel}</span>
                  <span>{formatPercent(ch.disbursal_conversion_rate_pct)} Conversion</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, ch.disbursal_conversion_rate_pct * 2)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>Vol: {formatNumber(ch.total_applications)} apps</span>
                  <span>CAC: {formatNumber(ch.unit_cac_inr)} INR</span>
                  <span>PAR30: {formatPercent(ch.par30_delinquency_rate_pct)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
