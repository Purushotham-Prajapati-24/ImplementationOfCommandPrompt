import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { TerminalState } from '../models/TerminalState';

const router = express.Router();

router.post('/signup', async (req: any, res: any) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Username, email, and password required' });

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(400).json({ error: 'Username or email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    // Create initial state for user
    const initialState = new TerminalState({
      userId: user._id,
      fs: {
        type: 'dir',
        name: '',
        createdAt: Date.now(),
        children: {
          'root': {
            type: 'dir',
            name: 'root',
            createdAt: Date.now(),
            children: {
               'README.md': { 
                 type: 'file', 
                 name: 'README.md', 
                 createdAt: Date.now(), 
                 content: `# Welcome to HyperOS, ${username}!\n\nThis is your personal, persistent cloud terminal.\n\n## Getting Started\n- Use \`ls\` to list files.\n- Use \`cd\` to navigate.\n- Use \`nano <file>\` to edit files.\n- Use \`ai <question>\` to ask the integrated AI assistant for help.\n\nFeel free to explore!` 
               },
               'system_info.txt': {
                 type: 'file',
                 name: 'system_info.txt',
                 createdAt: Date.now(),
                 content: `HyperOS v2.0.0\nKernel: Web 1.0\nUser: ${username}\nRole: Administrator`
               },
               'projects': {
                 type: 'dir',
                 name: 'projects',
                 createdAt: Date.now(),
                 children: {
                   'calculator.js': {
                     type: 'file',
                     name: 'calculator.js',
                     createdAt: Date.now(),
                     content: `// Simple Calculator\nfunction add(a, b) {\n  return a + b;\n}\n\nconsole.log("2 + 2 =", add(2, 2));`
                   },
                   'todo_list.c': {
                     type: 'file',
                     name: 'todo_list.c',
                     createdAt: Date.now(),
                     content: `#include <stdio.h>\n\nint main() {\n    printf("TODO: Build an awesome OS!\\n");\n    return 0;\n}`
                   }
                 }
               }
            }
          }
        }
      },
      history: [],
      env: { USER: username, HOST: 'hyperos-cloud' }
    });
    await initialState.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret');
    res.json({ token, username });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req: any, res: any) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret');
    res.json({ token, username });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
