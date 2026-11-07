import React, { useState } from 'react';
import {
  Atom,
  FileSpreadsheet,
  FileText,
  Mail,
  Calendar,
  CheckSquare,
  HardDrive,
  Presentation,
  Users,
  X,
  ExternalLink,
  Check,
  Sparkles,
} from 'lucide-react';

interface WorkspaceScienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendPrompt: (prompt: string) => void;
}

export function WorkspaceScienceModal({ isOpen, onClose, onSendPrompt }: WorkspaceScienceModalProps) {
  if (!isOpen) return null;

  const scienceTopics = [
    {
      title: 'Quantum & Particle Physics',
      prompt: 'Explain the principle of wave-particle duality and Heisenberg uncertainty in simple terms with math equations.',
    },
    {
      title: 'Biochemistry & Molecular Pathways',
      prompt: 'Describe the Krebs citric acid cycle and ATP yield calculation in cellular respiration.',
    },
    {
      title: 'Optical Science & Lens Physics',
      prompt: 'Explain focal length, chromatic aberration, and anamorphic lens distortion in camera optics.',
    },
  ];

  const workspaceTools = [
    {
      name: 'Google Sheets',
      icon: FileSpreadsheet,
      desc: 'Formulas, automated script generation, video production budgeting.',
      prompt: 'Generate an automated Google Sheets script for tracking YouTube video production budgets, rendering time, and CPM analytics.',
    },
    {
      name: 'Google Docs',
      icon: FileText,
      desc: 'Cinematic script formatting and teleprompter drafts.',
      prompt: 'Format a professional Hollywood two-column screenplay document in Google Docs format.',
    },
    {
      name: 'Google Calendar & Tasks',
      icon: Calendar,
      desc: 'YouTube upload schedules and editing sprints.',
      prompt: 'Create a weekly YouTube video production calendar with filming, rough-cut, sound design, and publishing deadlines.',
    },
    {
      name: 'Gmail & Brand Sponsorships',
      icon: Mail,
      desc: 'Professional creator outreach and collaboration emails.',
      prompt: 'Write a professional sponsorship pitch email from a video creator to a camera gear sponsor highlighting channel stats.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 liquid-glass-modal-backdrop animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl liquid-glass-modal-container p-6 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="liquid-glass-modal-glare" />
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Atom className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-white text-base">Science & Workspace Intelligence</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs font-bold p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-1 overflow-y-auto space-y-5 my-3 text-xs">
          {/* Science Section */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-teal-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Atom className="w-4 h-4" />
              <span>Science & Scientific Reasoning</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {scienceTopics.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSendPrompt(item.prompt);
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition space-y-1"
                >
                  <p className="font-bold text-white">{item.title}</p>
                  <p className="text-[10px] text-slate-400 line-clamp-2">{item.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Workspace Section */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Google Workspace Workflows</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {workspaceTools.map((tool, idx) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onSendPrompt(tool.prompt);
                      onClose();
                    }}
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-start gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">{tool.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{tool.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
