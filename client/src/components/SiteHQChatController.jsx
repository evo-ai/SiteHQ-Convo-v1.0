// client/src/components/SiteHQChatController.jsx
import React, { useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { useConversation } from '@11labs/react';

const SiteHQChatController = ({ apiKey, agentId, container }) => {
  const conversation = useConversation({
    onConnect: () => console.log('Connected to ElevenLabs'),
    onDisconnect: () => console.log('Disconnected from ElevenLabs'),
    onError: (error) => console.error('Conversation error:', error),
    onMessage: (message) => console.log('Message:', message),
  });

  const handleAcceptTerms = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const response = await fetch(`https://c46a1c6d-3d97-4f35-8e97-39c88d29fcc3-00-3jso8wzm23kek.pike.replit.dev/api/get-signed-url?agentId=${agentId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!response.ok) throw new Error('Failed to fetch signed URL');
      const { signedUrl } = await response.json();
      await conversation.startSession({ signedUrl });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      document.dispatchEvent(new CustomEvent('sitehq-status-update', { detail: { status: 'error' } }));
    }
  }, [apiKey, agentId, conversation]);

  const handleDisconnect = useCallback(() => {
    conversation.endSession();
  }, [conversation]);

  // Map conversation status to widget status
  useEffect(() => {
    let status = 'disconnected';
    if (conversation.status === 'connected') {
      status = conversation.isSpeaking ? 'speaking' : 'listening';
    } else if (conversation.status === 'connecting') {
      status = 'thinking';
    }
    document.dispatchEvent(new CustomEvent('sitehq-status-update', { detail: { status } }));
  }, [conversation.status, conversation.isSpeaking]);

  // Listen for events from the web component
  useEffect(() => {
    const onAcceptTerms = () => handleAcceptTerms();
    const onDisconnect = () => handleDisconnect();

    document.addEventListener('sitehq-accept-terms', onAcceptTerms);
    document.addEventListener('sitehq-disconnect', onDisconnect);

    return () => {
      document.removeEventListener('sitehq-accept-terms', onAcceptTerms);
      document.removeEventListener('sitehq-disconnect', onDisconnect);
    };
  }, [handleAcceptTerms, handleDisconnect]);

  return null; // This component doesn't render anything visible
};

// Initialize the React component when the web component is ready
document.addEventListener('sitehq-init', (event) => {
  const { apiKey, agentId, container } = event.detail;
  const root = createRoot(container);
  root.render(<SiteHQChatController apiKey={apiKey} agentId={agentId} container={container} />);
});