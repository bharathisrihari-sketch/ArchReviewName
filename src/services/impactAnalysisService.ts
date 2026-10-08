import { Component, Dependency } from '../types/architecture';

export interface ImpactedComponentNode {
  component: Component;
  depth: number;
  triggerEdge: Dependency;
  upstreamSource: Component;
}

export interface ImpactAnalysisResult {
  targetTable: Component;
  totalImpactedCount: number;
  impactedJobs: Component[];
  impactedTables: Component[];
  impactedReports: Component[];
  impactedApps: Component[];
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'CRITICAL';
  severityScore: number; // 0 to 100
  safeToRetire: boolean;
  propagationLevels: {
    level: number;
    title: string;
    items: {
      component: Component;
      causedBy: string;
      confidence: number;
      needsReview: boolean;
      rationale?: string;
    }[];
  }[];
  allImpactedIds: Set<string>;
  allImpactedEdges: Dependency[];
  recommendation: string;
}

export function analyzeDeletionImpact(
  tableId: string,
  components: Component[],
  dependencies: Dependency[]
): ImpactAnalysisResult | null {
  const compMap = new Map<string, Component>();
  for (const c of components) {
    compMap.set(c.id, c);
    compMap.set(c.name, c);
  }

  const targetTable = compMap.get(tableId);
  if (!targetTable) return null;

  // Build outbound edge map: sourceComponentId -> Array of outgoing dependencies
  const outboundMap = new Map<string, Dependency[]>();
  for (const dep of dependencies) {
    const sId = compMap.get(dep.source)?.id || dep.source;
    if (!outboundMap.has(sId)) {
      outboundMap.set(sId, []);
    }
    outboundMap.get(sId)!.push(dep);
  }

  const visitedCompIds = new Set<string>();
  const allImpactedEdges: Dependency[] = [];
  const levelBuckets = new Map<number, {
    component: Component;
    causedBy: string;
    confidence: number;
    needsReview: boolean;
    rationale?: string;
  }[]>();

  // BFS Queue: [componentId, depth, parentName, edge]
  interface QueueItem {
    id: string;
    depth: number;
    parentName: string;
    edge: Dependency | null;
  }

  const queue: QueueItem[] = [{ id: targetTable.id, depth: 0, parentName: targetTable.name, edge: null }];
  visitedCompIds.add(targetTable.id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const outboundDeps = outboundMap.get(current.id) || [];

    for (const dep of outboundDeps) {
      const targetComp = compMap.get(dep.target);
      if (!targetComp) continue;

      if (!allImpactedEdges.some((e) => e.id === dep.id)) {
        allImpactedEdges.push(dep);
      }

      if (!visitedCompIds.has(targetComp.id)) {
        visitedCompIds.add(targetComp.id);
        const nextDepth = current.depth + 1;

        if (!levelBuckets.has(nextDepth)) {
          levelBuckets.set(nextDepth, []);
        }

        levelBuckets.get(nextDepth)!.push({
          component: targetComp,
          causedBy: current.parentName,
          confidence: dep.confidence,
          needsReview: dep.needsReview,
          rationale: dep.rationale,
        });

        queue.push({
          id: targetComp.id,
          depth: nextDepth,
          parentName: targetComp.name,
          edge: dep,
        });
      }
    }
  }

  // Separate impacted components by type (excluding the root deleted table itself)
  const impactedComponents: Component[] = [];
  for (const id of visitedCompIds) {
    if (id !== targetTable.id) {
      const c = compMap.get(id);
      if (c) impactedComponents.push(c);
    }
  }

  const impactedJobs = impactedComponents.filter((c) => c.type === 'job');
  const impactedTables = impactedComponents.filter((c) => c.type === 'table' || c.type === 'view');
  const impactedReports = impactedComponents.filter((c) => c.type === 'report');
  const impactedApps = impactedComponents.filter((c) => c.type === 'app');

  const totalImpactedCount = impactedComponents.length;
  const safeToRetire = totalImpactedCount === 0;

  // Calculate severity
  let severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'CRITICAL' = 'SAFE';
  let severityScore = 0;

  if (safeToRetire) {
    severity = 'SAFE';
    severityScore = 0;
  } else if (impactedApps.length > 0 || impactedReports.length >= 3) {
    severity = 'CRITICAL';
    severityScore = Math.min(100, 75 + impactedApps.length * 10 + impactedReports.length * 3);
  } else if (impactedReports.length > 0 || impactedTables.length >= 2) {
    severity = 'MEDIUM';
    severityScore = Math.min(74, 40 + impactedReports.length * 8 + impactedTables.length * 4);
  } else {
    severity = 'LOW';
    severityScore = Math.min(39, 15 + totalImpactedCount * 5);
  }

  // Format propagation levels
  const propagationLevels = Array.from(levelBuckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([depth, items]) => {
      let title = `Hop ${depth}: Direct Consumers`;
      if (depth === 1) title = 'Direct Downstream Consumers (1st Order)';
      else if (depth === 2) title = 'Secondary Cascading Dependencies (2nd Order)';
      else if (depth === 3) title = 'High-Order Reporting & Marts (3rd Order)';
      else title = `Downstream Level ${depth} Propagation`;

      return {
        level: depth,
        title,
        items,
      };
    });

  // Actionable recommendation
  let recommendation = '';
  if (safeToRetire) {
    recommendation = `Safe to deprecate and delete. Zero downstream jobs, reports, or applications depend on ${targetTable.name}. Dropping this table will immediately reclaim database storage and reduce schema sprawl without operational risk.`;
  } else if (severity === 'CRITICAL') {
    recommendation = `CRITICAL DELETION HAZARD: Dropping ${targetTable.name} will trigger cascading outages across ${impactedApps.length} user-facing applications, ${impactedReports.length} executive reports, and ${impactedJobs.length} ETL batch jobs. Migration or replacement view required before deprecation.`;
  } else if (severity === 'MEDIUM') {
    recommendation = `MODERATE OPERATIONAL IMPACT: Dropping ${targetTable.name} will break ${impactedReports.length} business reports and halt ${impactedJobs.length} pipeline jobs. Deprecate with 30-day notice and repoint queries to target conformed marts first.`;
  } else {
    recommendation = `LOW RISK IMPACT: Dropping ${targetTable.name} affects ${totalImpactedCount} local component(s). Verify non-critical pipeline logs before archiving.`;
  }

  return {
    targetTable,
    totalImpactedCount,
    impactedJobs,
    impactedTables,
    impactedReports,
    impactedApps,
    severity,
    severityScore,
    safeToRetire,
    propagationLevels,
    allImpactedIds: visitedCompIds,
    allImpactedEdges,
    recommendation,
  };
}
