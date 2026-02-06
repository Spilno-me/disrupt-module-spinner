/**
 * Workflow Layout Algorithm
 *
 * Pure TypeScript implementation for directed graph layout.
 * No external dependencies - works in browser and server.
 */

import type { ProcessNode, ProcessTransition } from '@/types/module';

interface LayoutOptions {
  direction: 'TB' | 'LR';  // Top-to-bottom or left-to-right
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
  marginX: number;
  marginY: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  direction: 'TB',
  nodeWidth: 150,
  nodeHeight: 50,
  horizontalGap: 80,
  verticalGap: 100,
  marginX: 50,
  marginY: 50,
};

/**
 * Apply hierarchical layout to nodes
 * Handles cycles by using longest-path layering
 */
export function applyLayout(
  nodes: ProcessNode[],
  transitions: ProcessTransition[],
  options: Partial<LayoutOptions> = {}
): void {
  if (nodes.length === 0) return;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Build adjacency lists
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  nodes.forEach(n => {
    outgoing.set(n.id, []);
    incoming.set(n.id, []);
  });

  transitions.forEach(t => {
    if (nodeMap.has(t.from) && nodeMap.has(t.to)) {
      outgoing.get(t.from)!.push(t.to);
      incoming.get(t.to)!.push(t.from);
    }
  });

  // Step 1: Assign layers using longest-path algorithm
  const layers = assignLayers(nodes, outgoing, incoming);

  // Step 2: Order nodes within each layer to minimize crossings
  const orderedLayers = orderNodesInLayers(layers, outgoing);

  // Step 3: Assign positions
  assignPositions(orderedLayers, nodeMap, opts);
}

/**
 * Assign layers using modified longest-path algorithm
 * Handles cycles by processing nodes in topological-ish order
 */
function assignLayers(
  nodes: ProcessNode[],
  outgoing: Map<string, string[]>,
  incoming: Map<string, string[]>
): string[][] {
  const layers: string[][] = [];
  const nodeLayer = new Map<string, number>();
  const visited = new Set<string>();
  const inProgress = new Set<string>();

  // Find start nodes (no incoming edges or marked as 'start')
  const startNodes = nodes.filter(n =>
    n.type === 'start' || incoming.get(n.id)!.length === 0
  );

  // If no start nodes found, pick first node
  if (startNodes.length === 0 && nodes.length > 0) {
    startNodes.push(nodes[0]);
  }

  // DFS to assign layers
  function dfs(nodeId: string, minLayer: number): number {
    if (nodeLayer.has(nodeId)) {
      return nodeLayer.get(nodeId)!;
    }

    if (inProgress.has(nodeId)) {
      // Cycle detected - use current minimum layer
      return minLayer;
    }

    inProgress.add(nodeId);
    visited.add(nodeId);

    let maxChildLayer = minLayer - 1;

    // Process all predecessors first
    const predecessors = incoming.get(nodeId) || [];
    for (const pred of predecessors) {
      if (!inProgress.has(pred)) {
        const predLayer = dfs(pred, 0);
        maxChildLayer = Math.max(maxChildLayer, predLayer);
      }
    }

    const layer = maxChildLayer + 1;
    nodeLayer.set(nodeId, layer);
    inProgress.delete(nodeId);

    return layer;
  }

  // Process from start nodes
  for (const startNode of startNodes) {
    dfs(startNode.id, 0);
  }

  // Process any remaining unvisited nodes
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, 0);
    }
  }

  // Group nodes by layer
  const maxLayer = Math.max(...Array.from(nodeLayer.values()), 0);
  for (let i = 0; i <= maxLayer; i++) {
    layers.push([]);
  }

  nodeLayer.forEach((layer, nodeId) => {
    layers[layer].push(nodeId);
  });

  return layers.filter(l => l.length > 0);
}

/**
 * Order nodes within layers to minimize edge crossings
 * Uses barycenter heuristic
 */
function orderNodesInLayers(
  layers: string[][],
  outgoing: Map<string, string[]>
): string[][] {
  const orderedLayers = layers.map(l => [...l]);

  // Multiple passes to improve ordering
  for (let pass = 0; pass < 4; pass++) {
    // Forward pass
    for (let i = 1; i < orderedLayers.length; i++) {
      orderLayerByBarycenter(orderedLayers, i, outgoing, 'down');
    }

    // Backward pass
    for (let i = orderedLayers.length - 2; i >= 0; i--) {
      orderLayerByBarycenter(orderedLayers, i, outgoing, 'up');
    }
  }

  return orderedLayers;
}

/**
 * Order a single layer using barycenter method
 */
function orderLayerByBarycenter(
  layers: string[][],
  layerIndex: number,
  outgoing: Map<string, string[]>,
  direction: 'up' | 'down'
): void {
  const layer = layers[layerIndex];
  const refLayer = direction === 'down'
    ? layers[layerIndex - 1]
    : layers[layerIndex + 1];

  if (!refLayer || refLayer.length === 0) return;

  const refPositions = new Map(refLayer.map((id, idx) => [id, idx]));

  // Calculate barycenter for each node
  const barycenters = layer.map(nodeId => {
    let sum = 0;
    let count = 0;

    if (direction === 'down') {
      // Look at predecessors
      const predecessors = Array.from(outgoing.entries())
        .filter(([, targets]) => targets.includes(nodeId))
        .map(([source]) => source);

      for (const pred of predecessors) {
        if (refPositions.has(pred)) {
          sum += refPositions.get(pred)!;
          count++;
        }
      }
    } else {
      // Look at successors
      const successors = outgoing.get(nodeId) || [];
      for (const succ of successors) {
        if (refPositions.has(succ)) {
          sum += refPositions.get(succ)!;
          count++;
        }
      }
    }

    return {
      nodeId,
      barycenter: count > 0 ? sum / count : Infinity,
    };
  });

  // Sort by barycenter
  barycenters.sort((a, b) => a.barycenter - b.barycenter);

  // Update layer order
  layers[layerIndex] = barycenters.map(b => b.nodeId);
}

/**
 * Assign x,y positions to nodes
 */
function assignPositions(
  layers: string[][],
  nodeMap: Map<string, ProcessNode>,
  opts: LayoutOptions
): void {
  const isVertical = opts.direction === 'TB';

  layers.forEach((layer, layerIndex) => {
    const layerSize = layer.length;
    const totalSpan = isVertical
      ? (layerSize - 1) * (opts.nodeWidth + opts.horizontalGap)
      : (layerSize - 1) * (opts.nodeHeight + opts.verticalGap);

    layer.forEach((nodeId, nodeIndex) => {
      const node = nodeMap.get(nodeId);
      if (!node) return;

      if (isVertical) {
        // Top to bottom: x varies within layer, y varies by layer
        const layerOffset = nodeIndex * (opts.nodeWidth + opts.horizontalGap) - totalSpan / 2;
        node.position = {
          x: opts.marginX + layerOffset + 400, // Center horizontally
          y: opts.marginY + layerIndex * (opts.nodeHeight + opts.verticalGap),
        };
      } else {
        // Left to right: x varies by layer, y varies within layer
        const layerOffset = nodeIndex * (opts.nodeHeight + opts.verticalGap) - totalSpan / 2;
        node.position = {
          x: opts.marginX + layerIndex * (opts.nodeWidth + opts.horizontalGap),
          y: opts.marginY + layerOffset + 300,
        };
      }
    });
  });
}
