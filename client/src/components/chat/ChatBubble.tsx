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
import { Mic, MicOff, Volume2 } from 'lucide-react';

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
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
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
      await navigator.mediaDevices.getUserMedia({ audio: true });
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
    <>
      <AnimatePresence>
        {conversation.status !== 'connected' ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="w-[300px] rounded-lg shadow-lg p-6 chat-bubble"
            style={{ 
              backgroundColor: theme?.background || 'hsl(var(--primary))',
              color: theme?.text || 'white'
            }}
          >
            <div className="flex flex-col items-start gap-4">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Need help?
              </h3>
              <Button
                size="lg"
                className="rounded-full shadow-lg text-base py-6 px-8 gap-2"
                style={{ 
                  backgroundColor: theme?.primary || 'hsl(var(--primary))',
                  color: theme?.text || 'hsl(var(--primary-foreground))'
                }}
                onClick={handleStartCall}
              >
                <Mic className="w-5 h-5" />
                Start a call
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="w-[380px] rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{
                    scale: conversation.isSpeaking ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    repeat: conversation.isSpeaking ? Infinity : 0,
                    duration: 1.5,
                  }}
                  className={`flex gap-1 items-center ${
                    conversation.isSpeaking ? 'w-16' : 'w-4'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${
                    conversation.isSpeaking ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  {conversation.isSpeaking && (
                    <>
                      <div className="w-2 h-3 bg-blue-500 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-2 h-4 bg-blue-500 rounded-full animate-pulse" />
                    </>
                  )}
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-lg font-medium">
                    {conversation.isSpeaking ? (
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-5 h-5" />
                        <motion.span
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-blue-600"
                        >
                          AI Speaking - Click to Interrupt
                        </motion.span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Mic className="w-5 h-5" />
                        <span className="text-green-600">Listening to you</span>
                      </div>
                    )}
                  </span>
                </div>
              </div>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-base"
                onClick={() => conversation.endSession()}
              >
                <MicOff className="w-5 h-5" />
                End Call
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Terms and conditions</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              By clicking "Agree," and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as described in the Privacy Policy. If you do not wish to have your conversations recorded, please refrain from using this service.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTerms(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAcceptTerms}
              className="terms-agree-button"
              style={{ backgroundColor: '#5c078c' }}
            >
              Agree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}