'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  HelpCircle, 
  Layers, 
  Calculator, 
  ShieldCheck, 
  ArrowRight, 
  LayoutDashboard, 
  GitMerge, 
  Cpu, 
  FlaskConical, 
  PieChart, 
  FileText, 
  Lightbulb,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface ApmGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APM_STEPS = [
  {
    step: '01',
    title: 'Identify Problem',
    page: 'Executive Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: 'Spot macro conversion dips, channel underperformance, or early delinquency spikes across monthly cohorts.'
  },
  {
    step: '02',
    title: 'Diagnose Funnel',
    page: 'Customer Journey',
    href: '/customer-journey',
    icon: GitMerge,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    description: 'Isolate high-friction journey stages, turnaround times (TAT), and root-cause drop-off reasons across customer segments.'
  },
  {
    step: '03',
    title: 'Assess Credit Risk',
    page: 'Credit Intelligence',
    href: '/credit-intelligence',
    icon: Cpu,
    color: 'text-violet-600 bg-violet-50 border-violet-200',
    description: 'Inspect ML risk distributions, evaluate underwriting cutoffs, and audit local SHAP feature attributions for applicants.'
  },
  {
    step: '04',
    title: 'Simulate in Strategy Lab',
    page: 'Strategy Lab',
    href: '/strategy-lab',
    icon: FlaskConical,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    description: 'Simulate hypothetical funnel uplifts, risk cutoff adjustments, or acquisition mix rebalances with real-time P&L feedback.'
  },
  {
    step: '05',
    title: 'Compare Strategies',
    page: 'Scenario Comparison',
    href: '/strategy-lab?view=comparison',
    icon: Layers,
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    description: 'Benchmark multiple saved scenarios side-by-side against live portfolio baselines across revenue, ECL, and net margin.'
  },
  {
    step: '06',
    title: 'Export Decision Brief',
    page: 'Product Brief Generator',
    href: '/strategy-lab?view=brief',
    icon: FileText,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    description: 'Generate a structured 12-section APM brief (RFC/PRD format) with hypotheses, projections, guardrails, and validation plans.'
  },
  {
    step: '07',
    title: 'Run Product Experiment',
    page: 'Experimentation Workspace',
    href: '/experiments',
    icon: Lightbulb,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    description: 'Track in-market A/B tests, prioritize backlog via RICE scoring, and monitor guardrail metrics to protect credit quality.'
  }
];

const FORMULAS = [
  {
    name: 'Expected Credit Loss (ECL)',
    formula: 'ECL = PD × LGD × EAD',
    components: [
      { key: 'PD', label: 'Probability of Default (from Random Forest classifier)' },
      { key: 'LGD', label: 'Loss Given Default (assumed 65% for unsecured retail loans)' },
      { key: 'EAD', label: 'Exposure at Default (outstanding disbursed principal balance)' }
    ],
    note: 'Standard Basel II / IFRS 9 foundation for bank credit provisioning.'
  },
  {
    name: 'Net Financial Contribution',
    formula: 'Contribution = Gross Revenue − Cost of Funds − CAC − OpEx − ECL',
    components: [
      { key: 'Gross Revenue', label: 'Annual Interest Income + 1.5% Upfront Origination Fee' },
      { key: 'Cost of Funds', label: '6.5% institutional cost of capital on disbursed principal' },
      { key: 'CAC', label: 'Channel-specific customer acquisition expense' },
      { key: 'OpEx', label: 'Servicing, credit bureau checks, and KYC verification fees' }
    ],
    note: 'Ensures digital lending product changes protect unit economics.'
  },
  {
    name: 'Portfolio at Risk (PAR30 / PAR60 / PAR90)',
    formula: 'PAR30 Rate = Outstanding Principal (30+ DPD) ÷ Total Active Portfolio',
    components: [
      { key: 'PAR30 Target', label: '< 4.0% industry healthy portfolio benchmark' },
      { key: 'Default Cutoff', label: '90+ Days Past Due (DPD) or regulatory write-off threshold' }
    ],
    note: 'Primary early-warning indicator monitored by risk committees.'
  },
  {
    name: 'RICE Opportunity Prioritization',
    formula: 'RICE Score = (Reach × Impact × Confidence%) ÷ Effort (Weeks)',
    components: [
      { key: 'Reach', label: 'Monthly active applicants or borrowers affected' },
      { key: 'Impact', label: '1 (Minimal) to 5 (Massive conversion / delinquency lift)' },
      { key: 'Confidence', label: '50% (Moonshot), 80% (Data-backed), 100% (High telemetry)' },
      { key: 'Effort', label: 'Person-weeks of engineering, design, and risk alignment' }
    ],
    note: 'Transparent prioritization framework preventing subjective HIPPO decisions.'
  }
];

export default function ApmGuideModal({ isOpen, onClose }: ApmGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'workflow' | 'formulas' | 'principles'>('workflow');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  APM Reference Manual
                </span>
                <span className="text-xs text-slate-500 font-mono">v1.0 Architecture</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                LendLens Product Intelligence Playbook
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            aria-label="Close Playbook"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-6">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'workflow'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>7-Step APM Decision Loop</span>
          </button>

          <button
            onClick={() => setActiveTab('formulas')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'formulas'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>FinTech Formulas & Benchmarks</span>
          </button>

          <button
            onClick={() => setActiveTab('principles')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'principles'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Architecture & Responsible FinTech</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                <strong>The Core Product Management Loop:</strong> Rather than viewing retrospective analytics in isolation, LendLens connects conversion diagnostics directly with machine-learning credit risk, simulation modeling, decision briefs, and live experiments.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {APM_STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <Link
                      key={step.step}
                      href={step.href}
                      onClick={onClose}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              STEP {step.step}
                            </span>
                            <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {step.title}
                            </span>
                          </div>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${step.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {step.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-[11px] text-indigo-600 font-semibold">
                        <span>Go to {step.page}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'formulas' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                LendLens embeds standardized retail banking and growth product definitions to ensure calculations are mathematically grounded and audit-compliant.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FORMULAS.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-xs text-slate-900">{item.name}</h3>
                      <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                    </div>

                    <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 font-mono text-xs font-bold text-indigo-900">
                      {item.formula}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {item.components.map((comp, cIdx) => (
                        <div key={cIdx} className="flex items-start gap-1.5">
                          <span className="font-mono font-semibold text-slate-700 shrink-0">{comp.key}:</span>
                          <span className="text-slate-600">{comp.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                      {item.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'principles' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Core Engineering Principles:</span>
                  <p className="leading-relaxed">
                    Financial software requires strict defenses against data leakage, hallucinated metrics, and non-deterministic behavior. LendLens enforces four architectural boundaries:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Zero Target Leakage in ML
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Machine learning features are strictly constrained to application-time attributes. Post-disbursal repayment behavior is completely isolated during credit model training.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    No Arbitrary SQL Execution
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    The AI Copilot uses <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">ControlledAnalyticsToolkit</code> (parameter-checked method calls). It never executes LLM-generated raw SQL.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Ethical & Non-Discriminatory Scoring
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Demographic indicators (gender, age, marital status, location) are strictly excluded from underwriting models to prevent bias and ensure fair lending standards.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    100% Deterministic Fallback
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    The entire platform operates out of the box with zero external API key requirements. When LLM keys are absent, structured APM rule templates generate consistent answers.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Press ESC or click close to dismiss</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
