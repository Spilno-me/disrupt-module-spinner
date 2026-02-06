'use client';

/**
 * Workflow Preview Component
 *
 * Visualizes business processes as interactive flow diagrams
 * using React Flow. Shows nodes, transitions, and connections.
 */

import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  Position,
  MarkerType,
  Controls,
  MiniMap,
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
      fitViewOptions={{ padding: 0.3, minZoom: 0.4, maxZoom: 1.2 }}
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={true}
      zoomOnScroll={true}
      panOnScroll={true}
      panOnDrag={true}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{
        type: 'smoothstep',
        animated: false,
      }}
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1f1f23" />
      <Controls
        showInteractive={false}
        className="!bg-zinc-800 !border-zinc-700 !shadow-lg"
      />
      <MiniMap
        nodeColor={(node) => {
          if (node.data?.nodeType === 'start') return '#10b981';
          if (node.data?.nodeType === 'end') return '#ef4444';
          if (node.data?.nodeType === 'gateway') return '#f59e0b';
          return '#3b82f6';
        }}
        maskColor="rgba(0, 0, 0, 0.8)"
        className="!bg-zinc-900 !border-zinc-700"
      />
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
    data: { label: node.name, nodeType: node.type },
    type: 'default',
    // Horizontal flow: connect left to right
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: getNodeStyle(node),
  }));

  // Detect back-edges (edges going backward in horizontal layout)
  const nodeXPositions = new Map(process.nodes.map(n => [n.id, n.position.x]));

  const edges: Edge[] = process.transitions.map((transition) => {
    const sourceX = nodeXPositions.get(transition.from) || 0;
    const targetX = nodeXPositions.get(transition.to) || 0;
    const isBackEdge = targetX < sourceX - 50; // Going backward (left)

    return {
      id: transition.id,
      source: transition.from,
      target: transition.to,
      label: transition.label || undefined,
      type: 'smoothstep',
      animated: isBackEdge,
      style: {
        stroke: isBackEdge ? '#f59e0b' : '#52525b',
        strokeWidth: 1.5,
      },
      labelStyle: {
        fill: '#71717a',
        fontSize: 9,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: '#09090b',
        fillOpacity: 0.95,
      },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isBackEdge ? '#f59e0b' : '#52525b',
        width: 16,
        height: 16,
      },
    };
  });

  return { nodes, edges };
}

function getNodeStyle(node: ProcessNode): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: 500,
    minWidth: '120px',
    maxWidth: '160px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.2s ease',
  };

  switch (node.type) {
    case 'start':
      // BPMN: Start events are circles
      return {
        ...base,
        background: '#18181b',
        color: '#10b981',
        borderRadius: '50px',
        border: '2px solid #10b981',
        minWidth: '80px',
        maxWidth: '120px',
        padding: '8px 12px',
      };
    case 'end':
      // BPMN: End events are bold circles
      return {
        ...base,
        background: '#18181b',
        color: '#ef4444',
        borderRadius: '50px',
        border: '3px solid #ef4444',
        minWidth: '80px',
        maxWidth: '120px',
        padding: '8px 12px',
      };
    case 'gateway':
      // BPMN: Gateways are diamonds (we use rounded square)
      return {
        ...base,
        background: '#18181b',
        color: '#f59e0b',
        borderRadius: '4px',
        border: '2px solid #f59e0b',
        transform: 'rotate(0deg)', // Could be 45deg for diamond
        minWidth: '100px',
      };
    case 'task':
    default:
      // BPMN: Tasks are rounded rectangles
      return {
        ...base,
        background: '#18181b',
        color: '#e4e4e7',
        borderRadius: '8px',
        border: '1px solid #3f3f46',
      };
  }
}
