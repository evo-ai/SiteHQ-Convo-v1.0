import ChatBubble from '@/components/chat/ChatBubble';

export default function Demo() {
  return (
    <>
      {/* Only keep the demo chat bubble */}
      <div className="fixed bottom-5 right-5 z-50">
        <ChatBubble
          apiKey="demo-key"
          agentId="demo-agent"
          title="SiteHQ Assistant"
          theme={{
            primary: '#ff5733', /* SiteHQ Purple */
            background: '#ffffff', /* White container */
            text: '#333333' /* Dark text */
          }}
        />
      </div>
    </>
  );
}