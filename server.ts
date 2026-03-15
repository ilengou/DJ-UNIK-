import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// Handle __dirname for both ESM and CJS
const isCjs = typeof require !== 'undefined' && typeof module !== 'undefined';
const __filename_val = isCjs ? __filename : fileURLToPath(import.meta.url);
const __dirname_val = isCjs ? __dirname : path.dirname(__filename_val);

const db = new Database("quotes.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    event_type TEXT,
    event_date TEXT,
    venue TEXT,
    services TEXT,
    total_amount REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    email TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/quotes", (req, res) => {
    const { 
      client_name, client_email, client_phone, 
      event_type, event_date, venue, services, total_amount 
    } = req.body;

    try {
      // Generate ID based on date and daily count
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const dateStr = today.replace(/-/g, ''); // YYYYMMDD
      
      // Count quotes created today
      const countResult = db.prepare("SELECT COUNT(*) as count FROM quotes WHERE date(created_at) = date('now')").get() as { count: number };
      const sequence = (countResult.count + 1).toString().padStart(2, '0');
      const id = `${dateStr}-${sequence}`;

      // Update or Insert client profile
      const clientStmt = db.prepare(`
        INSERT INTO clients (email, name, phone, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(email) DO UPDATE SET
          name = excluded.name,
          phone = excluded.phone,
          updated_at = CURRENT_TIMESTAMP
      `);
      clientStmt.run(client_email, client_name, client_phone);

      const stmt = db.prepare(`
        INSERT INTO quotes (id, client_name, client_email, client_phone, event_type, event_date, venue, services, total_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, client_name, client_email, client_phone, event_type, event_date, venue, JSON.stringify(services), total_amount);
      res.status(201).json({ success: true, id });
    } catch (error) {
      console.error("Error creating quote:", error);
      res.status(500).json({ error: "Failed to create quote" });
    }
  });

  app.get("/api/quotes", (req, res) => {
    try {
      const quotes = db.prepare("SELECT * FROM quotes ORDER BY created_at DESC").all();
      res.json(quotes.map(q => ({ ...q, services: JSON.parse(q.services as string) })));
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  app.get("/api/quotes/:id", (req, res) => {
    try {
      const quote = db.prepare("SELECT * FROM quotes WHERE id = ?").get(req.params.id);
      if (quote) {
        // @ts-ignore
        res.json({ ...quote, services: JSON.parse(quote.services as string) });
      } else {
        res.status(404).json({ error: "Quote not found" });
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  });

  app.patch("/api/quotes/:id/status", (req, res) => {
    const { status } = req.body;
    try {
      const stmt = db.prepare("UPDATE quotes SET status = ? WHERE id = ?");
      const result = stmt.run(status, req.params.id);
      if (result.changes > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Quote not found" });
      }
    } catch (error) {
      console.error("Error updating quote status:", error);
      res.status(500).json({ error: "Failed to update quote status" });
    }
  });

  app.delete("/api/quotes/:id", (req, res) => {
    try {
      const stmt = db.prepare("DELETE FROM quotes WHERE id = ?");
      const result = stmt.run(req.params.id);
      if (result.changes > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Quote not found" });
      }
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ error: "Failed to delete quote" });
    }
  });

  app.get("/api/clients", (req, res) => {
    try {
      const clients = db.prepare(`
        SELECT 
          c.*,
          COUNT(q.id) as quote_count,
          SUM(CASE WHEN q.status IN ('paid', 'booked') THEN q.total_amount ELSE 0 END) as total_spent
        FROM clients c
        LEFT JOIN quotes q ON c.email = q.client_email
        GROUP BY c.email
        ORDER BY c.updated_at DESC
      `).all();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:email/history", (req, res) => {
    try {
      const quotes = db.prepare("SELECT * FROM quotes WHERE client_email = ? ORDER BY created_at DESC").all();
      res.json(quotes.map(q => ({ ...q, services: JSON.parse(q.services as string) })));
    } catch (error) {
      console.error("Error fetching client history:", error);
      res.status(500).json({ error: "Failed to fetch client history" });
    }
  });

  // Spotify OAuth Routes
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const APP_URL = process.env.APP_URL || 'http://localhost:3000';
  const REDIRECT_URI = `${APP_URL}/api/auth/spotify/callback`;

  console.log("Spotify Config:");
  console.log("- Client ID:", SPOTIFY_CLIENT_ID ? "Configured" : "MISSING");
  console.log("- Client Secret:", SPOTIFY_CLIENT_SECRET ? "Configured" : "MISSING");
  console.log("- Redirect URI:", REDIRECT_URI);

  app.get("/api/auth/spotify/url", (req, res) => {
    if (!SPOTIFY_CLIENT_ID) {
      return res.status(500).json({ error: "Spotify Client ID not configured in environment variables." });
    }
    const scope = "playlist-read-private playlist-read-collaborative user-library-read";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
    });
    res.json({ url: `https://accounts.spotify.com/authorize?${params.toString()}` });
  });

  app.get("/api/auth/spotify/callback", async (req, res) => {
    const { code } = req.query;

    if (!code) {
      return res.send(`
        <script>
          window.opener.postMessage({ type: 'SPOTIFY_AUTH_ERROR', error: 'No code provided' }, '*');
          window.close();
        </script>
      `);
    }

    try {
      const response = await axios.post("https://accounts.spotify.com/api/token", 
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: REDIRECT_URI,
          client_id: SPOTIFY_CLIENT_ID || "",
          client_secret: SPOTIFY_CLIENT_SECRET || "",
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token } = response.data;

      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS', accessToken: '${access_token}' }, '*');
              window.close();
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Spotify Auth Error:", error.response?.data || error.message);
      res.send(`
        <script>
          window.opener.postMessage({ type: 'SPOTIFY_AUTH_ERROR', error: 'Failed to exchange token' }, '*');
          window.close();
        </script>
      `);
    }
  });

  app.get("/api/spotify/playlists", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) return res.status(401).json({ error: "No access token" });

    try {
      const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to fetch playlists" });
    }
  });

  app.get("/api/spotify/playlists/:id/tracks", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) return res.status(401).json({ error: "No access token" });

    try {
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${req.params.id}/tracks`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to fetch tracks" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
