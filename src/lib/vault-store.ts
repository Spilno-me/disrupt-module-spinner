'use client';

/**
 * Vault Store
 *
 * Persistent storage for module artifacts.
 * Uses localStorage for POC, can be upgraded to API/DB later.
 */

import type { Dictionary, Form, BusinessProcess, Module } from '@/types/module';

const STORAGE_KEY = 'spinner-vault';

export interface VaultState {
  currentModuleId: string | null;
  modules: Module[];
}

export interface VaultActions {
  // Module operations
  createModule: (name: string, code: string, description?: string) => Module;
  selectModule: (moduleId: string) => void;
  deleteModule: (moduleId: string) => void;
  getCurrentModule: () => Module | null;

  // Artifact operations
  addDictionary: (dictionary: Dictionary) => void;
  addForm: (form: Form) => void;
  addWorkflow: (workflow: BusinessProcess) => void;

  removeArtifact: (type: 'dictionary' | 'form' | 'workflow', id: string) => void;
  updateArtifact: (type: 'dictionary' | 'form' | 'workflow', id: string, data: unknown) => void;

  // Export
  exportModule: (moduleId?: string) => string;
  importModule: (json: string) => Module;

  // State
  getState: () => VaultState;
}

/**
 * Load vault state from localStorage
 */
function loadState(): VaultState {
  if (typeof window === 'undefined') {
    return { currentModuleId: null, modules: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load vault state:', e);
  }

  return { currentModuleId: null, modules: [] };
}

/**
 * Save vault state to localStorage
 */
function saveState(state: VaultState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save vault state:', e);
  }
}

/**
 * Create the vault store
 */
export function createVaultStore(): VaultActions {
  let state = loadState();

  const persist = () => saveState(state);

  return {
    createModule(name: string, code: string, description?: string): Module {
      const module: Module = {
        id: generateId(),
        name,
        code,
        version: '1.0.0',
        description,
        dictionaries: [],
        forms: [],
        processes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.modules.push(module);
      state.currentModuleId = module.id;
      persist();

      return module;
    },

    selectModule(moduleId: string): void {
      const module = state.modules.find(m => m.id === moduleId);
      if (module) {
        state.currentModuleId = moduleId;
        persist();
      }
    },

    deleteModule(moduleId: string): void {
      state.modules = state.modules.filter(m => m.id !== moduleId);
      if (state.currentModuleId === moduleId) {
        state.currentModuleId = state.modules[0]?.id || null;
      }
      persist();
    },

    getCurrentModule(): Module | null {
      if (!state.currentModuleId) return null;
      return state.modules.find(m => m.id === state.currentModuleId) || null;
    },

    addDictionary(dictionary: Dictionary): void {
      const module = this.getCurrentModule();
      if (!module) return;

      // Check for duplicates by category code
      const existing = module.dictionaries.findIndex(
        d => d.category.code === dictionary.category.code
      );

      if (existing >= 0) {
        module.dictionaries[existing] = dictionary;
      } else {
        module.dictionaries.push(dictionary);
      }

      module.updatedAt = new Date().toISOString();
      persist();
    },

    addForm(form: Form): void {
      const module = this.getCurrentModule();
      if (!module) return;

      const existing = module.forms.findIndex(f => f.code === form.code);

      if (existing >= 0) {
        module.forms[existing] = form;
      } else {
        module.forms.push(form);
      }

      module.updatedAt = new Date().toISOString();
      persist();
    },

    addWorkflow(workflow: BusinessProcess): void {
      const module = this.getCurrentModule();
      if (!module) return;

      const existing = module.processes.findIndex(p => p.code === workflow.code);

      if (existing >= 0) {
        module.processes[existing] = workflow;
      } else {
        module.processes.push(workflow);
      }

      module.updatedAt = new Date().toISOString();
      persist();
    },

    removeArtifact(type: 'dictionary' | 'form' | 'workflow', id: string): void {
      const module = this.getCurrentModule();
      if (!module) return;

      switch (type) {
        case 'dictionary':
          module.dictionaries = module.dictionaries.filter(d => d.category.id !== id);
          break;
        case 'form':
          module.forms = module.forms.filter(f => f.id !== id);
          break;
        case 'workflow':
          module.processes = module.processes.filter(p => p.id !== id);
          break;
      }

      module.updatedAt = new Date().toISOString();
      persist();
    },

    updateArtifact(type: 'dictionary' | 'form' | 'workflow', id: string, data: unknown): void {
      const module = this.getCurrentModule();
      if (!module) return;

      switch (type) {
        case 'dictionary': {
          const idx = module.dictionaries.findIndex(d => d.category.id === id);
          if (idx >= 0) module.dictionaries[idx] = data as Dictionary;
          break;
        }
        case 'form': {
          const idx = module.forms.findIndex(f => f.id === id);
          if (idx >= 0) module.forms[idx] = data as Form;
          break;
        }
        case 'workflow': {
          const idx = module.processes.findIndex(p => p.id === id);
          if (idx >= 0) module.processes[idx] = data as BusinessProcess;
          break;
        }
      }

      module.updatedAt = new Date().toISOString();
      persist();
    },

    exportModule(moduleId?: string): string {
      const id = moduleId || state.currentModuleId;
      const module = state.modules.find(m => m.id === id);
      if (!module) throw new Error('Module not found');

      return JSON.stringify(module, null, 2);
    },

    importModule(json: string): Module {
      const module = JSON.parse(json) as Module;
      module.id = generateId(); // New ID to avoid conflicts
      module.createdAt = new Date().toISOString();
      module.updatedAt = new Date().toISOString();

      state.modules.push(module);
      state.currentModuleId = module.id;
      persist();

      return module;
    },

    getState(): VaultState {
      return { ...state };
    },
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Singleton instance
let vaultInstance: VaultActions | null = null;

export function getVault(): VaultActions {
  if (!vaultInstance) {
    vaultInstance = createVaultStore();
  }
  return vaultInstance;
}
