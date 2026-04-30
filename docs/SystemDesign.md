# 🏗️ System Design

---

## Architecture

Frontend (Terminal UI)
        ↓
Command Parser
        ↓
Execution Engine
   ↙           ↘
Virtual FS     Real Execution

---

## Components

### 1. Terminal UI
- Input/output
- Cursor control

### 2. Parser
- Tokenization
- Syntax handling

### 3. Execution Engine
- Maps commands to functions

### 4. Virtual File System
- Tree structure
- File/directory operations

---

## Data Flow

Input → Parse → Execute → Update State → Output

---

## Scalability

- Stateless frontend
- Backend can scale via containers