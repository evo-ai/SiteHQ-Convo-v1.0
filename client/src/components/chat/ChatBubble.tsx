import { useState, useCallback, useEffect } from 'react';
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
import { MessageCircle, MicOff, Volume2, Wand2 } from 'lucide-react';

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
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const primaryColor = theme?.primary || '#5c078c';

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

  // Pulse animation for the indicator
  const pulseVariants = {
    inactive: { scale: 1, opacity: 0.7 },
    active: { 
      scale: [1, 1.2, 1], 
      opacity: [0.7, 1, 0.7],
      transition: { 
        repeat: Infinity, 
        duration: 2
      }
    }
  };

  // Wave animation for the sound wave when AI is speaking
  const SoundWave = () => (
    <div className="flex gap-[2px] items-end justify-center h-4 w-12">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ height: '30%' }}
          animate={{ height: ['30%', `${Math.random() * 70 + 30}%`, '30%'] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: i * 0.1
          }}
          className="w-1 bg-blue-500 rounded-full"
          style={{ opacity: 0.7 + (i * 0.1) }}
        />
      ))}
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {conversation.status !== 'connected' ? (
          <div className="flex flex-col items-end">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="mb-3 bg-white rounded-lg px-4 py-2 shadow-lg max-w-[220px]"
              style={{ 
                opacity: isHovered ? 1 : 0,
                pointerEvents: isHovered ? 'auto' : 'none',
                transform: `translateY(${isHovered ? '0px' : '10px'})`,
                transition: 'opacity 0.3s, transform 0.3s'
              }}
            >
              <p className="text-sm font-medium" style={{ color: theme?.text || '#333' }}>
                Ask me anything! I'm here to help.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative cursor-pointer group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleStartCall}
            >
              {/* Main circular button */}
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{ 
                  background: `radial-gradient(circle at 30% 30%, ${primaryColor}, ${primaryColor}DD)`,
                  boxShadow: `0 4px 20px rgba(92, 7, 140, 0.3)`
                }}
              >
                <motion.div
                  initial="inactive"
                  animate={isHovered ? "active" : "inactive"}
                  variants={pulseVariants}
                >
                  <MessageCircle className="w-6 h-6 text-white" />
                </motion.div>
              </div>
              
              {/* Pulse effect around the button */}
              <motion.div 
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0, scale: 1 }}
                animate={{ 
                  opacity: [0, 0.2, 0], 
                  scale: [1, 1.4, 1.8]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }}
                style={{ 
                  background: primaryColor,
                  zIndex: -1
                }}
              />
              
              {/* Small decorative particle elements */}
              <motion.div 
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-300"
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-blue-400"
                animate={{ 
                  y: [0, 8, 0],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="rounded-xl shadow-xl p-4 bg-white flex items-center gap-3 max-w-[280px]"
            style={{
              boxShadow: `0 10px 25px -5px rgba(92, 7, 140, 0.15), 0 8px 10px -5px rgba(92, 7, 140, 0.1)`
            }}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                background: `radial-gradient(circle at 30% 30%, ${primaryColor}, ${primaryColor}DD)`,
              }}>
                {conversation.isSpeaking ? (
                  <Wand2 className="w-5 h-5 text-white" />
                ) : (
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2
                    }}
                  >
                    <MessageCircle className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </div>
              {conversation.isSpeaking && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 rounded-full"
                />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-medium mb-1" style={{ color: primaryColor }}>
                SiteHQ Assistant
              </h3>
              
              {conversation.isSpeaking ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-600">Speaking</span>
                  <SoundWave />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600">Listening to you...</span>
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full p-0 bg-red-50 hover:bg-red-100"
              onClick={() => conversation.endSession()}
            >
              <MicOff className="w-4 h-4 text-red-500" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center text-xs text-gray-500 mt-1.5">
        Powered by Futur Nod
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
              style={{ backgroundColor: primaryColor }}
            >
              Agree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}