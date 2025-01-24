import { WebSocket } from 'ws';
import { db } from '@db';
import { conversations, conversationMetrics } from '@db/schema';
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

// Verify the ElevenLabs API key exists
if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error('ELEVENLABS_API_KEY environment variable is required');
}

export async function getSignedUrl(agentId: string) {
  try {
    const headers = new Headers();
    headers.append('xi-api-key', process.env.ELEVENLABS_API_KEY);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers
      }
    );

    if (!response.ok) {
      console.error('ElevenLabs API Error:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`Failed to get signed URL: ${response.status}`);
    }

    const data = await response.json();
    return data.signed_url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
}

export function setupChatWebSocket(ws: WebSocket) {
  let elevenlabsWs: WebSocket | null = null;
  let conversationId: number | null = null;
  let messageCount = 0;
  let startTime: number | null = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received websocket message:', message);

      if (message.type === 'init') {
        startTime = Date.now();

        try {
          // Get signed URL using server-side API key
          const signedUrl = await getSignedUrl(message.agentId);

          // Create new conversation
          const [newConversation] = await db.insert(conversations)
            .values({
              configId: 1,
              agentId: message.agentId,
              messages: [],
              startedAt: new Date(),
              totalTurns: 0,
              interruptions: 0,
              overallSentiment: 0,
              sentimentTrend: [],
              emotionalStates: []
            })
            .returning();

          console.log('Created new conversation:', newConversation.id);
          conversationId = newConversation.id;

          // Connect to ElevenLabs with server-side credentials
          elevenlabsWs = new WebSocket(signedUrl);

          elevenlabsWs.on('message', async (data) => {
            try {
              ws.send(data.toString());

              if (conversationId) {
                const aiMessage = JSON.parse(data.toString());
                const content = aiMessage.content || aiMessage.text;

                // Analyze sentiment
                const words = content.toLowerCase().split(' ');
                const sentiment = analyzer.getSentiment(words);
                const mood = sentiment > 0.2 ? 'positive' : sentiment < -0.2 ? 'negative' : 'neutral';

                messageCount++;

                const currentConversation = await db.query.conversations.findFirst({
                  where: eq(conversations.id, conversationId)
                });

                if (currentConversation) {
                  const messageWithSentiment: Message = {
                    role: 'ai',
                    content,
                    timestamp: new Date().toISOString(),
                    sentiment: {
                      score: sentiment,
                      comparative: sentiment / words.length,
                      mood
                    }
                  };

                  // Update conversation with new message
                  const currentMessages = Array.isArray(currentConversation.messages)
                    ? currentConversation.messages
                    : [];

                  const updatedMessages = [...currentMessages, messageWithSentiment];
                  const overallSentiment = updatedMessages.reduce((acc, msg: any) =>
                    acc + (msg.sentiment?.score || 0), 0) / updatedMessages.length;

                  await db.update(conversations)
                    .set({
                      messages: updatedMessages,
                      totalTurns: messageCount,
                      updatedAt: new Date(),
                      overallSentiment,
                      sentimentTrend: [
                        ...(Array.isArray(currentConversation.sentimentTrend) ? currentConversation.sentimentTrend : []),
                        { timestamp: new Date().toISOString(), sentiment }
                      ],
                      emotionalStates: [
                        ...(Array.isArray(currentConversation.emotionalStates) ? currentConversation.emotionalStates : []),
                        { timestamp: new Date().toISOString(), sentiment, mood }
                      ]
                    })
                    .where(eq(conversations.id, conversationId));
                }
              }
            } catch (error) {
              console.error('Error processing AI message:', error);
              ws.send(JSON.stringify({ error: 'Failed to process AI response' }));
            }
          });

          elevenlabsWs.on('error', (error) => {
            console.error('ElevenLabs WebSocket error:', error);
            ws.send(JSON.stringify({ error: 'Connection error occurred' }));
          });

        } catch (error) {
          console.error('Failed to initialize chat:', error);
          ws.send(JSON.stringify({ error: 'Failed to initialize chat' }));
        }

      } else if (message.type === 'message' && elevenlabsWs) {
        elevenlabsWs.send(JSON.stringify({
          text: message.content
        }));

        if (conversationId) {
          messageCount++;
          const words = message.content.toLowerCase().split(' ');
          const sentiment = analyzer.getSentiment(words);
          const mood = sentiment > 0.2 ? 'positive' : sentiment < -0.2 ? 'negative' : 'neutral';

          const currentConversation = await db.query.conversations.findFirst({
            where: eq(conversations.id, conversationId)
          });

          if (currentConversation) {
            const messageWithSentiment: Message = {
              role: 'user',
              content: message.content,
              timestamp: new Date().toISOString(),
              sentiment: {
                score: sentiment,
                comparative: sentiment / words.length,
                mood
              }
            };

            const currentMessages = Array.isArray(currentConversation.messages)
              ? currentConversation.messages
              : [];

            const updatedMessages = [...currentMessages, messageWithSentiment];
            const overallSentiment = updatedMessages.reduce((acc, msg: any) =>
              acc + (msg.sentiment?.score || 0), 0) / updatedMessages.length;

            await db.update(conversations)
              .set({
                messages: updatedMessages,
                totalTurns: messageCount,
                updatedAt: new Date(),
                overallSentiment,
                sentimentTrend: [
                  ...(Array.isArray(currentConversation.sentimentTrend) ? currentConversation.sentimentTrend : []),
                  { timestamp: new Date().toISOString(), sentiment }
                ],
                emotionalStates: [
                  ...(Array.isArray(currentConversation.emotionalStates) ? currentConversation.emotionalStates : []),
                  { timestamp: new Date().toISOString(), sentiment, mood }
                ]
              })
              .where(eq(conversations.id, conversationId));
          }
        }
      }
    } catch (error) {
      console.error('Error processing websocket message:', error);
      ws.send(JSON.stringify({ error: 'Failed to process message' }));
    }
  });

  ws.on('close', async () => {
    try {
      if (elevenlabsWs) {
        elevenlabsWs.close();
      }

      if (conversationId && startTime) {
        const duration = Math.floor((Date.now() - startTime) / 1000);

        // Update conversation end data
        await db.update(conversations)
          .set({
            endedAt: new Date(),
            duration
          })
          .where(eq(conversations.id, conversationId));

        // Create conversation metrics
        await db.insert(conversationMetrics)
          .values({
            conversationId,
            avgResponseTime: Math.floor(duration / (messageCount || 1)),
            userEngagementScore: Math.min(100, Math.floor((messageCount * 20))),
            completionRate: 100
          });

        console.log('Conversation ended and metrics saved:', {
          conversationId,
          duration,
          messageCount
        });
      }
    } catch (error) {
      console.error('Error closing websocket connection:', error);
    }
  });
}