import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { executeCommand } from '../core/engine';
import { useTerminalStore } from '../store/terminalStore';
import { getAutocomplete } from '../utils/autocomplete';
import { NanoEditor } from '../core/nano';

const Terminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  // Advanced State Trackers
  const inputBufferRef = useRef<string>('');
  const cursorIndexRef = useRef<number>(0);
  const historyIndexRef = useRef<number>(-1);
  const nanoEditorRef = useRef<NanoEditor | null>(null);

  const mode = useTerminalStore((state) => state.mode);
  const nanoContext = useTerminalStore((state) => state.nanoContext);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontFamily: '"Fira Code", "Cascadia Code", "Ubuntu Mono", monospace',
      fontSize: 15,
      theme: {
        background: '#0d1117', // GitHub dark dim
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        selectionBackground: '#3b82f640',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    const editor = new NanoEditor(term);
    nanoEditorRef.current = editor;

    const currentState = useTerminalStore.getState();
    if (currentState.mode === 'nano' && currentState.nanoContext) {
      editor.start(currentState.nanoContext.file, currentState.nanoContext.content);
    }

    const unsub = useTerminalStore.subscribe((state) => {
      if (state.mode === 'nano' && state.nanoContext && !editor.isActive) {
        editor.start(state.nanoContext.file, state.nanoContext.content);
      }
    });

    const printLine = (text: string) => {
      term.writeln(text);
    };

    const getPrompt = () => {
      const state = useTerminalStore.getState();
      const user = state.env['USER'] || 'user';
      const host = state.env['HOST'] || 'hyperos';
      return `\r\n\x1b[1;32m${user}@${host}\x1b[0m:\x1b[1;34m${state.cwd}\x1b[0m$ `;
    };

    // Welcome Banner
    term.writeln('\x1b[1;36m┌──────────────────────────────────────────────┐\x1b[0m');
    term.writeln('\x1b[1;36m│\x1b[0m  \x1b[1;37mHyperOS Browser Terminal v2.0.0\x1b[0m             \x1b[1;36m│\x1b[0m');
    term.writeln('\x1b[1;36m│\x1b[0m  \x1b[38;5;245mType \x1b[1;32mls -l\x1b[38;5;245m to see files, or \x1b[1;32mclear\x1b[38;5;245m to reset\x1b[0m \x1b[1;36m│\x1b[0m');
    term.writeln('\x1b[1;36m└──────────────────────────────────────────────┘\x1b[0m');
    term.write(getPrompt());

    // Advanced Keystroke Engine
    term.onData((data) => {
      const currentState = useTerminalStore.getState();
      if (currentState.mode === 'nano') {
        nanoEditorRef.current?.handleInput(data);
        return;
      }

      const char = data;
      const buffer = inputBufferRef.current;
      const cursor = cursorIndexRef.current;

      if (char === '\x1b[A') { // Arrow Up
        const history = useTerminalStore.getState().history;
        if (history.length > 0 && historyIndexRef.current < history.length - 1) {
          historyIndexRef.current++;
          const cmd = history[history.length - 1 - historyIndexRef.current];
          term.write('\x1b[2K\r' + getPrompt() + cmd);
          inputBufferRef.current = cmd;
          cursorIndexRef.current = cmd.length;
        }
      } else if (char === '\x1b[B') { // Arrow Down
        const history = useTerminalStore.getState().history;
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const cmd = history[history.length - 1 - historyIndexRef.current];
          term.write('\x1b[2K\r' + getPrompt() + cmd);
          inputBufferRef.current = cmd;
          cursorIndexRef.current = cmd.length;
        } else if (historyIndexRef.current === 0) {
          historyIndexRef.current = -1;
          term.write('\x1b[2K\r' + getPrompt());
          inputBufferRef.current = '';
          cursorIndexRef.current = 0;
        }
      } else if (char === '\x1b[D') { // Arrow Left
        if (cursor > 0) {
          cursorIndexRef.current--;
          term.write(char);
        }
      } else if (char === '\x1b[C') { // Arrow Right
        if (cursor < buffer.length) {
          cursorIndexRef.current++;
          term.write(char);
        }
      } else if (char === '\r') { // Enter
        term.writeln('');
        const input = buffer.trim();
        if (input) {
            executeCommand(input, printLine);
        }
        inputBufferRef.current = '';
        cursorIndexRef.current = 0;
        historyIndexRef.current = -1;
        term.write(getPrompt());
      } else if (char === '\u007F') { // Backspace
        if (cursor > 0) {
          const left = buffer.slice(0, cursor - 1);
          const right = buffer.slice(cursor);
          inputBufferRef.current = left + right;
          cursorIndexRef.current--;
          
          term.write('\b'); // move left
          term.write(right + ' '); // shift right characters over
          term.write('\b'.repeat(right.length + 1)); // restore cursor
        }
      } else if (char === '\t') { // Tab Autocomplete
        const append = getAutocomplete(buffer.slice(0, cursor));
        if (append) {
          const left = buffer.slice(0, cursor) + append;
          const right = buffer.slice(cursor);
          inputBufferRef.current = left + right;
          cursorIndexRef.current += append.length;
          
          term.write(append + right);
          if (right.length > 0) {
             term.write('\b'.repeat(right.length));
          }
        }
      } else if (char === '\x03') { // Ctrl+C
        if (term.hasSelection()) {
          navigator.clipboard.writeText(term.getSelection());
          term.clearSelection();
          return;
        }
        term.writeln('^C');
        inputBufferRef.current = '';
        cursorIndexRef.current = 0;
        historyIndexRef.current = -1;
        term.write(getPrompt());
      } else if (char === '\x16') { // Ctrl+V
        navigator.clipboard.readText().then((text) => {
          const cleanChar = text.replace(/[\r\n]+/g, ' ').replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '');
          if (cleanChar.length > 0) {
            const left = inputBufferRef.current.slice(0, cursorIndexRef.current);
            const right = inputBufferRef.current.slice(cursorIndexRef.current);
            inputBufferRef.current = left + cleanChar + right;
            cursorIndexRef.current += cleanChar.length;
            
            term.write(cleanChar + right);
            if (right.length > 0) {
              term.write('\b'.repeat(right.length));
            }
          }
        }).catch(() => {
          // Clipboard access denied or failed, ignore
        });
      } else if (!char.startsWith('\x1b')) { // Normal characters and Pasted Text
        const cleanChar = char.replace(/[\r\n]+/g, ' ').replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '');
        if (cleanChar.length > 0) {
          const left = buffer.slice(0, cursor);
          const right = buffer.slice(cursor);
          inputBufferRef.current = left + cleanChar + right;
          cursorIndexRef.current += cleanChar.length;
          
          term.write(cleanChar + right);
          if (right.length > 0) {
            term.write('\b'.repeat(right.length));
          }
        }
      }
    });

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      unsub();
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  return <div ref={terminalRef} className="w-full h-full p-4 bg-[#0d1117] overflow-hidden" />;
};

export default Terminal;
