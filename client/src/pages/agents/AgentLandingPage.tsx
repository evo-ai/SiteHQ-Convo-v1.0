import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import ChatBubble from "@/components/chat/ChatBubble";
import type { AgentConfig } from "@/config/agents";
import { Clock, Activity, Database, Smile, Copy, Check } from "lucide-react";

interface AgentLandingPageProps {
  agent: AgentConfig;
}

export default function AgentLandingPage({ agent }: AgentLandingPageProps) {
  const [activeTab, setActiveTab] = useState<"script" | "iframe">("script");
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const scriptCode = `<script src="${baseUrl}/sitehq-widget.js"></script>\n<sitehq-convowidget agent-id="${agent.agentId}"></sitehq-convowidget>`;

  const iframeCode = `<iframe\n    src="${baseUrl}/embed?agentId=${agent.agentId}"\n    style="width: 400px; height: 600px; position: fixed; bottom: 20px;\n           right: 20px; border: none; border-radius: 12px;\n           box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 9999;"\n    allow="microphone"></iframe>`;

  const copyCode = () => {
    const code = activeTab === "script" ? scriptCode : iframeCode;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const features = [
    {
      icon: Clock,
      title: "Low Latency",
      description:
        "High-quality voices with ultra-low latency for seamless interactions",
    },
    {
      icon: Activity,
      title: "Monitoring and Evaluation",
      description:
        "Full transcripts, recordings, and automated evaluation to monitor agent performance",
    },
    {
      icon: Database,
      title: "Knowledge Base Integration",
      description:
        "Seamlessly integrate and leverage your existing knowledge base",
    },
    {
      icon: Smile,
      title: "Emotion Detection",
      description:
        "Advanced emotion detection and responsive interaction capabilities",
    },
  ];

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: "white" }}>
        <div className="text-center py-8">
          {agent.logoUrl ? (
            <div className="max-w-[300px] mx-auto mb-4">
              <img
                src={agent.logoUrl}
                alt={`${agent.name} Logo`}
                className="w-full h-auto"
              />
            </div>
          ) : (
            <h2
              className="text-3xl font-bold mb-2"
              style={{ color: agent.theme.primary }}
            >
              {agent.name}
            </h2>
          )}
          <h1
            className="text-2xl md:text-3xl font-medium"
            style={{ color: agent.theme.primary }}
          >
            {agent.tagline}
          </h1>
        </div>

        <div
          className="py-12 px-4"
          style={{
            backgroundColor: agent.theme.primary,
            minHeight: "calc(100vh - 200px)",
          }}
        >
          <div className="max-w-[1200px] mx-auto">
            <h1 className="text-center text-white text-3xl md:text-4xl font-bold mb-12">
              Conversational AI Widget Demo
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="rounded-2xl p-8 text-left transition-transform hover:-translate-y-1"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <feature.icon className="w-8 h-8 text-white mb-3" strokeWidth={1.5} />
                  <h3 className="text-white text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <div
              className="rounded-2xl p-8"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <h2 className="text-white text-2xl font-bold mb-6">
                Implementation Guide
              </h2>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setActiveTab("script")}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                  style={{
                    background:
                      activeTab === "script"
                        ? "rgba(255, 255, 255, 0.3)"
                        : "rgba(255, 255, 255, 0.15)",
                  }}
                >
                  Script Tag
                </button>
                <button
                  onClick={() => setActiveTab("iframe")}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                  style={{
                    background:
                      activeTab === "iframe"
                        ? "rgba(255, 255, 255, 0.3)"
                        : "rgba(255, 255, 255, 0.15)",
                  }}
                >
                  IFrame
                </button>
              </div>
              <div className="relative">
                <pre
                  className="rounded-lg p-6 overflow-x-auto"
                  style={{ background: "rgba(0, 0, 0, 0.5)" }}
                >
                  <code className="text-white text-sm font-mono whitespace-pre">
                    {activeTab === "script" ? scriptCode : iframeCode}
                  </code>
                </pre>
                <button
                  onClick={copyCode}
                  className="absolute top-3 right-3 p-2 rounded-md transition-colors"
                  style={{ background: "rgba(255, 255, 255, 0.15)" }}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-300" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/70" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link href={`/agents/${agent.slug}/deploy`}>
                <Button
                  size="lg"
                  className="text-white border-white/30 hover:bg-white/10"
                  variant="outline"
                >
                  Full Deployment Guide
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-5 right-5 z-50">
        <ChatBubble
          apiKey={agent.apiKey}
          agentId={agent.agentId}
          title={agent.widgetTitle}
          theme={agent.theme}
          useSolarSystemTheme={true}
        />
      </div>
    </>
  );
}
