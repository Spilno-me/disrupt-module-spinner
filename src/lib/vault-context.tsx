'use client';

/**
 * Vault Context
 *
 * React context for accessing the artifact vault.
 * Provides reactive updates when vault changes.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Dictionary, Form, BusinessProcess, Module } from '@/types/module';
import { getVault, VaultState, VaultActions } from './vault-store';

interface VaultContextValue {
  // State
  state: VaultState;
  currentModule: Module | null;

  // Module operations
  createModule: (name: string, code: string, description?: string) => void;
  selectModule: (moduleId: string) => void;
  deleteModule: (moduleId: string) => void;

  // Add artifacts
  addDictionary: (dictionary: Dictionary) => void;
  addForm: (form: Form) => void;
  addWorkflow: (workflow: BusinessProcess) => void;

  // Remove artifacts
  removeArtifact: (type: 'dictionary' | 'form' | 'workflow', id: string) => void;

  // Export/Import
  exportModule: () => string | null;
  importModule: (json: string) => void;

  // Refresh
  refresh: () => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vault] = useState<VaultActions>(() => getVault());
  const [state, setState] = useState<VaultState>({ currentModuleId: null, modules: [] });
  const [currentModule, setCurrentModule] = useState<Module | null>(null);

  // Load initial state
  useEffect(() => {
    const s = vault.getState();
    setState(s);
    setCurrentModule(vault.getCurrentModule());
  }, [vault]);

  const refresh = useCallback(() => {
    const s = vault.getState();
    setState(s);
    setCurrentModule(vault.getCurrentModule());
  }, [vault]);

  const createModule = useCallback((name: string, code: string, description?: string) => {
    vault.createModule(name, code, description);
    refresh();
  }, [vault, refresh]);

  const selectModule = useCallback((moduleId: string) => {
    vault.selectModule(moduleId);
    refresh();
  }, [vault, refresh]);

  const deleteModule = useCallback((moduleId: string) => {
    vault.deleteModule(moduleId);
    refresh();
  }, [vault, refresh]);

  const addDictionary = useCallback((dictionary: Dictionary) => {
    vault.addDictionary(dictionary);
    refresh();
  }, [vault, refresh]);

  const addForm = useCallback((form: Form) => {
    vault.addForm(form);
    refresh();
  }, [vault, refresh]);

  const addWorkflow = useCallback((workflow: BusinessProcess) => {
    vault.addWorkflow(workflow);
    refresh();
  }, [vault, refresh]);

  const removeArtifact = useCallback((type: 'dictionary' | 'form' | 'workflow', id: string) => {
    vault.removeArtifact(type, id);
    refresh();
  }, [vault, refresh]);

  const exportModule = useCallback(() => {
    try {
      return vault.exportModule();
    } catch {
      return null;
    }
  }, [vault]);

  const importModule = useCallback((json: string) => {
    vault.importModule(json);
    refresh();
  }, [vault, refresh]);

  return (
    <VaultContext.Provider value={{
      state,
      currentModule,
      createModule,
      selectModule,
      deleteModule,
      addDictionary,
      addForm,
      addWorkflow,
      removeArtifact,
      exportModule,
      importModule,
      refresh,
    }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) {
    throw new Error('useVault must be used within VaultProvider');
  }
  return ctx;
}
