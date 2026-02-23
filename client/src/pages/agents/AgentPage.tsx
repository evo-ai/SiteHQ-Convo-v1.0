import { getAgent } from "@/config/agents";
import AgentLandingPage from "./AgentLandingPage";
import NotFound from "@/pages/not-found";

interface AgentPageProps {
  params: { slug: string };
}

export default function AgentPage({ params }: AgentPageProps) {
  const agent = getAgent(params.slug);

  if (!agent) {
    return <NotFound />;
  }

  return <AgentLandingPage agent={agent} />;
}
