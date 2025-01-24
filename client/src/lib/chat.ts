export function createChatConnection(apiKey: string, agentId: string): WebSocket {
  const ws = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`, {
    headers: {
      'xi-api-key': apiKey
    }
  });

  ws.onopen = () => {
    console.log('Connected to ElevenLabs');
    ws.send(JSON.stringify({
      type: 'init',
      apiKey,
      agentId
    }));
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}