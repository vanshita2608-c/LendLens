import React from 'react';
import Link from 'next/link';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-lg text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8" />
        </div>
        <div className="text-4xl font-extrabold text-slate-900 font-mono">404</div>
        <h2 className="text-lg font-bold text-slate-900">Portfolio Resource Not Found</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested lending analytics route, strategy scenario, or experiment does not exist or has been relocated.
        </p>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Executive Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
