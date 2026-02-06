/**
 * Artifact Extraction & Utilities
 *
 * Parses AI responses to extract generated artifacts.
 */

import type { GeneratedArtifact, ArtifactType, BusinessProcess, ProcessNode } from '@/types/module';
import { applyLayout } from './workflow-layout';

/**
 * Extract artifacts from message content
 * Looks for JSON code blocks with type: "dictionary" | "form" | "process"
 */
export function extractArtifacts(content: string): GeneratedArtifact[] {
  const artifacts: GeneratedArtifact[] = [];

  // Match JSON code blocks
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g;
  let match;

  while ((match = jsonBlockRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());

      // Check if it's an artifact
      if (parsed.type && parsed.data) {
        const artifactType = parsed.type as ArtifactType;
        if (['dictionary', 'form', 'process'].includes(artifactType)) {
          let artifactData = parsed.data;

          // For process artifacts, ensure nodes have positions
          if (artifactType === 'process') {
            artifactData = ensureWorkflowPositions(artifactData as BusinessProcess);
          }

          artifacts.push({
            type: artifactType,
            data: artifactData,
            reasoning: parsed.reasoning,
          });
        }
      }
    } catch {
      // Not valid JSON, skip
      continue;
    }
  }

  return artifacts;
}

/**
 * Generate a display name for an artifact
 */
export function getArtifactDisplayName(artifact: GeneratedArtifact): string {
  switch (artifact.type) {
    case 'dictionary':
      return (artifact.data as { category: { name: string } }).category.name;
    case 'form':
      return (artifact.data as { name: string }).name;
    case 'process':
      return (artifact.data as { name: string }).name;
    default:
      return 'Unknown Artifact';
  }
}

/**
 * Get icon name for artifact type
 */
export function getArtifactIcon(type: ArtifactType): string {
  switch (type) {
    case 'dictionary':
      return 'list';
    case 'form':
      return 'file-text';
    case 'process':
      return 'git-branch';
    default:
      return 'box';
  }
}

/**
 * Get color class for artifact type
 */
export function getArtifactColor(type: ArtifactType): string {
  switch (type) {
    case 'dictionary':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'form':
      return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    case 'process':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    default:
      return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
  }
}

/**
 * Ensure workflow nodes have valid positions
 * If any node is missing position, apply automatic layout
 */
function ensureWorkflowPositions(process: BusinessProcess): BusinessProcess {
  if (!process.nodes || process.nodes.length === 0) {
    return process;
  }

  // Check if all nodes have valid positions
  const needsLayout = process.nodes.some(
    (node: ProcessNode) =>
      !node.position ||
      typeof node.position.x !== 'number' ||
      typeof node.position.y !== 'number'
  );

  if (!needsLayout) {
    return process;
  }

  // Clone the process to avoid mutating original
  const clonedProcess: BusinessProcess = {
    ...process,
    nodes: process.nodes.map((node: ProcessNode) => ({
      ...node,
      position: node.position ? { ...node.position } : { x: 0, y: 0 },
    })),
  };

  // Apply layout algorithm
  applyLayout(clonedProcess.nodes, clonedProcess.transitions);

  return clonedProcess;
}
