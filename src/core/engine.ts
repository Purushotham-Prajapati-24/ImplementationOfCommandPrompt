import { parseCommand } from './parser';
import { useTerminalStore } from '../store/terminalStore';
import { commands } from './commands';

/**
 * The core execution engine.
 */
export const executeCommand = (input: string, printLine: (text: string) => void): void => {
  const store = useTerminalStore.getState();
  store.addToHistory(input);

  // Substitute Environment Variables (e.g., $USER)
  const expandedInput = input.replace(/\$(\w+)/g, (_match, varName) => {
    return store.env[varName] !== undefined ? store.env[varName] : '';
  });

  // Output Redirection parser (>)
  let commandStr = expandedInput;
  let outFile: string | null = null;
  
  const redirectMatch = expandedInput.match(/^(.*)\s+>\s+([^\s]+)$/);
  if (redirectMatch) {
    commandStr = redirectMatch[1];
    outFile = redirectMatch[2];
  }

  const parsed = parseCommand(commandStr);
  if (!parsed) return;

  const { command, args, flags } = parsed;
  const handler = commands[command];

  let outputBuffer = '';
  const customPrintLine = (text: string) => {
    if (outFile) {
      outputBuffer += text + '\n';
    } else {
      printLine(text);
    }
  };

  const finalizeRedirection = () => {
    if (outFile) {
      const node = store.getNode(outFile);
      if (node && node.type === 'file') store.deleteNode(outFile);
      store.createNode(outFile, 'file', outputBuffer.trimEnd());
    }
  };

  if (command.startsWith('./')) {
    const file = command.slice(2);
    const node = store.getNode(file);
    if (node && node.type === 'file') {
      const result = commands['node']([file, ...args], flags, customPrintLine, store);
      if (result instanceof Promise) {
         result.finally(finalizeRedirection);
      } else {
         finalizeRedirection();
      }
      return;
    } else {
      customPrintLine(`bash: ${command}: No such file or directory`);
      finalizeRedirection();
      return;
    }
  }

  if (handler) {
    try {
      const result = handler(args, flags, customPrintLine, store);
      if (result instanceof Promise) {
        result.finally(finalizeRedirection);
        return;
      }
    } catch (e: any) {
      customPrintLine(`\x1b[31mError: ${e.message || 'Unknown error occurred'}\x1b[0m`);
    }
  } else {
    customPrintLine(`\x1b[31m${command}: command not found\x1b[0m`);
  }

  finalizeRedirection();
};
