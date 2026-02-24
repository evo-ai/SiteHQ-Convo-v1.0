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
  tagline: string;
  logoUrl?: string;
  agentId: string;
  apiKey: string;
  avatarId: string;
  theme: AgentTheme;
  widgetTitle: string;
  brandingUrl: string;
  brandingLabel: string;
  createdAt: string;
}

// API key should be provided via VITE_WIDGET_API_KEY environment variable
const WIDGET_API_KEY = import.meta.env.VITE_WIDGET_API_KEY || '';

const agents: Record<string, AgentConfig> = {
  sitehq: {
    id: "sitehq",
    slug: "sitehq",
    name: "SiteHQ",
    description: "SiteHQ Conversational AI Assistant",
    tagline: "Australia's Leading Site Solutions Provider",
    logoUrl: "/SiteHQ-logo.png",
    agentId: "KRGVz0f5HAU0E7u6BbA5",
    apiKey: WIDGET_API_KEY,
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
    tagline: "Intelligent Conversational AI Solutions",
    agentId: "x8uXlbP4xF2fnv352D7P",
    apiKey: WIDGET_API_KEY,
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
