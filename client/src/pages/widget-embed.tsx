import { useSearch } from 'wouter';
import { useEffect, useState } from 'react';
import ChatBubble from '@/components/chat/ChatBubble';

/**
 * This page is specifically for embedding the ChatBubble component in an iframe
 * It will only render the ChatBubble component with no other UI elements
 */
export default function WidgetEmbedPage() {
  const [params] = useSearch();
  const [theme, setTheme] = useState({
    primary: '#5c078c',
    background: '#ffffff',
    text: '#333333'
  });
  
  // Parse URL parameters
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(params || '');
      
      // Parse theme if provided
      const themeParam = searchParams.get('theme');
      if (themeParam) {
        const parsedTheme = JSON.parse(decodeURIComponent(themeParam));
        setTheme({
          ...theme,
          ...parsedTheme
        });
      }
    } catch (error) {
      console.error('Error parsing URL parameters:', error);
    }
  }, [params]);
  
  // Get API key and agent ID from URL parameters
  const searchParams = new URLSearchParams(params || '');
  const apiKey = searchParams.get('apiKey') || 'demo-key';
  const agentId = searchParams.get('agentId') || 'demo-agent';
  
  return (
    <div className="w-full h-screen flex justify-center items-center">
      <style>{`
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: transparent;
        }
      `}</style>
      
      {/* 
        We render the ChatBubble component with its window already open
        This way it appears as a standalone chat window in the iframe
      */}
      <div className="w-full h-full">
        <ChatBubble
          apiKey={apiKey}
          agentId={agentId}
          title="SiteHQ Assistant"
          theme={theme}
          initiallyOpen={true}
        />
      </div>
    </div>
  );
}