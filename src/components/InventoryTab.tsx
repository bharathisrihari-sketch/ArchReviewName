import React, { useState, useMemo } from 'react';
import { Component, ComponentType, Dependency } from '../types/architecture';
import { Table, Database, Cog, BarChart3, Smartphone, Search, AlertCircle, Copy, Check, Eye, Flame } from 'lucide-react';

interface InventoryTabProps {
  components: Component[];
  dependencies: Dependency[];
  onSelectComponentForLineage?: (comp: Component) => void;
  onSelectComponentForImpact?: (comp: Component) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  components,
  dependencies,
  onSelectComponentForLineage,
  onSelectComponentForImpact,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFlagsOnly, setFilterFlagsOnly] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Link counts
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
      if (selectedType !== 'all') {
        if (selectedType === 'table' && comp.type !== 'table' && comp.type !== 'view') return false;
        if (selectedType === 'job' && comp.type !== 'job') return false;
        if (selectedType === 'report' && comp.type !== 'report') return false;
        if (selectedType === 'app' && comp.type !== 'app') return false;
      }

      if (filterFlagsOnly && !comp.isUnusedCandidate && !comp.isDuplicateCandidate) {
        return false;
      }

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
        return <Database className="h-4 w-4 text-sky-400" />;
      case 'job':
        return <Cog className="h-4 w-4 text-purple-400" />;
      case 'report':
        return <BarChart3 className="h-4 w-4 text-emerald-400" />;
      case 'app':
        return <Smartphone className="h-4 w-4 text-amber-400" />;
      default:
        return <Table className="h-4 w-4 text-zinc-400" />;
    }
  };

  const getLayerBadge = (layer?: string) => {
    switch (layer) {
      case 'source':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-950/80 text-sky-300 border border-sky-800/80">1. Source Lake</span>;
      case 'staging':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">2. Staging</span>;
      case 'curated':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">3. Curated Mart</span>;
      case 'reporting':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800/80">4. Reporting</span>;
      case 'apps':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-950/80 text-purple-300 border border-purple-800/80">5. Applications</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400">Unassigned</span>;
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-4 text-zinc-100">
      {/* Top Filter Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => { setSelectedType('all'); setFilterFlagsOnly(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedType === 'all' && !filterFlagsOnly
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            All Components ({countsByType.all})
          </button>
          <button
            onClick={() => { setSelectedType('table'); setFilterFlagsOnly(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'table' && !filterFlagsOnly
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-zinc-950 text-sky-400 hover:bg-sky-950/40 border border-zinc-800'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Tables ({countsByType.table})
          </button>
          <button
            onClick={() => { setSelectedType('job'); setFilterFlagsOnly(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'job' && !filterFlagsOnly
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-zinc-950 text-purple-400 hover:bg-purple-950/40 border border-zinc-800'
            }`}
          >
            <Cog className="h-3.5 w-3.5" />
            ETL Jobs ({countsByType.job})
          </button>
          <button
            onClick={() => { setSelectedType('report'); setFilterFlagsOnly(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'report' && !filterFlagsOnly
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-zinc-950 text-emerald-400 hover:bg-emerald-950/40 border border-zinc-800'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Reports ({countsByType.report})
          </button>
          <button
            onClick={() => { setSelectedType('app'); setFilterFlagsOnly(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedType === 'app' && !filterFlagsOnly
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-zinc-950 text-amber-400 hover:bg-amber-950/40 border border-zinc-800'
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
                : 'bg-amber-950/40 text-amber-400 border border-amber-800/80'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Flagged Review ({countsByType.flagged})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search component..."
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-700 text-zinc-200 placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Component</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Target Layer</th>
                <th className="py-3 px-3 text-center">Inbound</th>
                <th className="py-3 px-3 text-center">Outbound</th>
                <th className="py-3 px-4">Governance Flags</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 font-sans">
              {filteredComponents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No components match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredComponents.map((comp) => {
                  const inbound = linkCounts.inbound.get(comp.id) || linkCounts.inbound.get(comp.name) || 0;
                  const outbound = linkCounts.outbound.get(comp.id) || linkCounts.outbound.get(comp.name) || 0;

                  return (
                    <tr
                      key={comp.id}
                      className="hover:bg-zinc-800/60 transition-colors group cursor-pointer"
                      onClick={() => setSelectedComponent(comp)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-1.5 rounded-md bg-zinc-950 border border-zinc-800 shrink-0">
                            {getTypeIcon(comp.type)}
                          </div>
                          <div>
                            <span className="font-mono font-bold text-white group-hover:text-indigo-400 transition-colors">
                              {comp.name}
                            </span>
                            <p className="text-[11px] text-zinc-400 line-clamp-1 max-w-sm mt-0.5">
                              {comp.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 capitalize text-zinc-300 font-medium">
                        {comp.type}
                      </td>

                      <td className="py-3 px-3">
                        {getLayerBadge(comp.layer)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono font-medium text-[11px] ${
                          inbound > 0 ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-950 text-zinc-500'
                        }`}>
                          {inbound}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono font-medium text-[11px] ${
                          outbound > 0 ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-950 text-zinc-500'
                        }`}>
                          {outbound}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {comp.isUnusedCandidate ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
                              <AlertCircle className="h-3 w-3 text-amber-400" />
                              Unused Candidate
                            </span>
                          ) : comp.isDuplicateCandidate ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/80">
                              <AlertCircle className="h-3 w-3 text-rose-400" />
                              Duplicate Candidate
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                              Active Pipeline
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {comp.type === 'report' && onSelectComponentForLineage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectComponentForLineage(comp);
                              }}
                              className="px-2 py-1 rounded text-[11px] font-medium bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 transition-colors"
                              title="Trace Lineage"
                            >
                              Lineage
                            </button>
                          )}
                          {(comp.type === 'table' || comp.type === 'view') && onSelectComponentForImpact && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectComponentForImpact(comp);
                              }}
                              className="px-2 py-1 rounded text-[11px] font-medium bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-colors flex items-center gap-1"
                              title="Simulate Drop Impact"
                            >
                              <Flame className="h-3 w-3 text-rose-400" />
                              Blast Radius
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedComponent(comp);
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto text-zinc-100">
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  {getTypeIcon(selectedComponent.type)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    {selectedComponent.name}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="capitalize text-xs font-semibold text-zinc-400">
                      {selectedComponent.type}
                    </span>
                    <span>•</span>
                    {getLayerBadge(selectedComponent.layer)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedComponent(null)}
                className="text-zinc-400 hover:text-white text-lg font-bold p-1 rounded-md hover:bg-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-zinc-400 mb-1">Description</h4>
                <p className="text-zinc-200 bg-zinc-950 p-3 rounded-lg border border-zinc-800 leading-relaxed">
                  {selectedComponent.description}
                </p>
              </div>

              {(selectedComponent.isUnusedCandidate || selectedComponent.isDuplicateCandidate || selectedComponent.notes) && (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/80 text-amber-200">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300 mb-1">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    Architecture Health Advisory:
                  </div>
                  {selectedComponent.isUnusedCandidate && (
                    <p className="mt-1">
                      ⚠️ <strong>Unused Candidate:</strong> Zero downstream consumers. Consider retiring to save storage/compute.
                    </p>
                  )}
                  {selectedComponent.isDuplicateCandidate && (
                    <p className="mt-1">
                      ⚠️ <strong>Duplicate Candidate:</strong> Identified redundant copy. Candidate for consolidation.
                    </p>
                  )}
                  {selectedComponent.notes && (
                    <p className="mt-1 text-zinc-400 italic">Note: {selectedComponent.notes}</p>
                  )}
                </div>
              )}

              {selectedComponent.sourceCodeSnippet && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-semibold text-zinc-400">Recovered Code Definition:</h4>
                    <button
                      onClick={() => copyCode(selectedComponent.sourceCodeSnippet!)}
                      className="text-[11px] font-medium text-zinc-400 hover:text-indigo-400 flex items-center gap-1"
                    >
                      {copiedSnippet ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedSnippet ? 'Copied' : 'Copy snippet'}
                    </button>
                  </div>
                  <pre className="p-3 bg-black text-zinc-200 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48 border border-zinc-800">
                    {selectedComponent.sourceCodeSnippet}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {selectedComponent.type === 'report' && onSelectComponentForLineage && (
                  <button
                    onClick={() => {
                      onSelectComponentForLineage(selectedComponent);
                      setSelectedComponent(null);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs"
                  >
                    Trace Backward Lineage
                  </button>
                )}
                {(selectedComponent.type === 'table' || selectedComponent.type === 'view') && onSelectComponentForImpact && (
                  <button
                    onClick={() => {
                      onSelectComponentForImpact(selectedComponent);
                      setSelectedComponent(null);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5"
                  >
                    <Flame className="h-3.5 w-3.5" />
                    Simulate Deletion Blast Radius
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedComponent(null)}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg font-medium hover:bg-zinc-700 text-xs"
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
