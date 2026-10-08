import React, { useState, useMemo } from 'react';
import { Component, Dependency } from '../types/architecture';
import { traceLineageBackward, LineageTraceResult } from '../services/lineageService';
import { GitBranch, Database, Cog, BarChart3, AlertTriangle, ShieldCheck, ChevronRight, Layers } from 'lucide-react';

interface LineageTabProps {
  components: Component[];
  dependencies: Dependency[];
  initialSelectedReportId?: string;
}

export const LineageTab: React.FC<LineageTabProps> = ({
  components,
  dependencies,
  initialSelectedReportId,
}) => {
  const reports = useMemo(() => {
    return components.filter((c) => c.type === 'report');
  }, [components]);

  const [selectedReportId, setSelectedReportId] = useState<string>(
    initialSelectedReportId || reports[0]?.id || 'rpt_executive_kpi_dashboard'
  );

  const lineageResult = useMemo<LineageTraceResult | null>(() => {
    if (!selectedReportId) return null;
    return traceLineageBackward(selectedReportId, components, dependencies);
  }, [selectedReportId, components, dependencies]);

  const tieredLineage = useMemo(() => {
    if (!lineageResult) return { sources: [], staging: [], curated: [], report: null };

    const sources = lineageResult.upstreamNodes.filter((c) => c.layer === 'source');
    const staging = lineageResult.upstreamNodes.filter((c) => c.layer === 'staging');
    const curated = lineageResult.upstreamNodes.filter((c) => c.layer === 'curated');

    return {
      sources,
      staging,
      curated,
      report: lineageResult.rootComponent,
    };
  }, [lineageResult]);

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'job':
        return <Cog className="h-3.5 w-3.5 text-purple-400" />;
      case 'report':
        return <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />;
      default:
        return <Database className="h-3.5 w-3.5 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Top Selector & Overview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-indigo-400" />
              <span>End-to-End Data Flow &amp; Backward Lineage</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Pick any executive report or analytics asset to trace its full dependency chain back to root source tables.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="report-picker" className="text-xs font-semibold text-zinc-300 whitespace-nowrap">
              Target Report:
            </label>
            <select
              id="report-picker"
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="bg-zinc-950 text-xs font-mono font-bold text-zinc-100 border border-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs"
            >
              {reports.map((rpt) => (
                <option key={rpt.id} value={rpt.id}>
                  📊 {rpt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lineage Summary Stats Bar */}
        {lineageResult && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] font-medium text-zinc-400 block">Upstream Dependencies</span>
              <strong className="text-sm font-mono text-white mt-0.5 block">
                {lineageResult.upstreamNodes.length} artifacts
              </strong>
            </div>

            <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800/60">
              <span className="text-[11px] font-medium text-sky-400 block">Root Source Tables</span>
              <strong className="text-sm font-mono text-sky-200 mt-0.5 block">
                {lineageResult.sourceTables.length} tables
              </strong>
            </div>

            <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60">
              <span className="text-[11px] font-medium text-indigo-400 block">Lineage Depth</span>
              <strong className="text-sm font-mono text-indigo-200 mt-0.5 block">
                {Math.max(...Array.from(lineageResult.depthMap.values()), 0)} hops
              </strong>
            </div>

            <div className={`p-3 rounded-lg border ${
              lineageResult.needsReviewEdges.length > 0
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            }`}>
              <span className="text-[11px] font-medium block">
                {lineageResult.needsReviewEdges.length > 0 ? 'Lineage Integrity Alert' : 'Path Confidence'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5 font-bold">
                {lineageResult.needsReviewEdges.length > 0 ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span>{lineageResult.needsReviewEdges.length} link needs review</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>100% Verified Path</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advisory Banner if "needs review" edge is present in lineage */}
      {lineageResult && lineageResult.needsReviewEdges.length > 0 && (
        <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <h4 className="font-bold text-amber-300 text-sm mb-1">
              Ambiguous Dependency / Architectural Bypass Detected on Lineage Path:
            </h4>
            {lineageResult.needsReviewEdges.map((e) => (
              <p key={e.id} className="mt-1 leading-relaxed">
                • Link from <code className="bg-zinc-900 px-1 py-0.5 rounded border border-amber-800/80 font-bold">{e.source}</code>{' '}
                to <code className="bg-zinc-900 px-1 py-0.5 rounded border border-amber-800/80 font-bold">{e.target}</code> has confidence{' '}
                <strong>{Math.round(e.confidence * 100)}%</strong>. {e.rationale}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 4-Column Step-by-Step Flow Chart from Source to Report */}
      {lineageResult && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl overflow-x-auto">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span>Topological Lineage Flow: Sources ➔ Staging ➔ Curated Marts ➔ Target Report</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[760px]">
            {/* Column 1: Sources */}
            <div className="p-3.5 rounded-xl border border-sky-800/60 bg-sky-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-sky-800/60">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    1. Source Estate ({tieredLineage.sources.length})
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                    Origin
                  </span>
                </div>
                <div className="space-y-2">
                  {tieredLineage.sources.length === 0 ? (
                    <p className="text-[11px] text-zinc-500 italic">No source tables directly connected.</p>
                  ) : (
                    tieredLineage.sources.map((comp) => (
                      <div
                        key={comp.id}
                        className="bg-black/80 p-2.5 rounded-lg border border-sky-900/60 text-xs font-mono"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          {getComponentIcon(comp.type)}
                          <span className="truncate">{comp.name}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-sans mt-1 line-clamp-2">
                          {comp.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Staging */}
            <div className="p-3.5 rounded-xl border border-indigo-800/60 bg-indigo-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-indigo-800/60">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    2. Staging &amp; Cleansing ({tieredLineage.staging.length})
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Transform
                  </span>
                </div>
                <div className="space-y-2">
                  {tieredLineage.staging.length === 0 ? (
                    <p className="text-[11px] text-zinc-500 italic">Direct pass-through (no staging transform).</p>
                  ) : (
                    tieredLineage.staging.map((comp) => (
                      <div
                        key={comp.id}
                        className="bg-black/80 p-2.5 rounded-lg border border-indigo-900/60 text-xs font-mono"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          {getComponentIcon(comp.type)}
                          <span className="truncate">{comp.name}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-sans mt-1 line-clamp-2">
                          {comp.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Column 3: Curated Marts */}
            <div className="p-3.5 rounded-xl border border-emerald-800/60 bg-emerald-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-800/60">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    3. Curated Marts ({tieredLineage.curated.length})
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Governed
                  </span>
                </div>
                <div className="space-y-2">
                  {tieredLineage.curated.length === 0 ? (
                    <p className="text-[11px] text-zinc-500 italic">No curated dimensional models queried.</p>
                  ) : (
                    tieredLineage.curated.map((comp) => (
                      <div
                        key={comp.id}
                        className="bg-black/80 p-2.5 rounded-lg border border-emerald-900/60 text-xs font-mono"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          {getComponentIcon(comp.type)}
                          <span className="truncate">{comp.name}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-sans mt-1 line-clamp-2">
                          {comp.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Column 4: Report Target */}
            <div className="p-3.5 rounded-xl border border-amber-800/60 bg-amber-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-amber-800/60">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    4. Target Report
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Consumer
                  </span>
                </div>
                {tieredLineage.report && (
                  <div className="bg-black/80 p-3 rounded-xl border border-amber-800/60 text-xs font-mono">
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      <BarChart3 className="h-4 w-4 text-emerald-400" />
                      <span className="break-all">{tieredLineage.report.name}</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-sans mt-2 leading-relaxed">
                      {tieredLineage.report.description}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between text-[11px] font-sans text-zinc-400">
                      <span>Total Upstream Paths:</span>
                      <strong className="text-white font-mono font-bold">
                        {lineageResult.upstreamEdges.length} edges
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upstream Direct Dependency Audit Table */}
      {lineageResult && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Lineage Edge Audit Trail ({lineageResult.upstreamEdges.length} Connected Links)
            </h4>
            <span className="text-xs text-zinc-500">
              Ordered by downstream hierarchy
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold text-[11px]">
                  <th className="py-2.5 px-4">Upstream Source</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-4">Downstream Target</th>
                  <th className="py-2.5 px-3 text-center">Confidence</th>
                  <th className="py-2.5 px-4">Dependency Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {lineageResult.upstreamEdges.map((edge) => (
                  <tr
                    key={edge.id}
                    className={`hover:bg-zinc-800/50 transition-colors ${
                      edge.needsReview ? 'bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono font-bold text-white">
                      {edge.source}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500">
                      <ChevronRight className="h-4 w-4" />
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-white">
                      {edge.target}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        edge.needsReview
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {Math.round(edge.confidence * 100)}%
                        {edge.needsReview && ' ⚠️'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400">
                      {edge.rationale || 'Inferred via schema foreign keys'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
