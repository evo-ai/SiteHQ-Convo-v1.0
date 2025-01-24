import { useState, useCallback } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useConversation } from '@11labs/react';

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

export default function ChatBubble({ 
  apiKey = process.env.ELEVENLABS_API_KEY, 
  agentId = "FnTVTPK2FfEkaktJIFFx", 
  title = "AI Assistant", 
  theme 
}: ChatBubbleProps) {
  const [showTerms, setShowTerms] = useState(false);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      toast({
        title: "Connected",
        description: "Successfully connected to AI assistant"
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      toast({
        title: "Disconnected",
        description: "The connection to the AI assistant was closed"
      });
    },
    onError: (error: Error) => {
      console.error('Conversation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect to the AI assistant",
        variant: "destructive"
      });
    },
    onMessage: (message: unknown) => console.log('Message:', message)
  });

  const handleStartCall = () => {
    setShowTerms(true);
  };

  const handleAcceptTerms = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation using the signed URL approach
      const response = await fetch('/api/get-signed-url', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }

      const { signedUrl } = await response.json();

      // Start the conversation with the signed URL
      await conversation.startSession({
        signedUrl
      });

      setShowTerms(false);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start conversation. Please check your permissions and try again.",
        variant: "destructive"
      });
    }
  }, [apiKey, conversation, toast]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {conversation.status !== 'connected' ? (
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
                {conversation.isSpeaking ? 'AI is speaking - Talk to interrupt' : 'Listening to you'}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => conversation.endSession()}
              >
                End Call
              </Button>
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