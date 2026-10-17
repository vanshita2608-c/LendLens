'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  GitMerge, 
  ShieldCheck, 
  PieChart, 
  FlaskConical, 
  Sparkles, 
  Lightbulb, 
  Settings,
  Layers
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Executive Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customer Journey', href: '/customer-journey', icon: GitMerge },
  { name: 'Credit Intelligence', href: '/credit-intelligence', icon: ShieldCheck },
  { name: 'Portfolio Analytics', href: '/portfolio', icon: PieChart },
  { 
    name: 'Strategy Lab', 
    href: '/strategy-lab', 
    icon: FlaskConical,
    badge: 'Core'
  },
  { name: 'AI Product Copilot', href: '/copilot', icon: Sparkles },
  { name: 'Product Experiments', href: '/experiments', icon: Lightbulb },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 z-40 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
            LendLens
            <span className="text-[10px] uppercase font-semibold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
              v1.0
            </span>
          </span>
          <p className="text-[11px] text-slate-400 font-medium leading-none">Product Intelligence</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Decision Intelligence
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-white/20 text-white' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Environment Indicator */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-300">Live Backend Connected</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Synthetic Lending Cohort • 10,000 Apps
        </p>
      </div>
    </aside>
  );
}
