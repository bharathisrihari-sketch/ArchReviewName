import React, { useState, useMemo, useRef } from 'react';
import { Component, Dependency } from '../types/architecture';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Filter,
  Search,
  Info,
  Check,
  Flame,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface DependencyGraphTabProps {
  components: Component[];
  dependencies: Dependency[];
  moduleAssignments: Record<string, number>; // componentId -> moduleId
  numModules?: number;
  onSelectComponentForLineage?: (comp: Component) => void;
  onSelectComponentForImpact?: (comp: Component) => void;
}

const MODULE_COLORS = [
  { bg: '#38bdf8', lightBg: 'rgba(56, 189, 248, 0.12)', border: '#0284c7', text: '#38bdf8', name: 'Module 0: Customer & Accounts' },
  { bg: '#34d399', lightBg: 'rgba(52, 211, 153, 0.12)', border: '#059669', text: '#34d399', name: 'Module 1: Commerce & Orders' },
  { bg: '#a78bfa', lightBg: 'rgba(167, 139, 250, 0.12)', border: '#7c3aed', text: '#a78bfa', name: 'Module 2: Supply & Catalog' },
  { bg: '#fbbf24', lightBg: 'rgba(251, 191, 36, 0.12)', border: '#d97706', text: '#fbbf24', name: 'Module 3: Analytics & BI' },
  { bg: '#f472b6', lightBg: 'rgba(244, 114, 182, 0.12)', border: '#db2777', text: '#f472b6', name: 'Module 4: Platform & Integrations' },
];

export const DependencyGraphTab: React.FC<DependencyGraphTabProps> = ({
  components,
  dependencies,
  moduleAssignments,
  numModules = 4,
  onSelectComponentForLineage,
  onSelectComponentForImpact,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  // Compute Layout Positions
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const n = components.length;
    if (n === 0) return positions;

    const moduleBuckets: Record<number, Component[]> = {};
    for (let m = 0; m < numModules; m++) moduleBuckets[m] = [];

    components.forEach((c) => {
      const mod = (moduleAssignments[c.id] ?? moduleAssignments[c.name] ?? 0) % numModules;
      moduleBuckets[mod] = moduleBuckets[mod] || [];
      moduleBuckets[mod].push(c);
    });

    const clusterCenters = [
      { x: 300, y: 240 },
      { x: 750, y: 240 },
      { x: 300, y: 640 },
      { x: 750, y: 640 },
      { x: 525, y: 440 },
    ];

    for (let m = 0; m < numModules; m++) {
      const center = clusterCenters[m % clusterCenters.length];
      const comps = moduleBuckets[m] || [];
      const count = comps.length;

      comps.forEach((comp, idx) => {
        const radius = Math.min(180, 50 + Math.sqrt(idx) * 36);
        const angle = (idx / Math.max(1, count)) * 2 * Math.PI;
        const x = center.x + Math.cos(angle) * radius;
        const y = center.y + Math.sin(angle) * radius;
        positions.set(comp.id, { x: Math.round(x), y: Math.round(y) });
      });
    }

    return positions;
  }, [components, moduleAssignments, numModules]);

  // Neighborhood search calculation: finds matched node AND all direct upstream/downstream neighbors!
  const searchNeighborhood = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();

    const matchedComponents = components.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );

    if (matchedComponents.length === 0) return null;

    const matchedIds = new Set(matchedComponents.map((c) => c.id));
    const upstreamNeighbors = new Set<string>();
    const downstreamNeighbors = new Set<string>();

    dependencies.forEach((dep) => {
      const sComp = compMap.get(dep.source);
      const tComp = compMap.get(dep.target);
      if (!sComp || !tComp) return;

      // If target is matched, source is an upstream neighbor!
      if (matchedIds.has(tComp.id) && !matchedIds.has(sComp.id)) {
        upstreamNeighbors.add(sComp.id);
      }
      // If source is matched, target is a downstream neighbor!
      if (matchedIds.has(sComp.id) && !matchedIds.has(tComp.id)) {
        downstreamNeighbors.add(tComp.id);
      }
    });

    const allHighlightedIds = new Set([...matchedIds, ...upstreamNeighbors, ...downstreamNeighbors]);

    return {
      query: searchQuery,
      matches: matchedComponents,
      matchedIds,
      upstream: Array.from(upstreamNeighbors).map((id) => compMap.get(id)!).filter(Boolean),
      downstream: Array.from(downstreamNeighbors).map((id) => compMap.get(id)!).filter(Boolean),
      allHighlightedIds,
    };
  }, [searchQuery, components, dependencies, compMap]);

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
    setSelectedNodeId(null);
    setSearchQuery('');
  };

  return (
    <div className="space-y-4 text-zinc-100">
      {/* Control Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Module Legend */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400 mr-1 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-indigo-400" />
            QUBO Partitions:
          </span>
          <button
            onClick={() => setSelectedModuleFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              selectedModuleFilter === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
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
                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedModuleFilter === m ? 'ring-2 ring-white/60 font-bold' : 'hover:opacity-90'
                }`}
                style={{
                  backgroundColor: colorDef.lightBg,
                  color: colorDef.text,
                  border: `1px solid ${colorDef.border}`,
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorDef.bg }} />
                Module {m} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Bar & Zoom Controls */}
        <div className="flex items-center space-x-3">
          <div className="relative w-64">
            <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search node + neighbors (e.g. sales)..."
              className="w-full text-xs pl-8 pr-7 py-1.5 bg-zinc-950 border border-zinc-700 text-zinc-200 placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas & Detail Drawer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Interactive SVG Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="lg:col-span-3 bg-black rounded-xl border border-zinc-800 shadow-2xl h-[650px] overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
        >
          {/* SEARCH/FILTER NEIGHBORHOOD OVERLAY HUD */}
          {searchNeighborhood && (
            <div className="absolute top-3 left-3 z-20 bg-zinc-900/95 backdrop-blur-md p-3.5 rounded-xl border border-indigo-500/40 shadow-2xl max-w-sm text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                  <Sparkles className="h-4 w-4" />
                  <span>Neighborhood Filter Active</span>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-zinc-400 hover:text-white text-xs cursor-pointer p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="text-[11px] text-zinc-300">
                Showing match &amp; immediate 1st-degree neighbors for{' '}
                <strong className="text-white font-mono">"{searchNeighborhood.query}"</strong>:
              </div>

              {/* Matched Node */}
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-300 block mb-1">
                  Direct Target Match ({searchNeighborhood.matches.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {searchNeighborhood.matches.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedNodeId(m.id)}
                      className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/50 text-indigo-200 font-mono text-[10px] cursor-pointer"
                    >
                      ★ {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upstream Neighbors */}
              {searchNeighborhood.upstream.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1 flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Upstream Feeds ({searchNeighborhood.upstream.length}):
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {searchNeighborhood.upstream.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedNodeId(u.id)}
                        className="px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 font-mono text-[10px] cursor-pointer"
                      >
                        {u.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Downstream Neighbors */}
              {searchNeighborhood.downstream.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1 flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" /> Downstream Consumers ({searchNeighborhood.downstream.length}):
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {searchNeighborhood.downstream.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedNodeId(d.id)}
                        className="px-1.5 py-0.5 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-300 font-mono text-[10px] cursor-pointer"
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edge Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-10 bg-zinc-900/90 backdrop-blur-xs p-2.5 rounded-lg border border-zinc-800 text-[11px] text-zinc-400 space-y-1.5 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 bg-zinc-600 inline-block" />
              <span>Verified dependency (high confidence)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" />
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
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
                id="dark-arrow-solid"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#52525b" />
              </marker>
              <marker
                id="dark-arrow-active"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8" />
              </marker>
              <marker
                id="dark-arrow-amber"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Cluster Zones */}
            {Array.from({ length: numModules }).map((_, m) => {
              const clusterCenters = [
                { x: 300, y: 240 },
                { x: 750, y: 240 },
                { x: 300, y: 640 },
                { x: 750, y: 640 },
                { x: 525, y: 440 },
              ];
              const center = clusterCenters[m % clusterCenters.length];
              const colorDef = MODULE_COLORS[m % MODULE_COLORS.length];
              return (
                <g key={`cluster-${m}`} className="pointer-events-none opacity-25">
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

            {/* Edges */}
            {dependencies.map((dep) => {
              const sourcePos = nodePositions.get(dep.source) || nodePositions.get(compMap.get(dep.source)?.id || '');
              const targetPos = nodePositions.get(dep.target) || nodePositions.get(compMap.get(dep.target)?.id || '');
              if (!sourcePos || !targetPos) return null;

              const sId = compMap.get(dep.source)?.id || dep.source;
              const tId = compMap.get(dep.target)?.id || dep.target;

              const isConnectedToSelected =
                selectedNodeId && (sId === selectedNodeId || tId === selectedNodeId);

              // Neighborhood check
              const isNeighborhoodEdge =
                searchNeighborhood &&
                searchNeighborhood.allHighlightedIds.has(sId) &&
                searchNeighborhood.allHighlightedIds.has(tId);

              const isDimmed =
                (searchNeighborhood && !isNeighborhoodEdge) ||
                (selectedModuleFilter !== 'all' &&
                  (moduleAssignments[sId] ?? 0) % numModules !== selectedModuleFilter &&
                  (moduleAssignments[tId] ?? 0) % numModules !== selectedModuleFilter) ||
                (selectedNodeId && !isConnectedToSelected && !searchNeighborhood);

              const isHovered = hoveredEdgeId === dep.id;

              return (
                <g
                  key={dep.id}
                  className="cursor-pointer transition-opacity"
                  opacity={isDimmed ? 0.08 : 1}
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
                        ? '#f59e0b'
                        : isConnectedToSelected || isNeighborhoodEdge
                        ? '#818cf8'
                        : isHovered
                        ? '#38bdf8'
                        : '#52525b'
                    }
                    strokeWidth={isConnectedToSelected || isNeighborhoodEdge || isHovered ? 2.5 : dep.needsReview ? 1.8 : 1.2}
                    strokeDasharray={dep.needsReview ? '5,4' : undefined}
                    markerEnd={
                      dep.needsReview
                        ? 'url(#dark-arrow-amber)'
                        : isConnectedToSelected || isNeighborhoodEdge
                        ? 'url(#dark-arrow-active)'
                        : 'url(#dark-arrow-solid)'
                    }
                  />

                  {/* Confidence Pill on hover or review */}
                  {(isHovered || isConnectedToSelected || isNeighborhoodEdge || dep.needsReview) && (
                    <g>
                      <rect
                        x={(sourcePos.x + targetPos.x) / 2 - 20}
                        y={(sourcePos.y + targetPos.y) / 2 - 9}
                        width={40}
                        height={16}
                        rx={4}
                        fill={dep.needsReview ? '#451a03' : '#18181b'}
                        stroke={dep.needsReview ? '#f59e0b' : '#3f3f46'}
                        strokeWidth={1}
                      />
                      <text
                        x={(sourcePos.x + targetPos.x) / 2}
                        y={(sourcePos.y + targetPos.y) / 2 + 3}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight="bold"
                        fill={dep.needsReview ? '#fde68a' : '#e4e4e7'}
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

              // Neighborhood status
              const isDirectMatch = searchNeighborhood?.matchedIds.has(comp.id);
              const isUpstreamNeighbor = searchNeighborhood?.upstream.some((u) => u.id === comp.id);
              const isDownstreamNeighbor = searchNeighborhood?.downstream.some((d) => d.id === comp.id);
              const isNeighborhoodHighlighted = isDirectMatch || isUpstreamNeighbor || isDownstreamNeighbor;

              const isDimmed =
                (searchNeighborhood && !isNeighborhoodHighlighted) ||
                (selectedModuleFilter !== 'all' && mod !== selectedModuleFilter && !searchNeighborhood);

              return (
                <g
                  key={comp.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer"
                  opacity={isDimmed ? 0.12 : 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(comp.id === selectedNodeId ? null : comp.id);
                  }}
                >
                  {/* Glowing halo for direct match or selected */}
                  {(isSelected || isDirectMatch) && (
                    <circle
                      r={20}
                      fill="none"
                      stroke={isDirectMatch ? '#818cf8' : '#38bdf8'}
                      strokeWidth={3}
                      className="animate-pulse"
                    />
                  )}

                  {/* Halo for neighbor */}
                  {(isUpstreamNeighbor || isDownstreamNeighbor) && !isDirectMatch && (
                    <circle
                      r={18}
                      fill="none"
                      stroke={isUpstreamNeighbor ? '#22d3ee' : '#c084fc'}
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={12}
                    fill={colorDef.bg}
                    stroke={isSelected || isDirectMatch ? '#ffffff' : '#18181b'}
                    strokeWidth={2}
                    className="shadow-md transition-transform hover:scale-125"
                  />

                  {/* Warning Badge */}
                  {(comp.isUnusedCandidate || comp.isDuplicateCandidate) && (
                    <circle cx={9} cy={-9} r={5} fill="#f59e0b" stroke="#000000" strokeWidth={1.5} />
                  )}

                  {/* Node Label */}
                  <text
                    y={22}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={isSelected || isDirectMatch ? 'bold' : '600'}
                    fill={
                      isDirectMatch
                        ? '#818cf8'
                        : isUpstreamNeighbor
                        ? '#22d3ee'
                        : isDownstreamNeighbor
                        ? '#c084fc'
                        : isSelected
                        ? '#ffffff'
                        : '#d4d4d8'
                    }
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-4 flex flex-col justify-between h-[650px] overflow-y-auto">
          {selectedComponent ? (
            <div className="space-y-4 text-xs">
              {/* Header */}
              <div className="pb-3 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-zinc-500">
                    Component Inspector
                  </span>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-zinc-400 hover:text-white font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <h3 className="text-sm font-bold font-mono text-white mt-1 break-all">
                  {selectedComponent.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1.5">
                  <span className="capitalize px-2 py-0.5 rounded bg-zinc-800 font-semibold text-zinc-300">
                    {selectedComponent.type}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400">
                    Layer: {selectedComponent.layer || 'n/a'}
                  </span>
                </div>
              </div>

              {/* Module Assignment */}
              <div className="p-2.5 rounded-lg border bg-zinc-950/60 border-zinc-800">
                <div className="font-semibold text-zinc-300 flex items-center justify-between">
                  <span>QUBO Partition:</span>
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
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-zinc-400 mb-1">Description:</h4>
                <p className="text-zinc-300 bg-zinc-950 p-2.5 rounded border border-zinc-800 leading-relaxed">
                  {selectedComponent.description}
                </p>
              </div>

              {/* Inbound Dependencies */}
              <div>
                <h4 className="font-semibold text-zinc-400 mb-1.5 flex items-center justify-between">
                  <span>Reads / Consumes From:</span>
                  <span className="text-zinc-500 font-mono">
                    ({selectedNodeDetails?.inbound.length || 0})
                  </span>
                </h4>
                {selectedNodeDetails?.inbound.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic">No incoming links (source root component)</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedNodeDetails?.inbound.map((d) => (
                      <div
                        key={d.id}
                        className={`p-2 rounded border text-[11px] ${
                          d.needsReview ? 'bg-amber-950/30 border-amber-500/40' : 'bg-zinc-950 border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-bold">
                          <span className="text-zinc-200 truncate">{d.source}</span>
                          <span className={d.needsReview ? 'text-amber-400' : 'text-zinc-400'}>
                            {Math.round(d.confidence * 100)}%
                          </span>
                        </div>
                        {d.needsReview && (
                          <div className="text-[10px] text-amber-300 mt-1 font-sans flex items-start gap-1">
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
                <h4 className="font-semibold text-zinc-400 mb-1.5 flex items-center justify-between">
                  <span>Feeds / Supplies To:</span>
                  <span className="text-zinc-500 font-mono">
                    ({selectedNodeDetails?.outbound.length || 0})
                  </span>
                </h4>
                {selectedNodeDetails?.outbound.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic">No outbound links (leaf sink / unused candidate)</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedNodeDetails?.outbound.map((d) => (
                      <div
                        key={d.id}
                        className={`p-2 rounded border text-[11px] ${
                          d.needsReview ? 'bg-amber-950/30 border-amber-500/40' : 'bg-zinc-950 border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-bold">
                          <span className="text-zinc-200 truncate">{d.target}</span>
                          <span className={d.needsReview ? 'text-amber-400' : 'text-zinc-400'}>
                            {Math.round(d.confidence * 100)}%
                          </span>
                        </div>
                        {d.needsReview && (
                          <div className="text-[10px] text-amber-300 mt-1 font-sans flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>Needs Review: {d.rationale}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {selectedComponent.type === 'report' && onSelectComponentForLineage && (
                  <button
                    onClick={() => onSelectComponentForLineage(selectedComponent)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Trace Backward Lineage to Sources
                  </button>
                )}

                {(selectedComponent.type === 'table' || selectedComponent.type === 'view') && onSelectComponentForImpact && (
                  <button
                    onClick={() => onSelectComponentForImpact(selectedComponent)}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Flame className="h-3.5 w-3.5" />
                    Simulate Deletion Blast Radius
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 p-6">
              <Info className="h-8 w-8 text-zinc-600 mb-2" />
              <h4 className="font-semibold text-zinc-400 text-xs mb-1">Select Any Node</h4>
              <p className="text-[11px] leading-relaxed">
                Click a node or type in the search bar above to highlight components and their immediate upstream/downstream neighbors.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
