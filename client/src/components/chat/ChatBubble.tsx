import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createChatConnection } from '@/lib/chat';

interface ChatBubbleProps {
  apiKey?: string;
  agentId?: string;
  title?: string;
  theme?: {
    primary: string;
    background: string;
    text: string;
  };
}

export default function ChatBubble({ apiKey, agentId, title = "AI Assistant", theme }: ChatBubbleProps) {
  const [showTerms, setShowTerms] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const handleStartCall = () => {
    setShowTerms(true);
  };

  const handleAcceptTerms = useCallback(() => {
    if (!apiKey || !agentId) return;

    setShowTerms(false);
    setIsActive(true);

    const ws = createChatConnection(apiKey, agentId);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'status') {
        setStatus(data.status);
      }
    };

    ws.onclose = () => {
      setIsActive(false);
      setStatus('idle');
      setSocket(null);
    };

    setSocket(ws);
  }, [apiKey, agentId]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {!isActive ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <div className="flex flex-col items-end gap-2">
              <div className="bg-white rounded-lg shadow-lg p-2 mb-2">
                <span className="text-sm font-medium">{title}</span>
              </div>
              <Button
                size="default"
                className="rounded-full shadow-lg"
                style={{ 
                  backgroundColor: theme?.primary || 'hsl(var(--primary))',
                  color: theme?.text || 'hsl(var(--primary-foreground))'
                }}
                onClick={handleStartCall}
              >
                Start a call
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="bg-white rounded-lg shadow-lg p-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium">
                {status === 'listening' ? 'Listening' : status === 'speaking' ? 'Talk to interrupt' : 'Ready'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terms and conditions</DialogTitle>
            <DialogDescription>
              By clicking "Agree," and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as described in the Privacy Policy. If you do not wish to have your conversations recorded, please refrain from using this service.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTerms(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcceptTerms}>
              Agree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}