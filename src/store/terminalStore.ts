import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizePath, getParentPath } from '../utils/pathHelpers';

export type NodeType = 'file' | 'dir';

export interface BaseNode {
  name: string;
  createdAt: number;
}

export interface FileNode extends BaseNode {
  type: 'file';
  content: string;
}

export interface DirNode extends BaseNode {
  type: 'dir';
  children: Record<string, VFSNode>;
}

export type VFSNode = FileNode | DirNode;

interface TerminalState {
  fs: DirNode;
  cwd: string;
  history: string[];
  
  // Getters
  getNode: (path: string) => VFSNode | null;
  getDir: (path: string) => DirNode | null;
  
  // Mutators
  setCwd: (path: string) => boolean;
  createNode: (path: string, type: NodeType, content?: string) => boolean;
  deleteNode: (path: string) => boolean;
  addToHistory: (cmd: string) => void;
}

// Initial root directory structure
const initialFS: DirNode = {
  type: 'dir',
  name: 'root',
  createdAt: Date.now(),
  children: {
    'README.md': {
      type: 'file',
      name: 'README.md',
      createdAt: Date.now(),
      content: 'Welcome to the Browser Terminal Emulator.\nThis is a safe sandbox to practice CLI commands.\n\nTry running "ls -l" or "mkdir -p tests/folder".',
    },
    'projects': {
      type: 'dir',
      name: 'projects',
      createdAt: Date.now(),
      children: {},
    }
  },
};

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set, get) => ({
      fs: {
        type: 'dir',
        name: '', 
        createdAt: Date.now(),
        children: {
          'root': initialFS 
        }
      },
      cwd: '/root',
      history: [],

  getNode: (path: string) => {
    const { fs } = get();
    const normalized = normalizePath(get().cwd, path);
    if (normalized === '/') return fs;

    const parts = normalized.split('/').filter(Boolean);
    let current: VFSNode = fs;

    for (const part of parts) {
      if (current.type !== 'dir' || !current.children[part]) {
        return null;
      }
      current = current.children[part];
    }
    return current;
  },

  getDir: (path: string) => {
    const node = get().getNode(path);
    return (node && node.type === 'dir') ? node : null;
  },

  setCwd: (path: string) => {
    const dir = get().getDir(path);
    if (dir) {
      set({ cwd: normalizePath(get().cwd, path) });
      return true;
    }
    return false;
  },

  createNode: (path: string, type: NodeType, content: string = '') => {
    const normalized = normalizePath(get().cwd, path);
    if (normalized === '/') return false; // Cannot overwrite root

    const { parentPath, targetName } = getParentPath(normalized);
    const parent = get().getDir(parentPath);
    
    // Parent must exist and be a directory. Target must not already exist.
    if (!parent || parent.children[targetName]) return false;

    const newNode: VFSNode = type === 'dir' 
      ? { type: 'dir', name: targetName, createdAt: Date.now(), children: {} }
      : { type: 'file', name: targetName, createdAt: Date.now(), content };

    set((state) => {
      const newFs = structuredClone(state.fs);
      
      const parts = parentPath.split('/').filter(Boolean);
      let curr = newFs;
      for (const part of parts) {
        if (curr.type === 'dir') {
           curr = curr.children[part] as DirNode;
        }
      }
      
      curr.children[targetName] = newNode;
      return { fs: newFs };
    });
    
    return true;
  },

  deleteNode: (path: string) => {
    const normalized = normalizePath(get().cwd, path);
    // Protect root directory from deletion
    if (normalized === '/' || normalized === '/root') return false;

    const { parentPath, targetName } = getParentPath(normalized);
    const parent = get().getDir(parentPath);
    
    if (!parent || !parent.children[targetName]) return false;

    set((state) => {
      const newFs = structuredClone(state.fs);
      
      const parts = parentPath.split('/').filter(Boolean);
      let curr = newFs;
      for (const part of parts) {
        if (curr.type === 'dir') {
           curr = curr.children[part] as DirNode;
        }
      }
      
      delete curr.children[targetName];
      return { fs: newFs };
    });
    
    return true;
  },

  addToHistory: (cmd: string) => {
    if (cmd.trim()) {
      set((state) => ({ history: [...state.history, cmd] }));
    }
  }
}),
{ name: 'hyperos-vfs-storage' }
));
