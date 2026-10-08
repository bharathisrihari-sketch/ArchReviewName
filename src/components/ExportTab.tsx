import React, { useState, useRef } from 'react';
import { ArchitectureModel } from '../types/architecture';
import { generateMermaidDiagram } from '../services/mermaidExport';
import { generateArchitecturePDF, svgToPngDataUrl } from '../services/pdfExportService';
import { generateDrawioXML, getDrawioDirectUrl } from '../services/drawioExport';
import {
  Download,
  Copy,
  Check,
  FileJson,
  FileCode,
  FileText,
  Printer,
  ExternalLink,
  Image,
  RefreshCw,
  Share2,
} from 'lucide-react';

interface ExportTabProps {
  model: ArchitectureModel;
}

export const ExportTab: React.FC<ExportTabProps> = ({ model }) => {
  const [activeFormat, setActiveFormat] = useState<'pdf' | 'drawio' | 'mermaid' | 'json'>('pdf');
  const [mermaidMode, setMermaidMode] = useState<'to-be' | 'as-is'>('to-be');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string>('');

  const svgRef = useRef<SVGSVGElement>(null);

  const mermaidContent = generateMermaidDiagram(model, mermaidMode);
  const jsonContent = JSON.stringify(model, null, 2);
  const drawioXmlContent = generateDrawioXML(model, mermaidMode);
  const drawioDirectLink = getDrawioDirectUrl(model, mermaidMode);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to PDF
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    setPdfSuccessMessage('');
    try {
      await generateArchitecturePDF(model, mermaidMode, svgRef.current);
      setPdfSuccessMessage('PDF report generated and downloaded successfully!');
      setTimeout(() => setPdfSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Download PNG
  const handleDownloadPNG = async () => {
    if (!svgRef.current) return;
    try {
      const dataUrl = await svgToPngDataUrl(svgRef.current);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `quantumlens_${mermaidMode}_diagram.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert('Failed to render PNG: ' + e.message);
    }
  };

  const layersDef = [
    { key: 'apps', name: '5. Applications & Interfaces', y: 40, color: 'rgba(192, 132, 252, 0.1)', border: '#a855f7', text: '#d8b4fe' },
    { key: 'reporting', name: '4. BI & Semantic Consumption', y: 155, color: 'rgba(251, 191, 36, 0.1)', border: '#d97706', text: '#fde68a' },
    { key: 'curated', name: '3. Core Conformed Data Marts', y: 270, color: 'rgba(52, 211, 153, 0.1)', border: '#059669', text: '#a7f3d0' },
    { key: 'staging', name: '2. Staging & Cleansing', y: 385, color: 'rgba(129, 140, 248, 0.1)', border: '#4f46e5', text: '#c7d2fe' },
    { key: 'source', name: '1. Ingestion & Raw CDC Lake', y: 500, color: 'rgba(56, 189, 248, 0.1)', border: '#0284c7', text: '#bae6fd' },
  ];

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Top Banner & Mode Selectors */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Download className="h-5 w-5 text-indigo-400" />
            <span>Architecture Diagram &amp; Model Export</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Export as PDF, direct Draw.io link, high-res PNG image, Mermaid code, or structured JSON.
          </p>
        </div>

        {/* Format Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveFormat('pdf')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFormat === 'pdf'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-zinc-950 text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Visual Diagram &amp; PDF</span>
          </button>
          <button
            onClick={() => setActiveFormat('drawio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFormat === 'drawio'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-zinc-950 text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <Share2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Draw.io Link (.drawio)</span>
          </button>
          <button
            onClick={() => setActiveFormat('mermaid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFormat === 'mermaid'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-zinc-950 text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Mermaid Code</span>
          </button>
          <button
            onClick={() => setActiveFormat('json')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFormat === 'json'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-zinc-950 text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <FileJson className="h-3.5 w-3.5" />
            <span>JSON Schema</span>
          </button>
        </div>
      </div>

      {activeFormat === 'pdf' ? (
        /* Visual Diagram & PDF Export Panel */
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-zinc-400">Diagram View:</span>
              <div className="flex bg-zinc-950 p-1 rounded-md border border-zinc-800 text-xs">
                <button
                  onClick={() => setMermaidMode('to-be')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    mermaidMode === 'to-be' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'
                  }`}
                >
                  Proposed To-Be Architecture
                </button>
                <button
                  onClick={() => setMermaidMode('as-is')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    mermaidMode === 'as-is' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'
                  }`}
                >
                  Legacy As-Is System
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadPNG}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-950 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Image className="h-3.5 w-3.5" />
                <span>PNG Image</span>
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-950 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                {isExportingPDF ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Rendering PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF Report</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {pdfSuccessMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>{pdfSuccessMessage}</span>
            </div>
          )}

          {/* Dark SVG Diagram Canvas */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-5 overflow-x-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Visual Architecture Vector Diagram Canvas
                </h3>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                {model.components.length} components | {model.dependencies.length} dependencies
              </span>
            </div>

            <div className="min-w-[850px] flex justify-center bg-black p-4 rounded-xl border border-zinc-800">
              <svg
                ref={svgRef}
                viewBox="0 0 950 630"
                className="w-full max-w-4xl h-auto bg-zinc-950 rounded-lg border border-zinc-800"
              >
                <defs>
                  <marker
                    id="dark-pdf-arrow"
                    viewBox="0 0 10 10"
                    refX="20"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8" />
                  </marker>
                </defs>

                {layersDef.map((layer) => {
                  const compsInLayer = model.components.filter((c) => c.layer === layer.key);

                  return (
                    <g key={layer.key}>
                      <rect
                        x="30"
                        y={layer.y}
                        width="890"
                        height="95"
                        rx="8"
                        fill={layer.color}
                        stroke={layer.border}
                        strokeWidth="1.5"
                      />

                      <text
                        x="45"
                        y={layer.y + 18}
                        fontSize="11"
                        fontWeight="bold"
                        fill={layer.text}
                      >
                        {layer.name} ({compsInLayer.length} components)
                      </text>

                      {compsInLayer.slice(0, 7).map((c, idx) => {
                        const px = 45 + idx * 122;
                        const py = layer.y + 32;

                        return (
                          <g key={c.id}>
                            <rect
                              x={px}
                              y={py}
                              width="114"
                              height="48"
                              rx="5"
                              fill="#18181b"
                              stroke="#3f3f46"
                              strokeWidth="1"
                            />
                            <text
                              x={px + 6}
                              y={py + 16}
                              fontSize="9"
                              fontWeight="bold"
                              fontFamily="monospace"
                              fill="#ffffff"
                            >
                              {c.name.length > 14 ? `${c.name.slice(0, 13)}…` : c.name}
                            </text>
                            <text
                              x={px + 6}
                              y={py + 30}
                              fontSize="7.5"
                              fill="#a1a1aa"
                            >
                              {c.type.toUpperCase()}
                            </text>
                            {c.isUnusedCandidate && (
                              <text x={px + 6} y={py + 41} fontSize="7" fill="#fbbf24" fontWeight="bold">
                                ⚠️ UNUSED
                              </text>
                            )}
                            {c.isDuplicateCandidate && (
                              <text x={px + 6} y={py + 41} fontSize="7" fill="#f43f5e" fontWeight="bold">
                                ⚠️ DUPLICATE
                              </text>
                            )}
                          </g>
                        );
                      })}
                      {compsInLayer.length > 7 && (
                        <text
                          x={45 + 7 * 122}
                          y={layer.y + 60}
                          fontSize="9"
                          fill="#a1a1aa"
                          fontWeight="bold"
                        >
                          +{compsInLayer.length - 7} more…
                        </text>
                      )}
                    </g>
                  );
                })}

                <line x1="475" y1="500" x2="475" y2="480" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#dark-pdf-arrow)" />
                <line x1="475" y1="385" x2="475" y2="365" stroke="#818cf8" strokeWidth="2" markerEnd="url(#dark-pdf-arrow)" />
                <line x1="475" y1="270" x2="475" y2="250" stroke="#34d399" strokeWidth="2" markerEnd="url(#dark-pdf-arrow)" />
                <line x1="475" y1="155" x2="475" y2="135" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#dark-pdf-arrow)" />
              </svg>
            </div>
          </div>
        </div>
      ) : activeFormat === 'drawio' ? (
        /* Draw.io Direct Link Panel */
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="h-4 w-4 text-cyan-400" />
                <span>Draw.io (Diagrams.net) Direct Integration</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Open the architecture diagram directly in Draw.io or download the raw mxGraphModel XML (.drawio).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={drawioDirectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
              >
                <span>Open in Draw.io (Direct Link)</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                onClick={() =>
                  downloadFile(
                    drawioXmlContent,
                    `quantumlens_${mermaidMode}_architecture.drawio`,
                    'application/xml'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-950 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .drawio</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-lg text-xs text-cyan-200">
            <strong>Direct Link Workflow:</strong> Clicking "Open in Draw.io" launches diagrams.net with the recovered architecture layers, components, and dependency arrows fully laid out in an editable canvas.
          </div>

          <pre className="p-4 bg-black text-cyan-300 rounded-xl font-mono text-xs overflow-x-auto max-h-[460px] border border-zinc-800">
            {drawioXmlContent}
          </pre>
        </div>
      ) : activeFormat === 'mermaid' ? (
        /* Mermaid Diagram Panel */
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-zinc-400">Diagram View:</span>
              <div className="flex bg-zinc-950 p-1 rounded-md border border-zinc-800 text-xs">
                <button
                  onClick={() => setMermaidMode('to-be')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    mermaidMode === 'to-be' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'
                  }`}
                >
                  Target Architecture (To-Be)
                </button>
                <button
                  onClick={() => setMermaidMode('as-is')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    mermaidMode === 'as-is' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'
                  }`}
                >
                  Legacy System (As-Is)
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(mermaidContent)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-950 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
              <button
                onClick={() =>
                  downloadFile(
                    mermaidContent,
                    `quantumlens_${mermaidMode}_architecture.mmd`,
                    'text/vnd.mermaid'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .mmd</span>
              </button>
            </div>
          </div>

          <pre className="p-4 bg-black text-zinc-200 rounded-xl font-mono text-xs overflow-x-auto max-h-[460px] border border-zinc-800">
            {mermaidContent}
          </pre>
        </div>
      ) : (
        /* Structured JSON Panel */
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Full Schema Model JSON Payload
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Contains all {model.components.length} components, {model.dependencies.length} dependencies, confidence scores, and domain service boundaries.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(jsonContent)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-950 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={() =>
                  downloadFile(
                    jsonContent,
                    'quantumlens_architecture_model.json',
                    'application/json'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          <pre className="p-4 bg-black text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto max-h-[460px] border border-zinc-800">
            {jsonContent}
          </pre>
        </div>
      )}
    </div>
  );
};
