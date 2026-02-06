/**
 * XAML Workflow Parser
 *
 * Parses Windows Workflow Foundation (WF) XAML state machine files
 * into our BusinessProcess format for visualization.
 */

import type { BusinessProcess, ProcessNode, ProcessTransition, ProcessNodeType } from '@/types/module';

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

  function processState(state: ParsedState, level: number = 0) {
    if (processedNodes.has(state.refId)) return;
    processedNodes.add(state.refId);

    // Determine node type
    let nodeType: ProcessNodeType = 'task';
    const nameLower = state.name.toLowerCase();
    if (state.refId === initialRefId) {
      nodeType = 'start';
    } else if (nameLower.includes('closed') || nameLower.includes('close')) {
      nodeType = 'end';
    } else if (nameLower.includes('check') || nameLower.includes('gateway')) {
      nodeType = 'gateway';
    }

    nodes.push({
      id: state.refId,
      type: nodeType,
      name: state.name,
      position: { x: 0, y: 0 }, // Will be auto-layouted
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
          processState(targetState, level + 1);
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
  applyHierarchicalLayout(nodes, transitions);

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
  if (label.length > 40) {
    // Extract meaningful part
    const match = label.match(/Submit|Approve|Decline|Close|Reopen|Request|Confirm|Investigation/i);
    if (match) {
      return match[0];
    }
    return label.substring(0, 35) + '...';
  }

  return label || 'transition';
}

/**
 * Apply hierarchical layout to nodes
 */
function applyHierarchicalLayout(nodes: ProcessNode[], transitions: ProcessTransition[]) {
  if (nodes.length === 0) return;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const levels: Map<string, number> = new Map();
  const positions: Map<string, number> = new Map();

  // Find start nodes (no incoming edges)
  const hasIncoming = new Set(transitions.map(t => t.to));
  const startNodeIds = nodes.filter(n => !hasIncoming.has(n.id) || n.type === 'start').map(n => n.id);

  // BFS to assign levels
  const queue = startNodeIds.map(id => ({ id, level: 0 }));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;

    if (levels.has(id) && levels.get(id)! <= level) continue;
    levels.set(id, level);

    // Get outgoing transitions
    const outgoing = transitions.filter(t => t.from === id);
    for (const t of outgoing) {
      if (!levels.has(t.to) || levels.get(t.to)! > level + 1) {
        queue.push({ id: t.to, level: level + 1 });
      }
    }
  }

  // Handle nodes not reached (cycles, isolated)
  let maxLevel = Math.max(...Array.from(levels.values()), 0);
  nodes.forEach(n => {
    if (!levels.has(n.id)) {
      levels.set(n.id, ++maxLevel);
    }
  });

  // Group nodes by level
  const levelGroups: Map<number, string[]> = new Map();
  levels.forEach((level, id) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(id);
  });

  // Position nodes
  const xGap = 220;
  const yGap = 100;

  levelGroups.forEach((nodeIds, level) => {
    nodeIds.forEach((id, index) => {
      const node = nodeMap.get(id);
      if (node) {
        const totalHeight = (nodeIds.length - 1) * yGap;
        node.position = {
          x: level * xGap + 50,
          y: index * yGap - totalHeight / 2 + 200,
        };
      }
    });
  });
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
