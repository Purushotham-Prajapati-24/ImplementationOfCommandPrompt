# 🚀 HyperOS: AI-Powered Terminal Emulator

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Groq](https://img.shields.io/badge/Groq-Cloud-orange?style=for-the-badge)](https://groq.com/)

**HyperOS** is an advanced, high-performance web-based terminal emulator that replicates a UNIX-like shell environment directly within the browser. Bridging the gap between traditional CLIs and modern AI-driven development, it features an **Autonomous AI Co-Pilot** capable of executing commands and manipulating files in real-time.

---

## ✨ Key Features

- **🤖 Autonomous AI Assistant:** Integrated Groq API (`llama-3.3-70b`) that understands terminal context, shell history, and file structures to execute complex workflows.
- **📂 Persistent VFS:** A robust Virtual File System synchronized with MongoDB Atlas, ensuring your workspace persists across sessions.
- **⚡ High Performance:** Powered by Xterm.js for 60FPS WebGL terminal rendering and Groq's LPU architecture for ultra-low latency AI responses.
- **🛡️ Secure Architecture:** JWT-based authentication and Bcrypt password hashing for isolated and secure user environments.
- **🛠️ Advanced Shell Features:**
  - Command chaining (`&&`) and output redirection (`>`).
  - Interactive `nano` editor with alternate screen buffering.
  - Mock `gcc` compiler for executing C code within the sandbox.
  - State-managed environment variables and history.

---

## 🏗️ System Architecture

HyperOS follows a modern **3-Tier Architecture**:

1.  **Client Tier:** React & Xterm.js capture user input. Zustand manages the VFS and terminal state.
2.  **API Tier:** Node.js & Express handle authentication, VFS synchronization, and AI orchestration.
3.  **Intelligence Tier:** Groq API processes context-rich prompts to return executable JSON payloads for autonomous terminal actions.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Terminal:** Xterm.js (with Fit addon)
- **State Management:** Zustand
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript

### Backend
- **Server:** Node.js + Express
- **Database:** MongoDB Atlas (Mongoose)
- **Security:** JWT (JSON Web Tokens)
- **AI:** Groq SDK

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- Groq Cloud API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Purushotham-Prajapati-24/ImplementationOfCommandPrompt.git
   cd ImplementationOfCommandPrompt
   ```

2. **Setup Backend:**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GROQ_API_KEY=your_groq_api_key
   ```

3. **Setup Frontend:**
   ```bash
   cd ..
   npm install
   ```

4. **Run the Application:**
   - Start Server: `cd server && npm run dev`
   - Start Frontend: `npm run dev`

---

## 🔮 Future Scope

- **WASM Integration:** Native binary execution using Emscripten.
- **Multiplayer CLI:** Real-time terminal sharing via WebSockets.
- **Advanced AST:** Full support for `if/else`, loops, and complex `grep` piping.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Purushotham-Prajapati-24">Purushotham Prajapati</a>
</p>
