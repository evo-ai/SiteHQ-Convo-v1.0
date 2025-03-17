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
import { Phone, MicOff, Volume2 } from 'lucide-react';

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

  // Create an animated gradient for the avatar
  const AvatarGradient = () => (
    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-300 via-purple-100 to-green-100 avatar-gradient" />
  );

  return (
    <>
      <AnimatePresence>
        {conversation.status !== 'connected' ? (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-[280px] rounded-full shadow-xl p-4 flex items-center justify-between"
            style={{ 
              backgroundColor: theme?.background || 'white',
              color: theme?.text || 'black',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div className="flex items-center gap-3">
              <AvatarGradient />
              <h3 className="text-lg font-medium" style={{ color: theme?.text || 'black' }}>
                Have a question?
              </h3>
            </div>
            <Button
              className="rounded-full shadow-md px-4 py-2 flex items-center gap-2 min-h-10"
              style={{ 
                backgroundColor: theme?.primary || 'black',
                color: 'white'
              }}
              onClick={handleStartCall}
            >
              <Phone className="w-4 h-4" />
              <span>Start a call</span>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-[280px] rounded-full shadow-xl p-4 bg-white flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <AvatarGradient />
                {conversation.isSpeaking && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -right-1 -top-1 w-4 h-4 bg-blue-500 rounded-full"
                  />
                )}
              </div>
              <span className="font-medium">
                {conversation.isSpeaking ? (
                  <span className="text-blue-600">AI Speaking...</span>
                ) : (
                  <span className="text-green-600">Listening...</span>
                )}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-red-400 text-red-500 hover:bg-red-50"
              onClick={() => conversation.endSession()}
            >
              <MicOff className="w-4 h-4 mr-1" />
              End
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center text-xs text-gray-500 mt-1.5">
        Powered by SiteHQ Assistant
      </div>

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