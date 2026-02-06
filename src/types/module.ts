/**
 * Module Builder Type Definitions
 *
 * Core artifact types for HSE module construction.
 * These represent the simplified MVP scope:
 * - Dictionaries (dropdowns, statuses)
 * - Forms (field definitions)
 * - Business Processes (workflow states)
 */

// ─────────────────────────────────────────────────────────────
// Dictionary Types
// ─────────────────────────────────────────────────────────────

export interface DictionaryCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface DictionaryItem {
  id: string;
  categoryId: string;
  label: string;
  value: string;
  order: number;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
}

export interface Dictionary {
  category: DictionaryCategory;
  items: DictionaryItem[];
}

// ─────────────────────────────────────────────────────────────
// Form Types
// ─────────────────────────────────────────────────────────────

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'user'
  | 'location';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  validation?: FieldValidation;
  options?: FieldOption[];
  dictionaryRef?: string; // Reference to dictionary category
  order: number;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
}

export interface FieldOption {
  label: string;
  value: string;
}

export interface Form {
  id: string;
  name: string;
  code: string;
  description?: string;
  fields: FormField[];
}

// ─────────────────────────────────────────────────────────────
// Business Process Types
// ─────────────────────────────────────────────────────────────

export type ProcessNodeType =
  | 'start'
  | 'end'
  | 'task'
  | 'gateway'
  | 'subprocess';

export interface ProcessNode {
  id: string;
  type: ProcessNodeType;
  name: string;
  description?: string;
  assignee?: string;
  formRef?: string; // Reference to form
  position: { x: number; y: number };
}

export interface ProcessTransition {
  id: string;
  from: string;
  to: string;
  condition?: string;
  label?: string;
}

export interface BusinessProcess {
  id: string;
  name: string;
  code: string;
  description?: string;
  nodes: ProcessNode[];
  transitions: ProcessTransition[];
}

// ─────────────────────────────────────────────────────────────
// Module Aggregate
// ─────────────────────────────────────────────────────────────

export interface Module {
  id: string;
  name: string;
  code: string;
  version: string;
  description?: string;
  dictionaries: Dictionary[];
  forms: Form[];
  processes: BusinessProcess[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Artifact Union (for AI generation)
// ─────────────────────────────────────────────────────────────

export type ArtifactType = 'dictionary' | 'form' | 'process';

export interface GeneratedArtifact {
  type: ArtifactType;
  data: Dictionary | Form | BusinessProcess;
  reasoning?: string;
}

// ─────────────────────────────────────────────────────────────
// Chat Message Types
// ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  artifacts?: GeneratedArtifact[];
  timestamp: string;
}
