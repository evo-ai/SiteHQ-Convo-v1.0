import { useState, useRef, useCallback } from 'preact/hooks';
import { Conversation } from '@11labs/client';
import type { ConversationStatus, ConversationCallbacks, ConversationState } from './types';

export function useConversation(callbacks: ConversationCallbacks = {}): ConversationState {
  const [status, setStatus] = useState<ConversationStatus>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const conversationRef = useRef<Conversation | null>(null);

  const startSession = useCallback(async ({ signedUrl }: { signedUrl: string }) => {
    try {
      setStatus('connecting');

      const conversation = await Conversation.startSession({
        signedUrl,
        onConnect: () => {
          setStatus('connected');
          callbacks.onConnect?.();
        },
        onDisconnect: () => {
          setStatus('disconnected');
          setIsSpeaking(false);
          conversationRef.current = null;
          callbacks.onDisconnect?.();
        },
        onError: (message: string) => {
          callbacks.onError?.(new Error(message));
        },
        onMessage: () => {
          callbacks.onMessage?.();
        },
        onModeChange: ({ mode }) => {
          setIsSpeaking(mode === 'speaking');
        },
        onStatusChange: ({ status: newStatus }) => {
          setStatus(newStatus);
        }
      });

      conversationRef.current = conversation;
    } catch (error) {
      setStatus('disconnected');
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [callbacks]);

  const endSession = useCallback(async () => {
    if (conversationRef.current) {
      setStatus('disconnecting');
      await conversationRef.current.endSession();
      conversationRef.current = null;
      setStatus('disconnected');
      setIsSpeaking(false);
    }
  }, []);

  return {
    status,
    isSpeaking,
    startSession,
    endSession
  };
}
