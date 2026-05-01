# 📋 Implementation Plan: Browser-Based Command Prompt Emulator

## STEP 1: SYNTHESIS

**What we are building:**  
A strictly client-side browser-based terminal emulator that acts as a safe sandbox for users to learn and practice CLI commands. It uses a virtual, in-memory file system rather than a real OS file system.

**Core Modules:**
1. **Terminal UI Layer:** Powered by `xterm.js` and React, handling raw keystrokes, ANSI color rendering, and cursor management.
2. **Command Parser:** Tokenizes raw string input into commands and arguments.
3. **Execution Engine:** A command registry that routes parsed inputs to their respective pure Javascript handler functions.
4. **Virtual File System (VFS):** An in-memory tree structure mimicking a UNIX file system.
5. **State Management:** Powered by Zustand to hold the VFS, Current Working Directory (CWD), and Command History.

**MVP Boundary:**  
Strictly Frontend (No Docker, no Node.js backend execution). The scope is limited to 7 core commands (`ls`, `cd`, `mkdir`, `rm`, `touch`, `cat`, `echo`), virtual file system navigation, command history, and standard terminal input/output.

---

## STEP 2: GAP ANALYSIS & ENGINEERING DECISIONS

1. **Path Resolution Logic:**  
   *Gap:* How do we handle relative vs. absolute paths?  
   *Decision:* Dedicated `pathHelpers.js` to parse paths (`../../folder`, `/root/file`). We enforce a rigid `/root` base directory.
2. **VFS Data Structure:**  
   *Gap:* The exact schema of the Virtual FS isn't defined.  
   *Decision:* Nested object tree. Each node: `{ type: 'dir' | 'file', name: string, content: string (if file), children: {} (if dir) }`.
3. **Command Arguments (Flags):**  
   *Gap:* Do we support flags like `ls -l` or `rm -rf`?  
   *Decision:* For MVP, **ignore flags** to keep parsing simple. Parse positional arguments only.
4. **xterm.js Input Handling Complexity:**  
   *Gap:* `xterm.js` doesn't provide a native "input box"—it captures raw keystrokes.  
   *Decision:* Manually buffer keystrokes in a local string until `Enter`, handling `Backspace` and Arrow keys.

---

## STEP 3: EXECUTION PLAN (MILESTONES)

**Milestone 1: Core Terminal Setup**
- Objective: Render a black box that accepts typing and echoes characters.
- Deliverable: React app with `Terminal.jsx` utilizing `xterm.js`. 

**Milestone 2: Virtual File System & State Engine**
- Objective: Setup the "brain" of the emulator without the UI hooked up yet.
- Deliverable: Zustand store with VFS schema, CWD tracker, and history buffer.

**Milestone 3: Parser, Engine, and Path Utilities**
- Objective: Connect input to logic. 
- Deliverable: Tokenizer, command registry, and absolute/relative path resolver.

**Milestone 4: Core Commands Implementation**
- Objective: Make the terminal actually useful.
- Deliverable: Implementing `mkdir`, `touch`, `ls`, `cd`, `rm`, `cat`, `echo`.

**Milestone 5: UX Enhancements**
- Objective: Polish the shell experience.
- Deliverable: Dynamic prompts (`user@web:~/dir$`), arrow-key history, and LocalStorage persistence.

---

## STEP 4: TASK BREAKDOWN

*Milestone 1:*
- [ ] **M1.1**: Initialize Vite + React project with Tailwind. Install `xterm`, `xterm-addon-fit`, `zustand`.
- [ ] **M1.2**: Create `Terminal.jsx` component. Initialize the `xterm` instance on a `ref`.
- [ ] **M1.3**: Implement the keystroke buffer (`term.onData`). Handle printable characters, `\r` (Enter), and `\x7F` (Backspace).

*Milestone 2:*
- [ ] **M2.1**: Define the Zustand store in `store/terminalStore.js` with initial state: `fs`, `cwd`, and `history`.
- [ ] **M2.2**: Write `pathHelpers.js` -> `resolvePath(cwd, targetPath)`.
- [ ] **M2.3**: Write VFS mutators in Zustand: `createNode(path, type)`, `deleteNode(path)`, `getNode(path)`.

---

## STEP 5: FILE & MODULE BLUEPRINT

```text
src/
├── components/
│   └── Terminal.jsx         # UI, xterm.js instance, raw I/O handling
├── core/
│   ├── parser.js            # Input -> { command: string, args: string[] }
│   ├── engine.js            # Command registry: routes command to function
│   └── commands.js          # The actual logic for cd, ls, mkdir, etc.
├── store/
│   └── terminalStore.js     # Zustand state: VFS tree, cwd, history
├── utils/
│   └── pathHelpers.js       # Pure functions for UNIX path traversal
└── App.jsx                  # Main Layout wrapper
```

---

## STEP 6: IMPLEMENTATION STRATEGY

1. **Order:** Outside-in for UI (M1), Inside-out for Logic (M2, M3), then Integration (M4).
2. **Integration Checkpoints:** After M1, verify typing/deleting. After M4, manual e2e testing.
3. **Refactoring:** Keep `commands.js` decoupled. Commands accept `(args, state, terminal)` for testability.

## STEP 6: PHASE 6 - ADVANCED EXECUTION & EDITOR (NEW)

**Objective:** Escalate the MVP into a fully functional workspace with an in-terminal text editor and script execution.

1. **In-Terminal Editor (`nano`)**:
   - Implement an Alternate Screen Buffer (`\x1b[?1049h`).
   - Create a 2D line buffer state machine to handle absolute cursor positioning.
   - Support `Ctrl+X` to save and exit, writing content directly to the VFS.
2. **Execution Engine (`node`)**:
   - Compiling C (`gcc`) in a purely browser-based JS app requires heavy WebAssembly payloads (e.g., in-browser clang). Instead, we will implement a native Javascript Execution Engine (`node`).
   - It will safely `eval` JS files stored in the VFS and pipe `console.log` back to the xterm terminal.
3. **Network Requests (`curl`)**:
   - Implement `curl` to fetch external APIs via browser fetch and print JSON/HTML.
4. **Execution Permissions**:
   - Support `./script.js` directly by parsing the shebang or file extension.

---

## STEP 7: CODING RULES

1. **Separation of Concerns:** `Terminal.jsx` handles I/O (ANSI, keystrokes). Logic lives elsewhere.
2. **Pure Logic:** VFS operations must be pure functions on the Zustand state copy.
3. **Error Handling:** Don't `throw` JS Errors for user mistakes. Print formatted error strings to `xterm`.
4. **Immutability:** Zustand state updates for VFS must follow immutability rules.
