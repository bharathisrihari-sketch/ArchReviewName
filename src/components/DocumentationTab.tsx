import React from 'react';
import {
  BookOpen,
  ArrowRight,
  Database,
  Network,
  Layers,
  GitBranch,
  Flame,
  BarChart2,
  Download,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  FileCode,
  CheckCircle2,
  Terminal,
  Binary,
  Code,
} from 'lucide-react';

interface DocumentationTabProps {
  onNavigateToTab: (
    tab: 'inventory' | 'graph' | 'model' | 'lineage' | 'impact' | 'benchmark' | 'export'
  ) => void;
  onLoadSampleSystem: () => void;
}

export const DocumentationTab: React.FC<DocumentationTabProps> = ({
  onNavigateToTab,
  onLoadSampleSystem,
}) => {
  const sections = [
    {
      id: 'ingestion',
      title: '1. Ingestion & Legacy Artifacts Input',
      badge: 'Input Phase',
      icon: <Terminal className="h-5 w-5 text-cyan-400" />,
      description:
        'Accepts legacy database DDL/DML (.sql), Airflow/dbt/Spark ETL jobs (.py), API definitions (.json), and configuration files (.txt). Also includes a built-in sample legacy enterprise estate with 25 tables, 12 ETL jobs, 8 reports, and 3 applications.',
      keyCapabilities: [
        'Multi-format file upload (.sql, .json, .py, .txt, .ddl)',
        'Built-in 48-artifact sample system representing real-world POS, CRM, ERP, and BI estates',
        'Direct paste syntax area with real-time character count',
      ],
      targetTab: 'inventory' as const,
      buttonText: 'Explore Artifacts & Inventory',
    },
    {
      id: 'extraction',
      title: '2. AI Extraction & Confidence Scoring',
      badge: 'Gemini 3.8 Flash',
      icon: <Sparkles className="h-5 w-5 text-indigo-400" />,
      description:
        'Uses server-side Gemini 3.8 Flash with structured JSON schemas to extract components and identify read/write dependencies. Strictly enforces a zero-fabrication rule, assigns a confidence score (0.0 to 1.0) to every edge, and marks any ambiguous legacy links as "needs review".',
      keyCapabilities: [
        'Component categorization: Tables, Views, ETL Jobs, Reports, and Applications',
        'Realistic confidence scoring based on explicit SQL foreign keys vs indirect queries',
        'Automatic "needs review" flags for unindexed replica queries and direct staging bypasses',
      ],
      targetTab: 'graph' as const,
      buttonText: 'View Dependency Graph',
    },
    {
      id: 'qubo',
      title: '3. QUBO Graph Partitioning & Solvers',
      badge: 'Optimization',
      icon: <Binary className="h-5 w-5 text-purple-400" />,
      description:
        'Groups components into decoupled modules by formulating graph partitioning as a Quadratic Unconstrained Binary Optimization (QUBO) problem. Minimizes cross-module coupling while penalizing module size imbalances.',
      keyCapabilities: [
        'QUBO Hamiltonian: H = H_cut + λ · H_balance',
        'Solver A: Classical Simulated Annealing with geometric cooling (runs in-browser)',
        'Solver B: Quantum-Inspired Annealing with transverse-field tunneling heuristics',
        'Solver Selector dropdown with disabled "Quantum hardware (not connected)" option',
      ],
      targetTab: 'benchmark' as const,
      buttonText: 'Open Solver Benchmark',
    },
    {
      id: 'inventory-section',
      title: '4. Inventory & Governance Debt Detection',
      badge: 'Catalog',
      icon: <Database className="h-5 w-5 text-sky-400" />,
      description:
        'Filterable component table that scans the recovered graph to identify technical debt, orphan assets, and redundant duplicate tables.',
      keyCapabilities: [
        'Type filtering (Tables, Jobs, Reports, Apps) and instant search',
        'Inbound and outbound link count badges',
        'Candidate Unused Flag: Highlights orphan tables with zero downstream consumers (e.g., raw_support_tickets)',
        'Candidate Duplicate Flag: Identifies stale replica copies (e.g., stg_legacy_order_backup)',
      ],
      targetTab: 'inventory' as const,
      buttonText: 'Inspect Inventory Table',
    },
    {
      id: 'graph-section',
      title: '5. Interactive Dependency Graph',
      badge: 'Topology',
      icon: <Network className="h-5 w-5 text-emerald-400" />,
      description:
        'Visualizes the entire dependency network on an interactive canvas where nodes are color-coded by their active QUBO module partition. Solid arrows denote verified links; dashed amber lines highlight "needs review" links.',
      keyCapabilities: [
        'Nodes color-coded by active module partition (Module 0 through Module 3)',
        'Interactive zoom, pan, search highlighting, and module filtering',
        'Inspector drawer displaying upstream readers, downstream writers, and recovered code snippets',
      ],
      targetTab: 'graph' as const,
      buttonText: 'Launch Graph Canvas',
    },
    {
      id: 'model-section',
      title: '6. Architecture Model (As-Is vs. To-Be)',
      badge: 'Target Design',
      icon: <Layers className="h-5 w-5 text-amber-400" />,
      description:
        'Provides side-by-side architecture views comparing the current unmanaged legacy spaghetti against a modern, governed 5-layer target architecture with suggested Domain Service Boundaries.',
      keyCapabilities: [
        'Proposed 5-Layer Stack: Ingestion Lake ➔ Staging ➔ Curated Marts ➔ BI Semantic Views ➔ Applications',
        '4 Domain Service Boundaries: Customer 360, Commerce & Revenue, Supply Chain, and BI Hub',
        'Clear architectural rationale and legacy anti-pattern remediation guidance',
      ],
      targetTab: 'model' as const,
      buttonText: 'View Architecture Models',
    },
    {
      id: 'lineage-section',
      title: '7. Backward Data Lineage & Root Cause',
      badge: 'Traceability',
      icon: <GitBranch className="h-5 w-5 text-teal-400" />,
      description:
        'Enables selecting any executive report or dashboard to trace its upstream dependency chain backward through intermediate marts and cleansing jobs to root source tables.',
      keyCapabilities: [
        'Report dropdown with all 8 estate reports',
        'Hop-by-hop topological flow chart (Sources ➔ Staging ➔ Curated ➔ Report)',
        'Audits critical path confidence and highlights unverified bypasses on the lineage path',
      ],
      targetTab: 'lineage' as const,
      buttonText: 'Trace Data Lineage',
    },
    {
      id: 'impact-section',
      title: '8. Downstream Impact Analysis (Blast Radius)',
      badge: 'Risk Analysis',
      icon: <Flame className="h-5 w-5 text-rose-400" />,
      description:
        'Simulates dropping or altering any table to calculate the exact downstream blast radius, showing cascading failures across ETL jobs, data marts, reports, and applications.',
      keyCapabilities: [
        'Interactive table deletion simulator with risk scoring (Critical, Moderate, Low, Safe)',
        'Hop-by-hop failure propagation timeline (Hop 1 direct readers ➔ Hop 2 marts ➔ Hop 3 dashboards)',
        'Validates safe retirement for orphan and duplicate tables (0 broken dependencies)',
        'Generates an actionable Pre-Deletion Remediation Protocol',
      ],
      targetTab: 'impact' as const,
      buttonText: 'Simulate Blast Radius',
    },
    {
      id: 'benchmark-section',
      title: '9. Solver Benchmark & Honest Comparison',
      badge: 'Performance',
      icon: <BarChart2 className="h-5 w-5 text-violet-400" />,
      description:
        'Head-to-head empirical comparison of Classical Simulated Annealing vs Quantum-Inspired Tunneling Annealing on the exact same graph.',
      keyCapabilities: [
        'Real measured execution times in milliseconds via performance.now()',
        'QUBO energy cost, Newman-Girvan Modularity Q, and cross-module cut counts',
        'Real-time SVG energy descent trajectory curve over iterations',
        'Honest scientific disclosure: No false claims of quantum advantage on sparse graphs',
      ],
      targetTab: 'benchmark' as const,
      buttonText: 'Run Solvers Benchmark',
    },
    {
      id: 'export-section',
      title: '10. Diagram & PDF Export Engine',
      badge: 'Deliverable',
      icon: <Download className="h-5 w-5 text-cyan-400" />,
      description:
        'Converts text specifications into publication-quality visual diagrams and exports full multi-page executive PDF reports, vector PNG images, Mermaid code, and JSON schemas.',
      keyCapabilities: [
        'Convert Text/Mermaid definitions into a live visual vector diagram on screen',
        'Executive 2-page PDF report generation with metadata, metrics, and embedded diagram',
        'Mermaid (.mmd) and JSON (.json) schema downloads with copy-to-clipboard',
      ],
      targetTab: 'export' as const,
      buttonText: 'Export Diagram to PDF',
    },
  ];

  return (
    <div className="space-y-8 text-zinc-100">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-indigo-950/40 p-8 border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            System Architecture Recovery Engine
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-3">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">QuantumLens</span>
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            QuantumLens reverse-engineers legacy data systems into modern, governed architecture models.
            Given SQL scripts, ETL DAGs, and code snippets, it extracts components, discovers dependencies with confidence scoring,
            solves modular partitioning via QUBO annealing, and simulates forward downstream impact.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToTab('inventory')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <span>Start with Functional Recovery</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onLoadSampleSystem}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
            >
              <Database className="h-4 w-4 text-cyan-400" />
              <span>Load 48-Artifact Sample System</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visible Governance Advisory */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <strong className="text-amber-300 font-bold block mb-0.5">
            Architectural Governance Standard:
          </strong>
          QuantumLens strictly enforces a zero-hallucination constraint. Components and dependencies are only extracted if explicitly present or directly implied by code syntax. All AI-generated architecture models need expert human review before implementation.
        </div>
      </div>

      {/* Section Explanations with Direct Conversion Buttons */}
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              <span>Architecture Recovery Modules & Documentation</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Detailed breakdown of each functional capability with one-click conversion to the live workspace.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sections.map((sec) => (
            <div
              key={sec.id}
              className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900 transition-all shadow-sm flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/60">
                      {sec.icon}
                    </div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      {sec.badge}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                  {sec.title}
                </h3>

                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  {sec.description}
                </p>

                <div className="space-y-1.5 mb-5 text-[11px] text-zinc-300 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/70">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block mb-1">
                    Key Features:
                  </span>
                  {sec.keyCapabilities.map((cap, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversion Action Button */}
              <button
                onClick={() => onNavigateToTab(sec.targetTab)}
                className="w-full py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-indigo-600 hover:text-white text-zinc-200 text-xs font-semibold border border-zinc-700/80 hover:border-indigo-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>{sec.buttonText}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
