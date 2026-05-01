import mongoose from 'mongoose';

const terminalStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fs: { type: Object, required: true },
  history: { type: [String], default: [] },
  env: { type: Object, default: {} }
}, { timestamps: true });

export const TerminalState = mongoose.model('TerminalState', terminalStateSchema);
