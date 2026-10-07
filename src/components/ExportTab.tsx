import React, { useState } from 'react';
import { ArchitectureModel } from '../types/architecture';
import { generateMermaidDiagram } from '../services/mermaidExport';
import { Download, Copy, Check, FileJson, FileCode, Sparkles, ExternalLink, Code } from 'lucide-react';

interface ExportTabProps {
  model: ArchitectureModel;
}

export const ExportTab: React.FC<ExportTabProps> = ({ model }) => {
  const [activeFormat, setActiveFormat] = useState<'mermaid' | 'json'>('mermaid');
  const [mermaidMode, setMermaidMode] = useState<'to-be' | 'as-is'>('to-be');
  const [copied, setCopied] = useState<boolean>(false);

  const mermaidContent = generateMermaidDiagram(model, mermaidMode);
  const jsonContent = JSON.stringify(model, null, 2);

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

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Selectors */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Download className="h-5 w-5 text-indigo-600" />
            <span>Architecture Model Export</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Download your recovered architecture model as structured machine-readable JSON or standard Mermaid markdown diagrams.
          </p>
        </div>

        {/* Format Switcher */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveFormat('mermaid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFormat === 'mermaid'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Mermaid Diagram (.mmd)</span>
          </button>
          <button
            onClick={() => setActiveFormat('json')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFormat === 'json'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileJson className="h-3.5 w-3.5" />
            <span>Structured JSON (.json)</span>
          </button>
        </div>
      </div>

      {activeFormat === 'mermaid' ? (
        /* Mermaid Diagram Panel */
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* As-Is vs To-Be Sub-Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-700">Diagram View:</span>
              <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 text-xs">
                <button
                  onClick={() => setMermaidMode('to-be')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    mermaidMode === 'to-be' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Target Architecture (To-Be)
                </button>
                <button
                  onClick={() => setMermaidMode('as-is')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    mermaidMode === 'as-is' ? 'bg-white text-amber-800 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Legacy System (As-Is)
                </button>
              </div>
            </div>

            {/* Copy & Download Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(mermaidContent)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy Mermaid Code'}</span>
              </button>
              <button
                onClick={() =>
                  downloadFile(
                    mermaidContent,
                    `quantumlens_${mermaidMode}_architecture.mmd`,
                    'text/vnd.mermaid'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .mmd</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed">
            Ready to embed directly into GitHub markdown, Notion documents, or visualize in the{' '}
            <a
              href="https://mermaid.live"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              Mermaid Live Editor <ExternalLink className="h-3 w-3" />
            </a>
            .
          </div>

          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed selection:bg-indigo-500 selection:text-white">
            {mermaidContent}
          </pre>
        </div>
      ) : (
        /* Structured JSON Panel */
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Full Schema Model JSON Payload
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Contains all {model.components.length} components, {model.dependencies.length} dependencies with confidence scores, target layers, and domain boundaries.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(jsonContent)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed selection:bg-emerald-700 selection:text-white">
            {jsonContent}
          </pre>
        </div>
      )}
    </div>
  );
};
