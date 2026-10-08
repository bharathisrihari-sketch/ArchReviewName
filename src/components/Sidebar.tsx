import React from 'react';
import {
  BookOpen,
  Terminal,
  Table2,
  Network,
  Layers,
  GitBranch,
  Flame,
  BarChart2,
  Download,
  Cpu,
  Database,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { SolverType } from './Header';

export type TabType =
  | 'docs'
  | 'input'
  | 'inventory'
  | 'graph'
  | 'model'
  | 'lineage'
  | 'impact'
  | 'benchmark'
  | 'export';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentSolver: SolverType;
  onSelectSolver: (solver: SolverType) => void;
  componentCount: number;
  dependencyCount: number;
  onLoadSampleSystem: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentSolver,
  onSelectSolver,
  componentCount,
  dependencyCount,
  onLoadSampleSystem,
}) => {
  const navItems: {
    id: TabType;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'docs',
      label: 'Documentation & Guide',
      icon: <BookOpen className="h-4 w-4" />,
      badge: 'Start Here',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'input',
      label: 'Ingestion & Artifacts',
      icon: <Terminal className="h-4 w-4" />,
    },
    {
      id: 'inventory',
      label: 'Component Inventory',
      icon: <Table2 className="h-4 w-4" />,
      badge: `${componentCount}`,
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    },
    {
      id: 'graph',
      label: 'Dependency Graph',
      icon: <Network className="h-4 w-4" />,
      badge: `${dependencyCount}`,
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    },
    {
      id: 'model',
      label: 'Architecture Model',
      icon: <Layers className="h-4 w-4" />,
    },
    {
      id: 'lineage',
      label: 'Data Flow & Lineage',
      icon: <GitBranch className="h-4 w-4" />,
    },
    {
      id: 'impact',
      label: 'Impact Analysis',
      icon: <Flame className="h-4 w-4 text-rose-400" />,
      badge: 'Blast Radius',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'benchmark',
      label: 'Solver Benchmark',
      icon: <BarChart2 className="h-4 w-4" />,
    },
    {
      id: 'export',
      label: 'Diagram & PDF Export',
      icon: <Download className="h-4 w-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-zinc-800/80">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Layers className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-white text-base tracking-tight">
                  QuantumLens
                </span>
              </div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Architecture Recovery
              </span>
            </div>
          </div>
        </div>

        {/* Solver Selector Section inside Sidebar */}
        <div className="p-3 border-b border-zinc-800/60 bg-zinc-900/40">
          <label
            htmlFor="sidebar-solver"
            className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1 mb-1.5"
          >
            <Cpu className="h-3 w-3 text-indigo-400" />
            QUBO Solver Engine
          </label>
          <select
            id="sidebar-solver"
            value={currentSolver}
            onChange={(e) => onSelectSolver(e.target.value as SolverType)}
            className="w-full bg-zinc-900 text-zinc-200 text-xs font-medium border border-zinc-700/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="classical">Solver A: Classical SA (Browser)</option>
            <option value="quantum-inspired">Solver B: Quantum-Inspired QIA</option>
            <option value="quantum-hardware" disabled className="text-zinc-500 bg-zinc-950">
              Quantum hardware (not connected)
            </option>
          </select>
        </div>

        {/* Vertical Navigation Links */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/20 text-white border border-indigo-500/40 shadow-xs font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className={isActive ? 'text-indigo-400' : 'text-zinc-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-sans border font-semibold ${
                      item.badgeColor || 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Stats & Actions */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/30 space-y-2.5">
        <button
          onClick={onLoadSampleSystem}
          className="w-full py-2 px-3 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Database className="h-3.5 w-3.5 text-cyan-400" />
          <span>Load 48-Artifact Estate</span>
        </button>

        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300/90 leading-tight flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>Notice: AI-generated models need expert review.</span>
        </div>
      </div>
    </aside>
  );
};
