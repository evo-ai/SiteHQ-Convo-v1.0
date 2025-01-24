import { WebSocket } from 'ws';
import { db } from '@db';
import { conversations } from '@db/schema';
import { eq } from 'drizzle-orm';
import natural from 'natural';
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  sentiment?: {
    score: number;
    comparative: number;
    mood: 'positive' | 'negative' | 'neutral';
  };
}

export function setupChatWebSocket(ws: WebSocket) {
  let elevenlabsWs: WebSocket | null = null;
  let conversationId: number | null = null;

  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());

    if (message.type === 'init') {
      // Create new conversation and connect to ElevenLabs
      const result = await db.insert(conversations)
        .values({
          configId: 1, // Default config for now
          agentId: message.agentId,
          messages: [],
          startedAt: new Date(),
          totalTurns: 0,
          interruptions: 0,
          overallSentiment: 0, // Initial neutral sentiment
          emotionalStates: [] // Track emotional states over time
        })
        .returning();

      conversationId = result[0].id;
      elevenlabsWs = new WebSocket(message.signedUrl);

      elevenlabsWs.on('message', (data) => {
        ws.send(data.toString());

        // Store AI response with sentiment analysis
        if (conversationId) {
          const aiMessage = JSON.parse(data.toString());
          const content = aiMessage.content || aiMessage.text;

          // Analyze sentiment
          const words = content.toLowerCase().split(' ');
          const sentiment = analyzer.getSentiment(words);
          const mood = sentiment > 0.2 ? 'positive' : sentiment < -0.2 ? 'negative' : 'neutral';

          const messageWithSentiment: Message = {
            role: 'ai',
            content: content,
            timestamp: new Date().toISOString(),
            sentiment: {
              score: sentiment,
              comparative: sentiment / words.length,
              mood: mood
            }
          };

          const currentMessages = result[0].messages || [];
          const updatedMessages = [...currentMessages, messageWithSentiment];

          // Calculate overall conversation sentiment
          const overallSentiment = updatedMessages.reduce((acc, msg) => 
            acc + (msg.sentiment?.score || 0), 0) / updatedMessages.length;

          db.update(conversations)
            .set({
              messages: updatedMessages,
              totalTurns: result[0].totalTurns + 1,
              updatedAt: new Date(),
              overallSentiment: overallSentiment,
              emotionalStates: [...(result[0].emotionalStates || []), {
                timestamp: new Date().toISOString(),
                sentiment: sentiment,
                mood: mood
              }]
            })
            .where(eq(conversations.id, conversationId))
            .execute();
        }
      });

    } else if (message.type === 'message' && elevenlabsWs) {
      elevenlabsWs.send(JSON.stringify({
        text: message.content
      }));

      // Store user message with sentiment analysis
      if (conversationId) {
        const currentConversation = await db.query.conversations.findFirst({
          where: eq(conversations.id, conversationId)
        });

        if (currentConversation) {
          // Analyze sentiment
          const words = message.content.toLowerCase().split(' ');
          const sentiment = analyzer.getSentiment(words);
          const mood = sentiment > 0.2 ? 'positive' : sentiment < -0.2 ? 'negative' : 'neutral';

          const messageWithSentiment: Message = {
            role: 'user',
            content: message.content,
            timestamp: new Date().toISOString(),
            sentiment: {
              score: sentiment,
              comparative: sentiment / words.length,
              mood: mood
            }
          };

          const updatedMessages = [...(currentConversation.messages || []), messageWithSentiment];

          // Calculate overall conversation sentiment
          const overallSentiment = updatedMessages.reduce((acc, msg) => 
            acc + (msg.sentiment?.score || 0), 0) / updatedMessages.length;

          await db.update(conversations)
            .set({
              messages: updatedMessages,
              totalTurns: currentConversation.totalTurns + 1,
              updatedAt: new Date(),
              overallSentiment: overallSentiment,
              emotionalStates: [...(currentConversation.emotionalStates || []), {
                timestamp: new Date().toISOString(),
                sentiment: sentiment,
                mood: mood
              }]
            })
            .where(eq(conversations.id, conversationId));
        }
      }
    }
  });

  ws.on('close', () => {
    if (elevenlabsWs) {
      elevenlabsWs.close();
    }

    if (conversationId) {
      db.update(conversations)
        .set({
          endedAt: new Date(),
          duration: Math.floor((Date.now() - new Date().getTime()) / 1000)
        })
        .where(eq(conversations.id, conversationId))
        .execute();
    }
  });
}