import { useTerminalStore, type DirNode } from '../store/terminalStore';
import { normalizePath } from '../utils/pathHelpers';

export type TerminalState = ReturnType<typeof useTerminalStore.getState>;
export type CommandHandler = (args: string[], flags: Record<string, boolean>, printLine: (text: string) => void, state: TerminalState) => void | Promise<void>;

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
      printLine('\x1bc'); // reset terminal
  },

  nano: (args, _flags, printLine, state) => {
    if (args.length === 0) {
      printLine('nano: missing file operand');
      return;
    }
    const target = args[0];
    const node = state.getNode(target);
    
    if (node && node.type === 'dir') {
      printLine(`nano: ${target}: Is a directory`);
      return;
    }

    const content = node && node.type === 'file' ? node.content : '';
    state.setMode('nano', { file: target, content });
  },

  node: (args, _flags, printLine, state) => {
    if (args.length === 0) {
      printLine('node: missing script path');
      return;
    }
    const target = args[0];
    const node = state.getNode(target);
    if (!node || node.type !== 'file') {
      printLine(`node: cannot access '${target}': No such file`);
      return;
    }

    try {
      const run = new Function('console', node.content);
      const mockConsole = {
        log: (...a: any[]) => printLine(a.join(' ')),
        error: (...a: any[]) => printLine('\x1b[31m' + a.join(' ') + '\x1b[0m'),
        warn: (...a: any[]) => printLine('\x1b[33m' + a.join(' ') + '\x1b[0m'),
      };
      run(mockConsole);
    } catch (err: any) {
      printLine(`\x1b[31mError during execution: ${err.message}\x1b[0m`);
    }
  },

  export: (args, _flags, printLine, state) => {
     if (args.length === 0) {
        Object.entries(state.env).forEach(([k, v]) => printLine(`${k}=${v}`));
        return;
     }
     const arg = args.join(' ');
     const [key, ...rest] = arg.split('=');
     if (key && rest.length >= 0) {
         state.setEnv(key, rest.join('='));
     }
  },

  curl: async (args, _flags, printLine) => {
    if (args.length === 0) {
      printLine('curl: try \'curl --help\' or \'curl --manual\' for more information');
      return;
    }
    const url = args[0];
    try {
      printLine(`* Trying ${url}...`);
      const response = await fetch(url);
      if (!response.ok) {
         printLine(`curl: (22) The requested URL returned error: ${response.status}`);
         return;
      }
      const text = await response.text();
      // Split and print lines to avoid breaking xterm wrapping
      text.split('\n').forEach(line => printLine(line));
    } catch (e: any) {
      printLine(`curl: (6) Could not resolve host: ${url}`);
    }
  },

  cp: (args, _flags, printLine, state) => {
    if (args.length < 2) {
      printLine('cp: missing file operand');
      return;
    }
    const src = args[0];
    const dest = args[1];
    const srcNode = state.getNode(src);
    if (!srcNode) {
      printLine(`cp: cannot stat '${src}': No such file or directory`);
      return;
    }
    if (srcNode.type === 'file') {
      const success = state.createNode(dest, 'file', srcNode.content);
      if (!success) printLine(`cp: cannot create regular file '${dest}': Permission denied`);
    } else {
      printLine(`cp: directory copying is mocked for now. Try copying files.`);
    }
  },

  mv: (args, _flags, printLine, state) => {
    if (args.length < 2) {
      printLine('mv: missing file operand');
      return;
    }
    const src = args[0];
    const dest = args[1];
    const srcNode = state.getNode(src);
    if (!srcNode) {
      printLine(`mv: cannot stat '${src}': No such file or directory`);
      return;
    }
    if (srcNode.type === 'file') {
      if (state.createNode(dest, 'file', srcNode.content)) {
        state.deleteNode(src);
      } else {
         printLine(`mv: cannot move '${src}': Permission denied`);
      }
    } else {
      printLine(`mv: directory moving is mocked for now. Try moving files.`);
    }
  },

  grep: (args, _flags, printLine, state) => {
    if (args.length < 2) {
      printLine('grep: missing operand');
      return;
    }
    const pattern = args[0];
    const files = args.slice(1);
    
    files.forEach(file => {
      const node = state.getNode(file);
      if (node && node.type === 'file') {
        const lines = node.content.split('\n');
        lines.forEach(line => {
          if (line.includes(pattern)) {
             const colored = line.replace(new RegExp(pattern, 'g'), `\x1b[31m${pattern}\x1b[0m`);
             printLine(files.length > 1 ? `${file}:${colored}` : colored);
          }
        });
      } else {
        printLine(`grep: ${file}: No such file or directory`);
      }
    });
  },

  whoami: (_args, _flags, printLine, state) => {
    printLine(state.env['USER'] || 'user');
  },

  date: (_args, _flags, printLine) => {
    printLine(new Date().toString());
  },

  history: (_args, _flags, printLine, state) => {
    state.history.forEach((cmd, i) => printLine(`  ${i + 1}  ${cmd}`));
  },

  uptime: (_args, _flags, printLine) => {
    const start = Date.now() - 3600000;
    const ms = Date.now() - start;
    const minutes = Math.floor(ms / 60000);
    printLine(` ${new Date().toLocaleTimeString()} up ${minutes} min,  1 user,  load average: 0.00, 0.01, 0.05`);
  },

  head: (args, _flags, printLine, state) => {
    if (args.length === 0) return printLine('head: missing operand');
    const node = state.getNode(args[0]);
    if (!node || node.type !== 'file') return printLine(`head: cannot open '${args[0]}'`);
    const lines = node.content.split('\n');
    lines.slice(0, 10).forEach(l => printLine(l));
  },

  tail: (args, _flags, printLine, state) => {
    if (args.length === 0) return printLine('tail: missing operand');
    const node = state.getNode(args[0]);
    if (!node || node.type !== 'file') return printLine(`tail: cannot open '${args[0]}'`);
    const lines = node.content.split('\n');
    lines.slice(-10).forEach(l => printLine(l));
  },

  wc: (args, _flags, printLine, state) => {
    if (args.length === 0) return printLine('wc: missing operand');
    const target = args[0];
    const node = state.getNode(target);
    if (!node || node.type !== 'file') return printLine(`wc: ${target}: No such file`);
    const lines = node.content.split('\n').length;
    const words = node.content.split(/\s+/).filter(Boolean).length;
    const chars = node.content.length;
    printLine(`  ${lines}  ${words} ${chars} ${target}`);
  },

  gcc: (args, flags, printLine, state) => {
     if (args.length === 0) {
        printLine('gcc: fatal error: no input files');
        return;
     }

     const fileIndex = args.findIndex(a => a.endsWith('.c'));
     const file = fileIndex !== -1 ? args[fileIndex] : args[0];

     const node = state.getNode(file);
     if (!node || node.type !== 'file') {
        printLine(`gcc: error: ${file}: No such file or directory`);
        return;
     }
     
     let outName = 'a.out';
     if (flags['o']) {
        const outArg = args.find((a, i) => i !== fileIndex);
        if (outArg) outName = outArg;
     }

     printLine(`\x1b[33mCompiling ${file}...\x1b[0m`);
     
     // Very basic C-to-JS "transpiler" for simple demos
     let transpiled = node.content
        .replace(/#include\s*<[^>]+>\n?/g, '') // Remove includes
        .replace(/int\s+main\s*\([^)]*\)\s*{/g, '') // Remove main header
        .replace(/return\s+\d+\s*;/g, '') // Remove any return <number>;
        .replace(/}\s*$/, '') // Remove the final closing brace of main
        .replace(/\bint\s+/g, 'let ') // crude C type to JS let
        .replace(/\bfloat\s+/g, 'let ')
        .replace(/\bchar\s+/g, 'let ')
        .replace(/\bdouble\s+/g, 'let ')
        .replace(/printf\s*\(\s*"([^"]+)"(?:[^)]*)\)\s*;/g, (_m, content) => {
           // Crude printf to console.log (ignores format args, just prints string)
           const clean = content.replace(/\\n$/, '');
           return `console.log("${clean}");`;
        });

     const binaryContent = `console.log("\\x1b[32m[Executing Compiled Binary: ${outName}]\\x1b[0m");\n${transpiled}`;
     state.createNode(outName, 'file', binaryContent);
     printLine(`\x1b[32mCompilation successful. Output: ${outName}\x1b[0m`);
  },

  os_sim: (args, _flags, printLine) => {
     if (args.length === 0) {
        printLine('os_sim: Missing simulation algorithm.');
        printLine('Available: fcfs, bankers, fifo, scan');
        return;
     }
     const algo = args[0].toLowerCase();
     if (algo === 'fcfs') {
        printLine('--- FCFS CPU Scheduling Simulation ---');
        printLine('Processes: P1(10), P2(5), P3(8)');
        printLine('Avg Waiting Time: 8.33');
     } else if (algo === 'bankers') {
        printLine('--- Bankers Algorithm Simulation ---');
        printLine('Available: [3,3,2]');
        printLine('Safe Sequence: P1 -> P0 -> P2');
        printLine('System is SAFE.');
     } else if (algo === 'fifo') {
        printLine('--- FIFO Page Replacement Simulation ---');
        printLine('Reference String: 1, 3, 0, 3, 5, 6, 3 (Frames: 3)');
        printLine('Total Page Faults: 6');
     } else if (algo === 'scan') {
        printLine('--- SCAN Disk Scheduling Simulation ---');
        printLine('Total Head Movement: 331 cylinders');
     } else {
        printLine(`os_sim: unknown algorithm '${algo}'`);
     }
  },

  ai: async (args, _flags, printLine, state) => {
    if (args.length === 0) {
      printLine('ai: missing query. Usage: ai <your question>');
      return;
    }
    const query = args.join(' ');
    printLine('\x1b[35m[AI Assistant thinking...]\x1b[0m');
    
    try {
      const token = localStorage.getItem('hyperos_token');
      const res = await fetch('http://localhost:5000/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          query,
          context: {
             cwd: state.cwd,
             history: state.history
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to contact AI');
      
      const reply = data.reply || 'No response.';
      reply.split('\n').forEach((line: string) => printLine(`\x1b[36m${line}\x1b[0m`));

      if (data.file_name && data.file_content) {
         state.createNode(data.file_name, 'file', data.file_content);
         printLine(`\x1b[32m[AI Generated File: ${data.file_name}]\x1b[0m`);
      }

      if (data.command && data.command.toLowerCase() !== 'none') {
         printLine(`\x1b[33m[AI Auto-Running Command: ${data.command}]\x1b[0m`);
         const { executeCommand } = await import('./engine');
         const commandsToRun = data.command.split('&&').map((c: string) => c.trim());
         for (const cmd of commandsToRun) {
             executeCommand(cmd, printLine);
         }
      }
    } catch (err: any) {
      printLine(`\x1b[31mai error: ${err.message}\x1b[0m`);
    }
  },

  help: (_args, _flags, printLine) => {
    printLine('\x1b[1;36mHyperOS Terminal - Available Commands\x1b[0m');
    printLine('--------------------------------------------------');
    printLine('\x1b[32mFile Management:\x1b[0m   ls, cd, pwd, mkdir, touch, rm, cp, mv');
    printLine('\x1b[32mText Processing:\x1b[0m   cat, grep, head, tail, wc, nano');
    printLine('\x1b[32mSystem Utility:\x1b[0m    clear, echo, date, whoami, uptime, history');
    printLine('\x1b[32mEnvironment:\x1b[0m       export, env (via export)');
    printLine('\x1b[32mNetwork & Dev:\x1b[0m     curl, node, gcc, os_sim');
    printLine('\x1b[32mAI Assistant:\x1b[0m      ai <query>');
    printLine('\x1b[32mSystem Reset:\x1b[0m      reset (clears local storage cache)');
    printLine('--------------------------------------------------');
    printLine('Tip: You can use Output Redirection (>) and Tab Autocompletion!');
  },

  reset: (_args, _flags, printLine) => {
    printLine('\x1b[31mClearing terminal cache and resetting to factory defaults...\x1b[0m');
    setTimeout(() => {
      localStorage.removeItem('hyperos-vfs-storage');
      localStorage.removeItem('hyperos_token');
      window.location.reload();
    }, 1000);
  }
};
