import { cn } from '@/lib/utils';

interface MessageProps {
  message: {
    content: string;
    role: 'user' | 'assistant';
  };
  theme?: {
    primary: string;
    background: string;
    text: string;
  };
}

export default function Message({ message, theme }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "rounded-lg px-4 py-2 max-w-[80%]",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted",
      )}
      style={isUser && theme ? {
        backgroundColor: theme.primary,
        color: theme.text
      } : undefined}>
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
}
