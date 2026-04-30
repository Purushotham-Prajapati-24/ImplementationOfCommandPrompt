# 🔄 User Flow

---

## 1. Entry Flow

User opens website
    ↓
Terminal loads (boot animation optional)
    ↓
User sees prompt (e.g., user@web:~$)

---

## 2. Command Execution Flow

User types command
    ↓
Input captured
    ↓
Command parser processes input
    ↓
Command validated

    ├── Valid → Execute command
    │          ↓
    │      Update state (FS, directory)
    │          ↓
    │      Display output
    │
    └── Invalid → Show error message

---

## 3. File Navigation Flow

User enters `cd folder`
    ↓
Validate folder exists
    ↓
Update current directory
    ↓
Update prompt

---

## 4. File Creation Flow

User enters `touch file.txt`
    ↓
Create file in current directory
    ↓
Update virtual file system
    ↓
Confirm via UI

---

## 5. Autocomplete Flow (Advanced)

User presses TAB
    ↓
Fetch matching commands/files
    ↓
Display suggestions
    ↓
Auto-fill input

---

## 6. Session Flow

User interacts with terminal
    ↓
Session state stored (memory/localStorage)
    ↓
Restore state on refresh (optional)

---

## 7. Error Handling Flow

Invalid command
    ↓
Display: "command not found"

Invalid path
    ↓
Display: "No such directory"