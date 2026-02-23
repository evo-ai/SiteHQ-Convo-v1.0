import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllAgents } from "@/config/agents";
import { Bot, ArrowRight } from "lucide-react";

export default function Demo() {
  const agents = getAllAgents();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <section className="container mx-auto pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-600">
            FuturNod Agent Hub
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Deploy conversational AI agents with custom chat widgets for your
            clients
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/widget-docs">
              <Button
                size="lg"
                className="bg-purple-700 hover:bg-purple-800"
              >
                Integration Guide
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Deployed Agents
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: agent.theme.primary }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  {agent.description}
                </p>
                <div className="text-xs text-gray-400 mb-4">
                  <p>
                    Agent ID:{" "}
                    <span className="font-mono">{agent.agentId}</span>
                  </p>
                  <p>Created: {agent.createdAt}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/agents/${agent.slug}`}>
                    <Button
                      size="sm"
                      style={{ backgroundColor: agent.theme.primary }}
                    >
                      Landing Page
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                  <Link href={`/agents/${agent.slug}/deploy`}>
                    <Button size="sm" variant="outline">
                      Deploy Guide
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
