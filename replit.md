# FuturNod Agent Hub

## AI Assistant Coordination

> **IMPORTANT FOR REPLIT AI**: Read `docs/HANDSHAKE.md` before making changes.
> This is a living document for coordination between AI assistants (Claude Code, Cursor, Replit AI).
> Update it after any significant work.

## Overview

Multi-agent platform for deploying ElevenLabs Conversational AI chat widgets to client websites. Each prospect/client gets their own agent with a dedicated landing page, chat widget, and deployment package.

## Architecture

### Directory Structure

```
client/src/
  config/
    agents.ts           # Central agent registry (add new agents here)
  components/
    chat/
      ChatBubble.tsx    # Solar System Bubble avatar (main app)
    conversation/
      ConversationFlow.tsx  # Analytics visualization
    ui/                 # shadcn UI components (trimmed to only used ones)
  widget/               # Embeddable widget (Shadow DOM + Preact)
    index.tsx           # Entry point — Shadow DOM injection
    ChatBubble.tsx      # Preact version of ChatBubble
    useConversation.ts  # Custom hook for @11labs/client
    styles.css          # All widget CSS (injected into Shadow DOM)
    types.ts            # TypeScript interfaces
  pages/
    agents/
      AgentLandingPage.tsx   # Reusable landing page template
      AgentDeployGuide.tsx   # Reusable deployment guide template
      AgentPage.tsx          # Route handler for /agents/:slug
      AgentDeployPage.tsx    # Route handler for /agents/:slug/deploy
    admin/              # Admin auth pages
    analytics.tsx       # Analytics dashboard
    demo.tsx            # Agent hub/directory (home page)
    widget-embed.tsx    # Standalone widget embed page (legacy iframe)
    standalone-widget-docs.tsx  # Widget integration docs
    not-found.tsx       # 404 page
  hooks/
    use-toast.ts        # Toast notification hook
  types/
    dagre.d.ts          # Type declarations for dagre library
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
  HANDSHAKE.md          # AI assistant coordination (living doc)
  overview/             # Platform philosophy & vision
  architecture/         # System architecture docs
  process/
    new-agent-setup.md  # Step-by-step guide for adding new agents
  agents/
    sitehq.md           # SiteHQ agent documentation
    futurnod.md         # FuturNod agent documentation
  avatars/
    solar-system-bubble.md  # Solar System Bubble avatar design spec & integrity rules
  deployment/           # Client-facing deployment guides
  roadmap/              # Future feature planning
  dev/                  # Development change logs
widget.vite.config.ts   # Vite config for widget bundle (separate from main app)
dist/widget/            # Built widget output
  convo-widget.js       # Self-contained widget (~16KB gzipped)
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
| `/convo-widget.js` | Embeddable widget script (Shadow DOM) |
| `/widget-embed` | Legacy iframe widget (backup) |
| `/widget-docs` | Widget integration documentation |
| `/admin/login` | Admin login |
| `/admin/analytics` | Analytics dashboard |

### Deployed Agents

| Agent | Slug | Agent ID | Primary Color | Theme Variant |
|-------|------|----------|--------------|---------------|
| SiteHQ | sitehq | KRGVz0f5HAU0E7u6BbA5 | #5c078c | Purple Cosmos |
| Nod for FuturNod | futurnod | x8uXlbP4xF2fnv352D7P | #F95638 | Orange Fire |

## Recent Changes

- **2026-02-24**: Widget embed redesign — Replaced iframe with Shadow DOM + Preact injection. Eliminates white card problem, ~16KB bundle. See `docs/dev/2026-02-24-widget-embed-redesign.md`.
- **2026-02-24**: Added AI coordination system — Created `docs/HANDSHAKE.md` (living doc), `CLAUDE.md`, `.cursorrules` for seamless handoffs between AI assistants.
- **2026-02-24**: Production hardening — removed 39 unused files, fixed 5 security issues (hardcoded API keys moved to env vars, cookie secret required, token leak removed), fixed 14 type safety violations, removed 30+ debug console statements, extracted duplicate code. See `docs/dev/2026-02-24-codebase-cleanup.md` for details.
- **2026-02-24**: Fixed widget embed system — resolved WebSocket localhost errors, iframe sizing issues, positioning problems. See `docs/dev/2026-02-24-widget-embed-fixes.md` for details.
- **2026-02-24**: Created comprehensive documentation — philosophy, architecture, roadmap. See `docs/README.md` for full index.
- **2026-02-23**: Major refactor — cleaned up dead code, created agent registry system, reusable landing page and deploy guide components, structured docs directory. Added FuturNod agent.

## Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `COOKIE_SECRET` | Session encryption (server crashes without it) |
| `DATABASE_URL` | PostgreSQL connection string |
| `WIDGET_API_KEYS` | Comma-separated valid API keys for widget auth (server-side) |
| `VITE_WIDGET_API_KEY` | Widget API key for client-side use |
| `ELEVENLABS_API_KEY` | Optional — for private ElevenLabs agents. Falls back to public WebSocket URL |

## User Preferences

- Each agent is autonomous — never modify one agent's config when working on another
- The Solar System Bubble is the flagship avatar design — NEVER modify without diffing against reference commits
- Theme colors are user-controlled — never pre-assign or change theme colors without user direction
- A future UI will be built to design and tweak themes of each avatar
- Documentation must be maintained for every agent and avatar
- Scalability is a priority — new agents should be easy to add
- ElevenLabs is a backend supplier — NEVER expose "ElevenLabs" in any client-facing pages, deploy guides, embed code, or widget UI. Use generic terms like "agent ID" instead
- All widget naming uses the generic `convo-` prefix — never use client-specific prefixes in shared widget code

## Critical: Solar System Bubble Integrity

The Solar System Bubble chat widget (`client/src/components/chat/ChatBubble.tsx`) is the most important visual asset. Before ANY modification:

1. **Diff against reference**: `git diff 85a65b0 -- client/src/components/chat/ChatBubble.tsx`
2. **CSS animations reference**: `git diff fac5155 -- client/src/index.css`
3. **Full design spec**: See `docs/avatars/solar-system-bubble.md`
4. **Visual verification**: Compare against published version at convo-ai.futurnod.com
5. **Only functional fixes allowed** — no visual/animation changes without explicit approval

## Future Plans

See `docs/roadmap/future-features.md` for the complete product roadmap.

**Phase 1 (Q2 2026)**: Theme Editor UI — Visual interface for designing and tweaking avatar theme variants per agent
**Phase 2 (Q3 2026)**: Multiple Avatar Designs — Additional avatar types beyond the Solar System Bubble
**Phase 3 (Q4 2026)**: Self-Service Agent Creation — Allow clients to create agents without FuturNod intervention
**Phase 4 (Q1 2027)**: Advanced Analytics — Conversation intelligence and actionable insights
**Phase 5 (Q2 2027)**: Enterprise Features — Multi-tenant, white-label, API access
**Phase 6 (Q3 2027)**: AI Enhancement — Conversation coaching, A/B testing, multi-language

## Comprehensive Documentation

For detailed documentation, see `docs/README.md`:

- **AI Coordination**: `docs/HANDSHAKE.md` (living doc for AI assistants)
- **Philosophy & Vision**: `docs/overview/philosophy.md`
- **System Architecture**: `docs/architecture/system-architecture.md`
- **Product Roadmap**: `docs/roadmap/future-features.md`
- **Widget Architecture**: `docs/dev/2026-02-24-widget-embed-redesign.md`
- **Development Work**: `docs/dev/` (bug fixes, feature implementations)
