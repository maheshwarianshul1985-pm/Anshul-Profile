import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  // For local development in AI Studio, try to load from the config file if env vars are missing
  const firebaseConfig: Record<string, string> = {};
  if (!env.VITE_FIREBASE_API_KEY) {
    try {
      const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        firebaseConfig['import.meta.env.VITE_FIREBASE_PROJECT_ID'] = JSON.stringify(config.projectId);
        firebaseConfig['import.meta.env.VITE_FIREBASE_APP_ID'] = JSON.stringify(config.appId);
        firebaseConfig['import.meta.env.VITE_FIREBASE_API_KEY'] = JSON.stringify(config.apiKey);
        firebaseConfig['import.meta.env.VITE_FIREBASE_AUTH_DOMAIN'] = JSON.stringify(config.authDomain);
        firebaseConfig['import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID'] = JSON.stringify(config.firestoreDatabaseId);
        firebaseConfig['import.meta.env.VITE_FIREBASE_STORAGE_BUCKET'] = JSON.stringify(config.storageBucket);
        firebaseConfig['import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID'] = JSON.stringify(config.messagingSenderId);
      }
    } catch (e) {
      // Ignored - fallback to regular env loading
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    define: {
      ...firebaseConfig
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
