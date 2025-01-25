import { useState } from 'react';
import ChatBubble from '@/components/chat/ChatBubble';
import { Button } from '@/components/ui/button';

export default function EmbedPage() {
  const [isOpen, setIsOpen] = useState(false);

  // Get configuration from URL parameters
  const params = new URLSearchParams(window.location.search);
  const apiKey = params.get('apiKey') || '';
  const agentId = params.get('agentId') || '';
  const theme = JSON.parse(params.get('theme') || '{}');

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
          style={{ 
            backgroundColor: theme.primary || '#0066cc',
            color: theme.text || '#ffffff'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </Button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-[400px] h-[600px]">
          <ChatBubble
            apiKey={apiKey}
            agentId={agentId}
            title="Chat Assistant"
            theme={{
              primary: theme.primary || '#0066cc',
              background: theme.background || '#ffffff',
              text: theme.text || '#ffffff'
            }}
          />
        </div>
      )}
    </div>
  );
}