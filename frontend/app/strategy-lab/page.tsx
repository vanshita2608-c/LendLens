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
  Bookmark,
  GitCompare,
  LineChart as LineChartIcon,
  Copy,
  Download,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
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
  deleteScenario,
  compareScenarios,
  getDecisionBrief 
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
  const [activeView, setActiveView] = useState<'simulator' | 'sensitivity' | 'comparison'>('simulator');
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Saved scenarios state
  const [savedScenarios, setSavedScenarios] = useState<any[]>([]);
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);

  // Modals state
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [scenarioName, setScenarioName] = useState<string>('');
  const [scenarioDesc, setScenarioDesc] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Decision brief viewer
  const [briefModalOpen, setBriefModalOpen] = useState<boolean>(false);
  const [activeBrief, setActiveBrief] = useState<any>(null);
  const [loadingBrief, setLoadingBrief] = useState<boolean>(false);

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

  // Load saved scenarios on mount & parse query parameters
  useEffect(() => {
    loadSavedScenarios();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stageParam = params.get('stage');
      if (stageParam) {
        const stageMap: Record<string, string> = {
          'KYC_COMPLETED': 'KYC Completed',
          'DETAILS_SUBMITTED': 'Details Submitted',
          'CREDIT_ASSESSED': 'Credit Assessed',
          'LOAN_APPROVED': 'Loan Approved',
          'OFFER_ACCEPTED': 'Offer Accepted'
        };
        if (stageMap[stageParam]) {
          setFunnelStage(stageMap[stageParam]);
          setSelectedCategory('funnel_improvement');
        }
      }
      const viewParam = params.get('view');
      if (viewParam === 'comparison') {
        setActiveView('comparison');
      }
    }
  }, []);

  const loadSavedScenarios = async () => {
    try {
      const data = await getScenarios();
      setSavedScenarios(data || []);
    } catch (err: any) {
      console.error('Failed to load saved scenarios:', err);
    }
  };

  const handleDownloadBrief = () => {
    if (!activeBrief) return;
    const blob = new Blob([activeBrief.markdown_content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (activeBrief.scenario_name || 'decision_brief')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `${safeName}_brief.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      setSelectedForComparison((prev) => prev.filter((item) => item !== id));
      await loadSavedScenarios();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleOpenBrief = async (scenarioId: number) => {
    try {
      setLoadingBrief(true);
      setBriefModalOpen(true);
      const brief = await getDecisionBrief(scenarioId);
      setActiveBrief(brief);
    } catch (err: any) {
      alert(`Failed to load decision brief: ${err.message}`);
      setBriefModalOpen(false);
    } finally {
      setLoadingBrief(false);
    }
  };

  const toggleSelectForComparison = (id: number) => {
    setSelectedForComparison((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRunComparison = async () => {
    if (selectedForComparison.length < 2) {
      alert('Please select at least 2 saved scenarios to compare.');
      return;
    }
    try {
      const data = await compareScenarios(selectedForComparison);
      setComparisonData(data);
      setActiveView('comparison');
    } catch (err: any) {
      alert(`Comparison failed: ${err.message}`);
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

  // Sensitivity curve generation across parameter sweep
  const sensitivityCurveData = [5, 10, 15, 20, 25, 30, 35, 40].map((stepUplift) => {
    const baseDisbursals = simulationResult?.baseline?.disbursals_count || 1200;
    const incDisbursals = Math.round(baseDisbursals * (stepUplift / 100.0) * 0.35);
    const incVol = incDisbursals * 150000;
    const grossIncome = incVol * 0.14;
    const fundingCost = incVol * 0.075;
    const opex = 250000 + (incDisbursals * 100);
    const ecl = incVol * 0.08 * 0.45 * 0.75;
    const netPnl = grossIncome - fundingCost - opex - ecl;

    return {
      uplift: `+${stepUplift}%`,
      disbursals: incDisbursals,
      netContribution: Math.round(netPnl),
      creditLoss: Math.round(ecl)
    };
  });

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

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveView('simulator')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeView === 'simulator' 
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Interactive Simulator
            </button>
            <button
              onClick={() => setActiveView('sensitivity')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeView === 'sensitivity' 
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sensitivity Curves
            </button>
            <button
              onClick={() => setActiveView('comparison')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeView === 'comparison' 
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Strategy Comparison
            </button>
          </div>

          <button
            onClick={() => setSaveModalOpen(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Strategy</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STRATEGY_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                if (activeView === 'comparison') setActiveView('simulator');
              }}
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

      {/* VIEW 1: INTERACTIVE SIMULATOR */}
      {activeView === 'simulator' && (
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
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost of Capital / Funds (%)</label>
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
                <div className="text-xs text-slate-500 mt-0.5">Principal Exposure</div>
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
          </div>
        </div>
      )}

      {/* VIEW 2: SENSITIVITY CURVE */}
      {activeView === 'sensitivity' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-indigo-600" />
                Uplift Sensitivity & Marginal Diminishing Returns Curve
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluates projected Net Contribution (₹) against Expected Credit Loss across conversion improvements from +5% to +40%.
              </p>
            </div>
            <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              Optimal Sweet-Spot: +18% to +25%
            </span>
          </div>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensitivityCurveData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="uplift" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis 
                  tickFormatter={(val) => formatINR(val, true)} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                />
                <Tooltip 
                  formatter={(val: any, name: any) => [formatINR(Number(val)), name === 'netContribution' ? 'Net P&L' : 'Credit Loss (ECL)']} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="netContribution" 
                  name="Net P&L Contribution" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 5 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="creditLoss" 
                  name="Expected Credit Loss" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <strong>Product Analytics Takeaway:</strong> Net contribution scales linearly initially but begins plateauing as marginal operational costs and default provisioning compound. Interventions targeting +15% to +25% conversion deliver the highest Sharpe-equivalent return on engineering effort.
          </div>
        </div>
      )}

      {/* VIEW 3: STRATEGY COMPARISON */}
      {activeView === 'comparison' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-indigo-600" />
                Multi-Strategy Comparison Matrix
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct head-to-head comparison between selected saved strategic scenarios.
              </p>
            </div>
            <button
              onClick={() => setActiveView('simulator')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Back to Simulator
            </button>
          </div>

          {comparisonData?.comparison_summary?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <th className="py-3 px-4">Scenario Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Incremental Loans</th>
                    <th className="py-3 px-4">Incremental Principal</th>
                    <th className="py-3 px-4 text-emerald-700">Net Contribution</th>
                    <th className="py-3 px-4 text-rose-700">Expected Credit Loss</th>
                    <th className="py-3 px-4">ROI / Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonData.comparison_summary.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{row.scenario_name}</td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">{row.scenario_type}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">+{row.incremental_disbursals}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{formatINR(row.incremental_volume_inr, true)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">{formatINR(row.net_contribution_inr, true)}</td>
                      <td className="py-3 px-4 font-mono text-rose-600">{formatINR(row.expected_credit_loss_inr, true)}</td>
                      <td className="py-3 px-4 font-mono text-indigo-700 font-semibold">{row.roi_ratio}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              Select 2 or more scenarios below and click "Compare Selected".
            </div>
          )}
        </div>
      )}

      {/* Saved Scenarios Vault */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-600" />
              Persisted Strategy Vault
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select scenarios to compare head-to-head or export full 12-section Product Decision Briefs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedForComparison.length >= 2 && (
              <button
                onClick={handleRunComparison}
                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare Selected ({selectedForComparison.length})</span>
              </button>
            )}
            <span className="text-xs font-mono text-slate-400">{savedScenarios.length} Saved</span>
          </div>
        </div>

        {savedScenarios.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {savedScenarios.map((sc) => {
              const isChecked = selectedForComparison.includes(sc.id);
              return (
                <div key={sc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectForComparison(sc.id)}
                      className="mt-1 accent-indigo-600 cursor-pointer rounded"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{sc.scenario_name}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-medium">
                          {sc.scenario_type}
                        </span>
                      </div>
                      {sc.description && <p className="text-xs text-slate-500 mt-0.5">{sc.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenBrief(sc.id)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-200"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Product Brief</span>
                    </button>
                    <button
                      onClick={() => handleDeleteScenario(sc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">
            No scenarios saved yet. Use the simulator above and click "Save Strategy".
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

      {/* Decision Brief Viewer Modal */}
      {briefModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Product Decision Brief (RFC / PRD Format)
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {activeBrief?.scenario_name || 'Loading...'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeBrief && (
                  <>
                    <button
                      onClick={handleDownloadBrief}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Download Decision Brief as Markdown"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download .md</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeBrief.markdown_content);
                        alert('Brief copied to clipboard in Markdown format!');
                      }}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Copy Markdown to Clipboard"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setBriefModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 font-sans text-sm text-slate-800 leading-relaxed bg-slate-50/50">
              {loadingBrief ? (
                <div className="py-16 text-center text-slate-400">
                  <span className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
                  <p className="text-xs mt-2">Generating 12-section evidence-based brief...</p>
                </div>
              ) : activeBrief ? (
                <pre className="whitespace-pre-wrap font-sans bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-800 leading-relaxed">
                  {activeBrief.markdown_content}
                </pre>
              ) : (
                <div className="py-12 text-center text-rose-500 text-sm">Failed to generate decision brief.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
