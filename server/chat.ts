import { WebSocket } from 'ws';
import { db } from '@db';
import { conversations, conversationMetrics } from '@db/schema';
import { eq } from 'drizzle-orm';
import natural from 'natural';

const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");

type Mood = 'positive' | 'negative' | 'neutral';

interface SentimentResult {
  score: number;
  comparative: number;
  mood: Mood;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  sentiment?: SentimentResult;
}

interface ConversationRecord {
  messages: unknown;
  sentimentTrend: unknown;
  emotionalStates: unknown;
}

function analyzeSentiment(content: string): SentimentResult {
  const words = content.toLowerCase().split(' ');
  const score = analyzer.getSentiment(words);
  const mood: Mood = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';
  return {
    score,
    comparative: words.length > 0 ? score / words.length : 0,
    mood
  };
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function calculateOverallSentiment(messages: Message[]): number {
  if (messages.length === 0) return 0;
  const total = messages.reduce((acc, msg) => acc + (msg.sentiment?.score || 0), 0);
  return total / messages.length;
}

async function updateConversationWithMessage(
  conversationId: number,
  conversation: ConversationRecord,
  newMessage: Message,
  messageCount: number
): Promise<void> {
  const currentMessages = ensureArray<Message>(conversation.messages);
  const updatedMessages = [...currentMessages, newMessage];
  const overallSentiment = calculateOverallSentiment(updatedMessages);

  const currentSentimentTrend = ensureArray<unknown>(conversation.sentimentTrend);
  const currentEmotionalStates = ensureArray<unknown>(conversation.emotionalStates);

  await db.update(conversations)
    .set({
      messages: updatedMessages,
      totalTurns: messageCount,
      updatedAt: new Date(),
      overallSentiment,
      sentimentTrend: [
        ...currentSentimentTrend,
        { timestamp: new Date().toISOString(), sentiment: newMessage.sentiment?.score || 0 }
      ],
      emotionalStates: [
        ...currentEmotionalStates,
        { timestamp: new Date().toISOString(), sentiment: newMessage.sentiment?.score || 0, mood: newMessage.sentiment?.mood || 'neutral' }
      ]
    })
    .where(eq(conversations.id, conversationId));
}

export function setupChatWebSocket(ws: WebSocket) {
  let elevenlabsWs: WebSocket | null = null;
  let conversationId: number | null = null;
  let messageCount = 0;
  let startTime: number | null = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'init') {
        startTime = Date.now();

        const [newConversation] = await db.insert(conversations)
          .values({
            configId: 1,
            agentId: message.agentId || 'default-agent',
            messages: [],
            startedAt: new Date(),
            totalTurns: 0,
            interruptions: 0,
            overallSentiment: 0,
            sentimentTrend: [],
            emotionalStates: []
          })
          .returning();

        conversationId = newConversation.id;
        elevenlabsWs = new WebSocket(message.signedUrl);

        elevenlabsWs.on('message', async (wsData) => {
          try {
            ws.send(wsData.toString());

            const elevenlabsMessage = JSON.parse(wsData.toString());

            // Forward voice status updates to client
            if (elevenlabsMessage.type === 'status') {
              const status = elevenlabsMessage.status;
              if (['listening', 'speaking', 'thinking'].includes(status)) {
                ws.send(JSON.stringify({ type: 'voice_status', status }));
              }
            }

            if (!conversationId) return;

            const content = elevenlabsMessage.content || elevenlabsMessage.text;
            if (!content) return;

            const sentiment = analyzeSentiment(content);
            messageCount++;

            const currentConversation = await db.query.conversations.findFirst({
              where: eq(conversations.id, conversationId)
            });

            if (currentConversation) {
              const newMessage: Message = {
                role: 'ai',
                content,
                timestamp: new Date().toISOString(),
                sentiment
              };

              await updateConversationWithMessage(
                conversationId,
                currentConversation,
                newMessage,
                messageCount
              );
            }
          } catch {
            // Silent fail for message processing errors
          }
        });

      } else if (message.type === 'message' && elevenlabsWs) {
        elevenlabsWs.send(JSON.stringify({ text: message.content }));

        if (conversationId) {
          messageCount++;
          const sentiment = analyzeSentiment(message.content);

          const currentConversation = await db.query.conversations.findFirst({
            where: eq(conversations.id, conversationId)
          });

          if (currentConversation) {
            const newMessage: Message = {
              role: 'user',
              content: message.content,
              timestamp: new Date().toISOString(),
              sentiment
            };

            await updateConversationWithMessage(
              conversationId,
              currentConversation,
              newMessage,
              messageCount
            );
          }
        }
      }
    } catch {
      // Silent fail for websocket message errors
    }
  });

  ws.on('close', async () => {
    try {
      if (elevenlabsWs) {
        elevenlabsWs.close();
      }

      if (conversationId && startTime) {
        const duration = Math.floor((Date.now() - startTime) / 1000);

        await db.update(conversations)
          .set({
            endedAt: new Date(),
            duration
          })
          .where(eq(conversations.id, conversationId));

        await db.insert(conversationMetrics)
          .values({
            conversationId,
            avgResponseTime: Math.floor(duration / (messageCount || 1)),
            userEngagementScore: Math.min(100, Math.floor((messageCount * 20))),
            completionRate: 100
          });
      }
    } catch {
      // Silent fail for close errors
    }
  });
}
