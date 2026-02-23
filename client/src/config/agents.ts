export interface AgentTheme {
  primary: string;
  background: string;
  text: string;
}

export interface AgentConfig {
  id: string;
  slug: string;
  name: string;
  description: string;
  agentId: string;
  apiKey: string;
  avatarId: string;
  theme: AgentTheme;
  widgetTitle: string;
  brandingUrl: string;
  brandingLabel: string;
  createdAt: string;
}

const agents: Record<string, AgentConfig> = {
  sitehq: {
    id: "sitehq",
    slug: "sitehq",
    name: "SiteHQ",
    description: "SiteHQ Conversational AI Assistant",
    agentId: "KRGVz0f5HAU0E7u6BbA5",
    apiKey: "sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500",
    avatarId: "solar-system",
    theme: {
      primary: "#5c078c",
      background: "#ffffff",
      text: "#333333",
    },
    widgetTitle: "SiteHQ Assistant",
    brandingUrl: "https://www.futurnod.com/",
    brandingLabel: "Futur Nod",
    createdAt: "2024-11-01",
  },
  futurnod: {
    id: "futurnod",
    slug: "futurnod",
    name: "Nod for FuturNod",
    description: "FuturNod Conversational AI Assistant",
    agentId: "x8uXlbP4xF2fnv352D7P",
    apiKey: "sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500",
    avatarId: "solar-system",
    theme: {
      primary: "#F95638",
      background: "#ffffff",
      text: "#333333",
    },
    widgetTitle: "Nod for FuturNod",
    brandingUrl: "https://www.futurnod.com/",
    brandingLabel: "Futur Nod",
    createdAt: "2026-02-23",
  },
};

export function getAgent(slug: string): AgentConfig | undefined {
  return agents[slug];
}

export function getAllAgents(): AgentConfig[] {
  return Object.values(agents);
}

export function getAgentSlugs(): string[] {
  return Object.keys(agents);
}

export default agents;
