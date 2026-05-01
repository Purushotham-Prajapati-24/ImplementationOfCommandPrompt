import { Terminal as XTerm } from '@xterm/xterm';
import { useTerminalStore } from '../store/terminalStore';

export class NanoEditor {
  private term: XTerm;
  private lines: string[] = [''];
  private cursorX: number = 0;
  private cursorY: number = 0;
  private file: string = '';
  public isActive: boolean = false;

  constructor(term: XTerm) {
    this.term = term;
  }

  public start(file: string, initialContent: string) {
    this.isActive = true;
    this.file = file;
    this.lines = initialContent ? initialContent.split('\n') : [''];
    if (this.lines.length === 0) this.lines = [''];
    this.cursorX = 0;
    this.cursorY = 0;

    // Switch to alternate screen buffer and clear
    this.term.write('\x1b[?1049h');
    this.term.write('\x1b[H\x1b[2J');
    this.render();
  }

  private render() {
    this.term.write('\x1b[?25l'); // Hide cursor
    this.term.write('\x1b[H'); // Move to 0,0
    
    // Header
    const headerStr = `  GNU nano Browser Port                      File: ${this.file} `;
    this.term.write('\x1b[7m' + headerStr.padEnd(this.term.cols, ' ') + '\x1b[0m\r\n');

    // Body
    const rows = this.term.rows - 3;
    for (let i = 0; i < rows; i++) {
      const line = this.lines[i] || '';
      // Truncate to terminal width for simple MVP
      const displayLine = line.slice(0, this.term.cols);
      this.term.write(displayLine + '\x1b[K\r\n');
    }

    // Footer
    this.term.write('\x1b[7m^X\x1b[0m Exit (Auto-Saves) \x1b[K');
    
    // Move cursor to actual position (Y + 2 because of header)
    this.term.write(`\x1b[${this.cursorY + 2};${this.cursorX + 1}H`);
    
    this.term.write('\x1b[?25h'); // Show cursor
  }

  public handleInput(data: string) {
    if (!this.isActive) return;

    if (data === '\x18') { // Ctrl+X
      this.exit();
      return;
    }

    if (data === '\x1b[A') { // Up
      if (this.cursorY > 0) {
        this.cursorY--;
        this.cursorX = Math.min(this.cursorX, this.lines[this.cursorY].length);
      }
    } else if (data === '\x1b[B') { // Down
      if (this.cursorY < this.lines.length - 1) {
        this.cursorY++;
        this.cursorX = Math.min(this.cursorX, this.lines[this.cursorY].length);
      }
    } else if (data === '\x1b[C') { // Right
      if (this.cursorX < this.lines[this.cursorY].length) {
        this.cursorX++;
      } else if (this.cursorY < this.lines.length - 1) {
        this.cursorY++;
        this.cursorX = 0;
      }
    } else if (data === '\x1b[D') { // Left
      if (this.cursorX > 0) {
        this.cursorX--;
      } else if (this.cursorY > 0) {
        this.cursorY--;
        this.cursorX = this.lines[this.cursorY].length;
      }
    } else if (data === '\r') { // Enter
      const left = this.lines[this.cursorY].slice(0, this.cursorX);
      const right = this.lines[this.cursorY].slice(this.cursorX);
      this.lines[this.cursorY] = left;
      this.lines.splice(this.cursorY + 1, 0, right);
      this.cursorY++;
      this.cursorX = 0;
    } else if (data === '\u007F') { // Backspace
      if (this.cursorX > 0) {
        const line = this.lines[this.cursorY];
        this.lines[this.cursorY] = line.slice(0, this.cursorX - 1) + line.slice(this.cursorX);
        this.cursorX--;
      } else if (this.cursorY > 0) {
        const currentLine = this.lines[this.cursorY];
        this.lines.splice(this.cursorY, 1);
        this.cursorY--;
        this.cursorX = this.lines[this.cursorY].length;
        this.lines[this.cursorY] += currentLine;
      }
    } else if (data === '\x16') { // Ctrl+V
      navigator.clipboard.readText().then((text) => {
        this.insertText(text);
      }).catch(() => {});
      return;
    } else if (data === '\x03') { // Ctrl+C
      if (this.term.hasSelection()) {
        navigator.clipboard.writeText(this.term.getSelection());
        this.term.clearSelection();
      }
      return;
    } else if (!data.startsWith('\x1b')) {
      const cleanData = data.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '');
      if (cleanData.length > 0) {
        this.insertText(cleanData);
        return; // render is called in insertText
      }
    }

    this.render();
  }

  private insertText(text: string) {
    const linesToInsert = text.split(/\r\n|\n|\r/);
    if (linesToInsert.length === 1) {
      const line = this.lines[this.cursorY] || '';
      this.lines[this.cursorY] = line.slice(0, this.cursorX) + linesToInsert[0] + line.slice(this.cursorX);
      this.cursorX += linesToInsert[0].length;
    } else {
      const currentLine = this.lines[this.cursorY] || '';
      const left = currentLine.slice(0, this.cursorX);
      const right = currentLine.slice(this.cursorX);
      
      this.lines[this.cursorY] = left + linesToInsert[0];
      
      const newLines = linesToInsert.slice(1, -1);
      const lastLine = linesToInsert[linesToInsert.length - 1];
      
      this.lines.splice(this.cursorY + 1, 0, ...newLines, lastLine + right);
      
      this.cursorY += linesToInsert.length - 1;
      this.cursorX = lastLine.length;
    }
    this.render();
  }

  private save() {
    const state = useTerminalStore.getState();
    const content = this.lines.join('\n');
    const existing = state.getNode(this.file);
    if (existing && existing.type === 'file') {
      state.deleteNode(this.file);
    }
    state.createNode(this.file, 'file', content);
  }

  private exit() {
    this.save();
    this.isActive = false;
    
    // Return to main screen buffer
    this.term.write('\x1b[?1049l');
    
    const state = useTerminalStore.getState();
    state.setMode('shell', null);

    // Reprint prompt properly aligned
    this.term.write(`\r\n\x1b[1;32madmin@hyperos\x1b[0m:\x1b[1;34m${state.cwd}\x1b[0m$ `);
  }
}
