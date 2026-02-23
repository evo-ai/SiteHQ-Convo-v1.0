import { getAgent } from "@/config/agents";
import AgentDeployGuide from "./AgentDeployGuide";
import NotFound from "@/pages/not-found";

interface AgentDeployPageProps {
  params: { slug: string };
}

export default function AgentDeployPage({ params }: AgentDeployPageProps) {
  const agent = getAgent(params.slug);

  if (!agent) {
    return <NotFound />;
  }

  return <AgentDeployGuide agent={agent} />;
}
