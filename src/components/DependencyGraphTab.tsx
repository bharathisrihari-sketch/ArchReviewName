import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Component, Dependency } from '../types/architecture';
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle, ShieldCheck, Filter, Search, Info, Check, Copy } from 'lucide-react';

interface DependencyGraphTabProps {
  components: Component[];
  dependencies: Dependency[];
  moduleAssignments: Record<string, number>; // componentId -> moduleId
  numModules?: number;
  onSelectComponentForLineage?: (comp: Component) => void;
}

const MODULE_COLORS = [
  { bg: '#3b82f6', lightBg: '#eff6ff', border: '#1d4ed8', text: '#1e40af', name: 'Module 0: Customer & Accounts' },
  { bg: '#10b981', lightBg: '#ecfdf5', border: '#047857', text: '#065f46', name: 'Module 1: Commerce & Orders' },
  { bg: '#8b5cf6', lightBg: '#f5f3ff', border: '#6d28d9', text: '#5b21b6', name: 'Module 2: Supply & Catalog' },
  { bg: '#f59e0b', lightBg: '#fffbeb', border: '#b45309', text: '#92400e', name: 'Module 3: Analytics & BI' },
  { bg: '#ec4899', lightBg: '#fdf2f8', border: '#be185d', text: '#9d174d', name: 'Module 4: Platform & Integrations' },
];

export const DependencyGraphTab: React.FC<DependencyGraphTabProps> = ({
  components,
  dependencies,
  moduleAssignments,
  numModules = 4,
  onSelectComponentForLineage,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<number | 'all'>('all');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Map components for quick lookup
  const compMap = useMemo(() => {
    const map = new Map<string, Component>();
    for (const c of components) {
      map.set(c.id, c);
      map.set(c.name, c);
    }
    return map;
  }, [components]);

  // Compute layout positions for nodes organized by module clusters or topological layers
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const n = components.length;
    if (n === 0) return positions;

    // Group nodes by module
    const moduleBuckets: Record<number, Component[]> = {};
    for (let m = 0; m < numModules; m++) moduleBuckets[m] = [];

    components.forEach((c) => {
      const mod = moduleAssignments[c.id] ?? (moduleAssignments[c.name] ?? 0);
      const safeMod = mod % numModules;
      moduleBuckets[safeMod] = moduleBuckets[safeMod] || [];
      moduleBuckets[safeMod].push(c);
    });

    // Center coordinates for module clusters
    const clusterCenters = [
      { x: 300, y: 250 },
      { x: 750, y: 250 },
      { x: 300, y: 650 },
      { x: 750, y: 650 },
      { x: 525, y: 450 },
    ];

    for (let m = 0; m < numModules; m++) {
      const center = clusterCenters[m % clusterCenters.length];
      const comps = moduleBuckets[m] || [];
      const count = comps.length;

      // Arrange nodes in a neat concentric or grid layout around cluster center
      comps.forEach((comp, idx) => {
        const radius = Math.min(180, 50 + Math.sqrt(idx) * 35);
        const angle = (idx / Math.max(1, count)) * 2 * Math.PI;
        const x = center.x + Math.cos(angle) * radius;
        const y = center.y + Math.sin(angle) * radius;
        positions.set(comp.id, { x: Math.round(x), y: Math.round(y) });
      });
    }

    return positions;
  }, [components, moduleAssignments, numModules]);

  // Selected node object
  const selectedComponent = selectedNodeId ? compMap.get(selectedNodeId) : null;

  // Inbound & Outbound for selected node
  const selectedNodeDetails = useMemo(() => {
    if (!selectedNodeId) return null;
    const inbound = dependencies.filter(
      (d) => d.target === selectedNodeId || compMap.get(d.target)?.id === selectedNodeId
    );
    const outbound = dependencies.filter(
      (d) => d.source === selectedNodeId || compMap.get(d.source)?.id === selectedNodeId
    );
    return { inbound, outbound };
  }, [selectedNodeId, dependencies, compMap]);

  // Handle pan & drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Legend, Search, Module Filter, Zoom */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Module Legend */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-indigo-600" />
            Modules (QUBO Partitions):
          </span>
          <button
            onClick={() => setSelectedModuleFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedModuleFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({components.length})
          </button>
          {Array.from({ length: numModules }).map((_, m) => {
            const colorDef = MODULE_COLORS[m % MODULE_COLORS.length];
            const count = components.filter(
              (c) => (moduleAssignments[c.id] ?? moduleAssignments[c.name] ?? 0) % numModules === m
            ).length;

            return (
              <button
                key={m}
                onClick={() => setSelectedModuleFilter(m)}
                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  selectedModuleFilter === m
                    ? 'ring-2 ring-slate-800'
                    : 'hover:opacity-90'
                }`}
                style={{
                  backgroundColor: colorDef.lightBg,
                  color: colorDef.text,
                  border: `1px solid ${colorDef.border}`,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: colorDef.bg }}
                />
                Module {m} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Zoom Buttons */}
        <div className="flex items-center space-x-3">
          <div className="relative w-48">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Highlight node..."
              className="w-full text-xs pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900"
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas & Detail Drawer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Interactive SVG Graph Area */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs h-[640px] overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
        >
          {/* Edge Type Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-xs p-2.5 rounded-lg border border-slate-200 shadow-xs text-[11px] text-slate-600 space-y-1.5 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 bg-slate-400 inline-block" />
              <span>Verified dependency (high confidence)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" />
              <span className="text-amber-800 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                "Needs review" flag (legacy bypass)
              </span>
            </div>
          </div>

          <svg
            className="w-full h-full"
            viewBox="0 0 1100 900"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '550px 450px',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <defs>
              <marker
                id="arrow-solid"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#4f46e5" />
              </marker>
              <marker
                id="arrow-amber"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#d97706" />
              </marker>
            </defs>

            {/* Background Cluster Zones */}
            {Array.from({ length: numModules }).map((_, m) => {
              const clusterCenters = [
                { x: 300, y: 250 },
                { x: 750, y: 250 },
                { x: 300, y: 650 },
                { x: 750, y: 650 },
                { x: 525, y: 450 },
              ];
              const center = clusterCenters[m % clusterCenters.length];
              const colorDef = MODULE_COLORS[m % MODULE_COLORS.length];
              return (
                <g key={`cluster-${m}`} className="pointer-events-none opacity-40">
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r={190}
                    fill={colorDef.lightBg}
                    stroke={colorDef.border}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={center.x}
                    y={center.y - 170}
                    textAnchor="middle"
                    fill={colorDef.text}
                    fontSize={11}
                    fontWeight="bold"
                  >
                    Module {m} Cluster
                  </text>
                </g>
              );
            })}

            {/* Dependency Edges */}
            {dependencies.map((dep) => {
              const sourcePos = nodePositions.get(dep.source) || nodePositions.get(compMap.get(dep.source)?.id || '');
              const targetPos = nodePositions.get(dep.target) || nodePositions.get(compMap.get(dep.target)?.id || '');
              if (!sourcePos || !targetPos) return null;

              const isConnectedToSelected =
                selectedNodeId &&
                (dep.source === selectedNodeId ||
                  dep.target === selectedNodeId ||
                  compMap.get(dep.source)?.id === selectedNodeId ||
                  compMap.get(dep.target)?.id === selectedNodeId);

              const isDimmed =
                (selectedModuleFilter !== 'all' &&
                  (moduleAssignments[dep.source] ?? 0) % numModules !== selectedModuleFilter &&
                  (moduleAssignments[dep.target] ?? 0) % numModules !== selectedModuleFilter) ||
                (selectedNodeId && !isConnectedToSelected);

              const isHovered = hoveredEdgeId === dep.id;

              return (
                <g
                  key={dep.id}
                  className="cursor-pointer transition-opacity"
                  opacity={isDimmed ? 0.15 : 1}
                  onMouseEnter={() => setHoveredEdgeId(dep.id)}
                  onMouseLeave={() => setHoveredEdgeId(null)}
                >
                  <line
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={
                      dep.needsReview
                        ? '#d97706'
                        : isConnectedToSelected
                        ? '#4f46e5'
                        : isHovered
                        ? '#0284c7'
                        : '#94a3b8'
                    }
                    strokeWidth={isConnectedToSelected || isHovered ? 2.5 : dep.needsReview ? 1.8 : 1.2}
                    strokeDasharray={dep.needsReview ? '5,4' : undefined}
                    markerEnd={
                      dep.needsReview
                        ? 'url(#arrow-amber)'
                        : isConnectedToSelected
                        ? 'url(#arrow-active)'
                        : 'url(#arrow-solid)'
                    }
                  />

                  {/* Edge Tooltip or Label on Hover / Selected */}
                  {(isHovered || isConnectedToSelected || dep.needsReview) && (
                    <g>
                      <rect
                        x={(sourcePos.x + targetPos.x) / 2 - 20}
                        y={(sourcePos.y + targetPos.y) / 2 - 9}
                        width={40}
                        height={16}
                        rx={4}
                        fill={dep.needsReview ? '#fffbeb' : '#f8fafc'}
                        stroke={dep.needsReview ? '#f59e0b' : '#cbd5e1'}
                        strokeWidth={1}
                      />
                      <text
                        x={(sourcePos.x + targetPos.x) / 2}
                        y={(sourcePos.y + targetPos.y) / 2 + 3}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight="bold"
                        fill={dep.needsReview ? '#b45309' : '#475569'}
                      >
                        {Math.round(dep.confidence * 100)}%
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {components.map((comp) => {
              const pos = nodePositions.get(comp.id);
              if (!pos) return null;

              const mod = (moduleAssignments[comp.id] ?? moduleAssignments[comp.name] ?? 0) % numModules;
              const colorDef = MODULE_COLORS[mod % MODULE_COLORS.length];
              const isSelected = selectedNodeId === comp.id;

              const isMatchSearch =
                searchQuery.trim().length > 0 &&
                (comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  comp.description.toLowerCase().includes(searchQuery.toLowerCase()));

              const isDimmed =
                (selectedModuleFilter !== 'all' && mod !== selectedModuleFilter) ||
                (searchQuery.trim().length > 0 && !isMatchSearch && !isSelected);

              return (
                <g
                  key={comp.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer"
                  opacity={isDimmed ? 0.2 : 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(comp.id === selectedNodeId ? null : comp.id);
                  }}
                >
                  {/* Outer halo if selected or matched search */}
                  {(isSelected || isMatchSearch) && (
                    <circle
                      r={18}
                      fill="none"
                      stroke={isSelected ? '#4f46e5' : '#0284c7'}
                      strokeWidth={3}
                      strokeDasharray={isSelected ? undefined : '3,3'}
                      className="animate-pulse"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={12}
                    fill={colorDef.bg}
                    stroke={isSelected ? '#1e1b4b' : '#ffffff'}
                    strokeWidth={2}
                    className="shadow-sm transition-transform hover:scale-125"
                  />

                  {/* Health Warning Badge if Unused or Duplicate */}
                  {(comp.isUnusedCandidate || comp.isDuplicateCandidate) && (
                    <circle
                      cx={9}
                      cy={-9}
                      r={5}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  )}

                  {/* Node Label */}
                  <text
                    y={22}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={isSelected ? 'bold' : '600'}
                    fill={isSelected ? '#1e1b4b' : '#334155'}
                    className="pointer-events-none font-mono"
                  >
                    {comp.name.length > 20 ? `${comp.name.slice(0, 18)}...` : comp.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Component Inspector Drawer */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between h-[640px] overflow-y-auto">
          {selectedComponent ? (
            <div className="space-y-4 text-xs">
              {/* Header */}
              <div className="pb-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-slate-500">
                    Selected Node Inspector
                  </span>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <h3 className="text-sm font-bold font-mono text-slate-900 mt-1 break-all">
                  {selectedComponent.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1.5">
                  <span className="capitalize px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                    {selectedComponent.type}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Layer: {selectedComponent.layer || 'n/a'}
                  </span>
                </div>
              </div>

              {/* Module Assignment */}
              <div className="p-2.5 rounded-lg border bg-slate-50 border-slate-200">
                <div className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>QUBO Module:</span>
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-bold"
                    style={{
                      backgroundColor:
                        MODULE_COLORS[
                          ((moduleAssignments[selectedComponent.id] ?? 0) % numModules) %
                            MODULE_COLORS.length
                        ].lightBg,
                      color:
                        MODULE_COLORS[
                          ((moduleAssignments[selectedComponent.id] ?? 0) % numModules) %
                            MODULE_COLORS.length
                        ].text,
                    }}
                  >
                    Module {(moduleAssignments[selectedComponent.id] ?? 0) % numModules}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Partitioned to minimize cross-module link cuts and keep balance.
                </p>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">Description:</h4>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                  {selectedComponent.description}
                </p>
              </div>

              {/* Inbound Dependencies */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Reads / Consumes From:</span>
                  <span className="text-slate-400 font-mono">
                    ({selectedNodeDetails?.inbound.length || 0})
                  </span>
                </h4>
                {selectedNodeDetails?.inbound.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No incoming links (source root component)</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedNodeDetails?.inbound.map((d) => (
                      <div
                        key={d.id}
                        className={`p-2 rounded border text-[11px] ${
                          d.needsReview ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-bold">
                          <span className="text-slate-800 truncate">{d.source}</span>
                          <span className={d.needsReview ? 'text-amber-700' : 'text-slate-500'}>
                            {Math.round(d.confidence * 100)}%
                          </span>
                        </div>
                        {d.needsReview && (
                          <div className="text-[10px] text-amber-800 mt-1 font-sans flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>Needs Review: {d.rationale}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outbound Dependencies */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Feeds / Supplies To:</span>
                  <span className="text-slate-400 font-mono">
                    ({selectedNodeDetails?.outbound.length || 0})
                  </span>
                </h4>
                {selectedNodeDetails?.outbound.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No outbound links (leaf sink / unused candidate)</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedNodeDetails?.outbound.map((d) => (
                      <div
                        key={d.id}
                        className={`p-2 rounded border text-[11px] ${
                          d.needsReview ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-bold">
                          <span className="text-slate-800 truncate">{d.target}</span>
                          <span className={d.needsReview ? 'text-amber-700' : 'text-slate-500'}>
                            {Math.round(d.confidence * 100)}%
                          </span>
                        </div>
                        {d.needsReview && (
                          <div className="text-[10px] text-amber-800 mt-1 font-sans flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>Needs Review: {d.rationale}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lineage Action for Reports */}
              {selectedComponent.type === 'report' && onSelectComponentForLineage && (
                <button
                  onClick={() => onSelectComponentForLineage(selectedComponent)}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-2xs text-xs"
                >
                  Trace Backward Lineage to Sources
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6">
              <Info className="h-8 w-8 text-slate-300 mb-2" />
              <h4 className="font-semibold text-slate-600 text-xs mb-1">
                Select Any Node
              </h4>
              <p className="text-[11px] leading-relaxed">
                Click a node on the canvas to inspect its module partition, incoming/outgoing dependencies, and confidence scores.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
