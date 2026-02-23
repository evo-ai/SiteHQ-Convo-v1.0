import { useEffect, useState } from 'react';
import ChatBubble from '@/components/chat/ChatBubble';

/**
 * This page is specifically for embedding the ChatBubble component in an iframe
 * It will only render the ChatBubble component with no other UI elements
 */
export default function WidgetEmbedPage() {
  const [theme, setTheme] = useState({
    primary: '#5c078c', // Updated to use the purple color
    background: '#ffffff',
    text: '#333333'
  });
  
  const [useSolarSystemTheme, setUseSolarSystemTheme] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [initiallyOpen, setInitiallyOpen] = useState(false);
  const [widgetTitle, setWidgetTitle] = useState("AI Assistant");
  
  // Get query parameters from window.location
  const getQueryParams = () => {
    // Use window.location.search to get the query string
    return new URLSearchParams(window.location.search);
  };
  
  // Parse URL parameters
  useEffect(() => {
    try {
      const searchParams = getQueryParams();
      console.log('URL parameters:', Object.fromEntries(searchParams.entries()));
      
      // Parse theme if provided
      const themeParam = searchParams.get('theme');
      if (themeParam) {
        try {
          const parsedTheme = JSON.parse(decodeURIComponent(themeParam));
          console.log('Parsed theme:', parsedTheme);
          setTheme({
            ...theme,
            ...parsedTheme
          });
        } catch (e) {
          console.error('Error parsing theme parameter:', e);
        }
      }
      
      // Check for solar system theme parameter
      const solarSystemTheme = searchParams.get('solarSystemTheme');
      if (solarSystemTheme !== null) {
        console.log('Solar system theme parameter:', solarSystemTheme);
        setUseSolarSystemTheme(solarSystemTheme === 'true');
      }
      
      // Check for dark mode parameter
      const darkModeParam = searchParams.get('darkMode');
      if (darkModeParam !== null) {
        console.log('Dark mode parameter:', darkModeParam);
        setDarkMode(darkModeParam === 'true');
      }
      
      // Check for initiallyOpen parameter
      const initiallyOpenParam = searchParams.get('initiallyOpen');
      if (initiallyOpenParam !== null) {
        console.log('Initially open parameter:', initiallyOpenParam);
        setInitiallyOpen(initiallyOpenParam === 'true');
      }
      
      // Check for title parameter
      const titleParam = searchParams.get('title');
      if (titleParam) {
        console.log('Title parameter:', titleParam);
        setWidgetTitle(titleParam);
      }
    } catch (error) {
      console.error('Error parsing URL parameters:', error);
    }
  }, []);
  
  // Get API key and agent ID from URL parameters
  const searchParams = getQueryParams();
  // Use trim() to remove any spaces that might have been included in the URL params
  const apiKey = searchParams.get('apiKey')?.trim() || 'demo-key';
  const agentId = searchParams.get('agentId')?.trim() || 'demo-agent';
  
  console.log('Using apiKey:', apiKey);
  console.log('Using agentId:', agentId);
  
  return (
    <div className="w-full h-screen flex justify-end items-end">
      <style dangerouslySetInnerHTML={{ __html: `
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: transparent;
        }
        .dark-mode-toggle {
          display: none;
        }
      `}} />
      
      {/* 
        We render the ChatBubble component with its window already open
        This way it appears as a standalone chat window in the iframe
      */}
      <div className="w-full h-full">
        <ChatBubble
          apiKey={apiKey}
          agentId={agentId}
          title={widgetTitle}
          theme={theme}
          initiallyOpen={initiallyOpen}
          useSolarSystemTheme={useSolarSystemTheme}
        />
      </div>
    </div>
  );
}