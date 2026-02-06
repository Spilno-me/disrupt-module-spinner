'use client';

/**
 * Artifact Preview Component
 *
 * Renders generated artifacts with type-specific visualizations:
 * - Dictionary: Tag cloud / list view
 * - Form: Field layout preview
 * - Process: Visual workflow graph
 */

import { useState } from 'react';
import { List, FileText, GitBranch, ChevronDown, ChevronUp, Copy, Check, Plus, CheckCircle } from 'lucide-react';
import type { GeneratedArtifact, Dictionary, Form, BusinessProcess } from '@/types/module';
import { getArtifactDisplayName, getArtifactColor } from '@/lib/artifacts';
import { WorkflowPreview } from './WorkflowPreview';
import { useVault } from '@/lib/vault-context';

interface ArtifactPreviewProps {
  artifact: GeneratedArtifact;
}

export function ArtifactPreview({ artifact }: ArtifactPreviewProps) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [saved, setSaved] = useState(false);

  const { currentModule, addDictionary, addForm, addWorkflow } = useVault();

  const colorClass = getArtifactColor(artifact.type);
  const name = getArtifactDisplayName(artifact);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(artifact, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToVault = () => {
    if (!currentModule) return;

    switch (artifact.type) {
      case 'dictionary':
        addDictionary(artifact.data as Dictionary);
        break;
      case 'form':
        addForm(artifact.data as Form);
        break;
      case 'process':
        addWorkflow(artifact.data as BusinessProcess);
        break;
    }

    setSaved(true);
  };

  const Icon = {
    dictionary: List,
    form: FileText,
    process: GitBranch,
  }[artifact.type];

  return (
    <div className={`rounded-xl border ${colorClass} overflow-hidden`}>
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <div>
            <span className="font-medium">{name}</span>
            <span className="ml-2 text-xs opacity-60 capitalize">
              {artifact.type}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Save to Vault button */}
          {currentModule && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveToVault();
              }}
              disabled={saved}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                saved
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/10 text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-400'
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Saved
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" />
                  Save
                </>
              )}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowRaw(!showRaw);
            }}
            className="rounded px-2 py-1 text-xs opacity-60 hover:opacity-100"
          >
            {showRaw ? 'Preview' : 'JSON'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="rounded p-1 opacity-60 hover:opacity-100"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 opacity-60" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-60" />
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="border-t border-current/10 px-4 py-3">
          {showRaw ? (
            <pre className="overflow-x-auto rounded bg-black/30 p-3 text-xs">
              {JSON.stringify(artifact.data, null, 2)}
            </pre>
          ) : (
            <ArtifactContent artifact={artifact} />
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Type-specific content renderers
// ─────────────────────────────────────────────────────────────

function ArtifactContent({ artifact }: ArtifactPreviewProps) {
  switch (artifact.type) {
    case 'dictionary':
      return <DictionaryPreview data={artifact.data as Dictionary} />;
    case 'form':
      return <FormPreview data={artifact.data as Form} />;
    case 'process':
      return <ProcessPreview data={artifact.data as BusinessProcess} />;
    default:
      return null;
  }
}

function DictionaryPreview({ data }: { data: Dictionary }) {
  return (
    <div className="space-y-2">
      <p className="text-xs opacity-60">{data.category.description}</p>
      <div className="flex flex-wrap gap-2">
        {data.items.map((item) => (
          <span
            key={item.id}
            className={`rounded-full px-3 py-1 text-sm ${
              item.isDefault
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-white/5 text-zinc-300'
            }`}
          >
            {item.label}
            {item.isDefault && (
              <span className="ml-1 text-xs opacity-60">(default)</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function FormPreview({ data }: { data: Form }) {
  return (
    <div className="space-y-3">
      {data.description && (
        <p className="text-xs opacity-60">{data.description}</p>
      )}
      <div className="space-y-2">
        {data.fields.map((field) => (
          <div
            key={field.id}
            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{field.label}</span>
              {field.required && (
                <span className="text-xs text-red-400">*</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs">
                {field.type}
              </span>
              {field.dictionaryRef && (
                <span className="text-xs text-blue-400">
                  → {field.dictionaryRef}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProcessPreview({ data }: { data: BusinessProcess }) {
  return (
    <div className="space-y-3">
      {data.description && (
        <p className="text-xs opacity-60">{data.description}</p>
      )}
      <div className="h-64 rounded-lg bg-black/30">
        <WorkflowPreview process={data} />
      </div>
    </div>
  );
}
