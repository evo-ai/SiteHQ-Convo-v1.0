# FuturNod Agent Hub — Documentation Index

**Last Updated**: 2026-02-24

---

## AI Assistant Coordination

> **IMPORTANT**: If you are an AI assistant (Claude, Cursor, Replit AI), read the handshake document first.

| Document | Purpose |
|----------|---------|
| **[HANDSHAKE.md](HANDSHAKE.md)** | **Living doc for AI coordination — read this first** |
| [CLAUDE.md](../CLAUDE.md) | Claude Code specific instructions |
| [.cursorrules](../.cursorrules) | Cursor AI specific rules |

---

## Start Here

| Document | Purpose |
|----------|---------|
| [Philosophy & Vision](overview/philosophy.md) | Why we built this, core principles, business model |
| [System Architecture](architecture/system-architecture.md) | Technical architecture, data flow, components |
| [Future Roadmap](roadmap/future-features.md) | Planned features, phases, product vision |

---

## Quick Links

### Operational Guides

| Document | Path | Purpose |
|----------|------|---------|
| [New Agent Setup](process/new-agent-setup.md) | `docs/process/` | Step-by-step guide for adding a new agent |
| [Solar System Bubble](avatars/solar-system-bubble.md) | `docs/avatars/` | Flagship avatar design specification & integrity rules |

### Agent Documentation

| Document | Path | Purpose |
|----------|------|---------|
| [SiteHQ Agent](agents/sitehq.md) | `docs/agents/` | SiteHQ agent configuration & details |
| [FuturNod Agent](agents/futurnod.md) | `docs/agents/` | Nod for FuturNod agent configuration & details |

### Client Deployment Guides

| Document | Path | Purpose |
|----------|------|---------|
| [SiteHQ Deploy Guide](deployment/sitehq-deploy.md) | `docs/deployment/` | Client-facing deployment guide for SiteHQ dev team |
| [FuturNod Deploy Guide](deployment/futurnod-deploy.md) | `docs/deployment/` | Client-facing deployment guide for FuturNod dev team |

---

## Development Work

| Document | Date | Summary |
|----------|------|---------|
| [Widget Embed Redesign](dev/2026-02-24-widget-embed-redesign.md) | 2026-02-24 | **Implemented** — Shadow DOM + Preact widget, eliminates white card problem |
| [Codebase Cleanup](dev/2026-02-24-codebase-cleanup.md) | 2026-02-24 | Removed 39 unused files, fixed security issues, improved type safety |
| [Widget Embed Fixes](dev/2026-02-24-widget-embed-fixes.md) | 2026-02-24 | Fixed embeddable widget system (WebSocket errors, iframe sizing, positioning) |

---

## Directory Structure

```
docs/
├── README.md                           # This file — documentation index
├── HANDSHAKE.md                        # AI assistant coordination (living doc)
│
├── overview/                           # Platform overview & vision
│   └── philosophy.md                   # Philosophy, principles, business model
│
├── architecture/                       # Technical documentation
│   └── system-architecture.md          # System architecture, data flow, tech stack
│
├── roadmap/                            # Future planning
│   └── future-features.md              # Product roadmap, planned features
│
├── process/                            # Operational guides
│   └── new-agent-setup.md              # How to add a new agent (7-step guide)
│
├── avatars/                            # Avatar design specifications
│   └── solar-system-bubble.md          # Flagship avatar design spec & integrity rules
│
├── agents/                             # Internal agent docs (ElevenLabs refs OK)
│   ├── sitehq.md                       # SiteHQ agent documentation
│   └── futurnod.md                     # FuturNod agent documentation
│
├── deployment/                         # Client-facing deployment guides (NO ElevenLabs refs)
│   ├── sitehq-deploy.md                # SiteHQ deployment guide
│   └── futurnod-deploy.md              # FuturNod deployment guide
│
└── dev/                                # Development work documentation
    ├── 2026-02-24-widget-embed-redesign.md  # Shadow DOM + Preact widget (IMPLEMENTED)
    ├── 2026-02-24-codebase-cleanup.md       # Codebase cleanup & production hardening
    └── 2026-02-24-widget-embed-fixes.md     # Widget embed system fixes (superseded)
```

---

## Source Code Reference

| File | Purpose |
|------|---------|
| `client/src/config/agents.ts` | Agent registry — all agent configurations live here |
| `client/src/components/chat/ChatBubble.tsx` | Solar System Bubble component (main app) |
| `client/src/index.css` | CSS animations for chat bubble (keyframes, particles, dark mode) |
| `client/src/pages/widget-embed.tsx` | Standalone widget for iframe embedding (legacy) |
| `client/src/pages/agents/AgentLandingPage.tsx` | Reusable landing page template |
| `client/src/pages/agents/AgentDeployGuide.tsx` | Reusable deployment guide template |
| `client/src/pages/agents/AgentPage.tsx` | Route handler — `/agents/:slug` |
| `client/src/pages/agents/AgentDeployPage.tsx` | Route handler — `/agents/:slug/deploy` |
| **Widget (Preact/Shadow DOM)** | |
| `client/src/widget/index.tsx` | Widget entry point — Shadow DOM injection |
| `client/src/widget/ChatBubble.tsx` | Preact version of ChatBubble |
| `client/src/widget/styles.css` | Widget CSS (injected into Shadow DOM) |
| `client/src/widget/useConversation.ts` | Custom hook wrapping @11labs/client |
| `widget.vite.config.ts` | Vite config for widget bundle |
| `dist/widget/convo-widget.js` | Built widget (~16KB gzipped) |
| **Server** | |
| `server/routes.ts` | Server API routes (signed URL endpoint) |
| `server/index.ts` | Express server initialization |
| `db/schema.ts` | Database schema (Drizzle ORM) |

---

## How Things Connect

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CONFIGURATION                                 │
│  agents.ts ──┬── name, description, theme                           │
│              ├── ElevenLabs agent ID                                │
│              ├── widget API key                                     │
│              └── avatar selection                                   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTO-GENERATED ROUTES                             │
│  /agents/{slug}        → Landing page (AgentLandingPage.tsx)        │
│  /agents/{slug}/deploy → Deploy guide (AgentDeployGuide.tsx)        │
│  /widget-embed         → Embeddable widget (widget-embed.tsx)       │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CLIENT DEPLOYMENT                               │
│  Option 1: <script src="convo-widget.js" data-auto-init="true">     │
│            (Shadow DOM injection — recommended)                      │
│  Option 2: <convo-chat-widget agent-id="...">                       │
│            (Custom element — also uses Shadow DOM)                   │
│  Option 3: ConvoWidget.init({ agentId, apiKey })                    │
│            (Programmatic initialization)                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Principles

1. **Configuration Over Code** — Adding a new agent requires zero code changes, just config
2. **Avatar-First Design** — The Solar System Bubble is the flagship visual identity
3. **Supplier Abstraction** — ElevenLabs is never exposed in client-facing content
4. **User-Controlled Theming** — Theme choices belong to clients, not us
5. **Autonomous Agents** — Each agent is isolated and independent
6. **Documentation as Product** — If it's not documented, it doesn't exist

See [Philosophy & Vision](overview/philosophy.md) for detailed explanation.

---

## Version Tracking

| Component | Canonical Commit | Purpose |
|-----------|------------------|---------|
| ChatBubble.tsx | `85a65b0` | Solar System theme reference |
| index.css animations | `fac5155` | CSS keyframes reference |

Before modifying these files, always diff against reference:
```bash
git diff 85a65b0 -- client/src/components/chat/ChatBubble.tsx
git diff fac5155 -- client/src/index.css
```

---

## Adding New Documentation

| Type | Location | Template |
|------|----------|----------|
| New agent | `docs/agents/{slug}.md` | Copy existing agent doc |
| New deploy guide | `docs/deployment/{slug}-deploy.md` | Copy existing deploy guide (NO ElevenLabs refs) |
| New avatar | `docs/avatars/{avatar-name}.md` | Include design spec, version refs, integrity rules |
| New process | `docs/process/{process-name}.md` | Step-by-step instructions |
| Dev work | `docs/dev/{YYYY-MM-DD}-{feature-name}.md` | Root cause, fixes, verification steps |

---

## External References

- **Production URL**: https://convo-ai.futurnod.com
- **Company Website**: https://www.futurnod.com
- **Replit Project**: (internal)
- **GitHub Repository**: (internal)
