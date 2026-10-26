'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Trash2,
  GitMerge,
  PieChart,
  Lightbulb,
  FlaskConical
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
  linkLabel: string;
  icon: any;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'critical',
    title: 'PAR30 Delinquency Guardrail Warning',
    message: 'Cohort 2026-M03 reached 3.8% PAR30, approaching the 4.0% risk committee limit.',
    time: '12m ago',
    read: false,
    link: '/portfolio',
    linkLabel: 'Inspect Loan Book',
    icon: PieChart
  },
  {
    id: 'notif-2',
    type: 'warning',
    title: 'Aggregator KYC Drop-off Elevated',
    message: 'Drop-off at KYC step spiked to 26.4% (+4.2% vs organic). Document verification latency identified as friction driver.',
    time: '45m ago',
    read: false,
    link: '/customer-journey',
    linkLabel: 'Diagnose Drop-offs',
    icon: GitMerge
  },
  {
    id: 'notif-3',
    type: 'success',
    title: 'A/B Experiment Telemetry Available',
    message: 'Instant KYC Verification test reached statistical significance with +18.4% observed conversion lift.',
    time: '2h ago',
    read: false,
    link: '/experiments',
    linkLabel: 'View Results',
    icon: Lightbulb
  },
  {
    id: 'notif-4',
    type: 'info',
    title: 'Strategy Lab Simulation Ready',
    message: 'Automated KYC v2 simulation completed. Projected net contribution increase of ₹12.4 Lakhs.',
    time: '4h ago',
    read: true,
    link: '/strategy-lab?view=comparison',
    linkLabel: 'Compare Scenarios',
    icon: FlaskConical
  }
];

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  onUnreadCountChange
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute right-0 top-12 w-96 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-900">Portfolio & Risk Alerts</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              title="Mark all as read"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-slate-400 hover:text-rose-600 p-1 rounded"
              title="Clear all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {notifications.length > 0 ? (
          notifications.map((item) => {
            const Icon = item.icon;
            const borderColors = {
              critical: 'border-l-rose-500 bg-rose-50/30',
              warning: 'border-l-amber-500 bg-amber-50/30',
              success: 'border-l-emerald-500 bg-emerald-50/30',
              info: 'border-l-indigo-500 bg-indigo-50/30'
            };

            const iconColors = {
              critical: 'text-rose-600 bg-rose-100',
              warning: 'text-amber-600 bg-amber-100',
              success: 'text-emerald-600 bg-emerald-100',
              info: 'text-indigo-600 bg-indigo-100'
            };

            return (
              <div 
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`p-3.5 border-l-4 transition-colors hover:bg-slate-50 cursor-pointer ${
                  !item.read ? borderColors[item.type] : 'border-l-transparent bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${iconColors[item.type]}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-xs font-bold truncate ${!item.read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {item.time}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-2">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={item.link}
                        onClick={() => {
                          markAsRead(item.id);
                          onClose();
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
                      >
                        <span>{item.linkLabel}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
            <p className="font-semibold text-slate-700">All alerts resolved</p>
            <p className="mt-0.5 text-slate-400">Your portfolio is operating within healthy guardrails.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 text-center">
        <span className="text-[10px] text-slate-500 font-mono">
          Thresholds: PAR30 &lt; 4.0% • KYC TAT &lt; 15m
        </span>
      </div>
    </div>
  );
}
