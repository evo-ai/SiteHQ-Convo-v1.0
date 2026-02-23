# Solar System Bubble Avatar

## Description

Animated chat bubble with orbiting celestial particles, pulse effects, and solar system themed decorations. This is the flagship avatar design.

## Component

`client/src/components/chat/ChatBubble.tsx`

## Features

- Floating animation with spring physics
- Orbiting particle decorations (sun and planet)
- Pulse ring effect
- Hover tooltip
- Dark mode toggle
- Microphone volume visualization when listening
- Sound wave animation when AI is speaking
- Typing indicator
- Terms & conditions dialog

## Theme Variants

| ID | Name | Primary | Accent 1 | Accent 2 |
|----|------|---------|----------|----------|
| purple-cosmos | Purple Cosmos | #5c078c | #FFCC00 | #00CCFF |
| orange-fire | Orange Fire | #F95638 | #FFD700 | #FF6B35 |
| ocean-blue | Ocean Blue | #0066CC | #00CED1 | #4169E1 |
| emerald-green | Emerald Green | #059669 | #34D399 | #10B981 |
| midnight-dark | Midnight Dark | #1E1E2E | #CBA6F7 | #89B4FA |

## Adding a New Theme Variant

Edit `client/src/config/avatars.ts` and add a new entry to the `themeVariants` array in the `solar-system` avatar config:

```typescript
{
  id: "your-theme-id",
  name: "Your Theme Name",
  primary: "#PRIMARY_COLOR",
  accent1: "#ACCENT_1",
  accent2: "#ACCENT_2",
  glow: "rgba(R, G, B, 0.3)",
},
```

## Creating a New Avatar Design

To create an entirely new avatar:

1. Create a new component in `client/src/components/avatars/`
2. Register it in `client/src/config/avatars.ts`
3. Update `ChatBubble.tsx` or create a new wrapper to support the new avatar
