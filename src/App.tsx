import React, { useState, useMemo } from 'react';
import { ArchitectureModel, Component, Dependency } from './types/architecture';
import {
  SAMPLE_COMPONENTS,
  SAMPLE_DEPENDENCIES,
  SAMPLE_TARGET_LAYERS,
  SAMPLE_SERVICE_BOUNDARIES,
  RAW_SAMPLE_SCRIPT_TEXT,
} from './data/sampleSystem';
import {
  buildQUBOProblem,
  runClassicalSimulatedAnnealing,
  runQuantumInspiredAnnealing,
} from './services/quboSolvers';
import { Sidebar, TabType } from './components/Sidebar';
import { SolverType } from './components/Header';
import { DocumentationTab } from './components/DocumentationTab';
import { InputPanel } from './components/InputPanel';
import { InventoryTab } from './components/InventoryTab';
import { DependencyGraphTab } from './components/DependencyGraphTab';
import { ArchitectureModelTab } from './components/ArchitectureModelTab';
import { LineageTab } from './components/LineageTab';
import { ImpactAnalysisView } from './components/ImpactAnalysisView';
import { BenchmarkTab } from './components/BenchmarkTab';
import { ExportTab } from './components/ExportTab';
import {
  Layers,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Sparkles,
  Database,
  ArrowRight,
  RefreshCw,
  Terminal,
} from 'lucide-react';

export default function App() {
  // Primary Architecture Model State
  const [model, setModel] = useState<ArchitectureModel>({
    name: 'Sample Legacy Retail Data Estate',
    description: 'Reverse-engineered enterprise data estate with POS, CRM, ERP, and BI dependencies',
    extractedAt: new Date().toISOString(),
    components: SAMPLE_COMPONENTS,
    dependencies: SAMPLE_DEPENDENCIES,
    targetLayers: SAMPLE_TARGET_LAYERS,
    serviceBoundaries: SAMPLE_SERVICE_BOUNDARIES,
  });

  // Input Text State
  const [inputArtifacts, setInputArtifacts] = useState<string>(RAW_SAMPLE_SCRIPT_TEXT);

  // Active Output Tab (Sidebar Navigation)
  const [activeTab, setActiveTab] = useState<TabType>('docs');

  // Active QUBO Solver
  const [currentSolver, setCurrentSolver] = useState<SolverType>('classical');

  // Loading & Error States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Selected Report for Lineage Drilldown
  const [lineageSelectedReportId, setLineageSelectedReportId] = useState<string>(
    'rpt_executive_kpi_dashboard'
  );

  // Selected Table for Deletion Impact Analysis
  const [impactSelectedTableId, setImpactSelectedTableId] = useState<string>(
    'raw_customers_cdc'
  );

  // Compute Active QUBO Module Partitions based on selected solver
  const moduleAssignments = useMemo<Record<string, number>>(() => {
    const numModules = 4;
    const problem = buildQUBOProblem(model.components, model.dependencies, numModules);
    if (currentSolver === 'quantum-inspired') {
      const qiaResult = runQuantumInspiredAnnealing(problem, 2000);
      return qiaResult.partitions;
    } else {
      const saResult = runClassicalSimulatedAnnealing(problem, 2000);
      return saResult.partitions;
    }
  }, [model.components, model.dependencies, currentSolver]);

  // Load Built-in Sample System
  const handleLoadSample = () => {
    setInputArtifacts(RAW_SAMPLE_SCRIPT_TEXT);
    setModel({
      name: 'Sample Legacy Retail Data Estate',
      description: 'Reverse-engineered enterprise data estate with POS, CRM, ERP, and BI dependencies',
      extractedAt: new Date().toISOString(),
      components: SAMPLE_COMPONENTS,
      dependencies: SAMPLE_DEPENDENCIES,
      targetLayers: SAMPLE_TARGET_LAYERS,
      serviceBoundaries: SAMPLE_SERVICE_BOUNDARIES,
    });
    setErrorMessage('');
    setStatusMessage('Loaded sample legacy estate: 25 tables, 12 ETL jobs, 8 reports, and 3 apps.');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  // Analyze Custom System Artifacts with Gemini API
  const handleAnalyzeSystem = async (content: string) => {
    if (!content.trim()) {
      setErrorMessage('Please provide system artifacts before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    setStatusMessage('Analyzing artifacts with Gemini 3.8 Flash (extracting components and dependencies)...');
    setErrorMessage('');

    try {
      const res = await fetch('/api/recover-architecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          systemName: 'Recovered Data Estate',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server error occurred during architecture recovery.');
      }

      if (data.components && Array.isArray(data.components) && data.components.length > 0) {
        setModel({
          name: data.name || 'Recovered Data Estate',
          description: data.description || 'Discovered components and dependencies',
          extractedAt: new Date().toISOString(),
          components: data.components,
          dependencies: data.dependencies || [],
          serviceBoundaries: data.serviceBoundaries || SAMPLE_SERVICE_BOUNDARIES,
          targetLayers: SAMPLE_TARGET_LAYERS,
        });

        setStatusMessage(
          `Successfully recovered ${data.components.length} components and ${(data.dependencies || []).length} dependencies!`
        );
        setTimeout(() => setStatusMessage(''), 5000);
        setActiveTab('inventory');
      } else {
        throw new Error('Gemini could not identify valid system components in the provided text.');
      }
    } catch (err: any) {
      console.warn('API error, providing helpful feedback:', err);
      setErrorMessage(
        err.message || 'Failed to call Gemini API. Using fallback offline parser for your SQL input.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectComponentForLineage = (comp: Component) => {
    setLineageSelectedReportId(comp.id);
    setActiveTab('lineage');
  };

  const handleSelectComponentForImpact = (comp: Component) => {
    setImpactSelectedTableId(comp.id);
    setActiveTab('impact');
  };

  const getTabTitle = (tab: TabType) => {
    switch (tab) {
      case 'docs':
        return 'System Documentation & Architectural Guide';
      case 'input':
        return 'Legacy System Ingestion & Code Upload';
      case 'inventory':
        return 'Component Inventory & Debt Catalog';
      case 'graph':
        return 'Dependency Topology & QUBO Graph Partitioning';
      case 'model':
        return 'Architecture Model: As-Is vs To-Be Target';
      case 'lineage':
        return 'Backward Data Lineage & Root Cause Trace';
      case 'impact':
        return 'Downstream Impact Analysis & Blast Radius Simulator';
      case 'benchmark':
        return 'QUBO Solvers Benchmark & Empirical Energy Descent';
      case 'export':
        return 'Visual Diagram & Executive PDF Export Engine';
      default:
        return 'QuantumLens Workspace';
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-row font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sleek Dark Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentSolver={currentSolver}
        onSelectSolver={setCurrentSolver}
        componentCount={model.components.length}
        dependencyCount={model.dependencies.length}
        onLoadSampleSystem={handleLoadSample}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-black">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-indigo-400 font-mono text-xs font-normal">/</span>
              <span>{getTabTitle(activeTab)}</span>
            </h1>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            {/* Live Metrics */}
            <div className="hidden md:flex items-center space-x-3 text-zinc-400 text-xs">
              <span>
                Estate: <strong className="text-white font-mono">{model.components.length}</strong> components
              </span>
              <span>•</span>
              <span>
                Edges: <strong className="text-white font-mono">{model.dependencies.length}</strong> links
              </span>
              <span>•</span>
              <span className="text-indigo-400 font-semibold flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5" />
                {currentSolver === 'classical' ? 'Solver A (SA)' : 'Solver B (QIA)'}
              </span>
            </div>

            {/* Quick Action to switch to Ingestion */}
            {activeTab !== 'input' && (
              <button
                onClick={() => setActiveTab('input')}
                className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700/80 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Terminal className="h-3 w-3 text-cyan-400" />
                <span>Ingest Code</span>
              </button>
            )}
          </div>
        </header>

        {/* Tab Content Canvas */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Documentation Tab */}
          {activeTab === 'docs' && (
            <DocumentationTab
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onLoadSampleSystem={handleLoadSample}
            />
          )}

          {/* Ingestion & Artifacts Tab */}
          {activeTab === 'input' && (
            <div className="space-y-6">
              <InputPanel
                inputArtifacts={inputArtifacts}
                onInputChange={setInputArtifacts}
                onLoadSampleSystem={handleLoadSample}
                onAnalyzeSystem={handleAnalyzeSystem}
                isAnalyzing={isAnalyzing}
                statusMessage={statusMessage}
                errorMessage={errorMessage}
              />
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Ready to explore discovered artifacts?</h4>
                  <p className="text-xs text-zinc-400">View the cataloged components, deduplication candidates, and orphan tables.</p>
                </div>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Go to Inventory</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Component Inventory Tab */}
          {activeTab === 'inventory' && (
            <InventoryTab
              components={model.components}
              dependencies={model.dependencies}
              onSelectComponentForLineage={handleSelectComponentForLineage}
              onSelectComponentForImpact={handleSelectComponentForImpact}
            />
          )}

          {/* Dependency Graph Tab */}
          {activeTab === 'graph' && (
            <DependencyGraphTab
              components={model.components}
              dependencies={model.dependencies}
              moduleAssignments={moduleAssignments}
              numModules={4}
              onSelectComponentForLineage={handleSelectComponentForLineage}
              onSelectComponentForImpact={handleSelectComponentForImpact}
            />
          )}

          {/* Architecture Model Tab */}
          {activeTab === 'model' && (
            <ArchitectureModelTab
              components={model.components}
              dependencies={model.dependencies}
              targetLayers={model.targetLayers || SAMPLE_TARGET_LAYERS}
              serviceBoundaries={model.serviceBoundaries || SAMPLE_SERVICE_BOUNDARIES}
            />
          )}

          {/* Data Flow & Lineage Tab */}
          {activeTab === 'lineage' && (
            <LineageTab
              components={model.components}
              dependencies={model.dependencies}
              initialSelectedReportId={lineageSelectedReportId}
            />
          )}

          {/* Impact Analysis & Blast Radius Tab */}
          {activeTab === 'impact' && (
            <ImpactAnalysisView
              components={model.components}
              dependencies={model.dependencies}
              initialSelectedTableId={impactSelectedTableId}
              onNavigateToLineage={handleSelectComponentForLineage}
            />
          )}

          {/* QUBO Solver Benchmark Tab */}
          {activeTab === 'benchmark' && (
            <BenchmarkTab
              components={model.components}
              dependencies={model.dependencies}
              numModules={4}
            />
          )}

          {/* Diagram & PDF Export Tab */}
          {activeTab === 'export' && <ExportTab model={model} />}
        </main>

        {/* Bottom Status Footer */}
        <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 px-6 py-3 text-xs text-zinc-500 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>QuantumLens Engine Active</span>
            <span>•</span>
            <span>EchoFlow Black Workspace Mode</span>
          </div>
          <div className="text-[11px] text-zinc-500">
            AI-generated models need expert human review.
          </div>
        </footer>
      </div>
    </div>
  );
}
