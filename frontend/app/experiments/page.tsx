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
  Users
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

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
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

      {/* RICE Prioritization Explainer Callout */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-slate-600">
        <div>
          <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
            <Award className="w-4 h-4 text-indigo-600" />
            Transparent RICE Scoring Framework:
          </span>
          <p className="leading-relaxed">
            Formula: <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono font-bold text-indigo-700">(Reach × Impact × Confidence%) ÷ Effort (Weeks)</code>.
            Prioritization scores support product judgment and strategic focus; they do not replace qualitative user discovery.
          </p>
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-2 shrink-0">
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

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="rice">Sort by RICE Priority</option>
            <option value="recent">Sort by Most Recent</option>
          </select>
        </div>
      </div>

      {/* Experiment Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading experiments pipeline...
          </div>
        ) : experiments.length > 0 ? (
          experiments.map((exp) => {
            const statusColors: Record<string, string> = {
              'Running': 'bg-indigo-50 text-indigo-700 border-indigo-200',
              'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
              'Planned': 'bg-amber-50 text-amber-700 border-amber-200',
              'Draft': 'bg-slate-100 text-slate-600 border-slate-200',
            };

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
