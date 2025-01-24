import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Message from './Message';
import MessageInput from './MessageInput';
import { useChat } from '@/hooks/use-chat';

interface ChatWindowProps {
  onClose: () => void;
  apiKey?: string;
  agentId?: string;
  theme?: {
    primary: string;
    background: string;
    text: string;
  };
}

export default function ChatWindow({ onClose, apiKey, agentId, theme }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, connecting } = useChat(apiKey, agentId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    <Card className="w-[350px] h-[500px] flex flex-col"
      style={{
        backgroundColor: theme?.background || 'hsl(var(--background))',
        color: theme?.text || 'hsl(var(--foreground))'
      }}>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <h3 className="font-semibold">Chat Assistant</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 p-4">
        <ScrollArea className="h-full" ref={scrollRef}>
          {messages.map((msg, i) => (
            <Message key={i} message={msg} theme={theme} />
          ))}
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4">
        <MessageInput 
          onSend={sendMessage}
          disabled={connecting}
          theme={theme}
        />
      </CardFooter>
    </Card>
  );
}
