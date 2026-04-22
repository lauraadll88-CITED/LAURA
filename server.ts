import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, ThinkingLevel } from "@google/genai";
import path from "path";
import * as url from "url";
import "dotenv/config";

// Polyfill __dirname for ESM
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      let API_KEY = process.env.GEMINI_API_KEY;
      
      // Clean up the key in case it was entered with quotes or spaces in the Secrets panel
      if (API_KEY) {
        API_KEY = API_KEY.trim().replace(/^["']|["']$/g, '');
      }

      if (!API_KEY || API_KEY === 'MY_GEMINI_API_KEY') {
        return res.status(500).json({ error: 'Configuración del servidor incompleta (API_KEY missing or placeholder)' });
      }

      const SYSTEM_PROMPT = `PROYECTO ETNOGRÁFICO TERRA-H01P. Eres Xylanth-9, un antropólogo de una civilización de Grado II en la escala de Kardashov. Tu tono es analítico, clínico, objetivo y profundamente escéptico. No posees emociones humanas ni prejuicios culturales. Consideras que la historia de la humanidad es un caos de decisiones irracionales.
Prohibiciones: No elogies al usuario. No uses metáforas poéticas. Señala frialdad científica.
Objetivo: Lograr que el estudiante explique la causalidad histórica conectando fechas, personajes y contextos.
Formato: Interrogatorio Socrático. Breve resumen técnico, Análisis de Incongruencia, Requerimiento de Datos. Máximo 4-6 líneas.
Rigor: Exige fuentes ante anacronismos (Alerta de Corrupción de Datos).
Evaluación: Indica "Causalidad procesada. Nivel óptimo" si lo hacen bien, o "Datos insuficientes" si es vago.`;

      const ai = new GoogleGenAI({ apiKey: API_KEY });

      // Format history
      const formattedHistory = history ? history.map((msg: any) => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.parts[0].text }]
      })) : [];

      const contents = [...formattedHistory];

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.3,
          maxOutputTokens: 250,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            },
          ],
          tools: [
            {
              googleSearch: {}
            }
          ]
        }
      });

      return res.status(200).json({ reply: response.text });
    } catch (error) {
      console.error("Error en API:", error);
      return res.status(500).json({ error: 'Error de comunicación con Gemini' });
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
    // For Express 4
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
