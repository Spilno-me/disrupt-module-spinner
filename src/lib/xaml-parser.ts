/**
 * XAML Workflow Parser
 *
 * Parses Windows Workflow Foundation (WF) XAML state machine files
 * into our BusinessProcess format for visualization.
 */

import type { BusinessProcess, ProcessNode, ProcessTransition, ProcessNodeType } from '@/types/module';
import { applyLayout } from './workflow-layout';

interface ParsedState {
  id: string;
  name: string;
  refId: string;
  transitions: ParsedTransition[];
}

interface ParsedTransition {
  displayName: string;
  toRefId: string | null;
}

/**
 * Parse XAML state machine to BusinessProcess format
 */
export function parseXamlWorkflow(xmlContent: string): BusinessProcess {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');

  // Extract all states with their ref IDs
  const states = extractStates(doc);
  const stateMap = new Map<string, ParsedState>();

  states.forEach(state => {
    stateMap.set(state.refId, state);
  });

  // Build nodes
  const nodes: ProcessNode[] = [];
  const transitions: ProcessTransition[] = [];
  const processedNodes = new Set<string>();

  // Determine which is the initial state
  const initialStateElement = doc.querySelector('StateMachine > InitialState > State');
  const initialRefId = initialStateElement?.getAttribute('x:Name') || '';

  // Process all states
  let transitionId = 0;

  function processState(state: ParsedState) {
    if (processedNodes.has(state.refId)) return;
    processedNodes.add(state.refId);

    // Determine node type
    let nodeType: ProcessNodeType = 'task';
    const nameLower = state.name.toLowerCase();
    if (state.refId === initialRefId) {
      nodeType = 'start';
    } else if (nameLower === 'closed') {
      nodeType = 'end';
    } else if (nameLower.includes('check') || nameLower.includes('gateway')) {
      nodeType = 'gateway';
    }

    nodes.push({
      id: state.refId,
      type: nodeType,
      name: state.name,
      position: { x: 0, y: 0 },
    });

    // Process transitions
    state.transitions.forEach(trans => {
      if (trans.toRefId) {
        transitions.push({
          id: `transition-${transitionId++}`,
          from: state.refId,
          to: trans.toRefId,
          label: cleanTransitionLabel(trans.displayName),
        });

        // Process target state
        const targetState = stateMap.get(trans.toRefId);
        if (targetState) {
          processState(targetState);
        }
      }
    });
  }

  // Start from initial state
  const initialState = stateMap.get(initialRefId);
  if (initialState) {
    processState(initialState);
  }

  // Process any remaining unprocessed states
  states.forEach(state => {
    if (!processedNodes.has(state.refId)) {
      processState(state);
    }
  });

  // Apply layout
  applyLayout(nodes, transitions);

  return {
    id: generateId(),
    name: 'Incident Workflow',
    code: 'incident-workflow',
    description: 'Imported from XAML state machine',
    nodes,
    transitions,
  };
}

/**
 * Extract states from XAML document
 */
function extractStates(doc: Document): ParsedState[] {
  const states: ParsedState[] = [];
  const stateElements = doc.querySelectorAll('State');

  stateElements.forEach(stateEl => {
    const name = stateEl.getAttribute('DisplayName') || 'Unknown';
    const refId = stateEl.getAttribute('x:Name') || generateId();

    // Extract transitions
    const transitionElements = stateEl.querySelectorAll(':scope > State\\.Transitions > Transition');
    const transitions: ParsedTransition[] = [];

    transitionElements.forEach(transEl => {
      const displayName = transEl.getAttribute('DisplayName') || '';

      // Check for inline To reference
      let toRefId = transEl.getAttribute('To');
      if (toRefId) {
        // Format: {x:Reference __ReferenceID0}
        const match = toRefId.match(/\{x:Reference\s+(\S+)\}/);
        if (match) {
          toRefId = match[1];
        }
      }

      // Check for nested Transition.To > State
      if (!toRefId) {
        const nestedState = transEl.querySelector('Transition\\.To > State');
        if (nestedState) {
          toRefId = nestedState.getAttribute('x:Name');
        }
      }

      transitions.push({
        displayName,
        toRefId: toRefId || null,
      });
    });

    // Avoid duplicates (nested states appear multiple times)
    if (!states.find(s => s.refId === refId)) {
      states.push({
        id: generateId(),
        name,
        refId,
        transitions,
      });
    }
  });

  return states;
}

/**
 * Clean up transition label for display
 */
function cleanTransitionLabel(displayName: string): string {
  // Remove B/Mark prefix
  let label = displayName.replace(/^B\/Mark:?\s*/i, '');

  // Decode HTML entities
  label = label.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

  // Truncate long conditions
  if (label.length > 25) {
    // Extract meaningful part
    const match = label.match(/Submit|Approve|Decline|Close|Reopen|Request|Confirm|Investigation/i);
    if (match) {
      return match[0];
    }
    return label.substring(0, 20) + '...';
  }

  return label || '';
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
