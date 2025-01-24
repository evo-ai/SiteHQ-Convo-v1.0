import { useState, useEffect } from 'react';
import { createChatConnection } from '@/lib/chat';

type Message = {
  content: string;
  role: 'user' | 'assistant';
};

export function useChat(apiKey?: string, agentId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (apiKey && agentId) {
      const ws = createChatConnection(apiKey, agentId);
      setSocket(ws);

      ws.onopen = () => {
        setConnecting(false);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          setMessages(prev => [...prev, {
            content: data.content,
            role: 'assistant'
          }]);
        }
      };

      ws.onclose = () => {
        setConnecting(true);
        setTimeout(() => {
          setSocket(createChatConnection(apiKey, agentId));
        }, 1000);
      };

      return () => {
        ws.close();
      };
    }
  }, [apiKey, agentId]);

  const sendMessage = (content: string) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'message',
        content
      }));
      setMessages(prev => [...prev, {
        content,
        role: 'user'
      }]);
    }
  };

  return {
    messages,
    sendMessage,
    connecting: connecting || !socket
  };
}
