import React, { useState } from 'react';
import { Component, Dependency, TargetArchitectureLayer, ServiceBoundary } from '../types/architecture';
import { Layers, ShieldCheck, AlertTriangle, Database, Cog, BarChart3, Smartphone, Sparkles, Building2 } from 'lucide-react';

interface ArchitectureModelTabProps {
  components: Component[];
  dependencies: Dependency[];
  targetLayers: TargetArchitectureLayer[];
  serviceBoundaries: ServiceBoundary[];
}

export const ArchitectureModelTab: React.FC<ArchitectureModelTabProps> = ({
  components,
  dependencies,
  targetLayers,
  serviceBoundaries,
}) => {
  const [activeView, setActiveView] = useState<'to-be' | 'as-is'>('to-be');

  const componentsByLayer = (layerKey: string) => {
    return components.filter((c) => c.layer === layerKey);
  };

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

  return (
    <div className="space-y-6 text-zinc-100">
      {/* View Switcher Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            <span>Enterprise Architecture Modeling</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Compare the current unmanaged legacy system against the proposed 5-layer target architecture.
          </p>
        </div>

        {/* Switcher Buttons */}
        <div className="flex items-center space-x-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setActiveView('to-be')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'to-be'
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Target Architecture (To-Be)</span>
          </button>
          <button
            onClick={() => setActiveView('as-is')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'as-is'
                ? 'bg-zinc-800 text-amber-300 shadow-xs border border-amber-800/60'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Legacy System (As-Is)</span>
          </button>
        </div>
      </div>

      {activeView === 'to-be' ? (
        <div className="space-y-6">
          {/* Banner */}
          <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-200">
              <h3 className="font-bold text-sm text-indigo-100 mb-1">
                Proposed 5-Layer Governed Target Architecture
              </h3>
              <p className="leading-relaxed">
                Reorganizes tangled dependencies into strict unidirectional layers: Ingestion ➔ Staging ➔ Conformed Marts ➔ BI Semantic Views ➔ Applications. Direct staging bypasses are completely decoupled.
              </p>
            </div>
          </div>

          {/* 5 Layer Stack Diagram */}
          <div className="space-y-3">
            {targetLayers.map((layerDef) => {
              const layerComps = componentsByLayer(layerDef.layer);

              const layerThemes: Record<string, { bg: string; border: string; badge: string }> = {
                apps: { bg: 'bg-purple-950/20', border: 'border-purple-800/60', badge: 'bg-purple-950 text-purple-300 border-purple-800' },
                reporting: { bg: 'bg-amber-950/20', border: 'border-amber-800/60', badge: 'bg-amber-950 text-amber-300 border-amber-800' },
                curated: { bg: 'bg-emerald-950/20', border: 'border-emerald-800/60', badge: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
                staging: { bg: 'bg-indigo-950/20', border: 'border-indigo-800/60', badge: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
                source: { bg: 'bg-sky-950/20', border: 'border-sky-800/60', badge: 'bg-sky-950 text-sky-300 border-sky-800' },
              };

              const theme = layerThemes[layerDef.layer] || layerThemes.source;

              return (
                <div
                  key={layerDef.layer}
                  className={`rounded-xl border ${theme.border} ${theme.bg} p-4 transition-all shadow-md bg-zinc-900/90`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-800 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${theme.badge}`}>
                        {layerDef.name}
                      </span>
                      <span className="text-xs text-zinc-400 hidden sm:inline">
                        ({layerComps.length} components assigned)
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium max-w-xl">
                      {layerDef.description}
                    </p>
                  </div>

                  {/* Components Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {layerComps.map((comp) => (
                      <div
                        key={comp.id}
                        className="bg-black/90 p-2 rounded-lg border border-zinc-800 hover:border-indigo-500/80 transition-all flex items-center space-x-2 shadow-2xs"
                        title={comp.description}
                      >
                        <div className="p-1 rounded bg-zinc-900 shrink-0">
                          {getComponentIcon(comp.type)}
                        </div>
                        <span className="text-[11px] font-mono font-medium text-zinc-200 truncate">
                          {comp.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suggested Service Boundaries */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl">
            <div className="mb-4 pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <span>Suggested Domain Service Boundaries</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Logical domain decompositions grouping cohesive components with clear bounded contexts and architecture rationales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceBoundaries.map((boundary) => (
                <div
                  key={boundary.id}
                  className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-indigo-500/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" />
                        {boundary.name}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {boundary.suggestedComponents.length} components
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                      {boundary.description}
                    </p>

                    <div className="p-2.5 rounded-lg bg-amber-950/25 border border-amber-800/50 text-[11px] text-amber-300 mb-3 leading-relaxed">
                      <strong className="text-amber-200 block font-semibold mb-0.5">
                        Architectural Rationale:
                      </strong>
                      {boundary.rationale}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                      Domain Components:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {boundary.suggestedComponents.map((cId) => (
                        <span
                          key={cId}
                          className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300"
                        >
                          {cId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200">
              <h3 className="font-bold text-sm text-amber-100 mb-1">
                As-Is Legacy System: Discovered Anti-Patterns &amp; Bottlenecks
              </h3>
              <p className="leading-relaxed">
                Reverse-engineered dependency analysis discovered several architectural flaws in the legacy estate: bypassed governance tiers, direct staging queries, orphan ingestion pipelines, and unmanaged replica access.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-rose-800/60 bg-rose-950/20">
              <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs mb-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>Anti-Pattern 1: Direct Staging Query Bypass</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded border border-rose-900/60 text-rose-300">
                  rpt_finance_general_ledger_recon
                </code>{' '}
                directly queries{' '}
                <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded border border-rose-900/60 text-rose-300">
                  stg_payments_reconciled
                </code>{' '}
                instead of reading from curated financial marts.
              </p>
              <div className="text-[11px] text-zinc-400 bg-zinc-900 p-2 rounded border border-zinc-800">
                <strong>Remediation:</strong> Route general ledger reconciliation through governed{' '}
                <code>agg_monthly_financials</code> mart to prevent reconciliation data drift.
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-800/60 bg-amber-950/20">
              <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs mb-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Anti-Pattern 2: Unindexed Direct App Replica Read</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded border border-amber-900/60 text-amber-300">
                  app_pos_mobile_terminal
                </code>{' '}
                issues direct SELECT queries against{' '}
                <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded border border-amber-900/60 text-amber-300">
                  dim_product
                </code>{' '}
                over an unindexed read replica.
              </p>
              <div className="text-[11px] text-zinc-400 bg-zinc-900 p-2 rounded border border-zinc-800">
                <strong>Remediation:</strong> Expose a cached Catalog API Gateway or Redis cache for mobile checkout latency.
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-800/60 bg-amber-950/20">
              <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs mb-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Anti-Pattern 3: Orphan Ingestion Pipeline</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded border border-amber-900/60 text-amber-300">
                  raw_support_tickets
                </code>{' '}
                is continuously ingested from Zendesk, but has zero downstream ETL jobs, reports, or models consuming it.
              </p>
              <div className="text-[11px] text-zinc-400 bg-zinc-900 p-2 rounded border border-zinc-800">
                <strong>Remediation:</strong> Deprecate ingestion or attach a downstream customer sentiment model to prevent wasted compute.
              </div>
            </div>

            <div className="p-4 rounded-xl border border-rose-800/60 bg-rose-950/20">
              <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs mb-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>Anti-Pattern 4: Stale Redundant Table Duplication</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded border border-rose-900/60 text-rose-300">
                  stg_legacy_order_backup
                </code>{' '}
                is a 1:1 duplicate snapshot of{' '}
                <code className="font-mono bg-zinc-900 px-1 py-0.5 rounded border border-rose-900/60 text-rose-300">
                  stg_orders_normalized
                </code>{' '}
                with zero write traffic for 90+ days.
              </p>
              <div className="text-[11px] text-zinc-400 bg-zinc-900 p-2 rounded border border-zinc-800">
                <strong>Remediation:</strong> Archive and drop the legacy backup table to reclaim database storage and reduce schema clutter.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
