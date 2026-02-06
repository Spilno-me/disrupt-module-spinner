/**
 * Workflow Normalizer
 *
 * Universal intake for workflow definitions.
 * Accepts multiple formats, outputs normalized BusinessProcess.
 *
 * Supported formats:
 * - XAML (Windows Workflow Foundation state machines)
 * - BPMN (Business Process Model and Notation)
 * - JSON (direct BusinessProcess format)
 * - Mermaid (flowchart syntax)
 * - Natural language (via AI interpretation)
 */

import type { BusinessProcess, ProcessNode, ProcessTransition, ProcessNodeType } from '@/types/module';

export type WorkflowFormat = 'xaml' | 'bpmn' | 'json' | 'mermaid' | 'natural';

export interface NormalizationResult {
  success: boolean;
  workflow?: BusinessProcess;
  format: WorkflowFormat;
  error?: string;
  warnings?: string[];
}

/**
 * Detect workflow format from content
 */
export function detectFormat(content: string): WorkflowFormat {
  const trimmed = content.trim();

  // JSON detection
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // XML-based detection
  if (trimmed.includes('<?xml') || trimmed.startsWith('<')) {
    if (trimmed.includes('StateMachine') || trimmed.includes('xmlns="http://schemas.microsoft.com/netfx')) {
      return 'xaml';
    }
    if (trimmed.includes('bpmn:') || trimmed.includes('definitions') && trimmed.includes('process')) {
      return 'bpmn';
    }
  }

  // Mermaid detection
  if (trimmed.startsWith('graph ') || trimmed.startsWith('flowchart ') || trimmed.startsWith('stateDiagram')) {
    return 'mermaid';
  }

  // Default to natural language
  return 'natural';
}

/**
 * Normalize any workflow format to BusinessProcess
 */
export async function normalizeWorkflow(content: string, formatHint?: WorkflowFormat): Promise<NormalizationResult> {
  const format = formatHint || detectFormat(content);
  const warnings: string[] = [];

  try {
    let workflow: BusinessProcess;

    switch (format) {
      case 'xaml':
        const { parseXamlWorkflow } = await import('./xaml-parser');
        workflow = await parseXamlWorkflow(content);
        break;

      case 'bpmn':
        workflow = await parseBpmnWorkflow(content);
        break;

      case 'json':
        workflow = parseJsonWorkflow(content);
        break;

      case 'mermaid':
        workflow = parseMermaidWorkflow(content);
        break;

      case 'natural':
        // Natural language requires AI - return placeholder
        return {
          success: false,
          format,
          error: 'Natural language workflows require AI interpretation. Use the chat to describe your workflow.',
        };

      default:
        return {
          success: false,
          format,
          error: `Unsupported format: ${format}`,
        };
    }

    // Validate and apply layout
    validateWorkflow(workflow, warnings);
    await applyLayout(workflow);

    return {
      success: true,
      workflow,
      format,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (err) {
    return {
      success: false,
      format,
      error: err instanceof Error ? err.message : 'Unknown parsing error',
    };
  }
}

/**
 * Parse BPMN XML to BusinessProcess
 */
async function parseBpmnWorkflow(content: string): Promise<BusinessProcess> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/xml');

  const nodes: ProcessNode[] = [];
  const transitions: ProcessTransition[] = [];

  // Extract process elements
  const startEvents = doc.querySelectorAll('startEvent, bpmn\\:startEvent');
  const endEvents = doc.querySelectorAll('endEvent, bpmn\\:endEvent');
  const tasks = doc.querySelectorAll('task, userTask, serviceTask, bpmn\\:task, bpmn\\:userTask, bpmn\\:serviceTask');
  const gateways = doc.querySelectorAll('exclusiveGateway, parallelGateway, bpmn\\:exclusiveGateway, bpmn\\:parallelGateway');
  const flows = doc.querySelectorAll('sequenceFlow, bpmn\\:sequenceFlow');

  // Process start events
  startEvents.forEach(el => {
    nodes.push({
      id: el.getAttribute('id') || generateId(),
      type: 'start',
      name: el.getAttribute('name') || 'Start',
      position: { x: 0, y: 0 },
    });
  });

  // Process tasks
  tasks.forEach(el => {
    nodes.push({
      id: el.getAttribute('id') || generateId(),
      type: 'task',
      name: el.getAttribute('name') || 'Task',
      position: { x: 0, y: 0 },
    });
  });

  // Process gateways
  gateways.forEach(el => {
    nodes.push({
      id: el.getAttribute('id') || generateId(),
      type: 'gateway',
      name: el.getAttribute('name') || 'Gateway',
      position: { x: 0, y: 0 },
    });
  });

  // Process end events
  endEvents.forEach(el => {
    nodes.push({
      id: el.getAttribute('id') || generateId(),
      type: 'end',
      name: el.getAttribute('name') || 'End',
      position: { x: 0, y: 0 },
    });
  });

  // Process sequence flows
  flows.forEach(el => {
    const sourceRef = el.getAttribute('sourceRef');
    const targetRef = el.getAttribute('targetRef');
    if (sourceRef && targetRef) {
      transitions.push({
        id: el.getAttribute('id') || generateId(),
        from: sourceRef,
        to: targetRef,
        label: el.getAttribute('name') || undefined,
      });
    }
  });

  return {
    id: generateId(),
    name: 'BPMN Workflow',
    code: 'bpmn-workflow',
    description: 'Imported from BPMN',
    nodes,
    transitions,
  };
}

/**
 * Parse direct JSON BusinessProcess format
 */
function parseJsonWorkflow(content: string): BusinessProcess {
  const parsed = JSON.parse(content);

  // Handle wrapped format { type: 'process', data: {...} }
  const data = parsed.data || parsed;

  // Validate required fields
  if (!data.nodes || !Array.isArray(data.nodes)) {
    throw new Error('Invalid workflow JSON: missing nodes array');
  }
  if (!data.transitions && !data.edges) {
    throw new Error('Invalid workflow JSON: missing transitions/edges array');
  }

  return {
    id: data.id || generateId(),
    name: data.name || 'Workflow',
    code: data.code || 'workflow',
    description: data.description,
    nodes: data.nodes.map((n: Partial<ProcessNode>) => ({
      id: n.id || generateId(),
      type: n.type || 'task',
      name: n.name || 'Node',
      position: n.position || { x: 0, y: 0 },
    })),
    transitions: (data.transitions || data.edges || []).map((t: Record<string, unknown>) => ({
      id: (t.id as string) || generateId(),
      from: (t.from as string) || (t.source as string) || '',
      to: (t.to as string) || (t.target as string) || '',
      label: t.label as string | undefined,
      condition: t.condition as string | undefined,
    })),
  };
}

/**
 * Parse Mermaid flowchart syntax
 */
function parseMermaidWorkflow(content: string): BusinessProcess {
  const nodes: ProcessNode[] = [];
  const transitions: ProcessTransition[] = [];
  const nodeMap = new Map<string, ProcessNode>();

  // Parse lines
  const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));

  // Skip the first line (graph/flowchart declaration)
  const contentLines = lines.slice(1);

  for (const line of contentLines) {
    // Match node definitions: A[Label] or A((Label)) or A{Label}
    const nodeMatch = line.match(/^(\w+)(?:\[([^\]]+)\]|\(\(([^)]+)\)\)|\{([^}]+)\})/);
    if (nodeMatch) {
      const [, id, squareLabel, circleLabel, diamondLabel] = nodeMatch;
      const label = squareLabel || circleLabel || diamondLabel || id;
      let type: ProcessNodeType = 'task';
      if (circleLabel) type = id.toLowerCase().includes('start') ? 'start' : 'end';
      if (diamondLabel) type = 'gateway';

      if (!nodeMap.has(id)) {
        const node: ProcessNode = { id, type, name: label, position: { x: 0, y: 0 } };
        nodes.push(node);
        nodeMap.set(id, node);
      }
    }

    // Match transitions: A --> B or A -->|label| B
    const transMatch = line.match(/(\w+)\s*--+>?\s*(?:\|([^|]+)\|)?\s*(\w+)/);
    if (transMatch) {
      const [, from, label, to] = transMatch;

      // Ensure nodes exist
      if (!nodeMap.has(from)) {
        const node: ProcessNode = { id: from, type: 'task', name: from, position: { x: 0, y: 0 } };
        nodes.push(node);
        nodeMap.set(from, node);
      }
      if (!nodeMap.has(to)) {
        const node: ProcessNode = { id: to, type: 'task', name: to, position: { x: 0, y: 0 } };
        nodes.push(node);
        nodeMap.set(to, node);
      }

      transitions.push({
        id: generateId(),
        from,
        to,
        label: label || undefined,
      });
    }
  }

  return {
    id: generateId(),
    name: 'Mermaid Workflow',
    code: 'mermaid-workflow',
    description: 'Imported from Mermaid diagram',
    nodes,
    transitions,
  };
}

/**
 * Validate workflow and collect warnings
 */
function validateWorkflow(workflow: BusinessProcess, warnings: string[]): void {
  const nodeIds = new Set(workflow.nodes.map(n => n.id));

  // Check for orphan transitions
  workflow.transitions.forEach(t => {
    if (!nodeIds.has(t.from)) {
      warnings.push(`Transition references unknown source: ${t.from}`);
    }
    if (!nodeIds.has(t.to)) {
      warnings.push(`Transition references unknown target: ${t.to}`);
    }
  });

  // Check for isolated nodes
  const connectedNodes = new Set<string>();
  workflow.transitions.forEach(t => {
    connectedNodes.add(t.from);
    connectedNodes.add(t.to);
  });

  workflow.nodes.forEach(n => {
    if (!connectedNodes.has(n.id) && workflow.nodes.length > 1) {
      warnings.push(`Node "${n.name}" is isolated (no connections)`);
    }
  });

  // Check for start/end nodes
  const hasStart = workflow.nodes.some(n => n.type === 'start');
  const hasEnd = workflow.nodes.some(n => n.type === 'end');

  if (!hasStart) warnings.push('Workflow has no start node');
  if (!hasEnd) warnings.push('Workflow has no end node');
}

/**
 * Apply dagre layout to workflow
 */
async function applyLayout(workflow: BusinessProcess): Promise<void> {
  if (workflow.nodes.length === 0) return;

  // Check if positions already set
  const hasPositions = workflow.nodes.some(n => n.position.x !== 0 || n.position.y !== 0);
  if (hasPositions) return;

  const Dagre = (await import('@dagrejs/dagre')).default;
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: 'TB',
    nodesep: 80,
    ranksep: 100,
    marginx: 50,
    marginy: 50,
  });

  workflow.nodes.forEach(node => {
    g.setNode(node.id, { width: 150, height: 50 });
  });

  workflow.transitions.forEach(t => {
    g.setEdge(t.from, t.to);
  });

  Dagre.layout(g);

  workflow.nodes.forEach(node => {
    const pos = g.node(node.id);
    if (pos) {
      node.position = { x: pos.x - 75, y: pos.y - 25 };
    }
  });
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// ─────────────────────────────────────────────────────────────
// Workflow Mutation Operations (for conversational editing)
// ─────────────────────────────────────────────────────────────

export interface WorkflowMutation {
  type: 'addNode' | 'removeNode' | 'updateNode' | 'addTransition' | 'removeTransition' | 'updateTransition';
  payload: Record<string, unknown>;
}

/**
 * Apply a mutation to a workflow
 */
export function applyMutation(workflow: BusinessProcess, mutation: WorkflowMutation): BusinessProcess {
  const updated = structuredClone(workflow);

  switch (mutation.type) {
    case 'addNode': {
      const { id, name, type = 'task' } = mutation.payload as { id?: string; name: string; type?: ProcessNodeType };
      updated.nodes.push({
        id: id || generateId(),
        name,
        type,
        position: { x: 0, y: 0 },
      });
      break;
    }

    case 'removeNode': {
      const { id } = mutation.payload as { id: string };
      updated.nodes = updated.nodes.filter(n => n.id !== id);
      updated.transitions = updated.transitions.filter(t => t.from !== id && t.to !== id);
      break;
    }

    case 'updateNode': {
      const { id, ...changes } = mutation.payload as { id: string; name?: string; type?: ProcessNodeType };
      const node = updated.nodes.find(n => n.id === id);
      if (node) {
        Object.assign(node, changes);
      }
      break;
    }

    case 'addTransition': {
      const { from, to, label } = mutation.payload as { from: string; to: string; label?: string };
      updated.transitions.push({
        id: generateId(),
        from,
        to,
        label,
      });
      break;
    }

    case 'removeTransition': {
      const { from, to } = mutation.payload as { from: string; to: string };
      updated.transitions = updated.transitions.filter(t => !(t.from === from && t.to === to));
      break;
    }

    case 'updateTransition': {
      const { from, to, ...changes } = mutation.payload as { from: string; to: string; label?: string };
      const trans = updated.transitions.find(t => t.from === from && t.to === to);
      if (trans) {
        Object.assign(trans, changes);
      }
      break;
    }
  }

  return updated;
}

/**
 * Generate workflow JSON for AI context
 */
export function workflowToContext(workflow: BusinessProcess): string {
  return JSON.stringify({
    name: workflow.name,
    nodes: workflow.nodes.map(n => ({ id: n.id, name: n.name, type: n.type })),
    transitions: workflow.transitions.map(t => ({ from: t.from, to: t.to, label: t.label })),
  }, null, 2);
}
