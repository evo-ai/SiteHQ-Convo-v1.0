import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  theme?: {
    primary: string;
    background: string;
    text: string;
  };
}

export default function MessageInput({ onSend, disabled, theme }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1"
      />
      <Button 
        type="submit" 
        size="icon"
        disabled={disabled || !message.trim()}
        style={theme ? {
          backgroundColor: theme.primary,
          color: theme.text
        } : undefined}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
