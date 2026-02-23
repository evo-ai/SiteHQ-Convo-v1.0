import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChatBubble from "@/components/chat/ChatBubble";
import type { AgentConfig } from "@/config/agents";
import { Mic, Shield, Zap, Globe } from "lucide-react";

interface AgentLandingPageProps {
  agent: AgentConfig;
}

export default function AgentLandingPage({ agent }: AgentLandingPageProps) {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <section className="container mx-auto pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1
              className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r"
              style={{
                backgroundImage: `linear-gradient(to right, ${agent.theme.primary}, ${agent.theme.primary}AA)`,
              }}
            >
              {agent.name}
            </h1>
            <p className="text-xl text-gray-600 mb-10">{agent.description}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href={`/agents/${agent.slug}/deploy`}>
                <Button
                  size="lg"
                  style={{ backgroundColor: agent.theme.primary }}
                >
                  Deployment Guide
                </Button>
              </Link>
              <a
                href={`/widget-embed?agentId=${agent.agentId}&apiKey=${agent.apiKey}&theme=${encodeURIComponent(JSON.stringify(agent.theme))}&title=${encodeURIComponent(agent.widgetTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline">
                  Try Live Demo
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section className="container mx-auto py-16 px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="text-center">
                <Mic
                  className="w-10 h-10 mx-auto mb-2"
                  style={{ color: agent.theme.primary }}
                />
                <CardTitle className="text-lg">Voice Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm">
                  Natural voice-based AI conversations powered by ElevenLabs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Shield
                  className="w-10 h-10 mx-auto mb-2"
                  style={{ color: agent.theme.primary }}
                />
                <CardTitle className="text-lg">Secure & Private</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm">
                  End-to-end secure communication with user consent management.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Zap
                  className="w-10 h-10 mx-auto mb-2"
                  style={{ color: agent.theme.primary }}
                />
                <CardTitle className="text-lg">Easy Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm">
                  Add to any website with a single script tag or iframe embed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Globe
                  className="w-10 h-10 mx-auto mb-2"
                  style={{ color: agent.theme.primary }}
                />
                <CardTitle className="text-lg">Custom Branding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center text-sm">
                  Fully customizable themes to match your brand identity.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto py-16 px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Quick Integration
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Script Tag</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Easiest integration — add a single script tag to your website.
                </p>
                <Link href={`/agents/${agent.slug}/deploy`}>
                  <Button
                    variant="link"
                    className="p-0"
                    style={{ color: agent.theme.primary }}
                  >
                    View code
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Custom Element</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  More control over widget placement and configuration.
                </p>
                <Link href={`/agents/${agent.slug}/deploy`}>
                  <Button
                    variant="link"
                    className="p-0"
                    style={{ color: agent.theme.primary }}
                  >
                    View code
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">IFrame Embed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Fully isolated widget for maximum compatibility.
                </p>
                <Link href={`/agents/${agent.slug}/deploy`}>
                  <Button
                    variant="link"
                    className="p-0"
                    style={{ color: agent.theme.primary }}
                  >
                    View code
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
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
