import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { MOTHER_PANEL_CONFIG } from "./motherpanel.config";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory transactions storage
  interface Transaction {
    id: string;
    transactionId: string;
    amount: number;
    method: string;
    status: 'pending' | 'completed' | 'rejected';
    userEmail: string;
    userId: string;
    date: string;
    applied: boolean;
  }
  let transactions: Transaction[] = [];

  // Submit a new transaction (User)
  app.post("/api/transactions/submit", (req, res) => {
    try {
      const { transactionId, amount, method, userEmail, userId } = req.body;
      
      if (!transactionId || !amount || !userEmail) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      const newTx: Transaction = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        transactionId,
        amount: parseFloat(amount),
        method,
        status: 'pending',
        userEmail,
        userId,
        date: new Date().toLocaleString(),
        applied: false
      };

      transactions.push(newTx);
      res.json({ success: true, transaction: newTx });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to submit transaction" });
    }
  });

  // Get all transactions (Admin)
  app.get("/api/transactions/all", (req, res) => {
    res.json({ success: true, transactions: [...transactions].reverse() });
  });

  // Get user transactions
  app.get("/api/transactions/user/:email", (req, res) => {
    const userTxs = transactions.filter(t => t.userEmail === req.params.email);
    res.json({ success: true, transactions: [...userTxs].reverse() });
  });

  // Update transaction status (Admin)
  app.post("/api/transactions/:id/status", (req, res) => {
    const { status } = req.body; // 'completed' or 'rejected'
    const txIndex = transactions.findIndex(t => t.id === req.params.id);
    
    if (txIndex === -1) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    transactions[txIndex].status = status;
    res.json({ success: true, transaction: transactions[txIndex] });
  });

  // Mark transaction as applied (User)
  app.post("/api/transactions/:id/apply", (req, res) => {
    const txIndex = transactions.findIndex(t => t.id === req.params.id);
    
    if (txIndex === -1) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    transactions[txIndex].applied = true;
    res.json({ success: true, transaction: transactions[txIndex] });
  });

  // Proxy for Top Up BD API
  app.post("/api/proxy", async (req, res) => {
    try {
      const { action, ...params } = req.body;
      
      const body = new URLSearchParams();
      body.append("key", MOTHER_PANEL_CONFIG.API_KEY);
      body.append("action", action);
      
      Object.entries(params).forEach(([key, value]) => {
        body.append(key, String(value));
      });

      const response = await fetch(MOTHER_PANEL_CONFIG.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body.toString(),
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (e) {
        console.error("Failed to parse MotherPanel response:", text);
        res.status(500).json({ error: "Invalid response from provider API" });
      }
    } catch (error) {
      console.error("API Proxy Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Payment Verification Endpoint (Legacy/Fallback)
  app.post("/api/verify-transaction", async (req, res) => {
    try {
      const { transactionId, amount, method } = req.body;

      // Simulate an automatic checking process with a slight delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Accept any transaction ID that is provided
      // In a real production app, this would connect to bKash/Nagad merchant API
      const isValid = transactionId && transactionId.trim().length > 0;

      if (isValid) {
        res.json({ success: true, message: "Transaction verified successfully!" });
      } else {
        res.status(400).json({ success: false, message: "Invalid Transaction ID format." });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Verification failed." });
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
