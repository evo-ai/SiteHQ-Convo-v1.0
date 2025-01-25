import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from 'ws';
import { setupChatWebSocket } from './chat';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function registerRoutes(app: Express): Server {
  // Serve widget.js with CORS enabled
  app.get('/widget.js', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.sendFile(path.resolve(__dirname, '..', 'client', 'public', 'widget.js'));
  });

  // Get signed URL endpoint
  app.get('/api/get-signed-url', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid API key' });
      }

      const apiKey = authHeader.split(' ')[1];
      const response = await fetch(
        'https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=FnTVTPK2FfEkaktJIFFx',
        {
          headers: {
            'xi-api-key': apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get signed URL from ElevenLabs');
      }

      const data = await response.json();
      return res.json({ signedUrl: data.signed_url });
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return res.status(500).json({
        message: 'Failed to get signed URL'
      });
    }
  });

  // WebSocket setup for chat
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    if (request.url === '/api/chat') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        setupChatWebSocket(ws);
      });
    }
  });

  return httpServer;
}