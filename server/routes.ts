import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from 'ws';
import { setupChatWebSocket } from './chat';

export function registerRoutes(app: Express): Server {
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
