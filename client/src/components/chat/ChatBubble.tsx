import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatWindow from './ChatWindow';

interface ChatBubbleProps {
  apiKey?: string;
  agentId?: string;
  theme?: {
    primary: string;
    background: string;
    text: string;
  };
}

export default function ChatBubble({ apiKey, agentId, theme }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="mb-4"
          >
            <ChatWindow onClose={() => setIsOpen(false)} apiKey={apiKey} agentId={agentId} theme={theme} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            <Button
              size="icon"
              className="w-14 h-14 rounded-full shadow-lg"
              style={{ 
                backgroundColor: theme?.primary || 'hsl(var(--primary))',
                color: theme?.text || 'hsl(var(--primary-foreground))'
              }}
              onClick={() => setIsOpen(true)}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
