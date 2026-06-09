import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

// Load Firebase configuration from the applet config file and inject into environment
// This keeps the preview working in AI Studio without manual env setup.
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (fs.existsSync(firebaseConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    process.env.VITE_FIREBASE_PROJECT_ID = config.projectId;
    process.env.VITE_FIREBASE_APP_ID = config.appId;
    process.env.VITE_FIREBASE_API_KEY = config.apiKey;
    process.env.VITE_FIREBASE_AUTH_DOMAIN = config.authDomain;
    process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID = config.firestoreDatabaseId;
    process.env.VITE_FIREBASE_STORAGE_BUCKET = config.storageBucket;
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = config.messagingSenderId;
    console.log("[Server] Injected Firebase configuration from local config file.");
  } catch (e) {
    console.error("[Server] Failed to parse firebase-applet-config.json", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/chat", express.json(), async (req, res) => {
    try {
      const { messages, apiKey: userKey, systemInstruction } = req.body;
      const apiKey = userKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API key is missing." });
      }

      const client = new GoogleGenAI({ apiKey });
      
      const chatHistory = messages.map((msg: any) => (msg.role === 'user' ? 'User' : 'Assistant') + ': ' + msg.content).join('\n');
      const lastMessage = messages[messages.length - 1].content;
      const prompt = "Chat History:\n" + chatHistory + "\nUser: " + lastMessage + "\nAssistant:";

      const response = await client.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });
      
      res.json({ content: response.text || "{}" });
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during the AI request." });
    }
  });

  app.post("/api/test-gemini", express.json(), async (req, res) => {
    try {
      const { apiKey: userKey } = req.body;
      const apiKey = userKey || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API key is missing." });
      }

      const client = new GoogleGenAI({ apiKey });
      const result = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Say hello",
      });
      
      res.json({ success: !!result.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
