'use client';

/**
 * Workflow Preview Component
 *
 * Visualizes business processes as interactive flow diagrams
 * using React Flow. Shows nodes, transitions, and connections.
 */

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { BusinessProcess, ProcessNode } from '@/types/module';

interface WorkflowPreviewProps {
  process: BusinessProcess;
}

export function WorkflowPreview({ process }: WorkflowPreviewProps) {
  const { nodes, edges } = useMemo(
    () => transformToReactFlow(process),
    [process]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      zoomOnScroll={false}
      panOnScroll={false}
      panOnDrag={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#333" />
    </ReactFlow>
  );
}

// ─────────────────────────────────────────────────────────────
// Transform business process to React Flow format
// ─────────────────────────────────────────────────────────────

function transformToReactFlow(process: BusinessProcess): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = process.nodes.map((node, index) => ({
    id: node.id,
    position: node.position || { x: 150 * index, y: 100 },
    data: { label: node.name },
    type: getNodeType(node),
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: getNodeStyle(node),
  }));

  const edges: Edge[] = process.transitions.map((transition) => ({
    id: transition.id,
    source: transition.from,
    target: transition.to,
    label: transition.label,
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 },
    labelStyle: { fill: '#a1a1aa', fontSize: 10 },
  }));

  // Auto-layout if positions not provided
  if (nodes.every((n) => n.position.x === 0 && n.position.y === 0)) {
    autoLayout(nodes, edges);
  }

  return { nodes, edges };
}

function getNodeType(node: ProcessNode): string {
  switch (node.type) {
    case 'start':
    case 'end':
      return 'input';
    case 'gateway':
      return 'default';
    default:
      return 'default';
  }
}

function getNodeStyle(node: ProcessNode): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 500,
  };

  switch (node.type) {
    case 'start':
      return {
        ...base,
        background: '#10b981',
        color: '#fff',
        borderRadius: '20px',
      };
    case 'end':
      return {
        ...base,
        background: '#ef4444',
        color: '#fff',
        borderRadius: '20px',
      };
    case 'gateway':
      return {
        ...base,
        background: '#f59e0b',
        color: '#fff',
        transform: 'rotate(45deg)',
      };
    case 'task':
      return {
        ...base,
        background: '#3b82f6',
        color: '#fff',
        border: '2px solid #60a5fa',
      };
    default:
      return {
        ...base,
        background: '#27272a',
        color: '#e4e4e7',
        border: '1px solid #3f3f46',
      };
  }
}

function autoLayout(nodes: Node[], edges: Edge[]) {
  // Simple left-to-right layout based on edges
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const levels: string[][] = [];

  // Find start nodes (no incoming edges)
  const hasIncoming = new Set(edges.map((e) => e.target));
  const startNodes = nodes.filter((n) => !hasIncoming.has(n.id));

  // BFS to assign levels
  let currentLevel = startNodes.map((n) => n.id);
  while (currentLevel.length > 0) {
    levels.push(currentLevel);
    currentLevel.forEach((id) => visited.add(id));

    const nextLevel: string[] = [];
    for (const nodeId of currentLevel) {
      const outgoing = edges.filter((e) => e.source === nodeId);
      for (const edge of outgoing) {
        if (!visited.has(edge.target)) {
          nextLevel.push(edge.target);
        }
      }
    }
    currentLevel = [...new Set(nextLevel)];
  }

  // Position nodes
  const xGap = 180;
  const yGap = 80;

  levels.forEach((level, levelIndex) => {
    level.forEach((nodeId, nodeIndex) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        node.position = {
          x: levelIndex * xGap + 50,
          y: nodeIndex * yGap + 50 - (level.length - 1) * (yGap / 2),
        };
      }
    });
  });
}
