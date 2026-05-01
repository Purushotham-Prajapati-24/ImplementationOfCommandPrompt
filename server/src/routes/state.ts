import express from 'express';
import { TerminalState } from '../models/TerminalState';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const state = await TerminalState.findOne({ userId: req.user?.userId } as any);
    if (!state) return res.status(404).json({ error: 'State not found' });
    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const { fs, history, env } = req.body;
    const state = await TerminalState.findOneAndUpdate(
      { userId: req.user?.userId } as any,
      { fs, history, env },
      { new: true, upsert: true }
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
