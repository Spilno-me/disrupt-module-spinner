'use client';

/**
 * Workflow Context
 *
 * Shared state for the active workflow.
 * Allows Chat and WorkflowUploader to communicate.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { BusinessProcess } from '@/types/module';
import { applyMutation, WorkflowMutation } from './workflow-normalizer';

interface WorkflowContextValue {
  workflow: BusinessProcess | null;
  setWorkflow: (workflow: BusinessProcess | null) => void;
  applyMutations: (mutations: WorkflowMutation[]) => void;
  clearWorkflow: () => void;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflow, setWorkflowState] = useState<BusinessProcess | null>(null);

  const setWorkflow = useCallback((wf: BusinessProcess | null) => {
    setWorkflowState(wf);
  }, []);

  const applyMutations = useCallback((mutations: WorkflowMutation[]) => {
    setWorkflowState(current => {
      if (!current) return current;
      let updated = current;
      for (const mutation of mutations) {
        updated = applyMutation(updated, mutation);
      }
      return updated;
    });
  }, []);

  const clearWorkflow = useCallback(() => {
    setWorkflowState(null);
  }, []);

  return (
    <WorkflowContext.Provider value={{ workflow, setWorkflow, applyMutations, clearWorkflow }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return ctx;
}
