# FuturNod Agent Hub

## Overview

Multi-agent platform for deploying ElevenLabs Conversational AI chat widgets to client websites. Each prospect/client gets their own agent with a dedicated landing page, chat widget, and deployment package.

## Architecture

### Directory Structure

```
client/src/
  config/
    agents.ts           # Central agent registry (add new agents here)
    avatars.ts          # Avatar designs & theme variants
  components/
    avatars/            # Future avatar components
    chat/
      ChatBubble.tsx    # Solar System Bubble avatar (main widget)
    conversation/
      ConversationFlow.tsx  # Analytics visualization
    SiteHQChatController.jsx  # Web component controller
    ui/                 # shadcn UI components
  pages/
    agents/
      AgentLandingPage.tsx   # Reusable landing page template
      AgentDeployGuide.tsx   # Reusable deployment guide template
      AgentPage.tsx          # Route handler for /agents/:slug
      AgentDeployPage.tsx    # Route handler for /agents/:slug/deploy
    admin/              # Admin auth pages
    analytics.tsx       # Analytics dashboard
    demo.tsx            # Agent hub/directory (home page)
    widget-embed.tsx    # Standalone widget embed page
    standalone-widget-docs.tsx  # Widget integration docs
    not-found.tsx       # 404 page
server/
  routes.ts             # Express API routes
  auth.ts               # Admin authentication
  chat.ts               # WebSocket chat handler
  vite.ts               # Vite dev server (DO NOT MODIFY)
db/
  schema.ts             # Drizzle database schema
  index.ts              # Database connection
docs/
  README.md             # Documentation index / map
  process/
    new-agent-setup.md  # Step-by-step guide for adding new agents
  agents/
    sitehq.md           # SiteHQ agent documentation
    futurnod.md         # FuturNod agent documentation
  avatars/
    solar-system-bubble.md  # Solar System Bubble avatar design spec & integrity rules
```

### Key Concepts

- **Agents**: Each client/prospect gets an agent config in `client/src/config/agents.ts`. Routes are dynamic — no code changes needed beyond the config.
- **Avatars**: Chat bubble designs. Currently one avatar (Solar System Bubble) with multiple color theme variants. New avatars can be added.
- **Theme Variants**: Color palettes applied to avatar designs. Theme assignment is user-controlled — a future UI will allow designing and tweaking themes per agent.
- **Deploy Guides**: Each agent automatically gets a deployment guide at `/agents/{slug}/deploy` with pre-filled embed codes.

### Adding a New Agent

See `docs/process/new-agent-setup.md` for the full process. Quick steps:
1. Create agent in ElevenLabs
2. Add config entry in `client/src/config/agents.ts`
3. Create doc at `docs/agents/{slug}.md`
4. Done — landing page and deploy guide are auto-generated

### Routes

| Route | Purpose |
|-------|---------|
| `/` | Agent Hub — lists all deployed agents |
| `/agents/:slug` | Agent landing page |
| `/agents/:slug/deploy` | Agent deployment guide |
| `/widget-embed` | Standalone widget embed (for iframes) |
| `/widget-docs` | Widget integration documentation |
| `/admin/login` | Admin login |
| `/admin/analytics` | Analytics dashboard |

### Deployed Agents

| Agent | Slug | Agent ID | Primary Color | Theme Variant |
|-------|------|----------|--------------|---------------|
| SiteHQ | sitehq | KRGVz0f5HAU0E7u6BbA5 | #5c078c | Purple Cosmos |
| Nod for FuturNod | futurnod | x8uXlbP4xF2fnv352D7P | #F95638 | Orange Fire |

## Recent Changes

- **2026-02-23**: Major refactor — cleaned up dead code, created agent registry system, avatar config system, reusable landing page and deploy guide components, structured docs directory. Added FuturNod agent.
- **2026-02-23**: Restored chat bubble CSS overrides from deleted styles.css. Created comprehensive Solar System Bubble design reference documentation with version tracking.
- **2026-02-23**: Full documentation pass — enriched agent docs, created docs index, documented theme system architecture.

## User Preferences

- Each agent is autonomous — never modify one agent's config when working on another
- The Solar System Bubble is the flagship avatar design — NEVER modify without diffing against reference commits
- Theme colors are user-controlled — never pre-assign or change theme colors without user direction
- A future UI will be built to design and tweak themes of each avatar
- Documentation must be maintained for every agent and avatar
- Scalability is a priority — new agents should be easy to add

## Critical: Solar System Bubble Integrity

The Solar System Bubble chat widget (`client/src/components/chat/ChatBubble.tsx`) is the most important visual asset. Before ANY modification:

1. **Diff against reference**: `git diff 85a65b0 -- client/src/components/chat/ChatBubble.tsx`
2. **CSS animations reference**: `git diff fac5155 -- client/src/index.css`
3. **Full design spec**: See `docs/avatars/solar-system-bubble.md`
4. **Visual verification**: Compare against published version at sitehq-convo-ai.futurnod.com
5. **Only functional fixes allowed** — no visual/animation changes without explicit approval

## Future Plans

- **Theme Editor UI**: Visual interface for designing and tweaking avatar theme variants per agent
- **New Avatar Designs**: Additional avatar types beyond the Solar System Bubble
- **Avatar Preview**: Real-time preview of theme changes on avatars
