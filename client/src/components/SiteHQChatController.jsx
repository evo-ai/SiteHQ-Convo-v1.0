// client/src/components/SiteHQChatController.jsx
import React, { useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { useConversation } from '@11labs/react';

const SiteHQChatController = ({ apiKey, agentId, container }) => {
  console.log('SiteHQChatController: Component mounted with apiKey:', apiKey, 'agentId:', agentId);

  const conversation = useConversation({
    onConnect: () => console.log('SiteHQChatController: Connected to ElevenLabs'),
    onDisconnect: () => console.log('SiteHQChatController: Disconnected from ElevenLabs'),
    onError: (error) => console.error('SiteHQChatController: Conversation error:', error),
    onMessage: (message) => console.log('SiteHQChatController: Message received:', message),
  });

  console.log('SiteHQChatController: useConversation status:', conversation.status);

  const handleAcceptTerms = useCallback(async () => {
    console.log('SiteHQChatController: handleAcceptTerms called');
    try {
      console.log('SiteHQChatController: Requesting microphone access...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('SiteHQChatController: Microphone access granted');
      console.log('SiteHQChatController: Fetching signed URL...');
      const response = await fetch(`https://c46a1c6d-3d97-4f35-8e97-39c88d29fcc3-00-3jso8wzm23kek.pike.replit.dev/api/get-signed-url?agentId=${agentId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!response.ok) throw new Error('Failed to fetch signed URL');
      const { signedUrl } = await response.json();
      console.log('SiteHQChatController: Signed URL fetched:', signedUrl);
      console.log('SiteHQChatController: Starting session...');
      await conversation.startSession({ signedUrl });
      console.log('SiteHQChatController: Session started');
    } catch (error) {
      console.error('SiteHQChatController: Failed to start conversation:', error);
      document.dispatchEvent(new CustomEvent('sitehq-status-update', { detail: { status: 'error' } }));
    }
  }, [apiKey, agentId, conversation]);

  const handleDisconnect = useCallback(() => {
    console.log('SiteHQChatController: handleDisconnect called');
    conversation.endSession();
  }, [conversation]);

  // Map conversation status to widget status
  useEffect(() => {
    console.log('SiteHQChatController: Conversation status changed:', conversation.status, 'isSpeaking:', conversation.isSpeaking);
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

    console.log('SiteHQChatController: Adding event listeners for sitehq-accept-terms and sitehq-disconnect');
    document.addEventListener('sitehq-accept-terms', onAcceptTerms);
    document.addEventListener('sitehq-disconnect', onDisconnect);

    return () => {
      console.log('SiteHQChatController: Removing event listeners');
      document.removeEventListener('sitehq-accept-terms', onAcceptTerms);
      document.removeEventListener('sitehq-disconnect', onDisconnect);
    };
  }, [handleAcceptTerms, handleDisconnect]);

  return null; // This component doesn't render anything visible
};

// Initialize the React component when the web component is ready
document.addEventListener('sitehq-init', (event) => {
  console.log('SiteHQChatController: sitehq-init event received:', event.detail);
  const { apiKey, agentId, container } = event.detail;
  const root = createRoot(container);
  root.render(<SiteHQChatController apiKey={apiKey} agentId={agentId} container={container} />);
});