import { useTerminalStore } from '../store/terminalStore';
import { commands } from '../core/commands';
import { getParentPath, normalizePath } from './pathHelpers';

export const getAutocomplete = (input: string): string => {
  const state = useTerminalStore.getState();
  const trimmed = input.trimStart();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s+/);
  
  // Autocomplete Commands
  if (parts.length === 1) {
    const cmdList = Object.keys(commands);
    const matches = cmdList.filter(c => c.startsWith(parts[0]));
    
    if (matches.length === 1) {
      return matches[0].slice(parts[0].length) + ' ';
    }
    return '';
  }

  // Autocomplete Paths (Files/Directories)
  const lastPart = parts[parts.length - 1];
  const { parentPath, targetName } = getParentPath(normalizePath(state.cwd, lastPart));
  
  const parent = state.getDir(parentPath);
  if (!parent) return '';

  const childrenNames = Object.keys(parent.children);
  const matches = childrenNames.filter(n => n.startsWith(targetName));
  
  if (matches.length === 1) {
    const matchNode = parent.children[matches[0]];
    const suffix = matchNode.type === 'dir' ? '/' : ' ';
    return matches[0].slice(targetName.length) + suffix;
  }
  
  return '';
};
