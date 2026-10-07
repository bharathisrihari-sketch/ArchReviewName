import { Component, Dependency } from '../types/architecture';

export interface LineageTraceResult {
  rootComponent: Component;
  upstreamNodes: Component[];
  upstreamEdges: Dependency[];
  sourceTables: Component[];
  intermediateJobs: Component[];
  intermediateTables: Component[];
  confidenceBottleneck: {
    edge: Dependency;
    minConfidence: number;
  } | null;
  needsReviewEdges: Dependency[];
  depthMap: Map<string, number>; // componentId -> distance from report (0 is the report itself, 1 is parent, etc.)
  lineageTree: LineageTreeNode;
}

export interface LineageTreeNode {
  component: Component;
  level: number;
  edgeToChild?: Dependency;
  parents: LineageTreeNode[];
}

export function traceLineageBackward(
  targetId: string,
  components: Component[],
  dependencies: Dependency[]
): LineageTraceResult | null {
  const compMap = new Map<string, Component>();
  for (const c of components) {
    compMap.set(c.id, c);
    compMap.set(c.name, c);
  }

  const root = compMap.get(targetId);
  if (!root) return null;
  const rootId = root.id;

  // Build incoming edge map: targetComponentId -> Array of incoming dependencies
  const incomingMap = new Map<string, Dependency[]>();
  for (const dep of dependencies) {
    if (!incomingMap.has(dep.target)) {
      incomingMap.set(dep.target, []);
    }
    incomingMap.get(dep.target)!.push(dep);
  }

  const visitedNodeIds = new Set<string>();
  const visitedEdgeIds = new Set<string>();
  const depthMap = new Map<string, number>();

  const upstreamNodes: Component[] = [];
  const upstreamEdges: Dependency[] = [];
  const needsReviewEdges: Dependency[] = [];
  let minConfidenceEdge: Dependency | null = null;
  let minConf = 1.0;

  function traverse(currentId: string, currentDepth: number, pathHistory: Set<string>): LineageTreeNode {
    const comp = compMap.get(currentId) || {
      id: currentId,
      name: currentId,
      type: 'table',
      description: 'Discovered artifact',
    };

    depthMap.set(currentId, Math.max(depthMap.get(currentId) ?? 0, currentDepth));

    if (!visitedNodeIds.has(currentId)) {
      visitedNodeIds.add(currentId);
      if (currentId !== rootId) {
        upstreamNodes.push(comp);
      }
    }

    const incomingDeps = incomingMap.get(currentId) || [];
    const parentNodes: LineageTreeNode[] = [];

    for (const dep of incomingDeps) {
      if (!visitedEdgeIds.has(dep.id)) {
        visitedEdgeIds.add(dep.id);
        upstreamEdges.push(dep);
      }

      if (dep.needsReview) {
        if (!needsReviewEdges.some((e) => e.id === dep.id)) {
          needsReviewEdges.push(dep);
        }
      }

      if (dep.confidence < minConf) {
        minConf = dep.confidence;
        minConfidenceEdge = dep;
      }

      const sourceId = dep.source;
      // Cycle prevention
      if (!pathHistory.has(sourceId)) {
        const nextHistory = new Set(pathHistory);
        nextHistory.add(sourceId);
        const parentTree = traverse(sourceId, currentDepth + 1, nextHistory);
        parentTree.edgeToChild = dep;
        parentNodes.push(parentTree);
      }
    }

    return {
      component: comp,
      level: currentDepth,
      parents: parentNodes,
    };
  }

  const tree = traverse(root.id, 0, new Set([root.id]));

  const sourceTables = upstreamNodes.filter((c) => c.layer === 'source' && c.type === 'table');
  const intermediateJobs = upstreamNodes.filter((c) => c.type === 'job');
  const intermediateTables = upstreamNodes.filter((c) => c.type === 'table' && c.layer !== 'source');

  return {
    rootComponent: root,
    upstreamNodes,
    upstreamEdges,
    sourceTables,
    intermediateJobs,
    intermediateTables,
    confidenceBottleneck: minConfidenceEdge ? { edge: minConfidenceEdge, minConfidence: minConf } : null,
    needsReviewEdges,
    depthMap,
    lineageTree: tree,
  };
}
