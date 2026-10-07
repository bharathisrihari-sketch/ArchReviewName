import React, { useState, useRef } from 'react';
import { Upload, FileText, Database, Sparkles, RefreshCw, AlertCircle, CheckCircle, Code, Layers } from 'lucide-react';
import { RAW_SAMPLE_SCRIPT_TEXT } from '../data/sampleSystem';

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <span>System Artifacts Ingestion</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Provide legacy SQL schemas, ETL scripts, DAG definitions, or reports to extract components & dependencies.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Load Sample System Button */}
          <button
            type="button"
            onClick={onLoadSampleSystem}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Load sample system</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-200/60 text-indigo-900 ml-1">
              48 artifacts
            </span>
          </button>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".sql,.json,.txt,.py,.ddl,.dag"
            className="hidden"
          />

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            <span>Upload File (.sql, .json, .py, .txt)</span>
          </button>

          {/* Analyze with AI Button */}
          <button
            type="button"
            onClick={() => onAnalyzeSystem(inputArtifacts)}
            disabled={isAnalyzing || !inputArtifacts.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
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

      {/* Drag & Drop / Text Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 px-1">
          <span className="flex items-center gap-1 font-medium">
            <Code className="h-3.5 w-3.5 text-slate-400" />
            Paste code, SQL, or drag & drop files:
          </span>
          {selectedFileName && (
            <span className="text-indigo-600 font-medium">
              Loaded: {selectedFileName}
            </span>
          )}
          <span className="text-slate-400">
            {inputArtifacts.length.toLocaleString()} characters
          </span>
        </div>

        <textarea
          value={inputArtifacts}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Paste legacy SQL statements (CREATE TABLE, SELECT, INSERT INTO), ETL scripts (Airflow DAGs, dbt models, Spark jobs), or API definitions here... Or click 'Load sample system' to inspect a realistic enterprise data estate with 25 tables, 12 jobs, 8 reports, and 3 apps."
          rows={7}
          className="w-full text-xs font-mono bg-slate-50 text-slate-800 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y"
        />
      </div>

      {/* Status & Error Feedback */}
      {statusMessage && (
        <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-xs text-blue-800 animate-pulse">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Notice:</span> {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
};
