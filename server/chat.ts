import { WebSocket } from 'ws';
import { db } from '@db';
import { conversations } from '@db/schema';
import { eq, sql } from 'drizzle-orm';

export function setupChatWebSocket(ws: WebSocket) {
  let elevenlabsWs: WebSocket | null = null;
  let conversationId: number | null = null;

  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());

    if (message.type === 'init') {
      // Create new conversation and connect to ElevenLabs
      const result = await db.insert(conversations)
        .values({
          agentId: message.agentId,
          messages: []
        })
        .returning();

      conversationId = result[0].id;

      elevenlabsWs = new WebSocket(
        `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${message.agentId}`,
        {
          headers: {
            'xi-api-key': message.apiKey
          }
        }
      );

      elevenlabsWs.on('message', (data) => {
        ws.send(data.toString());
      });

    } else if (message.type === 'message' && elevenlabsWs) {
      // Forward message to ElevenLabs
      elevenlabsWs.send(JSON.stringify({
        text: message.content
      }));

      // Store message in database
      if (conversationId) {
        await db.update(conversations)
          .set({
            messages: sql`${conversations.messages} || ${sql.json([{
              role: 'user',
              content: message.content
            }])}`,
            updatedAt: new Date()
          })
          .where(eq(conversations.id, conversationId));
      }
    }
  });

  ws.on('close', () => {
    if (elevenlabsWs) {
      elevenlabsWs.close();
    }
  });
}