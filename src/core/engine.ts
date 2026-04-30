import { parseCommand } from './parser';
import { useTerminalStore } from '../store/terminalStore';
import { commands } from './commands';

/**
 * The core execution engine.
 * Takes raw string input from the terminal UI, parses it, records it in history,
 * and routes it to the corresponding command handler.
 */
export const executeCommand = (input: string, printLine: (text: string) => void): void => {
  const parsed = parseCommand(input);
  if (!parsed) return;

  const { command, args, flags } = parsed;

  const store = useTerminalStore.getState();
  store.addToHistory(input);

  const handler = commands[command];

  if (handler) {
    try {
      handler(args, flags, printLine, store);
    } catch (e: any) {
      printLine(`\x1b[31mError: ${e.message || 'Unknown error occurred'}\x1b[0m`);
    }
  } else {
    printLine(`\x1b[31m${command}: command not found\x1b[0m`);
  }
};
