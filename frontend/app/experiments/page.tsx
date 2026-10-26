'use client';

import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sliders, 
  Award, 
  Trash2, 
  ArrowUpRight, 
  HelpCircle,
  X,
  Sparkles,
  BarChart2,
  Users,
  Layers,
  LayoutGrid,
  Zap,
  Eye,
  Info,
  Compass
} from 'lucide-react';
import { getExperiments, createExperiment, deleteExperiment } from '@/lib/api';
import { formatNumber, formatPercent } from '@/lib/formatters';

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('rice');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
  const [inspectExperiment, setInspectExperiment] = useState<any | null>(null);

  // New Experiment Form State
  const [formData, setFormData] = useState({
    experiment_name: '',
    problem_statement: '',
    hypothesis: '',
    target_segment: 'All',
    primary_metric: 'KYC Conversion Rate (%)',
    guardrail_metrics: 'First Payment Default < 2.0%, TAT < 3.0m',
    reach_score: 2500,
    impact_score: 3,
    confidence_score: 80,
    effort_score: 2,
    control_definition: 'Existing standard flow',
    treatment_definition: 'New automated flow'
  });

  useEffect(() => {
    loadExperiments();
  }, [filterStatus, sortBy]);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const data = await getExperiments(filterStatus, sortBy);
      setExperiments(data || []);
    } catch (err: any) {
      console.error('Failed to load experiments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.experiment_name.trim() || !formData.hypothesis.trim()) return;
    try {
      setSaving(true);
      await createExperiment(formData);
      setModalOpen(false);
      setFormData({
        experiment_name: '',
        problem_statement: '',
        hypothesis: '',
        target_segment: 'All',
        primary_metric: 'Conversion Rate (%)',
        guardrail_metrics: 'First Payment Default < 2.0%',
        reach_score: 2500,
        impact_score: 3,
        confidence_score: 80,
        effort_score: 2,
        control_definition: 'Existing flow',
        treatment_definition: 'Optimized variant'
      });
      await loadExperiments();
    } catch (err: any) {
      alert(`Failed to create experiment: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this experiment?')) return;
    try {
      await deleteExperiment(id);
      await loadExperiments();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Real-time RICE preview in modal
  const previewRice = Math.round(
    (formData.reach_score * formData.impact_score * (formData.confidence_score / 100.0)) / Math.max(0.5, formData.effort_score)
  );

  const runningCount = experiments.filter((e) => e.experiment_status === 'Running').length;
  const completedCount = experiments.filter((e) => e.experiment_status === 'Completed').length;
  const topRice = experiments.length > 0 ? Math.max(...experiments.map((e) => e.rice_priority_score)) : 0;

  // Quadrant classification for 2x2 Opportunity Prioritization Matrix
  const quickWins = experiments.filter((e) => e.impact_score >= 3.0 && e.effort_score <= 2.0);
  const bigBets = experiments.filter((e) => e.impact_score >= 3.0 && e.effort_score > 2.0);
  const incremental = experiments.filter((e) => e.impact_score < 3.0 && e.effort_score <= 2.0);
  const deprioritize = experiments.filter((e) => e.impact_score < 3.0 && e.effort_score > 2.0);

  const statusColors: Record<string, string> = {
    'Running': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Planned': 'bg-amber-50 text-amber-700 border-amber-200',
    'Draft': 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Module 07
            </span>
            <span className="text-xs text-slate-500 font-mono">Product Experimentation Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-indigo-600" />
            Product Experiments & RICE Prioritization
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Evaluate growth hypotheses, rank feature opportunities via transparent RICE scoring, and monitor A/B test lift.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Experiment</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Tracked Opportunities</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{experiments.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">In Product Backlog</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Running Live Tests</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{runningCount}</div>
          <div className="text-xs text-indigo-600 font-medium mt-0.5">Active Telemetry</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Validated Wins</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">Promoted to Prod</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Top Priority RICE</div>
          <div className="text-2xl font-bold text-indigo-900 mt-1">{formatNumber(topRice)}</div>
          <div className="text-xs text-slate-500 mt-0.5">Score Metric</div>
        </div>
      </div>

      {/* RICE Prioritization Explainer & Controls Bar */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-slate-600">
        <div>
          <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
            <Award className="w-4 h-4 text-indigo-600" />
            Transparent RICE Scoring Framework:
          </span>
          <p className="leading-relaxed">
            Formula: <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono font-bold text-indigo-700">(Reach × Impact × Confidence%) ÷ Effort (Weeks)</code>.
            Prioritization scores support product judgment and strategic focus.
          </p>
        </div>

        {/* View Switcher, Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* View Mode Toggle: Cards vs 2x2 Matrix */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Show standard backlog cards"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Backlog Cards</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'matrix'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Show 2x2 Opportunity Prioritization Matrix"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
              <span>2×2 Opportunity Matrix</span>
            </button>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Running">Running</option>
            <option value="Planned">Planned</option>
            <option value="Completed">Completed</option>
            <option value="Draft">Draft</option>
          </select>

          {viewMode === 'cards' && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="rice">Sort by RICE Priority</option>
              <option value="recent">Sort by Most Recent</option>
            </select>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: 2x2 OPPORTUNITY PRIORITIZATION MATRIX */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 px-1 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 uppercase tracking-wider">Opportunity Prioritization Matrix:</span>
              <span>Impact (Vertical) vs Effort (Horizontal)</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Quick Wins (≤2w, ≥3.0 Impact)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Big Bets (&gt;2w, ≥3.0 Impact)
              </span>
            </div>
          </div>

          {/* 2x2 Grid Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QUADRANT 1: QUICK WINS (Top-Left: High Impact, Low Effort) */}
            <div className="bg-emerald-50/30 border-2 border-emerald-200 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                      Quick Wins
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {quickWins.length}
                      </span>
                    </h3>
                    <p className="text-[11px] text-emerald-800/80 font-medium">
                      High Impact (≥ 3.0) • Low Effort (≤ 2.0w) — Immediate execution priority
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900 border border-emerald-300">
                  Priority 1
                </span>
              </div>

              <div className="flex-1 space-y-3">
                {quickWins.length > 0 ? (
                  quickWins.map((exp) => (
                    <div 
                      key={exp.id}
                      onClick={() => setInspectExperiment(exp)}
                      className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {exp.experiment_name}
                        </span>
                        <div className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 shrink-0">
                          RICE {formatNumber(exp.rice_priority_score)}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {exp.hypothesis}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-700">Impact: {exp.impact_score}/5</span>
                          <span>•</span>
                          <span>Effort: {exp.effort_score}w</span>
                        </div>
                        <span className={`px-2 py-0.2 rounded border text-[10px] font-medium ${statusColors[exp.experiment_status]}`}>
                          {exp.experiment_status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-emerald-800/60 text-xs">
                    <p>No experiments in this quadrant.</p>
                    <p className="text-[11px] mt-0.5">Target low-effort conversion hypotheses.</p>
                  </div>
                )}
              </div>
            </div>

            {/* QUADRANT 2: BIG BETS / STRATEGIC (Top-Right: High Impact, High Effort) */}
            <div className="bg-indigo-50/30 border-2 border-indigo-200 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-indigo-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-indigo-950 flex items-center gap-2">
                      Big Bets & Strategic Initiatives
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                        {bigBets.length}
                      </span>
                    </h3>
                    <p className="text-[11px] text-indigo-800/80 font-medium">
                      High Impact (≥ 3.0) • High Effort (&gt; 2.0w) — Roadmap sequencing required
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-200/60 text-indigo-900 border border-indigo-300">
                  Priority 2
                </span>
              </div>

              <div className="flex-1 space-y-3">
                {bigBets.length > 0 ? (
                  bigBets.map((exp) => (
                    <div 
                      key={exp.id}
                      onClick={() => setInspectExperiment(exp)}
                      className="bg-white p-4 rounded-xl border border-indigo-200/80 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-700 transition-colors">
                          {exp.experiment_name}
                        </span>
                        <div className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-900 shrink-0">
                          RICE {formatNumber(exp.rice_priority_score)}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {exp.hypothesis}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-indigo-700">Impact: {exp.impact_score}/5</span>
                          <span>•</span>
                          <span>Effort: {exp.effort_score}w</span>
                        </div>
                        <span className={`px-2 py-0.2 rounded border text-[10px] font-medium ${statusColors[exp.experiment_status]}`}>
                          {exp.experiment_status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-indigo-800/60 text-xs">
                    <p>No experiments in this quadrant.</p>
                  </div>
                )}
              </div>
            </div>

            {/* QUADRANT 3: INCREMENTAL / FILL-INS (Bottom-Left: Low Impact, Low Effort) */}
            <div className="bg-amber-50/30 border-2 border-amber-200 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                      Incremental / Fill-Ins
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                        {incremental.length}
                      </span>
                    </h3>
                    <p className="text-[11px] text-amber-800/80 font-medium">
                      Low Impact (&lt; 3.0) • Low Effort (≤ 2.0w) — Cooldown sprints & UX friction fixes
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200/60 text-amber-900 border border-amber-300">
                  Priority 3
                </span>
              </div>

              <div className="flex-1 space-y-3">
                {incremental.length > 0 ? (
                  incremental.map((exp) => (
                    <div 
                      key={exp.id}
                      onClick={() => setInspectExperiment(exp)}
                      className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-amber-700 transition-colors">
                          {exp.experiment_name}
                        </span>
                        <div className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 shrink-0">
                          RICE {formatNumber(exp.rice_priority_score)}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {exp.hypothesis}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-amber-700">Impact: {exp.impact_score}/5</span>
                          <span>•</span>
                          <span>Effort: {exp.effort_score}w</span>
                        </div>
                        <span className={`px-2 py-0.2 rounded border text-[10px] font-medium ${statusColors[exp.experiment_status]}`}>
                          {exp.experiment_status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-amber-800/60 text-xs">
                    <p>No incremental backlog items currently queued.</p>
                  </div>
                )}
              </div>
            </div>

            {/* QUADRANT 4: DEPRIORITIZE / LOW ROI (Bottom-Right: Low Impact, High Effort) */}
            <div className="bg-rose-50/20 border-2 border-rose-200 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-rose-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-rose-950 flex items-center gap-2">
                      Deprioritize / Low ROI
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                        {deprioritize.length}
                      </span>
                    </h3>
                    <p className="text-[11px] text-rose-800/80 font-medium">
                      Low Impact (&lt; 3.0) • High Effort (&gt; 2.0w) — Avoid or reframe hypothesis
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-200/60 text-rose-900 border border-rose-300">
                  Deprioritized
                </span>
              </div>

              <div className="flex-1 space-y-3">
                {deprioritize.length > 0 ? (
                  deprioritize.map((exp) => (
                    <div 
                      key={exp.id}
                      onClick={() => setInspectExperiment(exp)}
                      className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-sm hover:border-rose-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-rose-700 transition-colors">
                          {exp.experiment_name}
                        </span>
                        <div className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-900 shrink-0">
                          RICE {formatNumber(exp.rice_priority_score)}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {exp.hypothesis}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-rose-700">Impact: {exp.impact_score}/5</span>
                          <span>•</span>
                          <span>Effort: {exp.effort_score}w</span>
                        </div>
                        <span className={`px-2 py-0.2 rounded border text-[10px] font-medium ${statusColors[exp.experiment_status]}`}>
                          {exp.experiment_status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                    <p>Zero low-ROI opportunities in current pipeline.</p>
                    <p className="text-[11px] mt-0.5 text-slate-400">RICE filter ensures high-effort low-value work is rejected early.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: STANDARD BACKLOG CARDS */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Loading experiments pipeline...
            </div>
          ) : experiments.length > 0 ? (
            experiments.map((exp) => {
              return (
                <div 
                  key={exp.id} 
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-slate-900">{exp.experiment_name}</span>
                      <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${statusColors[exp.experiment_status] || statusColors['Planned']}`}>
                        {exp.experiment_status}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {exp.target_segment}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-xs font-bold font-mono">
                        RICE: {formatNumber(exp.rice_priority_score)}
                      </div>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded hover:bg-rose-50"
                        title="Delete experiment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Problem Statement & Hypothesis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <strong className="text-slate-700 block mb-0.5">Problem Statement:</strong>
                      <p className="text-slate-600 leading-relaxed">{exp.problem_statement}</p>
                    </div>
                    <div className="p-3 bg-indigo-50/40 rounded-lg border border-indigo-100">
                      <strong className="text-indigo-900 block mb-0.5">Testable Hypothesis:</strong>
                      <p className="text-indigo-800 leading-relaxed">{exp.hypothesis}</p>
                    </div>
                  </div>

                  {/* RICE Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400">Reach (Monthly):</span>
                      <div className="font-bold text-slate-900 mt-0.5">{formatNumber(exp.reach_score)} users</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Impact (1-5):</span>
                      <div className="font-bold text-slate-900 mt-0.5">{exp.impact_score} / 5.0</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Confidence:</span>
                      <div className="font-bold text-slate-900 mt-0.5">{exp.confidence_score}%</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Effort (Weeks):</span>
                      <div className="font-bold text-slate-900 mt-0.5">{exp.effort_score} person-weeks</div>
                    </div>
                  </div>

                  {/* A/B Test Telemetry (for Running & Completed) */}
                  {(exp.experiment_status === 'Running' || exp.experiment_status === 'Completed') && exp.sample_size_control > 0 && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>Observed A/B Test Results</span>
                        {exp.observed_lift_pct > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                            +{exp.observed_lift_pct}% Lift
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <div className="flex justify-between font-medium text-slate-500 mb-1">
                            <span>Control ({exp.sample_size_control} users)</span>
                            <span className="font-bold text-slate-800">{exp.control_conversion_rate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${exp.control_conversion_rate}%` }} />
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <div className="flex justify-between font-medium text-indigo-700 mb-1">
                            <span>Treatment ({exp.sample_size_treatment} users)</span>
                            <span className="font-bold text-indigo-900">{exp.treatment_conversion_rate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${exp.treatment_conversion_rate}%` }} />
                          </div>
                        </div>
                      </div>

                      {exp.decision_learnings && (
                        <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                          <strong>APM Learnings: </strong>{exp.decision_learnings}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
              No experiments found for the selected filter. Click "New Experiment" to add a hypothesis.
            </div>
          )}
        </div>
      )}

      {/* Experiment Inspection Modal (from Matrix click) */}
      {inspectExperiment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${statusColors[inspectExperiment.experiment_status]}`}>
                  {inspectExperiment.experiment_status}
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  {inspectExperiment.experiment_name}
                </h3>
              </div>
              <button 
                onClick={() => setInspectExperiment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                <div>
                  <span className="text-indigo-600 font-medium">Reach:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{formatNumber(inspectExperiment.reach_score)} users</div>
                </div>
                <div>
                  <span className="text-indigo-600 font-medium">Impact:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{inspectExperiment.impact_score} / 5.0</div>
                </div>
                <div>
                  <span className="text-indigo-600 font-medium">Confidence:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{inspectExperiment.confidence_score}%</div>
                </div>
                <div>
                  <span className="text-indigo-600 font-medium">Effort:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{inspectExperiment.effort_score} weeks</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800">Problem Statement:</span>
                <p className="text-slate-600 leading-relaxed">{inspectExperiment.problem_statement}</p>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-1">
                <span className="font-bold text-indigo-900">Testable Hypothesis:</span>
                <p className="text-indigo-800 leading-relaxed">{inspectExperiment.hypothesis}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-0.5">Control Definition:</span>
                  <p className="text-slate-600">{inspectExperiment.control_definition}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-0.5">Treatment Definition:</span>
                  <p className="text-slate-600">{inspectExperiment.treatment_definition}</p>
                </div>
              </div>

              {inspectExperiment.decision_learnings && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                  <strong className="block mb-0.5 font-bold">APM Decision Learnings:</strong>
                  <p>{inspectExperiment.decision_learnings}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-mono">
                Owner: {inspectExperiment.owner || 'Associate Product Manager'}
              </span>
              <button
                onClick={() => setInspectExperiment(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Experiment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-indigo-600" />
                Define New Product Opportunity
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Experiment Name</label>
                <input
                  type="text"
                  placeholder="e.g. EXP-05: Instant Bank Statement Account Aggregator Flow"
                  value={formData.experiment_name}
                  onChange={(e) => setFormData({ ...formData, experiment_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Problem Statement</label>
                <textarea
                  rows={2}
                  placeholder="Describe the user drop-off, operational delay, or unit cost problem..."
                  value={formData.problem_statement}
                  onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Testable Hypothesis</label>
                <textarea
                  rows={2}
                  placeholder="If we [implement change], then [metric will improve] because [rationale]..."
                  value={formData.hypothesis}
                  onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Segment</label>
                  <select
                    value={formData.target_segment}
                    onChange={(e) => setFormData({ ...formData, target_segment: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All Applicants</option>
                    <option value="Salaried">Salaried Only</option>
                    <option value="Self-Employed">Self-Employed Only</option>
                    <option value="Gig Worker">Gig Worker Only</option>
                    <option value="New-to-Credit">New-to-Credit Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Success Metric</label>
                  <input
                    type="text"
                    value={formData.primary_metric}
                    onChange={(e) => setFormData({ ...formData, primary_metric: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* RICE Sliders */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center font-bold text-slate-900">
                  <span>RICE Parameter Estimation</span>
                  <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Preview Score: {formatNumber(previewRice)}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                    <span>Reach (Monthly Eligible Applicants):</span>
                    <span className="font-bold">{formData.reach_score} users</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="500"
                    value={formData.reach_score}
                    onChange={(e) => setFormData({ ...formData, reach_score: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                    <span>Impact (1 = Minimal, 3 = Medium, 5 = Massive):</span>
                    <span className="font-bold">{formData.impact_score} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={formData.impact_score}
                    onChange={(e) => setFormData({ ...formData, impact_score: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                    <span>Confidence in Evidence (%):</span>
                    <span className="font-bold">{formData.confidence_score}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={formData.confidence_score}
                    onChange={(e) => setFormData({ ...formData, confidence_score: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                    <span>Effort (Person-Weeks):</span>
                    <span className="font-bold">{formData.effort_score} weeks</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={formData.effort_score}
                    onChange={(e) => setFormData({ ...formData, effort_score: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !formData.experiment_name.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm"
              >
                {saving ? 'Creating...' : 'Add to Prioritized Backlog'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
