import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Groq from 'groq-sdk';

const router = express.Router();
router.post('/ask', authenticate, async (req: AuthRequest, res: any) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'default' });
    const { query, context } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });

    const systemPrompt = `You are HyperOS AI, an intelligent terminal assistant living inside a browser-based UNIX-like shell.
You help the user with commands, explain files, and provide coding assistance.
You have access to the user's terminal context:
CWD: ${context?.cwd}
Recent History: ${context?.history?.slice(-5).join('; ')}
${context?.fileName ? `Currently Opened File: ${context.fileName}\nFile Content:\n${context.fileContent}` : ''}

CRITICAL: You MUST respond in pure JSON format only. The JSON structure should be:
{
  "reply": "Your conversational response to the user.",
  "command": "Optional. A terminal command to execute (e.g. 'gcc nano.c -o nano && ./nano'). DO NOT use 'echo' to write code to files. Use the file_name and file_content fields instead. OMIT if no command is needed.",
  "file_name": "Optional. If you need to create or edit a file, provide the file name here (e.g. 'nano.c').",
  "file_content": "Optional. The COMPLETE new content for the file. Provide the raw code without markdown backticks. OMIT if not writing a file."
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      model: 'llama-3.3-70b-versatile', // using a currently active model
      response_format: { type: 'json_object' },
    });

    const aiMessage = chatCompletion.choices[0]?.message?.content || '{}';
    let parsedResponse = { reply: 'No response' };
    try {
      parsedResponse = JSON.parse(aiMessage);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', aiMessage);
      parsedResponse = { reply: aiMessage };
    }

    res.json(parsedResponse);
  } catch (err: any) {
    console.error('Groq API Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
