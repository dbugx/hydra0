export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
}

export interface FileNode {
  id: string;
  name: string;
  content: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  parentId?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  lastModified: number;
  files: FileNode[];
  source: 'drive' | 'local' | 'template';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AnalysisResult {
  summary: string;
  suggestions: string[];
}
