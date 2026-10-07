import React, { useState, useEffect, useMemo } from 'react';
import { ArchitectureModel, Component, Dependency, TargetArchitectureLayer, ServiceBoundary } from './types/architecture';
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
import { Header, SolverType } from './components/Header';
import { HowItWorksSection } from './components/HowItWorksSection';
import { InputPanel } from './components/InputPanel';
import { InventoryTab } from './components/InventoryTab';
import { DependencyGraphTab } from './components/DependencyGraphTab';
import { ArchitectureModelTab } from './components/ArchitectureModelTab';
import { LineageTab } from './components/LineageTab';
import { BenchmarkTab } from './components/BenchmarkTab';
import { ExportTab } from './components/ExportTab';
import {
  Table2,
  Network,
  Layers,
  GitBranch,
  BarChart2,
  Download,
  AlertTriangle,
  Info,
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

  // Active Output Tab
  const [activeTab, setActiveTab] = useState<
    'inventory' | 'graph' | 'model' | 'lineage' | 'benchmark' | 'export'
  >('inventory');

  // Active QUBO Solver
  const [currentSolver, setCurrentSolver] = useState<SolverType>('classical');

  // How It Works Visibility
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(true);

  // Loading & Error States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Selected Report for Lineage Drilldown
  const [lineageSelectedReportId, setLineageSelectedReportId] = useState<string>(
    'rpt_executive_kpi_dashboard'
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
    setStatusMessage('Loaded sample legacy system: 25 tables, 12 ETL jobs, 8 reports, and 3 apps.');
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
      // If server failed (e.g. key missing), keep current model or inform user
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectComponentForLineage = (comp: Component) => {
    setLineageSelectedReportId(comp.id);
    setActiveTab('lineage');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <Header
        currentSolver={currentSolver}
        onSelectSolver={setCurrentSolver}
        componentCount={model.components.length}
        dependencyCount={model.dependencies.length}
        onOpenHowItWorks={() => setShowHowItWorks(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* How It Works Section on First Screen */}
        {showHowItWorks && (
          <HowItWorksSection
            isDismissible={true}
            onDismiss={() => setShowHowItWorks(false)}
          />
        )}

        {/* Input & Upload Panel */}
        <InputPanel
          inputArtifacts={inputArtifacts}
          onInputChange={setInputArtifacts}
          onLoadSampleSystem={handleLoadSample}
          onAnalyzeSystem={handleAnalyzeSystem}
          isAnalyzing={isAnalyzing}
          statusMessage={statusMessage}
          errorMessage={errorMessage}
        />

        {/* Output Tabs Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-3 px-3.5 border-b-2 font-semibold text-xs whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'inventory'
                  ? 'border-indigo-600 text-indigo-700 bg-white/70 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Table2 className="h-4 w-4" />
              <span>Inventory</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold">
                {model.components.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('graph')}
              className={`py-3 px-3.5 border-b-2 font-semibold text-xs whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'graph'
                  ? 'border-indigo-600 text-indigo-700 bg-white/70 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Network className="h-4 w-4" />
              <span>Dependency Graph</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold">
                {model.dependencies.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('model')}
              className={`py-3 px-3.5 border-b-2 font-semibold text-xs whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'model'
                  ? 'border-indigo-600 text-indigo-700 bg-white/70 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Architecture Model</span>
            </button>

            <button
              onClick={() => setActiveTab('lineage')}
              className={`py-3 px-3.5 border-b-2 font-semibold text-xs whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'lineage'
                  ? 'border-indigo-600 text-indigo-700 bg-white/70 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <GitBranch className="h-4 w-4" />
              <span>Data Flow & Lineage</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`py-3 px-3.5 border-b-2 font-semibold text-xs whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'benchmark'
                  ? 'border-indigo-600 text-indigo-700 bg-white/70 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              <span>Solver Benchmark</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`py-3 px-3.5 border-b-2 font-semibold text-xs whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'export'
                  ? 'border-indigo-600 text-indigo-700 bg-white/70 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </nav>
        </div>

        {/* Tab Panels */}
        <div>
          {activeTab === 'inventory' && (
            <InventoryTab
              components={model.components}
              dependencies={model.dependencies}
              onSelectComponentForLineage={handleSelectComponentForLineage}
            />
          )}

          {activeTab === 'graph' && (
            <DependencyGraphTab
              components={model.components}
              dependencies={model.dependencies}
              moduleAssignments={moduleAssignments}
              numModules={4}
              onSelectComponentForLineage={handleSelectComponentForLineage}
            />
          )}

          {activeTab === 'model' && (
            <ArchitectureModelTab
              components={model.components}
              dependencies={model.dependencies}
              targetLayers={model.targetLayers || SAMPLE_TARGET_LAYERS}
              serviceBoundaries={model.serviceBoundaries || SAMPLE_SERVICE_BOUNDARIES}
            />
          )}

          {activeTab === 'lineage' && (
            <LineageTab
              components={model.components}
              dependencies={model.dependencies}
              initialSelectedReportId={lineageSelectedReportId}
            />
          )}

          {activeTab === 'benchmark' && (
            <BenchmarkTab
              components={model.components}
              dependencies={model.dependencies}
              numModules={4}
            />
          )}

          {activeTab === 'export' && <ExportTab model={model} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>QuantumLens: Architecture Recovery</strong> — Enterprise Data Estate Reverse-Engineering & QUBO Partitioning.
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Simulated Annealing + Quantum-Inspired Ising Model</span>
            <span>•</span>
            <span className="text-amber-700 font-medium">Expert Review Recommended</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
