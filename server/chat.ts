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
      console.log('Received message:', message); // Debug log

      if (message.type === 'init') {
        startTime = Date.now();
        // Create new conversation
        const result = await db.insert(conversations)
          .values({
            configId: 1, // Default config for now
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

        console.log('Created new conversation:', result[0].id); // Debug log
        conversationId = result[0].id;
        elevenlabsWs = new WebSocket(message.signedUrl);

        elevenlabsWs.on('message', async (data) => {
          try {
            ws.send(data.toString());

            // Store AI response with sentiment analysis
            if (conversationId) {
              const aiMessage = JSON.parse(data.toString());
              const content = aiMessage.content || aiMessage.text;

              // Analyze sentiment
              const words = content.toLowerCase().split(' ');
              const sentiment = analyzer.getSentiment(words);
              const mood = sentiment > 0.2 ? 'positive' : sentiment < -0.2 ? 'negative' : 'neutral';

              messageCount++;
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

              const currentConversation = await db.query.conversations.findFirst({
                where: eq(conversations.id, conversationId)
              });

              if (currentConversation) {
                const updatedMessages = [...(currentConversation.messages || []), messageWithSentiment];
                const overallSentiment = updatedMessages.reduce((acc, msg) => 
                  acc + (msg.sentiment?.score || 0), 0) / updatedMessages.length;

                await db.update(conversations)
                  .set({
                    messages: updatedMessages,
                    totalTurns: messageCount,
                    updatedAt: new Date(),
                    overallSentiment: overallSentiment,
                    sentimentTrend: [
                      ...(currentConversation.sentimentTrend || []),
                      { timestamp: new Date().toISOString(), sentiment: sentiment }
                    ],
                    emotionalStates: [
                      ...(currentConversation.emotionalStates || []),
                      { timestamp: new Date().toISOString(), sentiment: sentiment, mood: mood }
                    ]
                  })
                  .where(eq(conversations.id, conversationId));

                console.log('Updated conversation with AI message:', conversationId); // Debug log
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

        // Store user message with sentiment analysis
        if (conversationId) {
          messageCount++;
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

          const currentConversation = await db.query.conversations.findFirst({
            where: eq(conversations.id, conversationId)
          });

          if (currentConversation) {
            const updatedMessages = [...(currentConversation.messages || []), messageWithSentiment];
            const overallSentiment = updatedMessages.reduce((acc, msg) => 
              acc + (msg.sentiment?.score || 0), 0) / updatedMessages.length;

            await db.update(conversations)
              .set({
                messages: updatedMessages,
                totalTurns: messageCount,
                updatedAt: new Date(),
                overallSentiment: overallSentiment,
                sentimentTrend: [
                  ...(currentConversation.sentimentTrend || []),
                  { timestamp: new Date().toISOString(), sentiment: sentiment }
                ],
                emotionalStates: [
                  ...(currentConversation.emotionalStates || []),
                  { timestamp: new Date().toISOString(), sentiment: sentiment, mood: mood }
                ]
              })
              .where(eq(conversations.id, conversationId));

            console.log('Updated conversation with user message:', conversationId); // Debug log
          }
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', async () => {
    if (elevenlabsWs) {
      elevenlabsWs.close();
    }

    if (conversationId && startTime) {
      const duration = Math.floor((Date.now() - startTime) / 1000);

      // Update conversation end data
      await db.update(conversations)
        .set({
          endedAt: new Date(),
          duration: duration
        })
        .where(eq(conversations.id, conversationId));

      // Create conversation metrics
      await db.insert(conversationMetrics)
        .values({
          conversationId: conversationId,
          avgResponseTime: Math.floor(duration / (messageCount || 1)),
          userEngagementScore: Math.min(100, Math.floor((messageCount * 20))), // Simple scoring based on message count
          completionRate: 100 // Assuming all conversations that end are completed
        });

      console.log('Conversation ended and metrics saved:', conversationId); // Debug log
    }
  });
}