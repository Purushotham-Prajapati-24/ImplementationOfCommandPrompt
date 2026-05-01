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

export type TerminalMode = 'shell' | 'nano';

interface TerminalState {
  fs: DirNode;
  cwd: string;
  history: string[];
  mode: TerminalMode;
  nanoContext: { file: string, content: string } | null;
  env: Record<string, string>;
  
  // Getters
  getNode: (path: string) => VFSNode | null;
  getDir: (path: string) => DirNode | null;
  
  // Mutators
  setCwd: (path: string) => boolean;
  setMode: (mode: TerminalMode, context?: { file: string, content: string } | null) => void;
  setEnv: (key: string, value: string) => void;
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
      content: 'Welcome to the Browser Terminal Emulator.\nThis is a safe sandbox to practice CLI commands.\n\nTry running "ls -l" or "nano newfile.js".',
    },
    'os_lab': {
      type: 'dir',
      name: 'os_lab',
      createdAt: Date.now(),
      children: {
        'fcfs.js': {
          type: 'file', name: 'fcfs.js', createdAt: Date.now(),
          content: 'const p=[{id:1,bt:10},{id:2,bt:5},{id:3,bt:8}];\nlet t=0;\nconsole.log("--- FCFS CPU Scheduling ---");\np.forEach(x => { console.log(`P${x.id} starts at ${t}, finishes at ${t+x.bt}`); t+=x.bt; });'
        },
        'bankers.js': {
          type: 'file', name: 'bankers.js', createdAt: Date.now(),
          content: 'console.log("--- Bankers Algorithm ---");\nconsole.log("Allocated: [0,1,0], [2,0,0], [3,0,2]");\nconsole.log("Max: [7,5,3], [3,2,2], [9,0,2]");\nconsole.log("Safe Sequence: P1 -> P0 -> P2");'
        },
        'page_replacement.js': {
           type: 'file', name: 'page_replacement.js', createdAt: Date.now(),
           content: 'const pages=[1,3,0,3,5,6,3];\nlet mem=[], faults=0;\nconsole.log("--- FIFO Page Replacement ---");\npages.forEach(p => { if(!mem.includes(p)){ if(mem.length===3)mem.shift(); mem.push(p); faults++; console.log(`Fault for ${p}: [${mem}]`);} });\nconsole.log("Total Faults:", faults);'
        }
      }
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
      mode: 'shell',
      nanoContext: null,
      env: { USER: 'admin', HOST: 'hyperos' },

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

  setMode: (mode: TerminalMode, context: { file: string, content: string } | null = null) => {
    set({ mode, nanoContext: context });
  },

  setEnv: (key: string, value: string) => {
    set((state) => ({ env: { ...state.env, [key]: value } }));
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
