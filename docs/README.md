# FuturNod Agent Hub — Documentation Index

## Quick Links

| Document | Path | Purpose |
|----------|------|---------|
| [New Agent Setup](process/new-agent-setup.md) | `docs/process/` | Step-by-step guide for adding a new agent |
| [Solar System Bubble](avatars/solar-system-bubble.md) | `docs/avatars/` | Flagship avatar design specification & integrity rules |
| [SiteHQ Agent](agents/sitehq.md) | `docs/agents/` | SiteHQ agent configuration & details |
| [FuturNod Agent](agents/futurnod.md) | `docs/agents/` | Nod for FuturNod agent configuration & details |

## Directory Structure

```
docs/
  README.md                    # This file — documentation index
  process/
    new-agent-setup.md         # How to add a new agent (6-step guide)
  avatars/
    solar-system-bubble.md     # Solar System Bubble design spec, version tracking, integrity rules
  agents/
    sitehq.md                  # SiteHQ agent — config, pages, embed code
    futurnod.md                # FuturNod agent — config, pages, embed code
```

## Source Code Reference

| File | Purpose |
|------|---------|
| `client/src/config/agents.ts` | Agent registry — all agent configurations live here |
| `client/src/config/avatars.ts` | Avatar registry — avatar designs and theme variants |
| `client/src/components/chat/ChatBubble.tsx` | Solar System Bubble component (605 lines) |
| `client/src/index.css` | CSS animations for chat bubble (keyframes, particles, dark mode) |
| `client/src/pages/agents/AgentLandingPage.tsx` | Reusable landing page template |
| `client/src/pages/agents/AgentDeployGuide.tsx` | Reusable deployment guide template |
| `client/src/pages/agents/AgentPage.tsx` | Route handler — `/agents/:slug` |
| `client/src/pages/agents/AgentDeployPage.tsx` | Route handler — `/agents/:slug/deploy` |
| `server/routes.ts` | Server API routes (signed URL endpoint) |

## How Things Connect

1. **Agent Registry** (`agents.ts`) holds all agent configs — name, agent ID, API key, theme, avatar choice
2. **Avatar Registry** (`avatars.ts`) defines avatar designs with color theme variants
3. **Landing Pages** are auto-generated from agent config — no per-agent pages needed
4. **Deploy Guides** are auto-generated with pre-filled embed codes
5. **Routes** are dynamic — adding an agent to the registry automatically creates all routes

## Key Principles

- **Each agent is autonomous** — never modify one agent when working on another
- **The Solar System Bubble design is locked** — only colors change per agent, not the structure/animations
- **Theme colors are user-controlled** — a future UI will let users design and tweak theme variants
- **Documentation must exist for every agent and avatar** — create a doc file when adding either
- **Version tracking** — ChatBubble.tsx canonical reference is commit `85a65b0`, CSS is `fac5155`

## Adding New Documentation

- **New agent**: Create `docs/agents/{slug}.md` using existing agent docs as template
- **New avatar**: Create `docs/avatars/{avatar-name}.md` with design spec, version refs, and integrity rules
- **New process**: Create `docs/process/{process-name}.md` with step-by-step instructions
