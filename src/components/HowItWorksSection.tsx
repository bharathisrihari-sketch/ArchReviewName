import React from 'react';
import { UploadCloud, BrainCircuit, Binary, Network, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface HowItWorksSectionProps {
  onDismiss?: () => void;
  isDismissible?: boolean;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onDismiss, isDismissible = false }) => {
  const steps = [
    {
      num: '1',
      title: 'Ingest Legacy Artifacts',
      desc: 'Input SQL DDL/DML, ETL DAG scripts (Airflow, dbt, Spark), API specs, or upload files (.sql, .json, .py, .txt).',
      icon: <UploadCloud className="h-5 w-5 text-sky-600" />,
      color: 'bg-sky-50 border-sky-200',
    },
    {
      num: '2',
      title: 'AI Component & Link Discovery',
      desc: 'Gemini extracts tables, views, ETL jobs, reports, and apps with confidence scores (0-100%). Ambiguous links are flagged "needs review".',
      icon: <BrainCircuit className="h-5 w-5 text-indigo-600" />,
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      num: '3',
      title: 'QUBO Modular Graph Partitioning',
      desc: 'Formulates graph partitioning as a Quadratic Unconstrained Binary Optimization problem to minimize cross-module coupling while balancing module sizes.',
      icon: <Binary className="h-5 w-5 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200',
    },
    {
      num: '4',
      title: 'Target Architecture & Lineage',
      desc: 'Synthesizes clean 5-layer target architectures, domain service boundaries, and full backward lineage from any report to raw source tables.',
      icon: <Network className="h-5 w-5 text-teal-600" />,
      color: 'bg-teal-50 border-teal-200',
    },
  ];

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>How QuantumLens Works</span>
            <span className="text-xs font-normal px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Architecture Recovery Pipeline
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end workflow for reverse-engineering legacy data estates into clean, governed architecture models
          </p>
        </div>
        {isDismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100"
          >
            Hide guide
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((step, idx) => (
          <div
            key={step.num}
            className={`p-3.5 rounded-lg border ${step.color} flex flex-col justify-between relative group hover:shadow-xs transition-shadow`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="h-7 w-7 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-800">
                  {step.num}
                </span>
                <div className="p-1.5 rounded-md bg-white/80">{step.icon}</div>
              </div>
              <h3 className="text-xs font-bold text-slate-800 mb-1">{step.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
            {idx < 3 && (
              <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-amber-800 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="font-semibold">Important Rule:</span>
          <span>Never fabricate components or links. All discovered entities match actual artifacts; AI-generated models need expert review.</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Confidence Scoring
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Zero Hallucinations
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> QUBO Graph Optimization
          </span>
        </div>
      </div>
    </section>
  );
};
