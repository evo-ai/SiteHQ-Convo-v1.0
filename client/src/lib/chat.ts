export function createChatConnection(apiKey: string, agentId: string): WebSocket {
  // For public agents, we can directly use the agent_id in the WebSocket URL
  const ws = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`, [
    `xi-api-key.${apiKey}`
  ]);

  ws.onopen = () => {
    console.log('Connected to ElevenLabs');
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}