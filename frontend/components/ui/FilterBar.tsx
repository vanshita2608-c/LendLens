'use client';

import React from 'react';
import { Filter, Calendar, Users, Radio, RotateCcw } from 'lucide-react';

export interface FilterState {
  dateRange: string;
  channel: string;
  segment: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
}

const CHANNELS = [
  'All',
  'Organic',
  'Paid Search',
  'Aggregators',
  'Partner Referral',
  'Direct Mail'
];

const SEGMENTS = [
  'All',
  'Salaried',
  'Self-Employed',
  'New-to-Credit',
  'Gig Worker'
];

const DATE_RANGES = [
  { id: 'all', label: 'All Time' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: '12m', label: 'Last 12 Months' },
];

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const isFiltered = filters.channel !== 'All' || filters.segment !== 'All' || filters.dateRange !== 'all';

  const resetFilters = () => {
    onChange({
      dateRange: 'all',
      channel: 'All',
      segment: 'All'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider pr-2 border-r border-slate-200">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Filters</span>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.dateRange}
            onChange={(e) => onChange({ ...filters, dateRange: e.target.value })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {DATE_RANGES.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Acquisition Channel Selector */}
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.channel}
            onChange={(e) => onChange({ ...filters, channel: e.target.value })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All">All Acquisition Channels</option>
            {CHANNELS.filter(c => c !== 'All').map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Customer Segment Selector */}
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.segment}
            onChange={(e) => onChange({ ...filters, segment: e.target.value })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All">All Customer Segments</option>
            {SEGMENTS.filter(s => s !== 'All').map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {isFiltered && (
        <button
          onClick={resetFilters}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 border border-blue-100 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Filters
        </button>
      )}
    </div>
  );
}
