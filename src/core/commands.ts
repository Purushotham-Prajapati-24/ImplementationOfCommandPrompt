import { useTerminalStore, type DirNode } from '../store/terminalStore';
import { normalizePath } from '../utils/pathHelpers';

export type TerminalState = ReturnType<typeof useTerminalStore.getState>;
export type CommandHandler = (args: string[], flags: Record<string, boolean>, printLine: (text: string) => void, state: TerminalState) => void;

export const commands: Record<string, CommandHandler> = {
  echo: (args, _flags, printLine) => {
    printLine(args.join(' '));
  },
  
  pwd: (_args, _flags, printLine, state) => {
    printLine(state.cwd);
  },

  cd: (args, _flags, printLine, state) => {
    const target = args[0] || '/root';
    const success = state.setCwd(target);
    if (!success) {
      printLine(`cd: ${target}: No such file or directory`);
    }
  },

  ls: (args, flags, printLine, state) => {
    const target = args[0] || '.';
    const node = state.getNode(target);

    if (!node) {
      printLine(`ls: cannot access '${target}': No such file or directory`);
      return;
    }

    if (node.type === 'file') {
      printLine(node.name);
      return;
    }

    const dir = node as DirNode;
    const entries = Object.values(dir.children);
    entries.sort((a, b) => a.name.localeCompare(b.name));

    if (flags['l']) {
      entries.forEach(entry => {
        const typeStr = entry.type === 'dir' ? 'd' : '-';
        // Mock size for directories (4096), files use content length
        const size = entry.type === 'dir' ? 4096 : entry.content.length;
        const dateStr = new Date(entry.createdAt).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const color = entry.type === 'dir' ? '\x1b[34m' : '\x1b[37m';
        printLine(`${typeStr}rwxr-xr-x 1 user user ${size.toString().padStart(5, ' ')} ${dateStr} ${color}${entry.name}\x1b[0m`);
      });
    } else {
      const output = entries.map(entry => {
        return entry.type === 'dir' ? `\x1b[34m${entry.name}\x1b[0m` : `\x1b[37m${entry.name}\x1b[0m`;
      }).join('  ');
      if (output) printLine(output);
    }
  },

  cat: (args, _flags, printLine, state) => {
    if (args.length === 0) {
      printLine('cat: missing file operand');
      return;
    }

    for (const file of args) {
      const node = state.getNode(file);
      if (!node) {
        printLine(`cat: ${file}: No such file or directory`);
      } else if (node.type === 'dir') {
        printLine(`cat: ${file}: Is a directory`);
      } else {
        // Output file content, splitting by newline to properly format in xterm
        const lines = node.content.split('\n');
        lines.forEach(l => printLine(l));
      }
    }
  },

  touch: (args, _flags, printLine, state) => {
    if (args.length === 0) {
      printLine('touch: missing file operand');
      return;
    }

    for (const file of args) {
      const existing = state.getNode(file);
      if (!existing) {
        const success = state.createNode(file, 'file', '');
        if (!success) printLine(`touch: cannot touch '${file}': No such file or directory`);
      }
    }
  },

  mkdir: (args, flags, printLine, state) => {
    if (args.length === 0) {
      printLine('mkdir: missing operand');
      return;
    }

    for (const dir of args) {
      if (flags['p']) {
        const normalized = normalizePath(state.cwd, dir);
        const parts = normalized.split('/').filter(Boolean);
        let currentPath = '';
        for (const part of parts) {
          currentPath += '/' + part;
          if (!state.getNode(currentPath)) {
            state.createNode(currentPath, 'dir');
          }
        }
      } else {
        const success = state.createNode(dir, 'dir');
        if (!success) {
          printLine(`mkdir: cannot create directory '${dir}': File exists or parent does not exist`);
        }
      }
    }
  },

  rm: (args, flags, printLine, state) => {
    if (args.length === 0) {
      printLine('rm: missing operand');
      return;
    }

    const recursive = flags['r'] || flags['R'];
    const force = flags['f'];

    for (const target of args) {
      const node = state.getNode(target);
      if (!node) {
        if (!force) printLine(`rm: cannot remove '${target}': No such file or directory`);
        continue;
      }

      if (node.type === 'dir' && !recursive) {
        printLine(`rm: cannot remove '${target}': Is a directory`);
        continue;
      }

      const success = state.deleteNode(target);
      if (!success && !force) {
        printLine(`rm: cannot remove '${target}': Permission denied`);
      }
    }
  },
  
  clear: (_args, _flags, printLine, _state) => {
      // We will handle clear differently later if needed, but xterm clear is a special escape sequence
      printLine('\x1bc'); // reset terminal
  }
};
