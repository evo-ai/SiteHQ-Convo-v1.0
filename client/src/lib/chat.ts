export function createChatConnection(apiKey: string, agentId: string): WebSocket {
  const ws = new WebSocket(`wss://${window.location.host}/api/chat`);
  
  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'init',
      apiKey,
      agentId
    }));
  };

  return ws;
}
