import { Hono } from "hono";
import { cors } from "hono/cors";

const api = new Hono();

// 👇 APLICAR CORS GLOBALES
api.use(
  '*',
  cors({
    origin: (origin) => {
      // Permití tu frontend (Render, Vercel, localhost, etc.)
      const allowedOrigins = [
        'http://localhost:5173',
        'https://langgraph-agent-chat-ui.onrender.com'
      ];
      return allowedOrigins.includes(origin ?? '') ? origin : '';
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  })
);

api.get("/info", (c) => c.json({ flags: { assistants: true, crons: false } }));

api.get("/ok", (c) => c.json({ ok: true }));

export default api;
