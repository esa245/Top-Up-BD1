import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import { MOTHER_PANEL_CONFIG } from "./motherpanel.config";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy for Top Up BD API
  app.post("/api/proxy", async (req, res) => {
    console.log("Proxy request received:", req.body);
    try {
      const { action, ...params } = req.body;
      
      const body = new URLSearchParams();
      body.append("key", MOTHER_PANEL_CONFIG.API_KEY);
      body.append("action", action);
      
      Object.entries(params).forEach(([key, value]) => {
        body.append(key, String(value));
      });

      console.log(`Fetching from MotherPanel: ${MOTHER_PANEL_CONFIG.API_URL} with action: ${action}`);
      const response = await fetch(MOTHER_PANEL_CONFIG.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString(),
      });

      const text = await response.text();
      console.log("MotherPanel response received, length:", text.length);
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (e) {
        console.error("Failed to parse MotherPanel response:", text.substring(0, 500));
        res.status(500).json({ error: "Invalid response from provider API", details: text.substring(0, 100) });
      }
    } catch (error) {
      console.error("API Proxy Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
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
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
