import React, { useState, useMemo } from 'react';
import { Component, ComponentType, Dependency } from '../types/architecture';
import { Table, Database, Cog, BarChart3, Smartphone, Search, AlertCircle, Copy, Check, Eye, HelpCircle, Filter } from 'lucide-react';

interface InventoryTabProps {
  components: Component[];
  dependencies: Dependency[];
  onSelectComponentForLineage?: (comp: Component) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  components,
  dependencies,
  onSelectComponentForLineage,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFlagsOnly, setFilterFlagsOnly] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Pre-calculate inbound and outbound counts for each component
  const linkCounts = useMemo(() => {
    const inbound = new Map<string, number>();
    const outbound = new Map<string, number>();

    for (const dep of dependencies) {
      outbound.set(dep.source, (outbound.get(dep.source) || 0) + 1);
      inbound.set(dep.target, (inbound.get(dep.target) || 0) + 1);
    }

    return { inbound, outbound };
  }, [dependencies]);

  // Filtered components
  const filteredComponents = useMemo(() => {
    return components.filter((comp) => {
      // Type filter
      if (selectedType !== 'all') {
        if (selectedType === 'table' && comp.type !== 'table' && comp.type !== 'view') return false;
        if (selectedType === 'job' && comp.type !== 'job') return false;
        if (selectedType === 'report' && comp.type !== 'report') return false;
        if (selectedType === 'app' && comp.type !== 'app') return false;
      }

      // Flags only filter
      if (filterFlagsOnly && !comp.isUnusedCandidate && !comp.isDuplicateCandidate) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = comp.name.toLowerCase().includes(q);
        const matchesDesc = comp.description.toLowerCase().includes(q);
        const matchesTags = comp.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTags) return false;
      }

      return true;
    });
  }, [components, selectedType, filterFlagsOnly, searchQuery]);

  const countsByType = useMemo(() => {
    return {
      all: components.length,
      table: components.filter((c) => c.type === 'table' || c.type === 'view').length,
      job: components.filter((c) => c.type === 'job').length,
      report: components.filter((c) => c.type === 'report').length,
      app: components.filter((c) => c.type === 'app').length,
      flagged: components.filter((c) => c.isUnusedCandidate || c.isDuplicateCandidate).length,
    };
  }, [components]);

  const getTypeIcon = (type: ComponentType) => {
    switch (type) {
      case 'table':
      case 'view':
        return <Database className="h-4 w-4 text-sky-600" />;
      case 'job':
        return <Cog className="h-4 w-4 text-purple-600" />;
      case 'report':
        return <BarChart3 className="h-4 w-4 text-emerald-600" />;
      case 'app':
        return <Smartphone className="h-4 w-4 text-amber-600" />;
      default:
        return <Table className="h-4 w-4 text-slate-600" />;
    }
  };

  const getLayerBadge = (layer?: string) => {
    switch (layer) {
      case 'source':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">1. Source / Lake</span>;
      case 'staging':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">2. Staging</span>;
      case 'curated':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">3. Curated Mart</span>;
      case 'reporting':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">4. Reporting</span>;
      case 'apps':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">5. Applications</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">Unassigned</span>;
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Filter Pills & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => { setSelectedType('all'); setFilterFlagsOnly(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedType === 'all' && !filterFlagsOnly
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Components ({countsByType.all})
          </button>
          <button
            onClick={() => { setSelectedType('table'); setFilterFlagsOnly(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'table' && !filterFlagsOnly
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/50'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Tables ({countsByType.table})
          </button>
          <button
            onClick={() => { setSelectedType('job'); setFilterFlagsOnly(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'job' && !filterFlagsOnly
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/50'
            }`}
          >
            <Cog className="h-3.5 w-3.5" />
            ETL Jobs ({countsByType.job})
          </button>
          <button
            onClick={() => { setSelectedType('report'); setFilterFlagsOnly(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'report' && !filterFlagsOnly
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/50'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Reports ({countsByType.report})
          </button>
          <button
            onClick={() => { setSelectedType('app'); setFilterFlagsOnly(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'app' && !filterFlagsOnly
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/50'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Apps ({countsByType.app})
          </button>
          <button
            onClick={() => setFilterFlagsOnly(!filterFlagsOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterFlagsOnly
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            Flagged Review ({countsByType.flagged})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search component name, description..."
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Target Layer</th>
                <th className="py-3 px-3 text-center">Inbound</th>
                <th className="py-3 px-3 text-center">Outbound</th>
                <th className="py-3 px-4">Health & Governance Flags</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
              {filteredComponents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No components match your current filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredComponents.map((comp) => {
                  const inbound = linkCounts.inbound.get(comp.id) || linkCounts.inbound.get(comp.name) || 0;
                  const outbound = linkCounts.outbound.get(comp.id) || linkCounts.outbound.get(comp.name) || 0;

                  return (
                    <tr
                      key={comp.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedComponent(comp)}
                    >
                      {/* Name & Description */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-1.5 rounded-md bg-slate-100 border border-slate-200 shrink-0">
                            {getTypeIcon(comp.type)}
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {comp.name}
                            </span>
                            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-sm mt-0.5">
                              {comp.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3">
                        <span className="capitalize font-medium text-slate-700">
                          {comp.type}
                        </span>
                      </td>

                      {/* Target Layer */}
                      <td className="py-3 px-3">
                        {getLayerBadge(comp.layer)}
                      </td>

                      {/* Inbound count */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono font-medium text-[11px] ${
                          inbound > 0 ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {inbound}
                        </span>
                      </td>

                      {/* Outbound count */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono font-medium text-[11px] ${
                          outbound > 0 ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {outbound}
                        </span>
                      </td>

                      {/* Flags & Warnings */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {comp.isUnusedCandidate ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                              <AlertCircle className="h-3 w-3 text-amber-600" />
                              Unused Candidate
                            </span>
                          ) : comp.isDuplicateCandidate ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-300">
                              <AlertCircle className="h-3 w-3 text-rose-600" />
                              Duplicate Candidate
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active Pipeline
                            </span>
                          )}
                          {comp.notes && (
                            <span className="text-[10px] text-slate-400 hidden xl:inline-block italic truncate max-w-xs">
                              {comp.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {comp.type === 'report' && onSelectComponentForLineage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectComponentForLineage(comp);
                              }}
                              className="px-2 py-1 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                              title="Trace Lineage"
                            >
                              Trace Lineage
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedComponent(comp);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="View Component Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Component Details Modal */}
      {selectedComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                  {getTypeIcon(selectedComponent.type)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-mono">
                    {selectedComponent.name}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="capitalize text-xs font-semibold text-slate-600">
                      {selectedComponent.type}
                    </span>
                    <span>•</span>
                    {getLayerBadge(selectedComponent.layer)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedComponent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-md hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Description</h4>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedComponent.description}
                </p>
              </div>

              {/* Warnings / Governance Flags */}
              {(selectedComponent.isUnusedCandidate || selectedComponent.isDuplicateCandidate || selectedComponent.notes) && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800 mb-1">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Architecture Health Advisory:
                  </div>
                  {selectedComponent.isUnusedCandidate && (
                    <p className="mt-1">
                      ⚠️ <strong>Unused Candidate:</strong> Zero downstream consumers detected. Consider deprecation or archiving to reduce estate footprint.
                    </p>
                  )}
                  {selectedComponent.isDuplicateCandidate && (
                    <p className="mt-1">
                      ⚠️ <strong>Duplicate Candidate:</strong> Identified redundant copy (matches {selectedComponent.duplicateOf || 'another schema'}). Candidate for consolidation.
                    </p>
                  )}
                  {selectedComponent.notes && (
                    <p className="mt-1 text-slate-700 italic">
                      Note: {selectedComponent.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Source Code / Schema Snippet */}
              {selectedComponent.sourceCodeSnippet && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-1">
                      <Table className="h-3.5 w-3.5 text-indigo-600" />
                      Recovered Artifact Definition:
                    </h4>
                    <button
                      onClick={() => copyCode(selectedComponent.sourceCodeSnippet!)}
                      className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                    >
                      {copiedSnippet ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      {copiedSnippet ? 'Copied' : 'Copy snippet'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48">
                    {selectedComponent.sourceCodeSnippet}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              {selectedComponent.type === 'report' && onSelectComponentForLineage ? (
                <button
                  onClick={() => {
                    onSelectComponentForLineage(selectedComponent);
                    setSelectedComponent(null);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-xs"
                >
                  Trace Full Backward Lineage
                </button>
              ) : <div />}
              <button
                onClick={() => setSelectedComponent(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
