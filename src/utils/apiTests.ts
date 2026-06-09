import { GoogleGenAI } from "@google/genai";

export async function testGemini(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const response = await fetch('/api/test-gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    const data = await response.json();
    return !!data.success;
  } catch (error) {
    console.error("Gemini test failed:", error);
    return false;
  }
}
