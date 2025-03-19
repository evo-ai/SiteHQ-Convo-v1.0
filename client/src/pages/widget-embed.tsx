import { useEffect } from 'react';
import ChatBubble from '@/components/chat/ChatBubble';

/**
 * This page is specifically for embedding the ChatBubble component in an iframe
 * It will only render the ChatBubble component with no other UI elements
 */
export default function WidgetEmbedPage() {
  // Get configuration from URL parameters
  const params = new URLSearchParams(window.location.search);
  const apiKey = params.get('apiKey') || '';
  const agentId = params.get('agentId') || '';
  const themeParam = params.get('theme') || '{}';
  
  // Parse theme from URL parameter
  let theme = {
    primary: '#5c078c',
    background: '#ffffff',
    text: '#333333'
  };
  
  try {
    const parsedTheme = JSON.parse(themeParam);
    theme = {
      ...theme,
      ...parsedTheme
    };
  } catch (error) {
    console.error('Failed to parse theme parameter:', error);
  }

  // Apply specific styles for the embed page to ensure clean embed
  useEffect(() => {
    // Set background to transparent
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    
    // Remove any margins or paddings
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    
    // Remove any scrollbars
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Clean up on unmount
    return () => {
      document.body.style.background = '';
      document.documentElement.style.background = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="widget-embed-container">
      <ChatBubble
        apiKey={apiKey}
        agentId={agentId}
        title="Chat Assistant"
        theme={theme}
      />
    </div>
  );
}