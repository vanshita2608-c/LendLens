import React from 'react';

export function LoadingSkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-pulse space-y-3 ${className}`}>
      <div className="h-3 bg-slate-200 rounded w-1/3" />
      <div className="h-7 bg-slate-200 rounded w-1/2" />
      <div className="h-2.5 bg-slate-100 rounded w-2/3" />
    </div>
  );
}

export function LoadingSkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse space-y-4">
      <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="h-4 bg-slate-100 rounded flex-1" />
            <div className="h-4 bg-slate-100 rounded w-24" />
            <div className="h-4 bg-slate-100 rounded w-20" />
            <div className="h-4 bg-slate-100 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
