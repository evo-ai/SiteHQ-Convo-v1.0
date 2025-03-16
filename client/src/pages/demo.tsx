import ChatBubble from '@/components/chat/ChatBubble';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Gauge, Database, HeartPulse } from 'lucide-react';

export default function Demo() {
  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="px-8 py-12 max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-12">
            <img 
              src="/assets/SiteHQ-logo.svg" 
              alt="SiteHQ Logo" 
              className="h-12 w-auto object-contain mb-8"
            />
            <h1 className="text-4xl font-bold mb-6">Conversational AI Widget Demo</h1>
          </div>

          {/* Removed Features Grid as requested */}

          {/* Implementation Guide */}
          <Card className="mb-12">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Implementation Guide</h2>
              <Tabs defaultValue="script">
                <TabsList>
                  <TabsTrigger value="script">Script Tag</TabsTrigger>
                  <TabsTrigger value="iframe">IFrame</TabsTrigger>
                </TabsList>
                <TabsContent value="script">
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-white">
                      {`<script>
  window.CONVAI_SETTINGS = {
    apiKey: "your-api-key",
    agentId: "your-agent-id",
    title: "SiteHQ Assistant"
  };
</script>
<script src="/widget.js" async></script>`}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="iframe">
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-white">
                      {`<iframe
    src="/embed?apiKey=YOUR_API_KEY&agentId=YOUR_AGENT_ID"
    style="
        width: 400px;
        height: 600px;
        position: fixed;
        bottom: 20px;
        right: 20px;
        border: none;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 9999;
    "
    allow="microphone"
></iframe>`}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Chat Bubble */}
      <div className="fixed bottom-5 right-5 z-50">
        <ChatBubble
          apiKey="demo-key"
          agentId="demo-agent"
          title="SiteHQ Assistant"
          theme={{
            primary: '#5c078c', /* SiteHQ purple */
            background: '#5c078c', /* Using the purple for background too */
            text: '#ffffff'
          }}
        />
      </div>
    </>
  );
}