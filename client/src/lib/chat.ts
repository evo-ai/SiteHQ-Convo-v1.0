export function createChatConnection(apiKey: string, agentId: string): WebSocket {
  const ws = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'init',
      apiKey,
      agentId
    }));
  };

  return ws;
}