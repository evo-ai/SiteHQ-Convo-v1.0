
import ChatBubble from '@/components/chat/ChatBubble';

export default function WidgetEmbed() {
  // Get configuration from URL parameters
  const params = new URLSearchParams(window.location.search);
  const apiKey = params.get('apiKey') || '';
  const agentId = params.get('agentId') || '';
  const theme = JSON.parse(params.get('theme') || '{}');

  return (
    <ChatBubble
      apiKey={apiKey}
      agentId={agentId}
      title="Chat Assistant"
      theme={{
        primary: theme.primary || '#5c078c',
        background: theme.background || '#ffffff',
        text: theme.text || '#333333'
      }}
    />
  );
}
