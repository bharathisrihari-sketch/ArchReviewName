import { ArchitectureModel, Component, Dependency } from '../types/architecture';

/**
 * Generates valid mxGraphModel XML for Draw.io (diagrams.net)
 */
export function generateDrawioXML(model: ArchitectureModel, mode: 'to-be' | 'as-is' = 'to-be'): string {
  const sanitize = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const layers = [
    { key: 'apps', name: 'Layer 5: Applications & API Interfaces', y: 40, fill: '#f3e8ff', stroke: '#c084fc' },
    { key: 'reporting', name: 'Layer 4: BI & Analytics Consumption', y: 180, fill: '#fef3c7', stroke: '#fbbf24' },
    { key: 'curated', name: 'Layer 3: Core Conformed Marts & Star Schemas', y: 320, fill: '#d1fae5', stroke: '#34d399' },
    { key: 'staging', name: 'Layer 2: Staging & Data Cleansing', y: 460, fill: '#e0e7ff', stroke: '#818cf8' },
    { key: 'source', name: 'Layer 1: Ingestion & Raw CDC Lake', y: 600, fill: '#e0f2fe', stroke: '#38bdf8' },
  ];

  let cellXml = '';
  let cellIdCounter = 2;
  const compCellMap = new Map<string, number>();

  // 1. Draw Layer Containers
  layers.forEach((layer) => {
    const layerCellId = cellIdCounter++;
    const comps = model.components.filter((c) => c.layer === layer.key);

    cellXml += `
      <mxCell id="${layerCellId}" value="${sanitize(layer.name)} (${comps.length})" style="swimlane;startSize=26;fillColor=${layer.fill};strokeColor=${layer.stroke};fontStyle=1;fontSize=12;rounded=1;arcSize=8;collapsible=0;" vertex="1" parent="1">
        <mxGeometry x="40" y="${layer.y}" width="1020" height="110" as="geometry"/>
      </mxCell>`;

    // Add component cells inside the layer
    comps.slice(0, 8).forEach((comp, idx) => {
      const compCellId = cellIdCounter++;
      compCellMap.set(comp.id, compCellId);
      compCellMap.set(comp.name, compCellId);

      const x = 20 + idx * 122;
      const y = 35;
      const style =
        comp.isUnusedCandidate || comp.isDuplicateCandidate
          ? 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fffbeb;strokeColor=#f59e0b;fontSize=10;fontFamily=monospace;fontStyle=1;'
          : 'rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#94a3b8;fontSize=10;fontFamily=monospace;fontStyle=1;';

      const alert = comp.isUnusedCandidate ? ' [UNUSED]' : comp.isDuplicateCandidate ? ' [DUP]' : '';
      const label = `${sanitize(comp.name)}${alert}&#xa;(${comp.type})`;

      cellXml += `
      <mxCell id="${compCellId}" value="${label}" style="${style}" vertex="1" parent="${layerCellId}">
        <mxGeometry x="${x}" y="${y}" width="112" height="60" as="geometry"/>
      </mxCell>`;
    });
  });

  // 2. Draw Dependencies / Connector Edges
  model.dependencies.slice(0, 35).forEach((dep) => {
    const sourceCellId = compCellMap.get(dep.source);
    const targetCellId = compCellMap.get(dep.target);

    if (sourceCellId && targetCellId) {
      const edgeCellId = cellIdCounter++;
      const edgeStyle = dep.needsReview
        ? 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#d97706;strokeWidth=2;dashed=1;fontSize=9;'
        : 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#64748b;strokeWidth=1.5;fontSize=9;';

      const edgeLabel = dep.needsReview ? `needs review (${Math.round(dep.confidence * 100)}%)` : `${Math.round(dep.confidence * 100)}%`;

      cellXml += `
      <mxCell id="${edgeCellId}" value="${edgeLabel}" style="${edgeStyle}" edge="1" parent="1" source="${sourceCellId}" target="${targetCellId}">
        <mxGeometry relative="1" as="geometry"/>
      </mxCell>`;
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="QuantumLens" version="22.1.0" type="device">
  <diagram id="quantumlens_arch" name="QuantumLens ${mode === 'to-be' ? 'Target' : 'Legacy'} Architecture">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1150" pageHeight="800" background="#ffffff">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ${cellXml}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

/**
 * Returns a direct URL link to open this diagram in Draw.io (app.diagrams.net)
 */
export function getDrawioDirectUrl(model: ArchitectureModel, mode: 'to-be' | 'as-is' = 'to-be'): string {
  const xml = generateDrawioXML(model, mode);
  // app.diagrams.net can read diagram XML directly via #R parameter:
  return `https://app.diagrams.net/?splash=0#R${encodeURIComponent(xml)}`;
}
