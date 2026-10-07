import React, { useState } from 'react';
import { Component, Dependency, TargetArchitectureLayer, ServiceBoundary } from '../types/architecture';
import { Layers, ArrowRight, ShieldCheck, AlertTriangle, CheckCircle2, Database, Cog, BarChart3, Smartphone, Sparkles, Building2, HelpCircle } from 'lucide-react';

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
  const [selectedBoundary, setSelectedBoundary] = useState<ServiceBoundary | null>(null);

  // Group components by layer
  const componentsByLayer = (layerKey: string) => {
    return components.filter((c) => c.layer === layerKey);
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'job':
        return <Cog className="h-3.5 w-3.5 text-purple-600" />;
      case 'report':
        return <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />;
      case 'app':
        return <Smartphone className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <Database className="h-3.5 w-3.5 text-sky-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* View Switcher Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            <span>Enterprise Architecture Modeling</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare the current unmanaged legacy system against the proposed modern target architecture.
          </p>
        </div>

        {/* Switcher Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveView('to-be')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'to-be'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Target Architecture (To-Be)</span>
          </button>
          <button
            onClick={() => setActiveView('as-is')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'as-is'
                ? 'bg-white text-amber-800 shadow-xs border border-amber-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Legacy System (As-Is)</span>
          </button>
        </div>
      </div>

      {activeView === 'to-be' ? (
        /* ================= PROPOSED TO-BE ARCHITECTURE ================= */
        <div className="space-y-6">
          {/* Target Architecture Layers Banner */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950">
              <h3 className="font-bold text-sm text-indigo-900 mb-1">
                Proposed 5-Layer Governed Target Architecture
              </h3>
              <p className="leading-relaxed">
                Reorganizes tangled dependencies into strict unidirectional layers: data flows solely from Ingestion to Staging,
                into Conformed Marts, then into BI & Consumption, and finally to Applications. Direct cross-layer bypasses are eliminated.
              </p>
            </div>
          </div>

          {/* 5 Layer Stack Diagram */}
          <div className="space-y-3">
            {targetLayers.map((layerDef, idx) => {
              const layerComps = componentsByLayer(layerDef.layer);

              const layerThemes: Record<string, { bg: string; border: string; badge: string; text: string }> = {
                apps: { bg: 'bg-purple-50/60', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800', text: 'text-purple-900' },
                reporting: { bg: 'bg-amber-50/60', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-900' },
                curated: { bg: 'bg-emerald-50/60', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900' },
                staging: { bg: 'bg-indigo-50/60', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-800', text: 'text-indigo-900' },
                source: { bg: 'bg-sky-50/60', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-800', text: 'text-sky-900' },
              };

              const theme = layerThemes[layerDef.layer] || layerThemes.source;

              return (
                <div
                  key={layerDef.layer}
                  className={`rounded-xl border ${theme.border} ${theme.bg} p-4 transition-all shadow-xs`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-black/5 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${theme.badge}`}>
                        {layerDef.name}
                      </span>
                      <span className="text-xs text-slate-500 hidden sm:inline">
                        ({layerComps.length} components assigned)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium max-w-xl">
                      {layerDef.description}
                    </p>
                  </div>

                  {/* Components Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {layerComps.map((comp) => (
                      <div
                        key={comp.id}
                        className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all flex items-center space-x-2"
                        title={comp.description}
                      >
                        <div className="p-1 rounded bg-slate-50 shrink-0">
                          {getComponentIcon(comp.type)}
                        </div>
                        <span className="text-[11px] font-mono font-medium text-slate-800 truncate">
                          {comp.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suggested Service Boundaries Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span>Suggested Domain Service Boundaries</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Logical domain decompositions grouping cohesive components with clear bounded contexts and architecture rationales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceBoundaries.map((boundary) => (
                <div
                  key={boundary.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-600 inline-block" />
                        {boundary.name}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {boundary.suggestedComponents.length} components
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      {boundary.description}
                    </p>

                    {/* Architecture Rationale Callout */}
                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 mb-3">
                      <strong className="text-amber-950 block font-semibold mb-0.5">
                        Architectural Rationale:
                      </strong>
                      {boundary.rationale}
                    </div>
                  </div>

                  {/* Components Tag Cloud */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Domain Components:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {boundary.suggestedComponents.map((cId) => (
                        <span
                          key={cId}
                          className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-700"
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
        /* ================= AS-IS LEGACY SYSTEM ARCHITECTURE ================= */
        <div className="space-y-6">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950">
              <h3 className="font-bold text-sm text-amber-900 mb-1">
                As-Is Legacy System: Discovered Anti-Patterns & Bottlenecks
              </h3>
              <p className="leading-relaxed">
                Reverse-engineered dependency analysis discovered several architectural flaws in the legacy estate:
                bypassed governance tiers, direct staging queries, orphan ingestion pipelines, and unmanaged replica access.
              </p>
            </div>
          </div>

          {/* Anti-Patterns List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs mb-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Anti-Pattern 1: Direct Staging Query Bypass</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed mb-2">
                <code className="font-mono bg-white px-1 py-0.5 rounded border border-rose-200">
                  rpt_finance_general_ledger_recon
                </code>{' '}
                directly queries{' '}
                <code className="font-mono bg-white px-1 py-0.5 rounded border border-rose-200">
                  stg_payments_reconciled
                </code>{' '}
                instead of reading from curated financial marts.
              </p>
              <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-rose-100">
                <strong>Remediation:</strong> Route general ledger reconciliation through governed{' '}
                <code>agg_monthly_financials</code> mart to prevent reconciliation data drift.
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs mb-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Anti-Pattern 2: Unindexed Direct App Replica Read</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed mb-2">
                <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">
                  app_pos_mobile_terminal
                </code>{' '}
                issues direct SELECT queries against{' '}
                <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">
                  dim_product
                </code>{' '}
                over an unindexed read replica.
              </p>
              <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-amber-100">
                <strong>Remediation:</strong> Expose a cached Catalog API Gateway or Redis cache for mobile checkout latency.
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs mb-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Anti-Pattern 3: Orphan Ingestion Pipeline</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed mb-2">
                <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">
                  raw_support_tickets
                </code>{' '}
                is continuously ingested from Zendesk, but has zero downstream ETL jobs, reports, or models consuming it.
              </p>
              <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-amber-100">
                <strong>Remediation:</strong> Deprecate ingestion or attach a downstream customer sentiment model to prevent wasted compute.
              </div>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs mb-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Anti-Pattern 4: Stale Redundant Table Duplication</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed mb-2">
                <code className="font-mono bg-white px-1 py-0.5 rounded border border-rose-200">
                  stg_legacy_order_backup
                </code>{' '}
                is a 1:1 duplicate snapshot of{' '}
                <code className="font-mono bg-white px-1 py-0.5 rounded border border-rose-200">
                  stg_orders_normalized
                </code>{' '}
                with zero write traffic for 90+ days.
              </p>
              <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-rose-100">
                <strong>Remediation:</strong> Archive and drop the legacy backup table to reclaim database storage and reduce schema clutter.
              </div>
            </div>
          </div>

          {/* Legacy Silo Layout */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              As-Is Component Breakdown by Legacy System Silo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                <h4 className="font-bold text-xs text-slate-800 mb-2">CRM & Marketing Silo</h4>
                <div className="space-y-1.5 text-[11px] font-mono text-slate-700">
                  <div>• raw_customers_cdc</div>
                  <div>• raw_web_clickstream</div>
                  <div>• raw_support_tickets (orphan)</div>
                  <div>• stg_customers_cleaned</div>
                  <div>• dim_customer</div>
                  <div>• agg_customer_ltv</div>
                  <div>• rpt_customer_retention_cohorts</div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                <h4 className="font-bold text-xs text-slate-800 mb-2">POS & Payments Silo</h4>
                <div className="space-y-1.5 text-[11px] font-mono text-slate-700">
                  <div>• raw_orders_stream</div>
                  <div>• raw_payment_trans</div>
                  <div>• stg_orders_normalized</div>
                  <div>• stg_payments_reconciled</div>
                  <div>• stg_legacy_order_backup (duplicate)</div>
                  <div>• fact_sales</div>
                  <div>• rpt_finance_general_ledger_recon (direct bypass!)</div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                <h4 className="font-bold text-xs text-slate-800 mb-2">ERP & Fulfillment Silo</h4>
                <div className="space-y-1.5 text-[11px] font-mono text-slate-700">
                  <div>• raw_erp_inventory</div>
                  <div>• stg_inventory_levels</div>
                  <div>• dim_product</div>
                  <div>• dim_warehouse</div>
                  <div>• fact_inventory_daily</div>
                  <div>• rpt_inventory_shrinkage</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
