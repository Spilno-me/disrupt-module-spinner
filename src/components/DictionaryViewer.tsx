'use client';

/**
 * Dictionary Viewer Component
 *
 * Full-screen view for dictionary artifacts.
 * Shows category info and all items in a clean list.
 */

import { X, List, Copy, Check, Download } from 'lucide-react';
import { useState } from 'react';
import type { Dictionary } from '@/types/module';

interface DictionaryViewerProps {
  dictionary: Dictionary;
  onClose: () => void;
}

export function DictionaryViewer({ dictionary, onClose }: DictionaryViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(dictionary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const json = JSON.stringify(dictionary, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dictionary.category.code}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
            <List className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h2 className="font-medium text-zinc-100">{dictionary.category.name}</h2>
            <p className="text-xs text-zinc-500">
              {dictionary.items.length} items • Code: {dictionary.category.code}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-blue-500 hover:text-blue-400"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-blue-500 hover:text-blue-400"
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
          {dictionary.category.description && (
            <p className="mb-6 text-zinc-400">{dictionary.category.description}</p>
          )}

          {/* Items Table */}
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-900">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Label
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Default
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {dictionary.items
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-900/50">
                      <td className="px-4 py-3 text-sm text-zinc-500">{item.order}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-zinc-200">{item.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                          {item.value}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        {item.isDefault && (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                            Default
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Usage Hint */}
          <div className="mt-6 rounded-lg bg-zinc-900/50 border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-2">To reference this dictionary in forms:</p>
            <code className="text-sm text-blue-400">
              &quot;dictionaryRef&quot;: &quot;{dictionary.category.code}&quot;
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
