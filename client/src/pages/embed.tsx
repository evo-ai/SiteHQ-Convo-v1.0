import ChatBubble from '@/components/chat/ChatBubble';

export default function EmbedPage() {
  // Get configuration from URL parameters
  const params = new URLSearchParams(window.location.search);
  const apiKey = params.get('apiKey') || '';
  const agentId = params.get('agentId') || '';
  const theme = JSON.parse(params.get('theme') || '{}');

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <ChatBubble
        apiKey={apiKey}
        agentId={agentId}
        title="FuturSurvey"
        theme={{
          primary: theme.primary || '#0066cc',
          background: theme.background || '#ffffff',
          text: theme.text || '#ffffff'
        }}
      />
    </div>
  );
}
