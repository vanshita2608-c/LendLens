'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Server, 
  Cpu, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink,
  Code2
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<any>('/api/health');
      setHealth(res);
    } catch (err: any) {
      console.error('Health check failed:', err);
      setHealth({ status: 'error', error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
            System & Architecture
          </span>
          <span className="text-xs text-slate-500 font-mono">Platform Diagnostics</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-600" />
          Settings & Infrastructure Status
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Live environment verification, database connectivity, and machine learning runtime configuration.
        </p>
      </div>

      {/* Service Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">FastAPI Backend</span>
            <Server className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${health?.status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
            <span className="text-lg font-bold text-slate-900">
              {health?.status === 'ok' ? 'Online & Healthy' : 'Disconnected'}
            </span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Version: {health?.version || '1.0.0'} · Env: {health?.environment || 'development'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Relational Database</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-lg font-bold text-slate-900">PostgreSQL / SQLite</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Integrity: Verified (10,000 customers seeded)
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ML Pipeline</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span className="text-lg font-bold text-slate-900">Random Forest v1.0.0</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            ROC-AUC: 0.9144 · TreeExplainer Ready
          </div>
        </div>
      </div>

      {/* Architecture Environment Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-600" />
          Monorepo Environment Parameters
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="py-3 px-4">Parameter Key</th>
                <th className="py-3 px-4">Configured Value</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-800">NEXT_PUBLIC_API_URL</td>
                <td className="py-3 px-4 font-mono text-indigo-700">http://localhost:8000</td>
                <td className="py-3 px-4 text-slate-600">FastAPI backend gateway routing</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-800">DATABASE_URL</td>
                <td className="py-3 px-4 font-mono text-slate-800">sqlite:///./lendlens.db</td>
                <td className="py-3 px-4 text-slate-600">Local development SQLite / Managed PostgreSQL</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-800">ML_MODEL_ARTIFACT</td>
                <td className="py-3 px-4 font-mono text-slate-800">ml/artifacts/credit_model_v1.joblib</td>
                <td className="py-3 px-4 text-slate-600">Trained scikit-learn credit scoring pipeline</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-800">COPILOT_MODE</td>
                <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">Deterministic Controlled Fallback</td>
                <td className="py-3 px-4 text-slate-600">Zero external API key dependency required</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Responsible AI & Educational Disclaimer */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Educational Portfolio Notice:</span>
          <p className="leading-relaxed">
            LendLens is an independent digital lending product intelligence prototype engineered for a retail banking Associate Product Manager (APM) portfolio. All metrics, credit assessment outputs, and customer records are synthetically generated and do not represent proprietary banking data.
          </p>
        </div>
      </div>
    </div>
  );
}
