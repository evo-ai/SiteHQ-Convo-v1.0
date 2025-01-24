import ChatBubble from '@/components/chat/ChatBubble';

export default function Demo() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Conversational AI Widget Demo</h1>

      <div className="prose">
        <h2>Embedding Instructions</h2>
        <p>To add the widget to your website, include the following code:</p>
        <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-white">
          {`<script>
  window.CONVAI_SETTINGS = {
    apiKey: "your-api-key",
    agentId: "your-agent-id",
    title: "Your Assistant Name"
  };
</script>
<script src="https://voice-convo-widget-futur-intel.replit.app/widget.js" async></script>`}
        </pre>

        <h2>Features</h2>
        <ul>
          <li>Voice-based conversational AI using ElevenLabs technology</li>
          <li>Real-time sentiment analysis and emotion detection</li>
          <li>Customizable appearance and behavior</li>
          <li>Secure server-side API handling</li>
          <li>Real-time conversation status indicators</li>
        </ul>

        <h2>Required Parameters</h2>
        <ul>
          <li><strong>apiKey</strong>: Your ElevenLabs API key</li>
          <li><strong>agentId</strong>: Your ConvAI agent ID</li>
          <li><strong>title</strong> (optional): Custom title for the chat window</li>
        </ul>

        <h2>Custom Element Usage</h2>
        <p>Alternatively, you can use the widget as a custom element:</p>
        <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-white">
          {`<voice-convo-widget 
    agent-id="your-agent-id"
    api-key="your-api-key"
    theme='{"primary":"#0066cc","background":"#ffffff","text":"#ffffff"}'
></voice-convo-widget>`}
        </pre>
      </div>

      {/* Live Demo */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Live Demo</h2>
        <ChatBubble
          agentId="demo-agent"
          title="Demo Assistant"
          theme={{
            primary: '#0066cc',
            background: '#ffffff',
            text: '#ffffff'
          }}
        />
      </div>
    </div>
  );
}