# SiteHQ Agent

## Summary

| Field | Value |
|-------|-------|
| Name | SiteHQ |
| Slug | `sitehq` |
| ElevenLabs Agent ID | `KRGVz0f5HAU0E7u6BbA5` |
| Avatar | Solar System Bubble |
| Theme Variant | Purple Cosmos |
| Primary Color | `#5c078c` |
| Accent 1 (Sun) | `#FFCC00` |
| Accent 2 (Planet) | `#00CCFF` |
| Widget Title | SiteHQ Assistant |
| Branding | Futur Nod |
| Created | 2024-11-01 |

## Description

SiteHQ Conversational AI Assistant — the first agent deployed on the platform. Built for SiteHQ, Australia's leading site solutions provider.

## Client Details

- **Company**: SiteHQ (Smart Site Solutions)
- **Logo**: `/SiteHQ-logo.png` (served from `client/public/`)
- **Tagline**: "Australia's Leading Site Solutions Provider"
- **Website**: https://www.sitehq.com.au

## Pages

| Page | URL |
|------|-----|
| Landing Page | `/agents/sitehq` |
| Deploy Guide | `/agents/sitehq/deploy` |
| Published Site | `sitehq-convo-ai.futurnod.com` |

## ElevenLabs Embed Code

```html
<elevenlabs-convai agent-id="KRGVz0f5HAU0E7u6BbA5"></elevenlabs-convai>
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
```

## Configuration Reference

Located in `client/src/config/agents.ts` under the `sitehq` key:

```typescript
sitehq: {
  id: "sitehq",
  slug: "sitehq",
  name: "SiteHQ",
  description: "SiteHQ Conversational AI Assistant",
  tagline: "Australia's Leading Site Solutions Provider",
  logoUrl: "/SiteHQ-logo.png",
  agentId: "KRGVz0f5HAU0E7u6BbA5",
  apiKey: "sk_...",
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
}
```

## Notes

- First agent deployed on the platform
- Uses the Purple Cosmos theme variant of the Solar System Bubble avatar
- Theme colors are user-configured — subject to change via future theme editor UI
- Published deployment at `sitehq-convo-ai.futurnod.com` may run an older code version
