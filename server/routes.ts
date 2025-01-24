import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from 'ws';
import { setupChatWebSocket } from './chat';
import { insertAdminSchema } from '@db/schema';
import { db } from '@db';
import { admins, conversations, conversationMetrics, conversationFeedback } from '@db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { requireAuth, hashPassword, comparePasswords } from './auth';
import session from 'express-session';
import MemoryStore from 'memorystore';

const MemoryStoreSession = MemoryStore(session);

export function registerRoutes(app: Express): Server {
  // Session middleware
  app.use(
    session({
      cookie: { maxAge: 86400000 },
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      secret: 'your-secret-key',
      saveUninitialized: false,
    })
  );

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password } = insertAdminSchema.parse(req.body);
      const existingAdmin = await db.query.admins.findFirst({
        where: eq(admins.email, email),
      });

      if (existingAdmin) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const hashedPassword = await hashPassword(password);
      const [admin] = await db.insert(admins)
        .values({
          email,
          password: hashedPassword,
        })
        .returning();

      req.session.adminId = admin.id;
      res.json({ admin: { id: admin.id, email: admin.email } });
    } catch (error) {
      res.status(400).json({ message: String(error) });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const admin = await db.query.admins.findFirst({
        where: eq(admins.email, email),
      });

      if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await comparePasswords(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.adminId = admin.id;
      res.json({ admin: { id: admin.id, email: admin.email } });
    } catch (error) {
      res.status(400).json({ message: String(error) });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Add the get-signed-url endpoint
  app.get('/api/get-signed-url', async (req, res) => {
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: 'ElevenLabs API key not configured' });
      }

      // Get the signed URL from ElevenLabs
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
        message: error instanceof Error ? error.message : 'Failed to get signed URL'
      });
    }
  });

  // Analytics routes
  app.get('/api/analytics/metrics', requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Get total conversations
      const [{ count: totalConversations }] = await db
        .select({ count: conversations.id })
        .from(conversations)
        .where(
          and(
            startDate ? gte(conversations.createdAt, new Date(startDate as string)) : undefined,
            endDate ? lte(conversations.createdAt, new Date(endDate as string)) : undefined
          )
        );

      // Get average duration
      const [{ avgDuration }] = await db
        .select({
          avgDuration: conversations.duration
        })
        .from(conversations)
        .where(
          and(
            startDate ? gte(conversations.createdAt, new Date(startDate as string)) : undefined,
            endDate ? lte(conversations.createdAt, new Date(endDate as string)) : undefined
          )
        );

      // Get average engagement score
      const [{ avgEngagement }] = await db
        .select({
          avgEngagement: conversationMetrics.userEngagementScore
        })
        .from(conversationMetrics)
        .where(
          and(
            startDate ? gte(conversationMetrics.createdAt, new Date(startDate as string)) : undefined,
            endDate ? lte(conversationMetrics.createdAt, new Date(endDate as string)) : undefined
          )
        );

      // Get satisfaction rate (average rating)
      const [{ satisfactionRate }] = await db
        .select({
          satisfactionRate: conversationFeedback.rating
        })
        .from(conversationFeedback)
        .where(
          and(
            startDate ? gte(conversationFeedback.createdAt, new Date(startDate as string)) : undefined,
            endDate ? lte(conversationFeedback.createdAt, new Date(endDate as string)) : undefined
          )
        );

      // Get time series data
      const timeSeriesData = await db
        .select({
          date: conversations.createdAt,
          conversations: conversations.id
        })
        .from(conversations)
        .where(
          and(
            startDate ? gte(conversations.createdAt, new Date(startDate as string)) : undefined,
            endDate ? lte(conversations.createdAt, new Date(endDate as string)) : undefined
          )
        )
        .orderBy(conversations.createdAt);

      // Get engagement distribution
      const engagementDistribution = await db
        .select({
          range: conversationMetrics.userEngagementScore,
          count: conversationMetrics.id
        })
        .from(conversationMetrics)
        .where(
          and(
            startDate ? gte(conversationMetrics.createdAt, new Date(startDate as string)) : undefined,
            endDate ? lte(conversationMetrics.createdAt, new Date(endDate as string)) : undefined
          )
        )
        .groupBy(conversationMetrics.userEngagementScore);

      res.json({
        totalConversations,
        avgDuration,
        avgEngagement,
        satisfactionRate,
        timeSeriesData,
        engagementDistribution
      });
    } catch (error) {
      console.error('Error fetching analytics metrics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics metrics' });
    }
  });

  app.get('/api/analytics/feedback', requireAuth, async (req, res) => {
    try {
      // Get sentiment distribution
      const sentimentDistribution = await db
        .select({
          name: conversationFeedback.sentiment,
          value: conversationFeedback.id
        })
        .from(conversationFeedback)
        .groupBy(conversationFeedback.sentiment);

      // Get recent feedback
      const recentFeedback = await db
        .select()
        .from(conversationFeedback)
        .orderBy(conversationFeedback.createdAt)
        .limit(5);

      res.json({
        sentimentDistribution,
        recentFeedback
      });
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      res.status(500).json({ message: 'Failed to fetch feedback data' });
    }
  });

  // Add new conversation flow endpoint
  app.get('/api/analytics/conversation', requireAuth, async (req, res) => {
    try {
      const { conversationId } = req.query;

      // Get conversation with messages
      const conversation = await db
        .select({
          id: conversations.id,
          messages: conversations.messages,
          startedAt: conversations.startedAt,
          endedAt: conversations.endedAt,
          duration: conversations.duration,
          totalTurns: conversations.totalTurns,
          interruptions: conversations.interruptions
        })
        .from(conversations)
        .where(conversationId ? eq(conversations.id, Number(conversationId)) : undefined)
        .orderBy(conversations.createdAt)
        .limit(1);

      if (!conversation.length) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Transform the messages for the flow visualization
      const transformedMessages = conversation[0].messages.map((msg: any, index: number) => ({
        id: `msg-${index}`,
        ...msg,
        timestamp: new Date(msg.timestamp).toISOString()
      }));

      res.json({
        conversation: {
          ...conversation[0],
          messages: transformedMessages
        }
      });
    } catch (error) {
      console.error('Error fetching conversation flow data:', error);
      res.status(500).json({ message: 'Failed to fetch conversation flow data' });
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