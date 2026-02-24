import { useEffect, useState } from 'react';
import ChatBubble from '@/components/chat/ChatBubble';

/**
 * This page is specifically for embedding the ChatBubble component in an iframe.
 * It renders the ChatBubble with transparent background, positioned at bottom-right.
 *
 * Required URL params:
 * - apiKey: The widget API key for authentication
 * - agentId: The ElevenLabs agent ID
 *
 * Optional URL params:
 * - theme: JSON encoded theme object {primary, background, text}
 * - title: Widget title shown when connected
 * - darkMode: "true" to enable dark mode
 * - initiallyOpen: "true" to auto-open terms dialog
 * - solarSystemTheme: "true"/"false" to enable/disable solar system particles
 */
export default function WidgetEmbedPage() {
  const [theme, setTheme] = useState({
    primary: '#F95638',
    background: '#ffffff',
    text: '#333333'
  });

  const [useSolarSystemTheme, setUseSolarSystemTheme] = useState(true);
  const [initiallyOpen, setInitiallyOpen] = useState(false);
  const [widgetTitle, setWidgetTitle] = useState("AI Assistant");
  const [apiKey, setApiKey] = useState<string>('');
  const [agentId, setAgentId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  // Parse URL parameters on mount
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      console.log('Widget embed URL parameters:', Object.fromEntries(searchParams.entries()));

      // Required params
      const apiKeyParam = searchParams.get('apiKey')?.trim();
      const agentIdParam = searchParams.get('agentId')?.trim();

      if (!apiKeyParam || !agentIdParam) {
        console.error('Missing required parameters: apiKey and agentId are required');
      }

      setApiKey(apiKeyParam || '');
      setAgentId(agentIdParam || '');

      // Parse theme if provided
      const themeParam = searchParams.get('theme');
      if (themeParam) {
        try {
          const parsedTheme = JSON.parse(decodeURIComponent(themeParam));
          setTheme(prev => ({ ...prev, ...parsedTheme }));
        } catch (e) {
          console.error('Error parsing theme parameter:', e);
        }
      }

      // Optional params
      const solarSystemParam = searchParams.get('solarSystemTheme');
      if (solarSystemParam !== null) {
        setUseSolarSystemTheme(solarSystemParam === 'true');
      }

      const initiallyOpenParam = searchParams.get('initiallyOpen');
      if (initiallyOpenParam !== null) {
        setInitiallyOpen(initiallyOpenParam === 'true');
      }

      const titleParam = searchParams.get('title');
      if (titleParam) {
        setWidgetTitle(decodeURIComponent(titleParam));
      }

      setIsReady(true);
    } catch (error) {
      console.error('Error parsing URL parameters:', error);
      setIsReady(true);
    }
  }, []);

  // Don't render until params are parsed
  if (!isReady) {
    return null;
  }

  // Show error if missing required params
  if (!apiKey || !agentId) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '16px',
        background: '#fee2e2',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#991b1b',
        maxWidth: '300px'
      }}>
        <strong>Widget Error:</strong> Missing required parameters (apiKey, agentId).
        Check the embed code.
      </div>
    );
  }

  return (
    <>
      {/* Global styles for iframe embedding */}
      <style dangerouslySetInnerHTML={{ __html: `
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
          background: transparent !important;
        }

        /* Position the widget container at bottom-right of iframe */
        .widget-embed-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
        }

        /* Dark mode toggle - hide in embed context as it's less relevant */
        .dark-mode-toggle {
          display: none;
        }

        /* Ensure dialogs work correctly in iframe */
        [data-radix-popper-content-wrapper] {
          z-index: 99999 !important;
        }

        /* Dialog overlay and content positioning for iframe */
        [role="dialog"] {
          position: fixed !important;
          z-index: 99999 !important;
        }

        /* Ensure the dialog backdrop covers the iframe */
        [data-state="open"] > [data-radix-dialog-overlay] {
          position: fixed !important;
          inset: 0 !important;
          background: rgba(0, 0, 0, 0.5) !important;
        }

        /* Make sure particles don't cause overflow issues */
        .particles-container {
          pointer-events: none;
        }
      `}} />

      <div className="widget-embed-container">
        <ChatBubble
          apiKey={apiKey}
          agentId={agentId}
          title={widgetTitle}
          theme={theme}
          initiallyOpen={initiallyOpen}
          useSolarSystemTheme={useSolarSystemTheme}
        />
      </div>
    </>
  );
}