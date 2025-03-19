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
        // Create new conversation
        const [newConversation] = await db.insert(conversations)
          .values({
            configId: 1,
            agentId: message.agentId || 'default-agent',
            messages: [], // Initialize as empty array
            startedAt: new Date(),
            totalTurns: 0,
            interruptions: 0,
            overallSentiment: 0,
            sentimentTrend: [], // Initialize as empty array
            emotionalStates: [] // Initialize as empty array
          })
          .returning();

        console.log('Created new conversation:', newConversation.id);
        conversationId = newConversation.id;

        // Connect to ElevenLabs
        elevenlabsWs = new WebSocket(message.signedUrl);

        elevenlabsWs.on('message', async (data) => {
          try {
            // First, pass the original message to the client
            ws.send(data.toString());
            
            const elevenlabsMessage = JSON.parse(data.toString());
            
            // Check for status indicators from ElevenLabs
            if (elevenlabsMessage.type === 'status') {
              console.log('ElevenLabs status update:', elevenlabsMessage);
              
              // Send voice-specific status updates to the client
              if (elevenlabsMessage.status === 'listening') {
                ws.send(JSON.stringify({
                  type: 'voice_status',
                  status: 'listening'
                }));
              } else if (elevenlabsMessage.status === 'speaking') {
                ws.send(JSON.stringify({
                  type: 'voice_status',
                  status: 'speaking'
                }));
              } else if (elevenlabsMessage.status === 'thinking') {
                ws.send(JSON.stringify({
                  type: 'voice_status',
                  status: 'thinking'
                }));
              }
            }

            if (conversationId) {
              const aiMessage = elevenlabsMessage;
              const content = aiMessage.content || aiMessage.text;
              
              // Only process content messages, not status updates
              if (!content) return;

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

                // Ensure messages is an array
                const currentMessages = Array.isArray(currentConversation.messages) 
                  ? currentConversation.messages 
                  : [];

                const updatedMessages = [...currentMessages, messageWithSentiment];
                const overallSentiment = updatedMessages.reduce((acc, msg: any) => 
                  acc + (msg.sentiment?.score || 0), 0) / updatedMessages.length;

                // Ensure arrays are properly initialized
                const currentSentimentTrend = Array.isArray(currentConversation.sentimentTrend)
                  ? currentConversation.sentimentTrend
                  : [];

                const currentEmotionalStates = Array.isArray(currentConversation.emotionalStates)
                  ? currentConversation.emotionalStates
                  : [];

                await db.update(conversations)
                  .set({
                    messages: updatedMessages,
                    totalTurns: messageCount,
                    updatedAt: new Date(),
                    overallSentiment,
                    sentimentTrend: [
                      ...currentSentimentTrend,
                      { timestamp: new Date().toISOString(), sentiment }
                    ],
                    emotionalStates: [
                      ...currentEmotionalStates,
                      { timestamp: new Date().toISOString(), sentiment, mood }
                    ]
                  })
                  .where(eq(conversations.id, conversationId));

                console.log('Updated conversation with AI message:', { 
                  conversationId,
                  messageCount,
                  overallSentiment
                });
              }
            }
          } catch (error) {
            console.error('Error processing AI message:', error);
          }
        });

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

            // Ensure messages is an array
            const currentMessages = Array.isArray(currentConversation.messages) 
              ? currentConversation.messages 
              : [];

            const updatedMessages = [...currentMessages, messageWithSentiment];
            const overallSentiment = updatedMessages.reduce((acc, msg: any) => 
              acc + (msg.sentiment?.score || 0), 0) / updatedMessages.length;

            // Ensure arrays are properly initialized
            const currentSentimentTrend = Array.isArray(currentConversation.sentimentTrend)
              ? currentConversation.sentimentTrend
              : [];

            const currentEmotionalStates = Array.isArray(currentConversation.emotionalStates)
              ? currentConversation.emotionalStates
              : [];

            await db.update(conversations)
              .set({
                messages: updatedMessages,
                totalTurns: messageCount,
                updatedAt: new Date(),
                overallSentiment,
                sentimentTrend: [
                  ...currentSentimentTrend,
                  { timestamp: new Date().toISOString(), sentiment }
                ],
                emotionalStates: [
                  ...currentEmotionalStates,
                  { timestamp: new Date().toISOString(), sentiment, mood }
                ]
              })
              .where(eq(conversations.id, conversationId));

            console.log('Updated conversation with user message:', { 
              conversationId,
              messageCount,
              overallSentiment
            });
          }
        }
      }
    } catch (error) {
      console.error('Error processing websocket message:', error);
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