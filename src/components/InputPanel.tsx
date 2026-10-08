import React, { useState, useRef } from 'react';
import { Upload, FileText, Database, Sparkles, RefreshCw, AlertCircle, Code, Layers } from 'lucide-react';

interface InputPanelProps {
  inputArtifacts: string;
  onInputChange: (val: string) => void;
  onLoadSampleSystem: () => void;
  onAnalyzeSystem: (content: string) => Promise<void>;
  isAnalyzing: boolean;
  statusMessage?: string;
  errorMessage?: string;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  inputArtifacts,
  onInputChange,
  onLoadSampleSystem,
  onAnalyzeSystem,
  isAnalyzing,
  statusMessage,
  errorMessage,
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onInputChange(content || '');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onInputChange(content || '');
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-5 text-zinc-100 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            <span>Legacy System Artifacts Ingestion</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Provide SQL schemas, ETL scripts (Airflow, dbt, Spark), API specs, or upload code files to extract architecture.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onLoadSampleSystem}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Database className="h-3.5 w-3.5 text-indigo-400" />
            <span>Load Sample Estate</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 ml-1">
              48 artifacts
            </span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".sql,.json,.txt,.py,.ddl,.dag"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-950 text-zinc-200 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5 text-zinc-400" />
            <span>Upload File (.sql, .json, .py, .txt)</span>
          </button>

          <button
            type="button"
            onClick={() => onAnalyzeSystem(inputArtifacts)}
            disabled={isAnalyzing || !inputArtifacts.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Recovering Architecture...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Analyze with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} className="relative">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5 px-1">
          <span className="flex items-center gap-1 font-medium">
            <Code className="h-3.5 w-3.5 text-zinc-500" />
            Paste code, SQL, or drag &amp; drop files:
          </span>
          {selectedFileName && (
            <span className="text-indigo-400 font-medium">
              Loaded: {selectedFileName}
            </span>
          )}
          <span className="text-zinc-500 font-mono">
            {inputArtifacts.length.toLocaleString()} characters
          </span>
        </div>

        <textarea
          value={inputArtifacts}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Paste legacy SQL statements (CREATE TABLE, SELECT, INSERT INTO), ETL scripts, or API specs here... Or click 'Load Sample Estate' to inspect a realistic enterprise data estate."
          rows={7}
          className="w-full text-xs font-mono bg-black text-zinc-200 border border-zinc-800 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
        />
      </div>

      {statusMessage && (
        <div className="p-2.5 bg-blue-950/50 border border-blue-500/40 rounded-lg flex items-center gap-2 text-xs text-blue-300 animate-pulse">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 bg-rose-950/50 border border-rose-500/40 rounded-lg flex items-start gap-2 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Notice:</span> {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
};
