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

      const ai = new GoogleGenAI({
        apiKey: API_KEY,
      });

      // Format history for the new SDK, ensuring it starts with 'user'
      let contents = history ? history.map((msg: any) => ({
        role: msg.role === 'bot' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.parts[0].text }]
      })) : [];

      // Filter out leading 'model' messages if they exist (Gemini usually wants to start with 'user')
      while (contents.length > 0 && contents[0].role === 'model') {
        contents.shift();
      }

      // If for some reason we have no user message yet, or history was empty/filtered out
      // (This shouldn't happen based on App.tsx logic)
      if (contents.length === 0) {
        contents = [{ role: 'user', parts: [{ text: message || "hola" }] }];
      }

      // Include system prompt as first message if no history, or separate if supported
      // Use config according to user snippet
      const config = {
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
      };

      const model = "gemini-3.1-flash-lite-preview";
      
      console.log(`Enviando petición a Gemini (${model})...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: config
      });

      console.log("Respuesta recibida de Gemini");

      let reply = "";
      if ((response as any).text) {
        reply = typeof (response as any).text === 'function' ? (response as any).text() : (response as any).text;
      } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
        reply = response.candidates[0].content.parts[0].text;
      }

      if (!reply) {
        console.error("No se pudo extraer texto de la respuesta:", JSON.stringify(response));
        throw new Error("La IA no devolvió contenido de texto.");
      }

      return res.status(200).json({ reply: reply });
    } catch (error: any) {
      console.error("Error en API:", error);
      let errorMessage = 'Error de comunicación con Gemini';
      
      // If it's a quota or auth error, be specific
      if (error.message && error.message.includes("quota")) {
        errorMessage = "Cuota excedida. Por favor, inténtalo de nuevo en unos segundos.";
      } else if (error.message && error.message.includes("key not valid")) {
        errorMessage = "API Key inválida. Por favor, verifica la configuración.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return res.status(500).json({ error: errorMessage });
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
