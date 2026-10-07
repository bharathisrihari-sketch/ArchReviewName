export type ComponentType = 'table' | 'view' | 'job' | 'report' | 'app';

export type LayerType = 'source' | 'staging' | 'curated' | 'reporting' | 'apps';

export interface Component {
  id: string;
  name: string;
  type: ComponentType;
  description: string;
  layer?: LayerType;
  tags?: string[];
  isUnusedCandidate?: boolean;
  isDuplicateCandidate?: boolean;
  duplicateOf?: string;
  notes?: string;
  sourceCodeSnippet?: string;
}

export interface Dependency {
  id: string;
  source: string; // Component ID or name
  target: string; // Component ID or name
  confidence: number; // 0.0 to 1.0
  needsReview: boolean;
  type?: 'reads' | 'writes' | 'invokes' | 'queries';
  rationale?: string;
}

export interface ModulePartition {
  moduleId: number;
  name: string;
  color: string;
  componentIds: string[];
  description?: string;
}

export interface ServiceBoundary {
  id: string;
  name: string;
  description: string;
  suggestedComponents: string[];
  rationale: string;
  targetLayer: LayerType;
}

export interface TargetArchitectureLayer {
  layer: LayerType;
  name: string;
  description: string;
  components: string[];
}

export interface ArchitectureModel {
  name: string;
  description: string;
  extractedAt: string;
  components: Component[];
  dependencies: Dependency[];
  modules?: ModulePartition[];
  serviceBoundaries?: ServiceBoundary[];
  targetLayers?: TargetArchitectureLayer[];
}

export interface SolverRunStats {
  solverName: string;
  executionTimeMs: number;
  finalEnergy: number;
  modularityScore: number;
  crossModuleEdgesCut: number;
  moduleBalanceStdDev: number;
  iterations: number;
  convergenceCurve: { iteration: number; energy: number }[];
  partitions: Record<string, number>; // componentId -> moduleId
}

export interface BenchmarkComparison {
  classicalSA: SolverRunStats;
  quantumInspired: SolverRunStats;
  problemSize: {
    nodes: number;
    edges: number;
    numModules: number;
  };
  winner: string;
  analysisText: string;
}

export interface LineagePathNode {
  component: Component;
  depth: number;
  incomingEdge?: Dependency;
  children: LineagePathNode[];
}
