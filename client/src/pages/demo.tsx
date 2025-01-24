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
<script src="/widget.js" async></script>`}
        </pre>

        <h2>Features</h2>
        <ul>
          <li>Voice-based conversational AI using ElevenLabs API</li>
          <li>Customizable appearance</li>
          <li>Terms and conditions compliance</li>
          <li>Real-time conversation status indicators</li>
        </ul>
      </div>

      <ChatBubble
        apiKey="demo-key"
        agentId="demo-agent"
        title="FuturSurvey"
        theme={{
          primary: '#0066cc',
          background: '#ffffff',
          text: '#ffffff'
        }}
      />
    </div>
  );
}