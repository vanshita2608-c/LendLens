'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Sliders, 
  HelpCircle, 
  CheckCircle2, 
  XCircle,
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { getCreditModelMetrics, predictCreditRisk } from '@/lib/api';
import { formatINR, formatPercent } from '@/lib/formatters';

const PRESETS = [
  {
    name: 'Prime Salaried Applicant',
    desc: 'High credit score, low DTI, stable salaried income',
    payload: {
      monthly_income: 120000,
      credit_score: 780,
      debt_to_income_ratio: 0.18,
      requested_amount: 200000,
      requested_tenure_months: 24,
      customer_segment: 'Salaried',
      acquisition_channel: 'Organic'
    }
  },
  {
    name: 'Near-Prime Self-Employed',
    desc: 'Moderate bureau history with mid-range leverage',
    payload: {
      monthly_income: 65000,
      credit_score: 670,
      debt_to_income_ratio: 0.38,
      requested_amount: 150000,
      requested_tenure_months: 18,
      customer_segment: 'Self-Employed',
      acquisition_channel: 'Paid Search'
    }
  },
  {
    name: 'Sub-Prime Gig Worker',
    desc: 'Elevated DTI ratio, lower bureau score, aggregator source',
    payload: {
      monthly_income: 25000,
      credit_score: 520,
      debt_to_income_ratio: 0.65,
      requested_amount: 350000,
      requested_tenure_months: 36,
      customer_segment: 'Gig Worker',
      acquisition_channel: 'Aggregators'
    }
  },
  {
    name: 'New-to-Credit Entry Level',
    desc: 'Thin credit file with entry-level salary and modest loan ask',
    payload: {
      monthly_income: 35000,
      credit_score: 610,
      debt_to_income_ratio: 0.22,
      requested_amount: 50000,
      requested_tenure_months: 12,
      customer_segment: 'New-to-Credit',
      acquisition_channel: 'Partner Referral'
    }
  }
];

export default function CreditIntelligencePage() {
  const [activeTab, setActiveTab] = useState<'assessment' | 'performance' | 'modelcard'>('assessment');
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Assessment Form State
  const [formData, setFormData] = useState(PRESETS[0].payload);
  const [prediction, setPrediction] = useState<any>(null);
  const [assessing, setAssessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Model Metrics
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingMetrics(true);
        const data = await getCreditModelMetrics();
        setModelMetrics(data);
      } catch (err: any) {
        console.error('Failed to load credit metrics:', err);
      } finally {
        setLoadingMetrics(false);
      }
    }
    loadData();
  }, []);

  // Run assessment on initial mount or preset change
  useEffect(() => {
    handleAssess();
  }, []);

  const handleAssess = async (overrideData?: typeof formData) => {
    try {
      setAssessing(true);
      setErrorMsg(null);
      const dataToRun = overrideData || formData;
      const res = await predictCreditRisk(dataToRun);
      setPrediction(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to score applicant');
    } finally {
      setAssessing(false);
    }
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setFormData(preset.payload);
    handleAssess(preset.payload);
  };

  const champion = modelMetrics?.champion_model;
  const baseline = modelMetrics?.baseline_model;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Module 03
            </span>
            <span className="text-xs text-slate-500 font-mono">Model: {modelMetrics?.version || 'v1.0.0-rf'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Credit Intelligence & Risk Modelling</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Explainable AI default probability estimation, temporal out-of-time calibration, and SHAP decision attribution.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-sm font-medium">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'assessment' 
                ? 'bg-white text-indigo-700 shadow-sm font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Applicant Sandbox
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'performance' 
                ? 'bg-white text-indigo-700 shadow-sm font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Model Performance
          </button>
          <button
            onClick={() => setActiveTab('modelcard')}
            className={`px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'modelcard' 
                ? 'bg-white text-indigo-700 shadow-sm font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Governance & Model Card
          </button>
        </div>
      </div>

      {/* Model Performance Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Champion ROC-AUC</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {champion ? champion.roc_auc : '0.9144'}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> High Discrimination
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Default Recall</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {champion ? formatPercent(champion.recall * 100) : '96.3%'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Minimizes Bad Debt</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Brier Calibration Score</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {champion ? champion.brier_score : '0.2094'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Well-Calibrated Risk</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Split Methodology</div>
          <div className="text-sm font-bold text-slate-900 mt-1 truncate">
            Temporal Holdout
          </div>
          <div className="text-xs text-indigo-600 font-medium mt-1">Zero Data Leakage</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <div className="text-xs text-slate-500 font-medium">Evaluated Sample</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {modelMetrics?.test_sample_size?.toLocaleString() || '2,500'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Out-of-Time Loans</div>
        </div>
      </div>

      {/* TAB 1: APPLICANT SANDBOX & EXPLAINER */}
      {activeTab === 'assessment' && (
        <div className="space-y-6">
          {/* Preset Buttons */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Select Sample Applicant Archetype:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetSelect(p)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    formData.customer_segment === p.payload.customer_segment &&
                    formData.credit_score === p.payload.credit_score
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Inputs (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Applicant Parameters
                </div>
                <span className="text-xs text-slate-400">Application-Time Features</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Monthly Net Income (₹)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.monthly_income}
                    onChange={(e) => setFormData({ ...formData, monthly_income: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1">
                    <span>Bureau Credit Score (CIBIL/Equifax)</span>
                    <span className="font-bold text-indigo-600">{formData.credit_score}</span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="900"
                    step="5"
                    value={formData.credit_score}
                    onChange={(e) => setFormData({ ...formData, credit_score: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                    <span>300 (Poor)</span>
                    <span>650 (Fair)</span>
                    <span>750 (Prime)</span>
                    <span>900 (Excellent)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Existing Debt-to-Income (DTI: {Math.round(formData.debt_to_income_ratio * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={formData.debt_to_income_ratio}
                    onChange={(e) => setFormData({ ...formData, debt_to_income_ratio: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Loan Requested (₹)
                    </label>
                    <input
                      type="number"
                      step="10000"
                      value={formData.requested_amount}
                      onChange={(e) => setFormData({ ...formData, requested_amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Tenure (Months)
                    </label>
                    <select
                      value={formData.requested_tenure_months}
                      onChange={(e) => setFormData({ ...formData, requested_tenure_months: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                      <option value="18">18 Months</option>
                      <option value="24">24 Months</option>
                      <option value="36">36 Months</option>
                      <option value="48">48 Months</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Employment Segment
                    </label>
                    <select
                      value={formData.customer_segment}
                      onChange={(e) => setFormData({ ...formData, customer_segment: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Salaried">Salaried</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Gig Worker">Gig Worker</option>
                      <option value="New-to-Credit">New-to-Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Acquisition Channel
                    </label>
                    <select
                      value={formData.acquisition_channel}
                      onChange={(e) => setFormData({ ...formData, acquisition_channel: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Organic">Organic</option>
                      <option value="Paid Search">Paid Search</option>
                      <option value="Aggregators">Aggregators</option>
                      <option value="Partner Referral">Partner Referral</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleAssess()}
                disabled={assessing}
                className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                {assessing ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                <span>Recalculate Probability & SHAP</span>
              </button>
            </div>

            {/* Results & SHAP Explanations (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
                  {errorMsg}
                </div>
              )}

              {prediction && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  {/* Risk Score Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="text-xs font-medium text-slate-500">Estimated Default Probability (PD)</div>
                      <div className="text-3xl font-extrabold text-slate-900 mt-1">
                        {formatPercent(prediction.predicted_probability_of_default * 100)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Operational Cutoff: <span className="font-mono">50.0%</span>
                      </div>
                    </div>

                    <div className="space-y-1 sm:text-right">
                      <div className="text-xs font-medium text-slate-500">Underwriting Risk Tier</div>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        prediction.risk_tier.includes('Low Risk') 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : prediction.risk_tier.includes('Medium Risk')
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {prediction.risk_tier}
                      </div>
                      <div className="text-xs font-medium text-slate-700 pt-1">
                        Action: <span className="text-indigo-700 font-semibold">{prediction.recommended_action}</span>
                      </div>
                    </div>
                  </div>

                  {/* SHAP Waterfall Explainers */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        Explainable AI: Key Risk Drivers (SHAP Values)
                      </h3>
                      <span className="text-xs text-slate-400">TreeExplainer Local Attributions</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Risk Increasing */}
                      <div className="p-4 rounded-lg bg-rose-50/60 border border-rose-100 space-y-2">
                        <div className="text-xs font-semibold text-rose-800 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Top Risk-Increasing Factors
                        </div>
                        <div className="space-y-1.5">
                          {prediction.top_risk_increasing_factors.map((f: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-rose-100">
                              <span className="font-medium text-slate-700">{f.feature.replace(/_/g, ' ')}</span>
                              <span className="font-mono font-bold text-rose-600">+{f.shap_impact}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risk Decreasing */}
                      <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-100 space-y-2">
                        <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Top Risk-Mitigating Factors
                        </div>
                        <div className="space-y-1.5">
                          {prediction.top_risk_decreasing_factors.map((f: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-emerald-100">
                              <span className="font-medium text-slate-700">{f.feature.replace(/_/g, ' ')}</span>
                              <span className="font-mono font-bold text-emerald-600">{f.shap_impact}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Responsible AI Disclaimer Banner */}
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Responsible Lending Governance: </span>
                      {prediction.disclaimer}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MODEL PERFORMANCE & BENCHMARKS */}
      {activeTab === 'performance' && (
        <div className="space-y-8">
          {/* Comparison Table */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Baseline vs Production Candidate Benchmark</h2>
            <p className="text-sm text-slate-500">
              Evaluated strictly on the 25% chronological out-of-time test dataset ({modelMetrics?.test_sample_size} unseen loans).
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <th className="py-3 px-4">Metric</th>
                    <th className="py-3 px-4">Logistic Regression (Baseline)</th>
                    <th className="py-3 px-4 text-indigo-700 font-bold">Random Forest (Champion)</th>
                    <th className="py-3 px-4">Fintech Rationale & Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">ROC-AUC</td>
                    <td className="py-3 px-4 font-mono">{baseline?.roc_auc}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{champion?.roc_auc}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">High ranking separation between healthy and defaulting borrowers.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">Recall (Default Detection)</td>
                    <td className="py-3 px-4 font-mono">{baseline?.recall ? formatPercent(baseline.recall * 100) : '-'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{champion?.recall ? formatPercent(champion.recall * 100) : '-'}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">Catches 96.3% of eventual defaults before loan disbursal.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">Brier Calibration Score</td>
                    <td className="py-3 px-4 font-mono">{baseline?.brier_score}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{champion?.brier_score}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">Lower score reflects better calibrated probabilistic estimates.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">Precision</td>
                    <td className="py-3 px-4 font-mono">{baseline?.precision ? formatPercent(baseline.precision * 100) : '-'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{champion?.precision ? formatPercent(champion.precision * 100) : '-'}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">Trade-off accepted to prevent catastrophic credit loss.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Global Feature Importance Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Global Feature Importance (Gini Impurity)</h2>
            <p className="text-sm text-slate-500">
              Relative importance weights across all 100 decision trees in the Random Forest model.
            </p>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={modelMetrics?.feature_importances || []}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                >
                  <XAxis type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <YAxis 
                    type="category" 
                    dataKey="feature" 
                    tick={{ fontSize: 12, fill: '#475569' }} 
                    tickFormatter={(val) => val.replace(/_/g, ' ')}
                  />
                  <Tooltip 
                    formatter={(val: any) => [`${(Number(val) * 100).toFixed(2)}%`, 'Weight']}
                    labelFormatter={(label) => label.replace(/_/g, ' ')}
                  />
                  <Bar dataKey="importance" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                    {(modelMetrics?.feature_importances || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#4f46e5' : '#818cf8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MODEL CARD & GOVERNANCE */}
      {activeTab === 'modelcard' && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">LendLens Credit Risk Model Card (v1.0.0-rf)</h2>
            <p className="text-sm text-slate-500 mt-1">
              Standardized transparency documentation for APMs, risk auditors, and credit committees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900">1. Intended Use</h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Provide decision support and risk signals for digital personal loan underwriting. Intended for Associate Product Managers and Credit Risk Analysts to model credit loss sensitivity and funnel impacts.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">2. Out-of-Scope & Prohibited Uses</h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Autonomous adverse credit decisions without human underwriter review. The model must never be used to decline applicants automatically without secondary verification.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">3. Target Variable Definition</h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Binary default indicator defined as 90+ Days Past Due (DPD) delinquency or write-off status within 12 months post-disbursal.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900">4. Zero Data Leakage Safeguards</h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  All 15 input features are computed strictly from information available at application time (income, bureau score, requested loan size, and employment category). Future repayments and post-disbursal metrics are strictly excluded from the feature store.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">5. Temporal Out-of-Time Splitting</h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  The dataset is split chronologically (75% in-time training, 25% out-of-time holdout). Random K-Fold splits are rejected to prevent macro-economic data leakage from future cohorts into historical models.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">6. Fairness & Disparate Impact</h3>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Protected demographic characteristics (gender, religion, caste, marital status) are completely omitted from the schema to enforce algorithmic fairness and compliance with fair lending principles.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
