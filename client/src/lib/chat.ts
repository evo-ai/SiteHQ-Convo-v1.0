export function createChatConnection(apiKey: string, agentId: string): WebSocket {
  // For public agents, we can directly use the agent_id in the WebSocket URL
  const ws = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`);

  ws.onopen = () => {
    console.log('Connected to ElevenLabs');
    // Send initial message with API key for authentication
    ws.send(JSON.stringify({
      type: "conversation_initiation_metadata",
      conversation_initiation_metadata_event: {
        xi_api_key: apiKey
      }
    }));
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}