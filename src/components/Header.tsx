import React from 'react';
import { Cpu, Layers, Sparkles, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export type SolverType = 'classical' | 'quantum-inspired';

interface HeaderProps {
  currentSolver: SolverType;
  onSelectSolver: (solver: SolverType) => void;
  componentCount: number;
  dependencyCount: number;
  onOpenHowItWorks: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSolver,
  onSelectSolver,
  componentCount,
  dependencyCount,
  onOpenHowItWorks,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
              <Layers className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  QuantumLens
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Architecture Recovery
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Automated Reverse Engineering & QUBO Modular Partitioning
              </p>
            </div>
          </div>

          {/* Center / Solver Selector & Help */}
          <div className="flex items-center space-x-4">
            {/* Solver Selector Dropdown */}
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <label htmlFor="solver-select" className="text-xs font-medium text-slate-600 hidden md:flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-indigo-600" />
                Partition Solver:
              </label>
              <select
                id="solver-select"
                value={currentSolver}
                onChange={(e) => onSelectSolver(e.target.value as SolverType)}
                className="bg-white text-xs font-medium text-slate-800 border border-slate-300 rounded-md px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
              >
                <option value="classical">Solver A: Classical Simulated Annealing (SA)</option>
                <option value="quantum-inspired">Solver B: Quantum-Inspired Annealing (QIA)</option>
                <option value="quantum-hardware" disabled className="text-slate-400 bg-slate-100">
                  Quantum hardware (not connected)
                </option>
              </select>
            </div>

            {/* How it works Button */}
            <button
              onClick={onOpenHowItWorks}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              How it works
            </button>
          </div>
        </div>

        {/* Global Visible Quality Notice */}
        <div className="py-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2 text-amber-700 bg-amber-50/80 px-2.5 py-0.5 rounded border border-amber-200/70">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold">Notice:</span>
            <span>AI-generated models need expert review.</span>
          </div>
          <div className="hidden sm:flex items-center space-x-4 text-slate-500 text-xs">
            <span>Discovered: <strong className="text-slate-800">{componentCount}</strong> components</span>
            <span>•</span>
            <span>Dependencies: <strong className="text-slate-800">{dependencyCount}</strong> edges</span>
            <span>•</span>
            <span className="flex items-center text-emerald-700 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              QUBO Partitioning Active
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
