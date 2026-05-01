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
  "command": "Optional. If the user asks you to perform an action (like creating a file, writing code to a file, compiling, running, etc.), you MUST provide the exact terminal command to execute it here. To write code or text to a file from the terminal, you can use output redirection like \\\"echo 'code' > file.c\\\". DO NOT write 'none'. If no action is needed, OMIT this field entirely.",
  "file_content": "Optional. If the user asked you to generate or edit the currently opened file, provide the COMPLETE new content for the file here. Do not use markdown backticks around the code in this field. Omit if not editing a file."
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
