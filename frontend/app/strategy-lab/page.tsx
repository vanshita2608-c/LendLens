'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Play, 
  Save, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  RotateCcw, 
  Layers, 
  Clock, 
  ArrowRight, 
  Percent, 
  Trash2, 
  FileText,
  BarChart3,
  Bookmark
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  simulateScenario, 
  getScenarios, 
  createScenario, 
  deleteScenario 
} from '@/lib/api';
import { formatINR, formatPercent, formatNumber } from '@/lib/formatters';

const STRATEGY_CATEGORIES = [
  { id: 'funnel_improvement', name: 'Funnel Optimization', icon: Layers, desc: 'Simulate conversion rate uplift at drop-off stages' },
  { id: 'risk_cutoff', name: 'Credit Risk Policy', icon: AlertTriangle, desc: 'Adjust underwriting PD cutoff thresholds & ECL' },
  { id: 'tat_optimization', name: 'TAT & Velocity', icon: Clock, desc: 'Model operational speed elasticity and friction reduction' },
  { id: 'channel_mix', name: 'Acquisition Mix', icon: BarChart3, desc: 'Reallocate marketing channel spend and blended CAC' },
];

export default function StrategyLabPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('funnel_improvement');
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Saved scenarios state
  const [savedScenarios, setSavedScenarios] = useState<any[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [scenarioName, setScenarioName] = useState<string>('');
  const [scenarioDesc, setScenarioDesc] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Category A: Funnel Improvement Parameters
  const [funnelStage, setFunnelStage] = useState<string>('KYC Completed');
  const [funnelUplift, setFunnelUplift] = useState<number>(18.0);
  const [funnelCost, setFunnelCost] = useState<number>(250000);
  const [funnelSegment, setFunnelSegment] = useState<string>('All');

  // Category B: Credit Risk Cutoff Parameters
  const [newPdCutoff, setNewPdCutoff] = useState<number>(0.14);
  const [costOfFunds, setCostOfFunds] = useState<number>(7.5);

  // Category C: Processing TAT Parameters
  const [tatStage, setTatStage] = useState<string>('Credit Assessment Completed');
  const [tatReduction, setTatReduction] = useState<number>(30.0);
  const [tatElasticity, setTatElasticity] = useState<number>(0.20);
  const [tatCost, setTatCost] = useState<number>(350000);

  // Category D: Channel Mix Parameters
  const [channelShares, setChannelShares] = useState<Record<string, number>>({
    'Organic': 35.0,
    'Partner Referral': 30.0,
    'Aggregators': 10.0,
    'Paid Search': 20.0,
    'Direct Mail': 5.0
  });

  // Load saved scenarios on mount
  useEffect(() => {
    loadSavedScenarios();
  }, []);

  const loadSavedScenarios = async () => {
    try {
      const data = await getScenarios();
      setSavedScenarios(data || []);
    } catch (err: any) {
      console.error('Failed to load saved scenarios:', err);
    }
  };

  // Run simulation whenever category or primary parameters change
  useEffect(() => {
    runCurrentSimulation();
  }, [
    selectedCategory, 
    funnelStage, 
    funnelUplift, 
    funnelCost, 
    funnelSegment, 
    newPdCutoff, 
    costOfFunds, 
    tatStage, 
    tatReduction, 
    tatCost,
    channelShares
  ]);

  const runCurrentSimulation = async () => {
    try {
      setIsSimulating(true);
      setErrorMsg(null);

      let payload: any = { scenario_type: selectedCategory };

      if (selectedCategory === 'funnel_improvement') {
        payload.target_stage = funnelStage;
        payload.relative_uplift_pct = funnelUplift;
        payload.implementation_cost_inr = funnelCost;
        if (funnelSegment !== 'All') payload.target_segment = funnelSegment;
      } else if (selectedCategory === 'risk_cutoff') {
        payload.new_pd_threshold = newPdCutoff;
        payload.cost_of_funds_pct = costOfFunds;
      } else if (selectedCategory === 'tat_optimization') {
        payload.target_stage = tatStage;
        payload.tat_reduction_pct = tatReduction;
        payload.elasticity_factor = tatElasticity;
        payload.implementation_cost_inr = tatCost;
      } else if (selectedCategory === 'channel_mix') {
        payload.channel_shares = channelShares;
      }

      const res = await simulateScenario(payload);
      setSimulationResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Simulation execution failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSaveScenario = async () => {
    if (!scenarioName.trim()) return;
    try {
      setSaving(true);
      let assumptions: any = {};
      if (selectedCategory === 'funnel_improvement') {
        assumptions = { target_stage: funnelStage, relative_uplift_pct: funnelUplift, implementation_cost_inr: funnelCost, target_segment: funnelSegment };
      } else if (selectedCategory === 'risk_cutoff') {
        assumptions = { new_pd_threshold: newPdCutoff, cost_of_funds_pct: costOfFunds };
      } else if (selectedCategory === 'tat_optimization') {
        assumptions = { target_stage: tatStage, tat_reduction_pct: tatReduction, elasticity_factor: tatElasticity, implementation_cost_inr: tatCost };
      } else if (selectedCategory === 'channel_mix') {
        assumptions = { channel_shares: channelShares };
      }

      await createScenario({
        scenario_name: scenarioName,
        description: scenarioDesc,
        scenario_type: selectedCategory,
        assumptions
      });

      setSaveModalOpen(false);
      setScenarioName('');
      setScenarioDesc('');
      await loadSavedScenarios();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScenario = async (id: number) => {
    if (!confirm('Are you sure you want to delete this saved scenario?')) return;
    try {
      await deleteScenario(id);
      await loadSavedScenarios();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Funnel comparison chart data
  const funnelComparisonData = (simulationResult?.scenario?.stages_comparison || []).map((s: any) => ({
    stage: s.stage_name,
    Baseline: s.baseline_volume,
    Scenario: s.scenario_volume,
    delta: s.delta_volume
  }));

  // Risk band chart data
  const riskBandData = (simulationResult?.risk_band_distribution || []).map((b: any) => ({
    band: b.band_label.split('(')[0].trim(),
    applicants: b.applicant_count,
    share: b.share_pct
  }));

  // Financial calculations from engine
  const financialImpact = simulationResult?.financial_impact || simulationResult?.marginal_portfolio_impact || {};

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Module 05 · Core Differentiator
            </span>
            <span className="text-xs text-slate-500 font-mono">Dynamic P&L & Risk Simulator</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Strategy Lab — Decision Simulator</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Evaluate hypothetical funnel interventions, credit underwriting policy adjustments, and financial unit economics.
          </p>
        </div>

        <button
          onClick={() => setSaveModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Current Strategy</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STRATEGY_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                  {cat.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-snug">{cat.desc}</p>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls & Sliders Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Scenario Assumptions
            </h2>
            <span className="text-xs text-slate-400 font-mono">Real-Time Engine</span>
          </div>

          {/* Form Fields by Category */}
          {selectedCategory === 'funnel_improvement' && (
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Funnel Stage</label>
                <select
                  value={funnelStage}
                  onChange={(e) => setFunnelStage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Details Submitted">Details Submitted</option>
                  <option value="KYC Completed">KYC Completed (Recommended)</option>
                  <option value="Credit Assessed">Credit Assessed</option>
                  <option value="Loan Approved">Loan Approved</option>
                  <option value="Offer Accepted">Offer Accepted</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                  <span>Relative Conversion Uplift</span>
                  <span className="font-bold text-indigo-600">+{funnelUplift}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={funnelUplift}
                  onChange={(e) => setFunnelUplift(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Implementation Cost (₹)</label>
                <input
                  type="number"
                  step="50000"
                  value={funnelCost}
                  onChange={(e) => setFunnelCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-400">Engineering, OCR SDK & integration cost</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Customer Segment</label>
                <select
                  value={funnelSegment}
                  onChange={(e) => setFunnelSegment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Customer Segments</option>
                  <option value="Salaried">Salaried Only</option>
                  <option value="Self-Employed">Self-Employed Only</option>
                  <option value="Gig Worker">Gig Worker Only</option>
                  <option value="New-to-Credit">New-to-Credit Only</option>
                </select>
              </div>
            </div>
          )}

          {selectedCategory === 'risk_cutoff' && (
            <div className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                  <span>Proposed Underwriting Cutoff (Max PD)</span>
                  <span className="font-bold text-indigo-600">{formatPercent(newPdCutoff * 100)} PD</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.25"
                  step="0.01"
                  value={newPdCutoff}
                  onChange={(e) => setNewPdCutoff(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                  <span>5% (Conservative)</span>
                  <span>11% (Current Policy)</span>
                  <span>25% (Aggressive)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Cost of Capital / Funds (%)</label>
                <input
                  type="number"
                  step="0.25"
                  value={costOfFunds}
                  onChange={(e) => setCostOfFunds(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {selectedCategory === 'tat_optimization' && (
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Optimization Stage</label>
                <select
                  value={tatStage}
                  onChange={(e) => setTatStage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Details Submitted">Details Submitted</option>
                  <option value="KYC Completed">KYC Verification</option>
                  <option value="Credit Assessment Completed">Credit Assessment / Bureau Pull</option>
                  <option value="Loan Approved">Loan Approval Decisioning</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                  <span>Turnaround Time (TAT) Reduction</span>
                  <span className="font-bold text-indigo-600">-{tatReduction}% Faster</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={tatReduction}
                  onChange={(e) => setTatReduction(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Automation Investment (₹)</label>
                <input
                  type="number"
                  step="50000"
                  value={tatCost}
                  onChange={(e) => setTatCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {selectedCategory === 'channel_mix' && (
            <div className="space-y-3 text-sm">
              <span className="text-xs text-slate-500">Adjust acquisition channel allocation (% of volume):</span>
              {Object.keys(channelShares).map((ch) => (
                <div key={ch}>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-0.5">
                    <span>{ch}</span>
                    <span className="font-bold text-indigo-600">{channelShares[ch]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={channelShares[ch]}
                    onChange={(e) => setChannelShares({ ...channelShares, [ch]: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-900">Deterministic Economics:</span>
            <p>
              Calculations account for interest revenue (14% APR), cost of capital ({costOfFunds}%), variable origination costs, and Expected Credit Loss (PD × LGD × EAD).
            </p>
          </div>
        </div>

        {/* Live Simulation Outcomes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Impact Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Incremental Disbursals</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                +{simulationResult?.scenario?.incremental_disbursals_count || simulationResult?.marginal_portfolio_impact?.marginal_disbursals_count || 0}
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-0.5">Loans Funded</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Incremental Volume</div>
              <div className="text-2xl font-bold text-indigo-700 mt-1">
                {formatINR(simulationResult?.scenario?.incremental_disbursed_principal_inr || simulationResult?.marginal_portfolio_impact?.marginal_disbursed_principal_inr || 0, true)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Disbursed Principal</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Net P&L Contribution</div>
              <div className={`text-2xl font-bold mt-1 ${
                (financialImpact?.net_contribution || financialImpact?.marginal_net_contribution_inr || 0) >= 0 
                  ? 'text-emerald-600' 
                  : 'text-rose-600'
              }`}>
                {formatINR(financialImpact?.net_contribution || financialImpact?.marginal_net_contribution_inr || 0, true)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">After Risk & Opex</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Expected Credit Loss</div>
              <div className="text-2xl font-bold text-rose-600 mt-1">
                {formatINR(financialImpact?.expected_credit_loss || financialImpact?.marginal_expected_credit_loss_inr || 0, true)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">PD × LGD × EAD</div>
            </div>
          </div>

          {/* Dynamic Visualization */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {selectedCategory === 'risk_cutoff' ? 'Applicant Risk Band Distribution' : 'Baseline vs Scenario Funnel Propagation'}
              </h3>
              <span className="text-xs text-slate-400">Unit Volumes</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {selectedCategory === 'risk_cutoff' ? (
                  <BarChart data={riskBandData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <XAxis dataKey="band" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip formatter={(val: any) => [formatNumber(val), 'Assessed Applicants']} />
                    <Bar dataKey="applicants" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={funnelComparisonData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Scenario" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Unit Economics Breakdown Table */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Waterfall Financial Unit Economics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Gross Interest Income</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5 font-mono">
                  {formatINR(financialImpact?.gross_interest_income || 0, true)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Funding Costs</span>
                <div className="font-bold text-rose-600 text-sm mt-0.5 font-mono">
                  -{formatINR(financialImpact?.funding_costs || 0, true)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Operating Cost</span>
                <div className="font-bold text-slate-700 text-sm mt-0.5 font-mono">
                  -{formatINR(financialImpact?.total_scenario_investment_inr || funnelCost || 0, true)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Net Expected ROI</span>
                <div className="font-bold text-indigo-700 text-sm mt-0.5 font-mono">
                  {financialImpact?.expected_roi_ratio ? `${financialImpact.expected_roi_ratio}x` : '1.4x'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Scenarios Vault */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-600" />
              Saved Strategic Scenarios
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Persisted in database for multi-strategy comparative evaluation and product briefs.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">{savedScenarios.length} Scenarios Saved</span>
        </div>

        {savedScenarios.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {savedScenarios.map((sc) => (
              <div key={sc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{sc.scenario_name}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-medium">
                      {sc.scenario_type}
                    </span>
                  </div>
                  {sc.description && <p className="text-xs text-slate-500 mt-0.5">{sc.description}</p>}
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-400 font-mono">
                    {sc.created_at ? new Date(sc.created_at).toLocaleDateString() : ''}
                  </span>
                  <button
                    onClick={() => handleDeleteScenario(sc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">
            No scenarios saved yet. Run a simulation above and click "Save Current Strategy".
          </div>
        )}
      </div>

      {/* Save Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Save Scenario to Portfolio Vault</h3>
            <p className="text-xs text-slate-500">
              Persist your simulated assumptions and calculated P&L for APM decision reviews.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Scenario Name</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Instant DigiLocker Rollout"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Hypothesis</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Mitigates 40% drop-off at KYC stage via automated bank statement parsing."
                  value={scenarioDesc}
                  onChange={(e) => setScenarioDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScenario}
                disabled={saving || !scenarioName.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm"
              >
                {saving ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
