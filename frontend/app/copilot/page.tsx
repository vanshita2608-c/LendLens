'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  HelpCircle,
  FlaskConical,
  Compass,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { queryCopilot, getExperimentSuggestions } from '@/lib/api';

const QUERY_TEMPLATES = [
  'Where are customers abandoning the loan journey?',
  'Which acquisition channels have the lowest conversion rates?',
  'What are the limitations of our credit-risk model?',
  'What is our current portfolio delinquency and PAR30 status?',
  'Suggest an experiment to improve KYC completion.'
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text?: string;
  response?: any;
  experiment?: any;
  timestamp: string;
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: "Hello! I am the LendLens Product Intelligence Copilot. I can analyze application funnels, evaluate customer acquisition costs, explain credit risk models, and generate product experiment proposals based on real data.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      if (query.toLowerCase().includes('suggest an experiment') || query.toLowerCase().includes('experiment proposal')) {
        const expData = await getExperimentSuggestions('KYC Completed');
        const copilotMsg: ChatMessage = {
          id: `copilot-${Date.now()}`,
          sender: 'copilot',
          experiment: expData,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, copilotMsg]);
      } else {
        const res = await queryCopilot(query);
        const copilotMsg: ChatMessage = {
          id: `copilot-${Date.now()}`,
          sender: 'copilot',
          response: res,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, copilotMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'copilot',
        text: `Error analyzing request: ${err.message || 'Unable to execute query.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Module 06
            </span>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Controlled Tools Layer Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-600" />
            AI Product Copilot
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Natural language decision support grounded in live application funnels, credit models, and loan portfolio metrics.
          </p>
        </div>

        <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Zero Hallucination / No Arbitrary SQL</span>
        </div>
      </div>

      {/* Suggested Query Chips */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Example Inquiries:</span>
        <div className="flex flex-wrap gap-2">
          {QUERY_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(tmpl)}
              disabled={loading}
              className="text-xs py-1.5 px-3 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg text-slate-700 font-medium transition-all text-left shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>{tmpl}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'copilot' && (
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm p-4 text-sm' : 'space-y-4 w-full'}`}>
              {/* Simple Text Message */}
              {msg.text && (
                <div className={msg.sender === 'user' ? '' : 'bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800'}>
                  {msg.text}
                </div>
              )}

              {/* Structured AI Response Card */}
              {msg.response && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-sm">
                  {/* Direct Answer */}
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block mb-1">
                      Direct Executive Answer:
                    </span>
                    <p className="text-slate-900 font-medium leading-relaxed">
                      {msg.response.direct_answer}
                    </p>
                  </div>

                  {/* Supporting Metrics Summary */}
                  {msg.response.supporting_metrics && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Ground-Truth Measured Metrics:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {Object.entries(msg.response.supporting_metrics)
                          .filter(([_, val]) => typeof val !== 'object')
                          .map(([key, val], idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                              <div className="text-slate-400 font-mono capitalize truncate">{key.replace(/_/g, ' ')}</div>
                              <div className="text-sm font-bold text-slate-900 mt-0.5">{String(val)}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* APM Deep Interpretation */}
                  {msg.response.apm_interpretation && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-indigo-600" />
                        Associate Product Manager (APM) Strategic Interpretation:
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {msg.response.apm_interpretation}
                      </p>
                    </div>
                  )}

                  {/* Caveats & Next Step */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100">
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{msg.response.limitations}</span>
                    </div>

                    {msg.response.recommended_next_step && (
                      <div className="text-indigo-700 font-semibold bg-indigo-50 px-3 py-1 rounded-md border border-indigo-200 flex items-center gap-1 shrink-0">
                        <span>Action:</span> {msg.response.recommended_next_step}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Experiment Suggestion Card */}
              {msg.experiment && (
                <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm space-y-4 text-sm">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-5 h-5 text-indigo-600" />
                      <div>
                        <span className="font-bold text-slate-900">{msg.experiment.experiment_name}</span>
                        <div className="text-xs text-indigo-600 font-semibold">{msg.experiment.status}</div>
                      </div>
                    </div>
                    <Link
                      href="/experiments"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-slate-700">Hypothesis: </strong>
                      <span className="text-slate-600">{msg.experiment.hypothesis}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <strong className="text-slate-700 block mb-0.5">Control (A):</strong>
                        <span className="text-slate-600">{msg.experiment.control_group}</span>
                      </div>
                      <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
                        <strong className="text-indigo-900 block mb-0.5">Treatment (B):</strong>
                        <span className="text-indigo-800">{msg.experiment.treatment_group}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <strong className="text-slate-700 block mb-1">Guardrail Metrics:</strong>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.experiment.guardrail_metrics.map((g: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[11px] font-mono">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-[10px] text-slate-400 mt-1 px-1">
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <span>Executing parameterized analytics services and evaluating evidence...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about funnel drop-offs, CAC by channel, credit model recall, or portfolio delinquency..."
          className="flex-1 px-4 py-2.5 text-sm border-none focus:outline-none"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputText.trim()}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-sm transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
