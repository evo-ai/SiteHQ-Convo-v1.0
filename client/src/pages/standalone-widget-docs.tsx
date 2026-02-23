import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function StandaloneWidgetDocs() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('script');
  
  const baseUrl = window.location.origin;
  
  const scriptCode = `<script 
  src="${baseUrl}/convo-widget.js" 
  data-auto-init="true" 
  data-api-key="YOUR_API_KEY" 
  data-agent-id="YOUR_AGENT_ID"
  data-theme='{"primary":"#F95638","background":"#ffffff","text":"#333333"}'>
</script>`;

  const customElementCode = `<!-- Step 1: Include the script -->
<script src="${baseUrl}/convo-widget.js"></script>

<!-- Step 2: Add the custom element anywhere on your page -->
<convo-chat-widget 
  api-key="YOUR_API_KEY"
  agent-id="YOUR_AGENT_ID"
  theme='{"primary":"#F95638","background":"#ffffff","text":"#333333"}'
  dark-mode="false">
</convo-chat-widget>`;

  const iframeCode = `<iframe 
  src="${baseUrl}/widget-embed?apiKey=YOUR_API_KEY&agentId=YOUR_AGENT_ID&theme=%7B%22primary%22%3A%22%23F95638%22%2C%22background%22%3A%22%23ffffff%22%2C%22text%22%3A%22%23333333%22%7D" 
  style="width: 400px; height: 600px; position: fixed; bottom: 20px; right: 20px; border: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 9999;" 
  allow="microphone">
</iframe>`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Conversational AI Widget Integration</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Add conversational AI capabilities to your website with our easy-to-integrate widget.
        </p>
      </div>

      <Tabs defaultValue="script" className="mb-10" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="script">Script Tag</TabsTrigger>
          <TabsTrigger value="element">Custom Element</TabsTrigger>
          <TabsTrigger value="iframe">IFrame Embed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="script">
          <Card className="relative">
            <CardHeader>
              <CardTitle>Script Tag Integration</CardTitle>
              <CardDescription>
                Add a single script tag to your website. This is the easiest way to integrate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                <code className="text-sm font-mono">{scriptCode}</code>
              </pre>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(scriptCode)}
                className="mt-4"
              >
                {copied && activeTab === 'script' ? 'Copied!' : 'Copy Code'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="element">
          <Card>
            <CardHeader>
              <CardTitle>Custom Element Integration</CardTitle>
              <CardDescription>
                More control over widget placement and initialization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                <code className="text-sm font-mono">{customElementCode}</code>
              </pre>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(customElementCode)}
                className="mt-4"
              >
                {copied && activeTab === 'element' ? 'Copied!' : 'Copy Code'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="iframe">
          <Card>
            <CardHeader>
              <CardTitle>IFrame Integration</CardTitle>
              <CardDescription>
                Fully isolated widget without shadow DOM or custom elements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                <code className="text-sm font-mono">{iframeCode}</code>
              </pre>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(iframeCode)}
                className="mt-4"
              >
                {copied && activeTab === 'iframe' ? 'Copied!' : 'Copy Code'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Options</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>api-key</strong>: Your API key for authentication</li>
              <li><strong>agent-id</strong>: Your agent's unique ID</li>
              <li><strong>theme</strong>: JSON object with color settings</li>
              <li><strong>dark-mode</strong>: Enable dark mode by default</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Theme Customization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Customize the appearance with a JSON theme object:</p>
            <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
              <code className="text-sm font-mono">{`{
  "primary": "#F95638",  // Primary color
  "background": "#ffffff",  // Background color
  "text": "#333333"  // Text color
}`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-4">
            <li>
              <strong>Get your API Key and Agent ID</strong>
              <p className="text-gray-600 mt-1">Contact the FuturNod team to get your API key and agent ID.</p>
            </li>
            <li>
              <strong>Choose an integration method</strong>
              <p className="text-gray-600 mt-1">Select the integration method that best fits your needs.</p>
            </li>
            <li>
              <strong>Add the widget to your site</strong>
              <p className="text-gray-600 mt-1">Copy the code and add it to your website.</p>
            </li>
            <li>
              <strong>Customize the appearance</strong>
              <p className="text-gray-600 mt-1">Adjust the theme to match your brand.</p>
            </li>
          </ol>
          
          <div className="mt-6">
            <Button
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
              onClick={() => window.open('/widget-demo', '_blank')}
            >
              View Live Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
