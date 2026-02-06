'use client';

/**
 * Workflow Uploader Component
 *
 * Allows users to upload XAML workflow files and visualize them.
 * Supports Windows Workflow Foundation state machine format.
 */

import { useState, useCallback } from 'react';
import { Upload, FileCode, X, Loader2, Download } from 'lucide-react';
import { parseXamlWorkflow } from '@/lib/xaml-parser';
import { WorkflowPreview } from './WorkflowPreview';
import type { BusinessProcess } from '@/types/module';

export function WorkflowUploader() {
  const [workflow, setWorkflow] = useState<BusinessProcess | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const parsed = await parseXamlWorkflow(content);
      setWorkflow(parsed);
      setFileName(file.name);
    } catch (err) {
      console.error('Parse error:', err);
      setError('Failed to parse workflow file. Ensure it\'s a valid XAML state machine.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xml') || file.name.endsWith('.xaml'))) {
      handleFileUpload(file);
    } else {
      setError('Please upload an XML or XAML file');
    }
  }, [handleFileUpload]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleClear = useCallback(() => {
    setWorkflow(null);
    setFileName(null);
    setError(null);
  }, []);

  const handleExportJson = useCallback(() => {
    if (!workflow) return;
    const json = JSON.stringify(workflow, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.code}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [workflow]);

  if (workflow) {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <FileCode className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="font-medium text-zinc-100">{workflow.name}</h2>
              <p className="text-xs text-zinc-500">
                {fileName} • {workflow.nodes.length} states • {workflow.transitions.length} transitions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-emerald-500 hover:text-emerald-400"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
            <button
              onClick={handleClear}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Workflow Visualization */}
        <div className="flex-1">
          <WorkflowPreview process={workflow} />
        </div>

        {/* Stats Footer */}
        <div className="border-t border-zinc-800 bg-zinc-900/50 px-4 py-2">
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Start: {workflow.nodes.find(n => n.type === 'start')?.name}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              End: {workflow.nodes.filter(n => n.type === 'end').map(n => n.name).join(', ')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="relative w-full max-w-md"
      >
        <input
          type="file"
          accept=".xml,.xaml"
          onChange={handleInputChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          id="workflow-upload"
        />
        <label
          htmlFor="workflow-upload"
          className={`
            flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed
            px-8 py-12 transition-colors
            ${error
              ? 'border-red-500/50 bg-red-500/5'
              : 'border-zinc-700 bg-zinc-900/50 hover:border-emerald-500/50 hover:bg-emerald-500/5'
            }
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-emerald-500" />
              <p className="text-zinc-300">Parsing workflow...</p>
            </>
          ) : (
            <>
              <div className="mb-4 rounded-xl bg-zinc-800 p-4">
                <Upload className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-zinc-100">
                Upload Workflow
              </h3>
              <p className="mb-4 text-center text-sm text-zinc-400">
                Drop a XAML state machine file here, or click to browse
              </p>
              <p className="text-xs text-zinc-500">
                Supports Windows Workflow Foundation (.xml, .xaml)
              </p>
            </>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}
        </label>
      </div>
    </div>
  );
}
