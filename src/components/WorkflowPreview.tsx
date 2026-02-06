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
  MarkerType,
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
      fitViewOptions={{ padding: 0.2 }}
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={true}
      zoomOnScroll={true}
      panOnScroll={true}
      panOnDrag={true}
      minZoom={0.3}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{
        type: 'smoothstep',
        animated: false,
      }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#27272a" />
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
  const nodes: Node[] = process.nodes.map((node) => ({
    id: node.id,
    position: node.position,
    data: { label: node.name },
    type: 'default',
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    style: getNodeStyle(node),
  }));

  // Detect back-edges (edges going upward or to earlier ranks)
  const nodeYPositions = new Map(process.nodes.map(n => [n.id, n.position.y]));

  const edges: Edge[] = process.transitions.map((transition) => {
    const sourceY = nodeYPositions.get(transition.from) || 0;
    const targetY = nodeYPositions.get(transition.to) || 0;
    const isBackEdge = targetY < sourceY - 20; // Going upward

    return {
      id: transition.id,
      source: transition.from,
      target: transition.to,
      label: transition.label || undefined,
      type: isBackEdge ? 'smoothstep' : 'smoothstep',
      animated: isBackEdge,
      style: {
        stroke: isBackEdge ? '#f59e0b' : '#10b981',
        strokeWidth: 2,
      },
      labelStyle: {
        fill: '#a1a1aa',
        fontSize: 10,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: '#18181b',
        fillOpacity: 0.9,
      },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isBackEdge ? '#f59e0b' : '#10b981',
        width: 20,
        height: 20,
      },
    };
  });

  return { nodes, edges };
}

function getNodeStyle(node: ProcessNode): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    minWidth: '140px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  };

  switch (node.type) {
    case 'start':
      return {
        ...base,
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff',
        borderRadius: '24px',
        border: '2px solid #34d399',
      };
    case 'end':
      return {
        ...base,
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: '#fff',
        borderRadius: '24px',
        border: '2px solid #f87171',
      };
    case 'gateway':
      return {
        ...base,
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#fff',
        border: '2px solid #fbbf24',
      };
    case 'task':
      return {
        ...base,
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: '#fff',
        border: '2px solid #60a5fa',
      };
    default:
      return {
        ...base,
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: '#fff',
        border: '2px solid #60a5fa',
      };
  }
}
