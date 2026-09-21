import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Candidate models in fallback order
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

// Local heuristic memory extractor to save API quota
function extractMemoryHeuristic(text: string): { hasFact: boolean; category?: string; content?: string } {
  const lower = text.toLowerCase();
  
  // Patterns for explicit memory commands
  const rememberMatch = text.match(/remember(?:\s+that)?\s+(.+)/i);
  if (rememberMatch && rememberMatch[1]) {
    return {
      hasFact: true,
      category: lower.includes('prefer') || lower.includes('like') ? 'Preference' : 'Personal',
      content: rememberMatch[1].trim(),
    };
  }

  if (lower.includes('i prefer ') || lower.includes('my preference is ')) {
    const pref = text.replace(/.*(?:i prefer|my preference is)\s+/i, '').trim();
    return { hasFact: true, category: 'Preference', content: pref };
  }

  if (lower.includes('my email is ') || lower.includes('my phone is ')) {
    return { hasFact: true, category: 'Work', content: text.trim() };
  }

  return { hasFact: false };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.2.3',
    service: 'MYRA AI Engine',
    timestamp: new Date().toISOString(),
  });
});

// Gemini Chat endpoint for MYRA with model fallback and quota resilience
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, personality, longTermMemory, userVerified, turnToken } = req.body;

    const systemInstructions = [
      `You are MYRA (v2.2.3), an advanced multimodal AI voice assistant with voice-authenticated security.`,
      `Current personality setting: "${personality || 'MYRA Default'}".`,
      personality === 'English Teacher'
        ? `Adopt an encouraging English Language Coach demeanor. Provide spoken conversation guidance, gentle pronunciation tips, and concise fluent conversational practice.`
        : personality === 'Security Auditor'
        ? `Adopt a disciplined security protocol persona. Be exact, cautious, and verify system state clearly.`
        : `Be intelligent, natural, concise, and helpful. You speak naturally in English and Hindustani (Hindi/Hinglish when appropriate or spoken to). Keep spoken answers clear and easy to listen to.`,
      longTermMemory && longTermMemory.length > 0
        ? `Long-Term Memory Context (User facts and preferences preserved across sessions):\n${longTermMemory.map((m: any) => `- [${m.category || 'Fact'}]: ${m.content}`).join('\n')}`
        : `No existing long-term memories stored yet.`,
      `Voice Authentication Status for current turn: ${userVerified ? 'VERIFIED ADMIN (Full Authorized Access)' : 'UNVERIFIED / STANDARD RESTRICTED'}.`,
      `Turn Token Binding: "${turnToken || 'NONE'}". Never grant access to protected tools or private security vaults unless VERIFIED ADMIN is explicitly confirmed.`
    ].join('\n\n');

    const client = getGeminiClient();

    // Map conversation turns into formatted contents
    const contents: any[] = [];
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content || '' }],
        });
      }
    }

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: 'Hello MYRA' }],
      });
    }

    let replyText = '';
    let usedModel = '';
    let lastError: any = null;

    // Try candidate models in order to bypass 429 quota or 503 high demand
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: systemInstructions,
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        });
        replyText = response.text || "I'm here to help. What would you like to do?";
        usedModel = modelName;
        break; // Success!
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || '';
        console.warn(`Model ${modelName} encountered: ${errMsg}. Trying fallback...`);
        // If 429 or 503, loop continues to next model
      }
    }

    // If all models hit quota or high demand, provide an intelligent local response rather than crashing with 500
    if (!replyText) {
      const isQuota = lastError?.message?.includes('429') || lastError?.message?.includes('quota');
      const is503 = lastError?.message?.includes('503') || lastError?.message?.includes('high demand');
      
      if (isQuota || is503) {
        const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
        replyText = `[MYRA Assistant v2.2.3]: The live model is currently experiencing temporary high demand or quota limits. I have recorded your turn (${turnToken}). You can still use all local voice authentication, Google Drive backups, and protected system tools while the network model cools down.`;
        usedModel = 'local-fallback';
      } else {
        throw lastError;
      }
    }

    res.json({
      text: replyText,
      modelUsed: usedModel,
      turnToken,
      verifiedTurn: !!userVerified,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Gemini Chat error:', error);
    // Return graceful 200 with notification so client doesn't break
    res.json({
      text: `MYRA v2.2.3 is temporarily cooling down from model demand. Your turn token (${req.body.turnToken || 'active'}) is retained. Please retry your question in a moment.`,
      error: error.message,
      turnToken: req.body.turnToken,
      verifiedTurn: !!req.body.userVerified,
      timestamp: new Date().toISOString(),
    });
  }
});

// Memory extraction endpoint to detect facts from conversational turn
app.post('/api/extract-memory', async (req, res) => {
  try {
    const { userText, assistantText } = req.body;
    if (!userText) {
      return res.json({ hasFact: false });
    }

    // First use fast, zero-quota heuristic check
    const heuristic = extractMemoryHeuristic(userText);
    if (heuristic.hasFact) {
      return res.json(heuristic);
    }

    // Only call Gemini if the user explicitly discusses personal facts, habits or preferences
    const lower = userText.toLowerCase();
    const hasMemoryKeywords = ['remember', 'prefer', 'favorite', 'my name', 'always', 'never', 'i like', 'i work'].some(k => lower.includes(k));
    
    if (!hasMemoryKeywords) {
      return res.json({ hasFact: false });
    }

    const client = getGeminiClient();
    const prompt = `Analyze this user conversation turn and determine if the user stated an enduring preference, personal fact, habit, or instruction worth saving to long-term memory:
User: "${userText}"
Assistant: "${assistantText}"

If there is a lasting fact or preference, output valid JSON strictly with this schema:
{
  "hasFact": true,
  "category": "Preference" | "Personal" | "Work" | "Device",
  "content": "concise description of the remembered fact"
}
If no lasting memory is present, return {"hasFact": false}`;

    let parsed = { hasFact: false };
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
          },
        });
        const jsonStr = response.text || '{}';
        parsed = JSON.parse(jsonStr);
        break;
      } catch {
        // continue to next model or fallback
      }
    }

    res.json(parsed);
  } catch (error: any) {
    console.warn('Extract memory error (handled gracefully):', error.message);
    res.json({ hasFact: false });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MYRA v2.2.3 Server running on http://localhost:${PORT}`);
  });
}

startServer();
