// ============================================
// NIVA — Generation Engine Types & Interfaces
// ============================================

export type GenerationType = 'image' | 'code' | 'document' | 'audio';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ImageGenOptions {
  prompt: string;
  style?: 'photorealistic' | 'cyberpunk' | 'anime' | '3d-render' | 'minimalist' | 'vector';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  width?: number;
  height?: number;
  seed?: number;
}

export interface ImageGenResult {
  imageUrl: string;
  localPath: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  width: number;
  height: number;
}

export interface CodeGenOptions {
  prompt: string;
  language?: 'typescript' | 'python' | 'javascript' | 'html' | 'css' | 'sql' | 'bash' | 'rust';
  includeTests?: boolean;
  projectType?: string;
}

export interface CodeGenResult {
  code: string;
  language: string;
  explanation: string;
  fileName?: string;
  suggestedRunCommand?: string;
}

export interface DocumentGenOptions {
  topic: string;
  format?: 'markdown' | 'html' | 'csv' | 'json';
  sections?: string[];
  depth?: 'brief' | 'detailed' | 'comprehensive';
}

export interface DocumentGenResult {
  content: string;
  format: string;
  fileName: string;
  fileUrl?: string;
  wordCount: number;
}

export interface AudioGenOptions {
  text: string;
  voice?: string;
  format?: 'wav' | 'mp3';
}

export interface AudioGenResult {
  audioUrl: string;
  localPath: string;
  durationSeconds?: number;
}

export interface GenerationJob {
  id: string;
  type: GenerationType;
  status: JobStatus;
  input: any;
  output?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}
