# Nod for FuturNod Agent

## Summary

| Field | Value |
|-------|-------|
| Name | Nod for FuturNod |
| Slug | `futurnod` |
| ElevenLabs Agent ID | `x8uXlbP4xF2fnv352D7P` |
| Avatar | Solar System Bubble |
| Theme Variant | Orange Fire |
| Primary Color | `#F95638` |
| Accent 1 (Sun) | `#FFD700` |
| Accent 2 (Planet) | `#FF6B35` |
| Widget Title | Nod for FuturNod |
| Branding | Futur Nod |
| Created | 2026-02-23 |

## Description

FuturNod's own Conversational AI Assistant — the second agent deployed on the platform. Demonstrates the multi-agent capability with a distinct brand identity.

## Client Details

- **Company**: FuturNod
- **Logo**: None (text-only heading)
- **Tagline**: "Intelligent Conversational AI Solutions"
- **Website**: https://www.futurnod.com/

## Pages

| Page | URL |
|------|-----|
| Landing Page | `/agents/futurnod` |
| Deploy Guide | `/agents/futurnod/deploy` |

## ElevenLabs Embed Code

```html
<elevenlabs-convai agent-id="x8uXlbP4xF2fnv352D7P"></elevenlabs-convai>
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
```

## Configuration Reference

Located in `client/src/config/agents.ts` under the `futurnod` key:

```typescript
futurnod: {
  id: "futurnod",
  slug: "futurnod",
  name: "Nod for FuturNod",
  description: "FuturNod Conversational AI Assistant",
  tagline: "Intelligent Conversational AI Solutions",
  agentId: "x8uXlbP4xF2fnv352D7P",
  apiKey: "sk_...",
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
}
```

## Notes

- Second agent deployed on the platform
- Uses the Orange Fire theme variant of the Solar System Bubble avatar
- Theme colors are user-configured — subject to change via future theme editor UI
- No logo image — landing page uses text heading with the agent name
