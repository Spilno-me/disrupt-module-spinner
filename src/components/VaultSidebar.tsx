'use client';

/**
 * Vault Sidebar
 *
 * Shows accumulated artifacts in the current module.
 * Organized by type: Dictionaries, Forms, Workflows.
 */

import { useState } from 'react';
import {
  List,
  FileText,
  GitBranch,
  ChevronRight,
  ChevronDown,
  Plus,
  Download,
  Trash2,
  Package,
} from 'lucide-react';
import { useVault } from '@/lib/vault-context';
import type { Dictionary, Form, BusinessProcess } from '@/types/module';

interface VaultSidebarProps {
  onSelectArtifact?: (type: string, artifact: Dictionary | Form | BusinessProcess) => void;
}

export function VaultSidebar({ onSelectArtifact }: VaultSidebarProps) {
  const { state, currentModule, createModule, selectModule, exportModule } = useVault();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['dictionaries', 'forms', 'workflows'])
  );
  const [showNewModule, setShowNewModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleCreateModule = () => {
    if (!newModuleName.trim()) return;
    const code = newModuleName.toLowerCase().replace(/\s+/g, '-');
    createModule(newModuleName, code);
    setNewModuleName('');
    setShowNewModule(false);
  };

  const handleExport = () => {
    const json = exportModule();
    if (!json) return;

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentModule?.code || 'module'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-900/50">
      {/* Module Selector */}
      <div className="border-b border-zinc-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Module
          </span>
          <button
            onClick={() => setShowNewModule(true)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            title="New Module"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {showNewModule ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              placeholder="Module name..."
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateModule();
                if (e.key === 'Escape') setShowNewModule(false);
              }}
            />
            <div className="flex gap-1">
              <button
                onClick={handleCreateModule}
                className="flex-1 rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewModule(false)}
                className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <select
            value={currentModule?.id || ''}
            onChange={(e) => selectModule(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
          >
            {state.modules.length === 0 ? (
              <option value="">No modules - create one</option>
            ) : (
              state.modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))
            )}
          </select>
        )}
      </div>

      {/* Artifacts List */}
      {currentModule ? (
        <div className="flex-1 overflow-y-auto p-2">
          {/* Dictionaries */}
          <ArtifactSection
            title="Dictionaries"
            icon={<List className="h-4 w-4" />}
            count={currentModule.dictionaries.length}
            expanded={expandedSections.has('dictionaries')}
            onToggle={() => toggleSection('dictionaries')}
          >
            {currentModule.dictionaries.map((dict) => (
              <ArtifactItem
                key={dict.category.id}
                name={dict.category.name}
                subtitle={`${dict.items.length} items`}
                onClick={() => onSelectArtifact?.('dictionary', dict)}
              />
            ))}
          </ArtifactSection>

          {/* Forms */}
          <ArtifactSection
            title="Forms"
            icon={<FileText className="h-4 w-4" />}
            count={currentModule.forms.length}
            expanded={expandedSections.has('forms')}
            onToggle={() => toggleSection('forms')}
          >
            {currentModule.forms.map((form) => (
              <ArtifactItem
                key={form.id}
                name={form.name}
                subtitle={`${form.fields.length} fields`}
                onClick={() => onSelectArtifact?.('form', form)}
              />
            ))}
          </ArtifactSection>

          {/* Workflows */}
          <ArtifactSection
            title="Workflows"
            icon={<GitBranch className="h-4 w-4" />}
            count={currentModule.processes.length}
            expanded={expandedSections.has('workflows')}
            onToggle={() => toggleSection('workflows')}
          >
            {currentModule.processes.map((process) => (
              <ArtifactItem
                key={process.id}
                name={process.name}
                subtitle={`${process.nodes.length} states`}
                onClick={() => onSelectArtifact?.('workflow', process)}
              />
            ))}
          </ArtifactSection>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <Package className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-500">
              Create a module to start building artifacts
            </p>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      {currentModule && (
        <div className="border-t border-zinc-800 p-2">
          <button
            onClick={handleExport}
            className="flex w-full items-center justify-center gap-2 rounded bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            <Download className="h-4 w-4" />
            Export Module
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

interface ArtifactSectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ArtifactSection({ title, icon, count, expanded, onToggle, children }: ArtifactSectionProps) {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm font-medium text-zinc-300 hover:bg-zinc-800"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-500" />
        )}
        <span className="text-zinc-400">{icon}</span>
        <span className="flex-1">{title}</span>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
          {count}
        </span>
      </button>

      {expanded && (
        <div className="ml-4 mt-1 space-y-0.5">
          {count === 0 ? (
            <p className="px-2 py-1 text-xs text-zinc-600 italic">
              No {title.toLowerCase()} yet
            </p>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

interface ArtifactItemProps {
  name: string;
  subtitle: string;
  onClick?: () => void;
}

function ArtifactItem({ name, subtitle, onClick }: ArtifactItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-zinc-800"
    >
      <div>
        <p className="text-sm text-zinc-200">{name}</p>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>
    </button>
  );
}
