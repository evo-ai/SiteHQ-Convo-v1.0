# New Agent Setup Process

This document describes the step-by-step process for setting up a new ElevenLabs Conversational AI agent in the platform.

---

## Prerequisites

1. An ElevenLabs account with a Conversational AI agent already created
2. The agent ID from ElevenLabs (found in the agent's embed code)
3. The ElevenLabs API key (stored in server environment as `ELEVENLABS_API_KEY`)
4. An internal API key for widget authentication

---

## Step 1: Create the Agent in ElevenLabs

1. Log into [elevenlabs.io](https://elevenlabs.io)
2. Navigate to Conversational AI
3. Create your agent with the desired voice, personality, and instructions
4. Copy the agent ID from the embed code provided

---

## Step 2: Register the Agent in the Codebase

Open `client/src/config/agents.ts` and add a new entry to the `agents` object:

```typescript
newagent: {
  id: "newagent",
  slug: "newagent",
  name: "Agent Display Name",
  description: "Short description of what this agent does",
  agentId: "ELEVENLABS_AGENT_ID_HERE",
  apiKey: "YOUR_API_KEY",
  avatarId: "solar-system",
  theme: {
    primary: "#HEX_COLOR",
    background: "#ffffff",
    text: "#333333",
  },
  widgetTitle: "Agent Widget Title",
  brandingUrl: "https://www.futurnod.com/",
  brandingLabel: "Futur Nod",
  createdAt: "YYYY-MM-DD",
},
```

### Key Fields:
- **slug**: URL-friendly identifier (lowercase, no spaces). Used in routes like `/agents/slug`
- **agentId**: The ElevenLabs agent ID from Step 1
- **avatarId**: Which avatar design to use (currently only "solar-system")
- **theme.primary**: The main brand color for this agent's widget and landing page

---

## Step 3: Choose Avatar and Theme

Open `client/src/config/avatars.ts` to see available avatar designs and their theme variants.

Currently available avatars:
- **solar-system**: Animated bubble with orbiting particles (see `docs/avatars/solar-system-bubble.md`)

Each avatar has multiple color theme variants. You can also add new variants by extending the `themeVariants` array.

**Important**: Theme colors are user-controlled. When adding a new agent, use a placeholder theme or an existing variant. The user will choose the final colors via the future theme editor UI. Do not pre-assign or change theme colors without explicit user direction.

---

## Step 4: Test the Agent

After registering, the following pages are automatically available:

| Page | URL | Purpose |
|------|-----|---------|
| Landing Page | `/agents/{slug}` | Client-facing page showcasing the agent |
| Deploy Guide | `/agents/{slug}/deploy` | Embed code and deployment instructions |
| Widget Embed | `/widget-embed?agentId=...&apiKey=...` | Standalone widget for iframe embedding |

1. Navigate to `/agents/{slug}` to verify the landing page
2. Click the chat bubble to test the voice conversation
3. Navigate to `/agents/{slug}/deploy` to verify deployment instructions

---

## Step 5: Generate Client Deployment Package

Navigate to `/agents/{slug}/deploy` and share the deployment guide URL with the client. The page includes:

1. **Script Tag** — Single line to add to client's website
2. **Custom Element** — More control over placement
3. **IFrame Embed** — Fully isolated widget
4. **ElevenLabs Native Embed** — Direct ElevenLabs widget

All embed codes are pre-filled with the correct agent ID and configuration.

---

## Step 6: Document the Agent

Create a new file at `docs/agents/{slug}.md` with:
- Agent name and purpose
- Client name (if applicable)
- Agent ID
- Date created
- Any special configuration notes

---

## Quick Reference

| Action | File |
|--------|------|
| Add new agent | `client/src/config/agents.ts` |
| Add new avatar | `client/src/config/avatars.ts` |
| Agent landing page template | `client/src/pages/agents/AgentLandingPage.tsx` |
| Agent deploy guide template | `client/src/pages/agents/AgentDeployGuide.tsx` |
| Route registration | `client/src/App.tsx` (dynamic, no changes needed) |
| Server API (signed URL) | `server/routes.ts` |
