import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from 'ws';
import { setupChatWebSocket } from './chat';
import { db } from '@db';
import { admins, conversations, conversationMetrics, conversationFeedback } from '@db/schema';
import { eq, and, lte, gte, sql } from 'drizzle-orm';
import { requireAuth, hashPassword, comparePasswords } from './auth';
import session from 'express-session';
import MemoryStore from 'memorystore';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import fs from 'fs';
import { insertAdminSchema } from '@db/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Store password reset tokens (in production this should be in a database)
const passwordResetTokens = new Map<string, { email: string, expires: Date }>();

export function registerRoutes(app: Express): Server {
  // Session middleware with secure settings
  app.use(
    session({
      cookie: {
        maxAge: ONE_DAY,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: true
      },
      store: new MemoryStoreSession({
        checkPeriod: ONE_DAY
      }),
      resave: false,
      secret: COOKIE_SECRET,
      saveUninitialized: false,
      name: 'analytics_session'
    })
  );

  // Serve widget.js with CORS enabled
  app.get('/widget.js', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendFile(path.resolve(__dirname, '..', 'client', 'public', 'widget.js'));
  });

  // Serve standalone-widget.js with CORS enabled
  app.get('/standalone-widget.js', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendFile(path.resolve(__dirname, '..', 'client', 'public', 'standalone-widget.js'));
  });

  // Serve widget demo page
  app.get('/widget-demo', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'client', 'public', 'widget-demo.html'));
  });

  // Auth status check endpoint
  app.get('/api/auth/status', (req, res) => {
    if (req.session.adminId) {
      res.json({ authenticated: true });
    } else {
      res.json({ authenticated: false });
    }
  });

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
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Error saving session' });
        }
        res.json({ admin: { id: admin.id, email: admin.email } });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: String(error) });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.clearCookie('analytics_session');
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);

      const admin = await db.query.admins.findFirst({
        where: eq(admins.email, email),
      });

      // Don't reveal if the email exists
      if (!admin) {
        return res.json({ message: 'If an account exists with that email, you will receive password reset instructions.' });
      }

      // Generate reset token
      const token = randomBytes(32).toString('hex');
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

      // Store token (in production, this should be in a database)
      passwordResetTokens.set(token, { email, expires });

      // In production, send email with reset link
      // For demo, we'll just return the token
      res.json({ 
        message: 'Password reset instructions sent',
        token // Remove this in production
      });
    } catch (error) {
      res.status(400).json({ message: String(error) });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = z.object({
        token: z.string(),
        password: z.string().min(8),
      }).parse(req.body);

      const resetInfo = passwordResetTokens.get(token);

      if (!resetInfo || resetInfo.expires < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      const hashedPassword = await hashPassword(password);

      // Update password in database
      await db.update(admins)
        .set({ password: hashedPassword })
        .where(eq(admins.email, resetInfo.email));

      // Remove used token
      passwordResetTokens.delete(token);

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      res.status(400).json({ message: String(error) });
    }
  });

  app.get('/api/get-signed-url', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization');

    console.log('Request to /api/get-signed-url arrived!', {
      headers: req.headers,
      query: req.query,
      timestamp: new Date().toISOString()
    });

    try {
      // Validate Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization header missing or invalid' });
      }

      const providedApiKey = authHeader.split('Bearer ')[1];
      const expectedApiKey = 'sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500'; // For testing
      if (providedApiKey !== expectedApiKey) {
        return res.status(401).json({ message: 'Invalid API key' });
      }

      // Get agent_id from query parameters
      const agentId = req.query.agentId as string;
      if (!agentId) {
        return res.status(400).json({ message: 'Agent ID is required' });
      }

      // For testing, return a mock signed URL if ElevenLabs API key isn't set
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        console.warn('ElevenLabs API key not configured, returning mock signed URL for testing');
        const mockSignedUrl = `wss://${req.headers.host}/api/chat?agentId=${agentId}`;
        return res.json({ signedUrl: mockSignedUrl });
      }

      // Fetch signed URL from ElevenLabs
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
        {
          headers: {
            'xi-api-key': apiKey
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', response.status, errorText);
        throw new Error(`Failed to get signed URL from ElevenLabs: ${errorText}`);
      }

      const data = await response.json();
      console.log('Successfully retrieved signed URL:', data.signed_url);
      return res.json({ signedUrl: data.signed_url });
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to get signed URL'
      });
    }
  });

  // Analytics routes
  app.get('/api/analytics/metrics', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Get total conversations and metrics
      const [{
        count: totalConversations,
        avgDuration,
        avgEngagement,
        overallSentiment
      }] = await db
        .select({
          count: sql<number>`count(${conversations.id})`,
          avgDuration: sql<number>`avg(${conversations.duration})`,
          avgEngagement: sql<number>`avg(${conversationMetrics.userEngagementScore})`,
          overallSentiment: sql<number>`avg(${conversations.overallSentiment})`
        })
        .from(conversations)
        .leftJoin(conversationMetrics, eq(conversations.id, conversationMetrics.conversationId))
        .where(
          and(
            startDate ? gte(conversations.createdAt, new Date(startDate as string)) : undefined,
            endDate ? lte(conversations.createdAt, new Date(endDate as string)) : undefined
          )
        );

      // Get sentiment trend
      const sentimentTrend = await db
        .select({
          timestamp: conversations.createdAt,
          sentiment: conversations.overallSentiment
        })
        .from(conversations)
        .where(
          and(
            startDate ? gte(conversations.createdAt, new Date(startDate as string)) : undefined,
            endDate ? lte(conversations.createdAt, new Date(endDate as string)) : undefined
          )
        )
        .orderBy(conversations.createdAt);

      // Get emotional state distribution
      const emotionalStates = await db
        .select({
          mood: sql<string>`jsonb_array_elements(${conversations.emotionalStates})->>'mood'`,
          count: sql<number>`count(*)`
        })
        .from(conversations)
        .groupBy(sql`jsonb_array_elements(${conversations.emotionalStates})->>'mood'`);

      const emotionalStateDistribution = emotionalStates.map(state => ({
        mood: state.mood,
        value: Number(state.count)
      }));

      res.json({
        totalConversations,
        avgDuration,
        avgEngagement,
        overallSentiment,
        sentimentTrend,
        emotionalStateDistribution
      });
    } catch (error) {
      console.error('Error fetching analytics metrics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics metrics' });
    }
  });

  app.get('/api/analytics/feedback', async (req, res) => {
    try {
      // Get sentiment distribution
      const sentimentDistribution = await db
        .select({
          name: conversationFeedback.sentiment,
          value: sql<number>`count(*)`
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

  app.get('/api/analytics/conversation', async (req, res) => {
    try {
      const { conversationId } = req.query;

      const conversation = await db
        .select({
          id: conversations.id,
          messages: conversations.messages,
          startedAt: conversations.startedAt,
          endedAt: conversations.endedAt,
          duration: conversations.duration,
          totalTurns: conversations.totalTurns,
          interruptions: conversations.interruptions,
          overallSentiment: conversations.overallSentiment,
          emotionalStates: conversations.emotionalStates
        })
        .from(conversations)
        .where(conversationId ? eq(conversations.id, Number(conversationId)) : undefined)
        .orderBy(conversations.createdAt)
        .limit(1);

      if (!conversation.length) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Define the conversation type
      interface ConversationMessage {
        role: string;
        content: string;
        timestamp: string;
        sentiment?: {
          score: number;
          comparative: number;
          mood: string;
        };
      }

      interface ConversationData {
        id: number;
        messages: ConversationMessage[];
        [key: string]: any; // Allow for other properties
      }

      const conversationData = conversation[0] as ConversationData;

      const transformedMessages = Array.isArray(conversationData.messages) 
        ? conversationData.messages.map((msg: ConversationMessage, index: number) => ({
            id: `msg-${index}`,
            ...msg,
            timestamp: new Date(msg.timestamp).toISOString()
          }))
        : [];

      res.json({
        conversation: {
          ...conversationData,
          messages: transformedMessages
        }
      });
    } catch (error) {
      console.error('Error fetching conversation flow data:', error);
      res.status(500).json({ message: 'Failed to fetch conversation flow data' });
    }
  });

  // Serve the embed page for all routes starting with /embed
  app.get('/embed*', (req, res) => {
    // Redirect to widget-embed instead to avoid loading the entire landing page
    const queryParams = req.url.includes('?') ? req.url.split('?')[1] : '';
    const redirectUrl = req.url.replace('/embed', '/widget-embed');
    const fullRedirectUrl = queryParams ? `${redirectUrl}?${queryParams}` : redirectUrl;
    res.redirect(307, fullRedirectUrl);
  });

  // Serve the standalone widget demo page
  app.get('/widget-demo', (req, res) => {
    res.sendFile(path.resolve('./client/public/standalone-widget-demo.html'));
  });

  // Serve the standalone chat bubble script with proper CORS headers
  app.get('/standalone-chat-bubble.js', (req, res) => {
    res.set({
      'Content-Type': 'application/javascript',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'max-age=3600'
    });
    res.sendFile(path.resolve('./client/public/standalone-chat-bubble.js'));
  });


  // Serve the simple-widget-demo.html with environment variables injected
  app.get('/simple-widget-demo.html', (req, res) => {
    // Read the file from disk
    fs.readFile(path.resolve('./client/public/simple-widget-demo.html'), 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
      if (err) {
        console.error('Error reading simple-widget-demo.html:', err);
        return res.status(500).send('Error loading the demo page');
      }

      // Inject a global JavaScript variable with the API key
      const apiKeyScript = `<script>window.ELEVENLABS_API_KEY = "${process.env.ELEVENLABS_API_KEY || ''}";</script>`;
      const processedHTML = data.replace(
        '</head>',
        apiKeyScript + '</head>'
      );

      res.set('Content-Type', 'text/html');
      res.send(processedHTML);
    });
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

const ONE_DAY = 1000 * 60 * 60 * 24;
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'your-secret-key-change-in-production';
const MemoryStoreSession = MemoryStore(session);