/**
 * Artifact Extraction & Utilities
 *
 * Parses AI responses to extract generated artifacts.
 */

import type { GeneratedArtifact, ArtifactType } from '@/types/module';

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
          artifacts.push({
            type: artifactType,
            data: parsed.data,
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
