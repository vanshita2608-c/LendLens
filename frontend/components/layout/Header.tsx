'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, HelpCircle } from 'lucide-react';
import ApmGuideModal from '@/components/ui/ApmGuideModal';
import NotificationDropdown from '@/components/ui/NotificationDropdown';

const TITLE_MAP: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Executive Overview',
    subtitle: 'High-level lending portfolio performance and end-to-end conversion health.'
  },
  '/customer-journey': {
    title: 'Customer Journey & Funnel Intelligence',
    subtitle: 'Step-by-step conversion tracking, drop-off diagnostics, and processing duration.'
  },
  '/credit-intelligence': {
    title: 'Credit Intelligence & Risk Modelling',
    subtitle: 'Probability of default (PD) predictions, SHAP explainability, and fairness diagnostics.'
  },
  '/portfolio': {
    title: 'Lending Portfolio Analytics',
    subtitle: 'Active loan book health, PAR30/60/90 delinquency aging, and vintage repayment curves.'
  },
  '/strategy-lab': {
    title: 'Strategy Lab — Decision Simulator',
    subtitle: 'Simulate hypothetical product interventions, risk cutoffs, and downstream unit economics.'
  },
  '/copilot': {
    title: 'AI Product Copilot',
    subtitle: 'Controlled product intelligence assistant with deterministic fallback operations.'
  },
  '/experiments': {
    title: 'Product Experiments & Prioritization',
    subtitle: 'Manage hypothesis lifecycle, evaluate A/B metrics, and rank by RICE priority score.'
  },
  '/settings': {
    title: 'Platform Settings',
    subtitle: 'Data pipeline configuration, environment variables, and system connection health.'
  }
};

export default function Header() {
  const pathname = usePathname();
  const [guideOpen, setGuideOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const current = TITLE_MAP[pathname] || {
    title: 'Digital Lending Platform',
    subtitle: 'Turning lending data into smarter product decisions.'
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-base font-semibold text-slate-900 tracking-tight leading-tight">
          {current.title}
        </h1>
        <p className="text-xs text-slate-500 leading-none mt-0.5">
          {current.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3 relative">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>PostgreSQL / SQLite Production Mirror</span>
        </div>

        {/* APM Playbook & Documentation Modal Trigger */}
        <button 
          onClick={() => {
            setGuideOpen(true);
            setNotifsOpen(false);
          }}
          className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${
            guideOpen 
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title="Product Guide & APM Playbook"
          aria-label="Open APM Playbook"
        >
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <span className="hidden sm:inline">Playbook</span>
        </button>

        {/* Notification Center Trigger */}
        <div className="relative">
          <button 
            onClick={() => setNotifsOpen(!notifsOpen)}
            className={`p-2 rounded-lg transition-colors relative ${
              notifsOpen 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title="Portfolio & Risk Notifications"
            aria-label="Toggle notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-2 h-2 bg-indigo-600 rounded-full absolute top-1.5 right-1.5 animate-pulse" />
            )}
          </button>

          {/* Notification Dropdown Component */}
          <NotificationDropdown
            isOpen={notifsOpen}
            onClose={() => setNotifsOpen(false)}
            onUnreadCountChange={setUnreadCount}
          />
        </div>
      </div>

      {/* APM Guide Modal Component */}
      <ApmGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </header>
  );
}
