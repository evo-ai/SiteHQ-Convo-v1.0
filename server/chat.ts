import { WebSocket } from 'ws';
import { db } from '@db';
import { conversations } from '@db/schema';
import { eq } from 'drizzle-orm';

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
          interruptions: 0
        })
        .returning();

      conversationId = result[0].id;

      // Connect to ElevenLabs WebSocket
      elevenlabsWs = new WebSocket(message.signedUrl);

      elevenlabsWs.on('message', (data) => {
        // Forward ElevenLabs messages back to the client
        ws.send(data.toString());

        // Store AI response in the database
        if (conversationId) {
          const aiMessage = JSON.parse(data.toString());
          db.update(conversations)
            .set({
              messages: [...(result[0].messages || []), {
                role: 'ai',
                content: aiMessage.content || aiMessage.text,
                timestamp: new Date().toISOString()
              }],
              totalTurns: result[0].totalTurns + 1,
              updatedAt: new Date()
            })
            .where(eq(conversations.id, conversationId))
            .execute();
        }
      });

    } else if (message.type === 'message' && elevenlabsWs) {
      // Forward message to ElevenLabs
      elevenlabsWs.send(JSON.stringify({
        text: message.content
      }));

      // Store user message in database
      if (conversationId) {
        const currentConversation = await db.query.conversations.findFirst({
          where: eq(conversations.id, conversationId)
        });

        if (currentConversation) {
          await db.update(conversations)
            .set({
              messages: [...(currentConversation.messages || []), {
                role: 'user',
                content: message.content,
                timestamp: new Date().toISOString()
              }],
              totalTurns: currentConversation.totalTurns + 1,
              updatedAt: new Date()
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

    // Update conversation end time if it exists
    if (conversationId) {
      db.update(conversations)
        .set({
          endedAt: new Date(),
          duration: Math.floor((Date.now() - new Date(conversations.startedAt).getTime()) / 1000)
        })
        .where(eq(conversations.id, conversationId))
        .execute();
    }
  });
}