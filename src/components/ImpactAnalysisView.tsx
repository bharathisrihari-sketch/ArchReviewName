import React, { useState, useMemo } from 'react';
import { Component, Dependency } from '../types/architecture';
import { analyzeDeletionImpact, ImpactAnalysisResult } from '../services/impactAnalysisService';
import {
  AlertTriangle,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Database,
  Cog,
  BarChart3,
  Smartphone,
  Layers,
  Sparkles,
  Info,
  Check,
  XCircle,
} from 'lucide-react';

interface ImpactAnalysisViewProps {
  components: Component[];
  dependencies: Dependency[];
  initialSelectedTableId?: string;
  onNavigateToLineage?: (comp: Component) => void;
}

export const ImpactAnalysisView: React.FC<ImpactAnalysisViewProps> = ({
  components,
  dependencies,
  initialSelectedTableId,
}) => {
  const tables = useMemo(() => {
    return components.filter((c) => c.type === 'table' || c.type === 'view');
  }, [components]);

  const [selectedTableId, setSelectedTableId] = useState<string>(
    initialSelectedTableId || tables[0]?.id || 'raw_customers_cdc'
  );

  const impactResult = useMemo<ImpactAnalysisResult | null>(() => {
    if (!selectedTableId) return null;
    return analyzeDeletionImpact(selectedTableId, components, dependencies);
  }, [selectedTableId, components, dependencies]);

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'job':
        return <Cog className="h-3.5 w-3.5 text-purple-400" />;
      case 'report':
        return <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />;
      case 'app':
        return <Smartphone className="h-3.5 w-3.5 text-amber-400" />;
      default:
        return <Database className="h-3.5 w-3.5 text-sky-400" />;
    }
  };

  const getSeverityBadge = (severity: string, score: number) => {
    switch (severity) {
      case 'SAFE':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            ZERO IMPACT (SAFE TO DELETE)
          </span>
        );
      case 'LOW':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-950/80 text-blue-300 border border-blue-700/80 flex items-center gap-1.5 shadow-xs">
            <Info className="h-4 w-4 text-blue-400" />
            LOW BLAST RADIUS ({score}% RISK)
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-700/80 flex items-center gap-1.5 shadow-xs">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            MODERATE BLAST RADIUS ({score}% RISK)
          </span>
        );
      case 'CRITICAL':
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-700/80 flex items-center gap-1.5 animate-pulse shadow-xs">
            <Flame className="h-4 w-4 text-rose-400" />
            CRITICAL BLAST RADIUS ({score}% RISK)
          </span>
        );
    }
  };

  const presetScenarios = [
    { id: 'raw_customers_cdc', label: 'raw_customers_cdc (Core CDC)', tag: 'Critical' },
    { id: 'fact_sales', label: 'fact_sales (Central Fact)', tag: 'High' },
    { id: 'stg_orders_normalized', label: 'stg_orders_normalized (Staging)', tag: 'Medium' },
    { id: 'raw_support_tickets', label: 'raw_support_tickets (Orphan)', tag: 'Safe' },
    { id: 'stg_legacy_order_backup', label: 'stg_legacy_order_backup (Duplicate)', tag: 'Safe' },
  ];

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Top Selector & Scenario Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="h-5 w-5 text-rose-500" />
              <span>Downstream Impact Analysis &amp; Blast Radius Simulator</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Simulate dropping or modifying any table to trace cascading pipeline failures through jobs, marts, reports, and apps.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="table-picker" className="text-xs font-semibold text-zinc-300 whitespace-nowrap flex items-center gap-1">
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              Target Table to Delete:
            </label>
            <select
              id="table-picker"
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="bg-zinc-950 text-xs font-mono font-bold text-zinc-100 border border-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer shadow-xs"
            >
              {tables.map((tbl) => (
                <option key={tbl.id} value={tbl.id}>
                  🗄️ {tbl.name} {tbl.isUnusedCandidate ? '⚠️ (Unused)' : tbl.isDuplicateCandidate ? '⚠️ (Duplicate)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Scenario Preset Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-400 mr-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            Quick Scenarios:
          </span>
          {presetScenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setSelectedTableId(sc.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedTableId === sc.id
                  ? 'bg-zinc-800 text-white font-bold border border-zinc-600'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <span>{sc.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-semibold ${
                  sc.tag === 'Safe'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : sc.tag === 'Critical'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {sc.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {impactResult && (
        <div className="space-y-6">
          {/* Severity & Metrics Banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl border ${
                  impactResult.safeToRetire
                    ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-400'
                    : 'bg-rose-950/60 border-rose-700/60 text-rose-400'
                }`}>
                  {impactResult.safeToRetire ? (
                    <ShieldCheck className="h-7 w-7" />
                  ) : (
                    <Flame className="h-7 w-7 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-mono text-white">
                      DROP TABLE {impactResult.targetTable.name}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {impactResult.targetTable.description}
                  </p>
                </div>
              </div>

              <div>{getSeverityBadge(impactResult.severity, impactResult.severityScore)}</div>
            </div>

            {/* Downstream Blast Metrics */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-[11px] font-medium text-zinc-400 block">Total Downstream Blast</span>
                <strong className={`text-base font-mono font-bold block mt-0.5 ${
                  impactResult.safeToRetire ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {impactResult.totalImpactedCount} components
                </strong>
                <span className="text-[10px] text-zinc-500">Broken dependencies</span>
              </div>

              <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-800/60">
                <span className="text-[11px] font-medium text-purple-400 block">Halted ETL Jobs</span>
                <strong className="text-base font-mono font-bold text-purple-200 block mt-0.5">
                  {impactResult.impactedJobs.length} pipelines
                </strong>
                <span className="text-[10px] text-purple-400">Upstream DAG aborts</span>
              </div>

              <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800/60">
                <span className="text-[11px] font-medium text-sky-400 block">Corrupted Data Marts</span>
                <strong className="text-base font-mono font-bold text-sky-200 block mt-0.5">
                  {impactResult.impactedTables.length} tables/views
                </strong>
                <span className="text-[10px] text-sky-400">Failed refreshes</span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60">
                <span className="text-[11px] font-medium text-emerald-400 block">Broken Reports</span>
                <strong className="text-base font-mono font-bold text-emerald-200 block mt-0.5">
                  {impactResult.impactedReports.length} reports
                </strong>
                <span className="text-[10px] text-emerald-400">Dashboard outages</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60">
                <span className="text-[11px] font-medium text-amber-400 block">Crashing Apps</span>
                <strong className="text-base font-mono font-bold text-amber-200 block mt-0.5">
                  {impactResult.impactedApps.length} applications
                </strong>
                <span className="text-[10px] text-amber-400">User-facing outage</span>
              </div>
            </div>

            {/* Recommendation Box */}
            <div className={`mt-4 p-3.5 rounded-xl border text-xs leading-relaxed ${
              impactResult.safeToRetire
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                : impactResult.severity === 'CRITICAL'
                ? 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                : 'bg-amber-950/40 border-amber-700/60 text-amber-200'
            }`}>
              <div className="font-bold flex items-center gap-1.5 mb-1">
                {impactResult.safeToRetire ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                )}
                <span>Architect Recommendation:</span>
              </div>
              <p>{impactResult.recommendation}</p>
            </div>
          </div>

          {/* Step-by-Step Cascading Propagation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Cascading Failure Propagation Timeline (Hop by Hop)</span>
            </h3>

            {impactResult.safeToRetire ? (
              <div className="p-8 text-center bg-black rounded-xl border border-dashed border-zinc-800">
                <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-white mb-1">
                  Zero Downstream Propagation Detected
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {impactResult.targetTable.name} is completely isolated. No ETL scripts read from it, no dashboards query it, and no applications depend on it.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-md text-xs font-semibold">
                  <Check className="h-3.5 w-3.5" />
                  Verified Safe For Immediate Table Drop
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Step 0 */}
                <div className="p-3 rounded-lg border border-rose-800/80 bg-rose-950/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      0
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-rose-300 text-xs line-through">
                          {impactResult.targetTable.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          DELETED TABLE
                        </span>
                      </div>
                      <span className="text-[11px] text-rose-400">
                        Initial failure trigger: table schema dropped or removed
                      </span>
                    </div>
                  </div>
                  <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
                </div>

                {/* Downstream levels */}
                {impactResult.propagationLevels.map((lvl) => (
                  <div key={lvl.level} className="p-4 rounded-xl border border-zinc-800 bg-black/60 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div className="flex items-center space-x-2">
                        <span className="h-5 w-5 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-[11px]">
                          {lvl.level}
                        </span>
                        <h4 className="font-bold text-xs text-white">
                          {lvl.title} ({lvl.items.length} affected)
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Cascade Depth: {lvl.level}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {lvl.items.map((item) => (
                        <div
                          key={item.component.id}
                          className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 hover:border-rose-500/60 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center space-x-1.5 font-mono font-bold text-xs text-white truncate">
                                {getComponentIcon(item.component.type)}
                                <span className="truncate">{item.component.name}</span>
                              </div>
                              <span className="capitalize text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                                {item.component.type}
                              </span>
                            </div>

                            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-2 font-sans">
                              {item.component.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-zinc-800 text-[10px] text-rose-400 flex items-center justify-between font-sans">
                            <span className="truncate">
                              Fails because of: <strong>{item.causedBy}</strong>
                            </span>
                            <span className="font-mono font-semibold text-zinc-500 shrink-0 ml-1">
                              {Math.round(item.confidence * 100)}% conf
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
