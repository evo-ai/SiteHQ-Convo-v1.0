import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Copy, Check } from "lucide-react";
import type { AgentConfig } from "@/config/agents";

interface AgentDeployGuideProps {
  agent: AgentConfig;
}

export default function AgentDeployGuide({ agent }: AgentDeployGuideProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const baseUrl = window.location.origin;

  const scriptCode = `<script 
  src="${baseUrl}/convo-widget.js" 
  data-auto-init="true" 
  data-api-key="${agent.apiKey}" 
  data-agent-id="${agent.agentId}"
  data-theme='${JSON.stringify(agent.theme)}'>
</script>`;

  const customElementCode = `<!-- Step 1: Include the script -->
<script src="${baseUrl}/convo-widget.js"></script>

<!-- Step 2: Add the custom element -->
<convo-chat-widget 
  api-key="${agent.apiKey}"
  agent-id="${agent.agentId}"
  title="${agent.widgetTitle}"
  theme='${JSON.stringify(agent.theme)}'
  dark-mode="false">
</convo-chat-widget>`;

  const iframeCode = `<iframe 
  src="${baseUrl}/widget-embed?apiKey=${agent.apiKey}&agentId=${agent.agentId}&theme=${encodeURIComponent(JSON.stringify(agent.theme))}&title=${encodeURIComponent(agent.widgetTitle)}" 
  style="width: 400px; height: 600px; position: fixed; bottom: 20px; right: 20px; border: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 9999;" 
  allow="microphone">
</iframe>`;

  const copyToClipboard = (text: string, tab: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Link href={`/agents/${agent.slug}`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {agent.name}
        </Button>
      </Link>

      <div className="text-center mb-10">
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: agent.theme.primary }}
        >
          {agent.name} — Deployment Guide
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Follow the instructions below to add the {agent.name} chat widget to
          your website.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Agent Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Agent Name:</span>
              <p className="font-mono">{agent.name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Agent ID:</span>
              <p className="font-mono">{agent.agentId}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Widget Title:</span>
              <p className="font-mono">{agent.widgetTitle}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Primary Color:</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: agent.theme.primary }}
                />
                <p className="font-mono">{agent.theme.primary}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="script" className="mb-10">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="script">Script Tag</TabsTrigger>
          <TabsTrigger value="element">Custom Element</TabsTrigger>
          <TabsTrigger value="iframe">IFrame</TabsTrigger>
        </TabsList>

        <TabsContent value="script">
          <Card>
            <CardHeader>
              <CardTitle>Script Tag Integration</CardTitle>
              <CardDescription>
                Add a single script tag to your website. This is the easiest way
                to integrate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
                <code>{scriptCode}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(scriptCode, "script")}
                className="mt-4"
              >
                {copiedTab === "script" ? (
                  <>
                    <Check className="w-4 h-4 mr-1" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" /> Copy Code
                  </>
                )}
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
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
                <code>{customElementCode}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(customElementCode, "element")}
                className="mt-4"
              >
                {copiedTab === "element" ? (
                  <>
                    <Check className="w-4 h-4 mr-1" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" /> Copy Code
                  </>
                )}
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
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
                <code>{iframeCode}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(iframeCode, "iframe")}
                className="mt-4"
              >
                {copiedTab === "iframe" ? (
                  <>
                    <Check className="w-4 h-4 mr-1" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" /> Copy Code
                  </>
                )}
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
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>api-key</strong>: Your API key for authentication
              </li>
              <li>
                <strong>agent-id</strong>: Your agent's unique ID
              </li>
              <li>
                <strong>theme</strong>: JSON object with color settings
              </li>
              <li>
                <strong>dark-mode</strong>: Enable dark mode by default
              </li>
              <li>
                <strong>title</strong>: Widget title displayed in the header
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme Customization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm">
              Customize the appearance with a JSON theme object:
            </p>
            <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
              <code>{JSON.stringify(agent.theme, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
