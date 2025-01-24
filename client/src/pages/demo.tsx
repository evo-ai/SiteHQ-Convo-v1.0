import ChatBubble from '@/components/chat/ChatBubble';

export default function Demo() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Chat Widget Demo</h1>
      
      <div className="prose">
        <p>This is a demo page showing the chat widget integration. The widget appears as a floating bubble in the bottom-right corner.</p>
        <h2>Features</h2>
        <ul>
          <li>Real-time chat using WebSocket</li>
          <li>Customizable appearance</li>
          <li>Smooth animations</li>
          <li>Responsive design</li>
        </ul>
      </div>

      <ChatBubble
        apiKey="demo-key"
        agentId="demo-agent"
        theme={{
          primary: '#0066cc',
          background: '#ffffff',
          text: '#ffffff'
        }}
      />
    </div>
  );
}
