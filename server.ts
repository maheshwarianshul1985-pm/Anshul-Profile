import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';

// Set up local storage for media uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Persistent store for uploaded files across container restarts
const uploadsStoreFile = path.join(process.cwd(), 'uploads_store.json');

function getUploadsStore(): Record<string, string> {
  if (fs.existsSync(uploadsStoreFile)) {
    try {
      return JSON.parse(fs.readFileSync(uploadsStoreFile, 'utf8'));
    } catch (e) {
      console.error("[Server] Failed to read uploads_store.json", e);
    }
  }
  return {};
}

function saveUploadToStore(filename: string, filePath: string) {
  try {
    const store = getUploadsStore();
    const fileBuf = fs.readFileSync(filePath);
    store[filename] = fileBuf.toString('base64');
    fs.writeFileSync(uploadsStoreFile, JSON.stringify(store, null, 2));
    console.log(`[Server] Persisted ${filename} to uploads_store.json (${Math.round(fileBuf.length / 1024)} KB)`);
  } catch (e) {
    console.error("[Server] Failed to persist file to uploads_store.json", e);
  }
}

function restoreUploadsFromStore() {
  try {
    const store = getUploadsStore();
    let restoredCount = 0;
    for (const [filename, base64Data] of Object.entries(store)) {
      const targetPath = path.join(uploadsDir, filename);
      if (!fs.existsSync(targetPath)) {
        fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));
        restoredCount++;
      }
    }
    if (restoredCount > 0) {
      console.log(`[Server] Restored ${restoredCount} persistent uploaded files to ${uploadsDir}`);
    }
  } catch (e) {
    console.error("[Server] Failed to restore uploads from uploads_store.json", e);
  }
}

// Auto-restore any previously saved files into uploadsDir on server boot
restoreUploadsFromStore();

const multerCreator = typeof multer === 'function' ? multer : (multer as any).default;

const storageConfig = (multerCreator.diskStorage || (multer as any).diskStorage)({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multerCreator({ 
  storage: storageConfig,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Load Firebase configuration from the applet config file and inject into environment
// This keeps the preview working in AI Studio without manual env setup.
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
const manualConfig = {
  apiKey: "AIzaSyBBd_dAZKW9vRcC5y09cpqcdQk8kySAlA0",
  authDomain: "gen-lang-client-0568439716.firebaseapp.com",
  projectId: "gen-lang-client-0568439716",
  storageBucket: "gen-lang-client-0568439716.firebasestorage.app",
  messagingSenderId: "701773395834",
  appId: "1:701773395834:web:c627d4e5d9de0e79edc8c3",
  firestoreDatabaseId: "ai-studio-15655e8c-18ff-4359-b057-60febe5dddfc"
};

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    Object.assign(manualConfig, config);
    console.log("[Server] Injected Firebase configuration from local config file.");
  } catch (e) {
    console.error("[Server] Failed to parse firebase-applet-config.json", e);
  }
}

process.env.VITE_FIREBASE_PROJECT_ID = manualConfig.projectId;
process.env.VITE_FIREBASE_APP_ID = manualConfig.appId;
process.env.VITE_FIREBASE_API_KEY = manualConfig.apiKey;
process.env.VITE_FIREBASE_AUTH_DOMAIN = manualConfig.authDomain;
process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID = manualConfig.firestoreDatabaseId;
process.env.VITE_FIREBASE_STORAGE_BUCKET = manualConfig.storageBucket;
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = manualConfig.messagingSenderId;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS Middleware supporting authenticated credentials and preflight OPTIONS
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Simple global logger for debugging API requests
  app.use((req, res, next) => {
    console.log(`[Server Log] ${req.method} ${req.url}`);
    next();
  });

  // Serve static files from the uploads directory
  app.use('/uploads', express.static(uploadsDir));

  // Catch missing local uploads to restore from store or return clear 404
  app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadsDir, filename);
    if (fs.existsSync(filepath)) {
      return res.sendFile(filepath);
    }
    // Check persistent store if file is missing from disk
    const store = getUploadsStore();
    if (store[filename]) {
      try {
        fs.writeFileSync(filepath, Buffer.from(store[filename], 'base64'));
        console.log(`[Server] Dynamically restored ${filename} from uploads_store.json`);
        return res.sendFile(filepath);
      } catch (e) {
        console.error(`[Server] Failed restoring ${filename} from store:`, e);
      }
    }
    res.status(404).json({ 
      error: "Local file not found on disk", 
      message: "This local upload is missing. Please re-upload your PDF/video in Edit mode." 
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post(["/api/upload", "/api/upload/"], upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file was uploaded." });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      // Persist to store so it survives container restarts!
      saveUploadToStore(req.file.filename, req.file.path);
      res.json({ url: fileUrl });
    } catch (err: any) {
      console.error("[Server] Local file upload failed:", err);
      res.status(500).json({ error: err.message || "Upload processor failed." });
    }
  });

  // Guard against GET /api/upload or other methods returning index.html
  app.get(["/api/upload", "/api/upload/"], (req, res) => {
    res.status(405).json({ error: "Method Not Allowed. Use POST to upload files." });
  });

  app.get("/api/download", async (req, res) => {
    try {
      const fileUrl = req.query.url as string;
      if (!fileUrl) {
        return res.status(400).json({ error: "Missing url parameter" });
      }

      let cleanPath = "";
      if (fileUrl.startsWith("/uploads/") || fileUrl.startsWith("uploads/")) {
        cleanPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
      } else {
        try {
          const parsed = new URL(fileUrl);
          if (parsed.pathname.startsWith("/uploads/")) {
            cleanPath = parsed.pathname;
          }
        } catch (e) {}
      }

      if (cleanPath) {
        const filename = path.basename(cleanPath);
        const filepath = path.join(uploadsDir, filename);
        if (fs.existsSync(filepath)) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
          return res.sendFile(filepath);
        } else {
          return res.status(404).json({
            error: "Local file not found on disk",
            message: "This local file has been cleared during a server restart. Since container storage is temporary, please re-upload this file."
          });
        }
      }

      if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
        console.log(`[Proxy Download] Server-side fetching remote file: ${fileUrl}`);
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch remote file, status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        const contentLength = response.headers.get("content-length");

        if (contentType) res.setHeader("Content-Type", contentType);
        if (contentLength) res.setHeader("Content-Length", contentLength);
        
        const origin = req.headers.origin;
        if (origin) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        } else {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        
        let filename = "download";
        try {
          const parsedUrl = new URL(fileUrl);
          filename = path.basename(parsedUrl.pathname) || "download";
        } catch (e) {}
        
        res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
      }

      res.redirect(fileUrl);
    } catch (err: any) {
      console.error("[Server] Download proxy failed:", err);
      res.status(500).json({ error: err.message || "Download failed." });
    }
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

  // Catch-all for unmatched /api routes to prevent them from falling through to Vite/SPA handler
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.url}`
    });
  });

  // Dedicated error handler for API routes to avoid falling back to HTML response
  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("[API Error Handler] Captured an error:", err);
    res.status(err.status || 500).json({
      error: err.message || "An unexpected error occurred.",
      details: err.stack || err
    });
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
