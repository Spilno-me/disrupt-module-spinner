'use client';

/**
 * Form Viewer Component
 *
 * Full-screen view for form artifacts.
 * Shows field definitions with types, validation, and references.
 */

import { X, FileText, Copy, Check, Download } from 'lucide-react';
import { useState } from 'react';
import type { Form } from '@/types/module';

interface FormViewerProps {
  form: Form;
  onClose: () => void;
}

export function FormViewer({ form, onClose }: FormViewerProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'fields'>('preview');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(form, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const json = JSON.stringify(form, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.code}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
            <FileText className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h2 className="font-medium text-zinc-100">{form.name}</h2>
            <p className="text-xs text-zinc-500">
              {form.fields.length} fields • Code: {form.code}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-zinc-700 p-0.5">
            <button
              onClick={() => setViewMode('preview')}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                viewMode === 'preview'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode('fields')}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                viewMode === 'fields'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Fields
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-purple-500 hover:text-purple-400"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-purple-500 hover:text-purple-400"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          {/* Description */}
          {form.description && (
            <p className="mb-6 text-zinc-400">{form.description}</p>
          )}

          {viewMode === 'preview' ? (
            <FormPreview form={form} />
          ) : (
            <FieldsTable form={form} />
          )}

          {/* Usage Hint */}
          <div className="mt-6 rounded-lg bg-zinc-900/50 border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-2">To reference this form in workflows:</p>
            <code className="text-sm text-purple-400">
              &quot;formRef&quot;: &quot;{form.code}&quot;
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormPreview({ form }: { form: Form }) {
  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
      <h3 className="text-lg font-medium text-zinc-200 mb-4">{form.name}</h3>

      {form.fields
        .sort((a, b) => a.order - b.order)
        .map((field) => (
          <div key={field.id} className="space-y-1.5">
            <label className="flex items-center gap-1 text-sm font-medium text-zinc-300">
              {field.label}
              {field.required && <span className="text-red-400">*</span>}
            </label>

            {/* Render mock input based on type */}
            {field.type === 'textarea' ? (
              <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 min-h-[80px]">
                <span className="text-zinc-500 text-sm">{field.placeholder || `Enter ${field.label.toLowerCase()}...`}</span>
              </div>
            ) : field.type === 'select' || field.type === 'multiselect' ? (
              <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 flex items-center justify-between">
                <span className="text-zinc-500 text-sm">
                  {field.dictionaryRef ? `Select from ${field.dictionaryRef}` : 'Select option...'}
                </span>
                <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            ) : field.type === 'checkbox' ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-zinc-600 bg-zinc-800" />
                <span className="text-sm text-zinc-400">{field.placeholder || 'Check if applicable'}</span>
              </div>
            ) : field.type === 'date' ? (
              <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 flex items-center justify-between">
                <span className="text-zinc-500 text-sm">Select date...</span>
                <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            ) : field.type === 'file' ? (
              <div className="w-full rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 px-3 py-4 text-center">
                <span className="text-zinc-500 text-sm">Drop file or click to upload</span>
              </div>
            ) : field.type === 'number' ? (
              <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                <span className="text-zinc-500 text-sm">{field.placeholder || '0'}</span>
              </div>
            ) : (
              <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                <span className="text-zinc-500 text-sm">{field.placeholder || `Enter ${field.label.toLowerCase()}...`}</span>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

function FieldsTable({ form }: { form: Form }) {
  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-zinc-900">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Label
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Required
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              Reference
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {form.fields
            .sort((a, b) => a.order - b.order)
            .map((field) => (
              <tr key={field.id} className="hover:bg-zinc-900/50">
                <td className="px-4 py-3 text-sm text-zinc-500">{field.order}</td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-zinc-200">{field.label}</span>
                </td>
                <td className="px-4 py-3">
                  <code className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                    {field.name}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${getTypeColor(field.type)}`}>
                    {field.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {field.required && (
                    <span className="text-red-400 text-sm">Required</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {field.dictionaryRef && (
                    <span className="text-blue-400 text-xs">
                      → {field.dictionaryRef}
                    </span>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'text':
    case 'textarea':
      return 'bg-zinc-700 text-zinc-300';
    case 'number':
      return 'bg-blue-500/20 text-blue-400';
    case 'date':
      return 'bg-amber-500/20 text-amber-400';
    case 'select':
    case 'multiselect':
      return 'bg-purple-500/20 text-purple-400';
    case 'checkbox':
    case 'radio':
      return 'bg-emerald-500/20 text-emerald-400';
    case 'file':
      return 'bg-orange-500/20 text-orange-400';
    case 'user':
      return 'bg-cyan-500/20 text-cyan-400';
    case 'location':
      return 'bg-pink-500/20 text-pink-400';
    default:
      return 'bg-zinc-700 text-zinc-400';
  }
}
