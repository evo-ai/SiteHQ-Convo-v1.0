# Solar System Bubble Avatar — Design Reference

**Version**: 1.0.0
**Created**: 2024-11-01
**Last Verified**: 2026-02-23
**Status**: Production — Flagship Avatar

## Overview

The Solar System Bubble is the flagship chat widget avatar design. It renders as an animated floating chat bubble with orbiting celestial particles (a yellow "sun" and blue "planet"), pulse effects, and spring-physics animations. This design is the visual identity of the platform and must be preserved exactly.

## Source Files

| File | Purpose |
|------|---------|
| `client/src/components/chat/ChatBubble.tsx` | Main component (605 lines) |
| `client/src/index.css` | CSS animations & keyframes |
| `client/src/config/avatars.ts` | Theme variant definitions |

## Canonical Git Reference

The Solar System theme was established at commit `85a65b0` ("Add solar system themed chat bubble option"). All future changes to ChatBubble.tsx must be diffed against this commit to verify visual integrity:

```bash
git diff 85a65b0 -- client/src/components/chat/ChatBubble.tsx
```

The CSS animations were established at commit `fac5155` ("Enhance UI: Add microphone visualization, typing indicator, dark mode toggle, and improved animations"). Verify with:

```bash
git diff fac5155 -- client/src/index.css
```

## Visual Design Specification

### Idle State (Not Connected)
- **Main button**: 56x56px (w-14 h-14) rounded circle
- **Background**: Radial gradient from `primaryColor` to `primaryColor` at 87% opacity (DD suffix)
- **Gradient origin**: 30% 30% (top-left bias for 3D depth)
- **Shadow**: `0 4px 20px rgba(92, 7, 140, 0.3)` (purple glow for SiteHQ)
- **Icon**: MessageCircle (lucide-react), white, 24x24px
- **Float animation**: 3s ease-in-out infinite, 6px vertical travel
- **Pulse ring**: Expanding ring from scale 1→1.4→1.8 with opacity 0→0.2→0, 2s duration

### Solar System Particles
- **Sun particle** (top-right): 20x20px yellow circle (#FFCC00), glow shadow `0 0 10px rgba(255, 204, 0, 0.8)`, rotates 360° in 8s, wobbles ±3px in 4s
- **Planet particle** (bottom-left): 10x10px blue circle (#00CCFF), rotates -360° in 6s, wobbles ±4px in 3s

### Background Particles (CSS)
Five decorative particles falling from top, each with unique color:
1. Purple (rgba(92, 7, 140, 0.7)) — left 10%
2. Green (rgba(76, 175, 80, 0.6)) — left 30%
3. Blue (rgba(33, 150, 243, 0.5)) — left 50%
4. Amber (rgba(255, 193, 7, 0.6)) — left 70%
5. Pink (rgba(233, 30, 99, 0.6)) — left 90%

### Hover State
- Tooltip appears: "Ask me anything! I'm here to help." (white background, shadow, max-width 220px)
- Button scales to 1.05x with spring physics (stiffness 300, damping 20)
- Icon pulses (scale 1→1.2→1, 2s repeat)

### Connected State (Active Call)
- Compact card: rounded-xl, shadow, 280px max width
- Agent icon: 40x40px circle with same radial gradient
- Three visual states:
  - **Speaking**: Wand2 icon, "Speaking" label, 5-bar sound wave animation
  - **Listening**: Animated MicIcon (scale + rotate), "Listening" label, mic volume bars
  - **Thinking**: "Thinking" label, 3-dot typing indicator animation
- End call button: red ghost button with MicOff icon

### Dark Mode
- Toggle button: Sun/Moon icon, positioned absolute top -30px
- Card background: #222
- Text: #eee
- Typing/speaking labels: blue-300
- Listening label: green-300

### Branding Footer
- "Powered by Futur Nod" text, centered below bubble
- Links to https://www.futurnod.com/
- Gray-500 color, xs size

### Terms Dialog
- Modal with title "Terms and conditions"
- Consent text about recording, storage, and third-party sharing
- Cancel (outline) and Agree (primaryColor background) buttons
- Agree button uses `.terms-agree-button` CSS class

## CSS Keyframes Reference

| Animation | Duration | Purpose |
|-----------|----------|---------|
| `float` | 3s ease-in-out infinite | Idle bubble floating |
| `gradientAnimation` | 3s ease infinite | Avatar gradient shift |
| `micWaveAnimation` | 0.5s ease infinite | Mic level bars |
| `dotPulse` | 1.5s ease-in-out infinite | Typing dots |
| `particleFall` | 4s linear infinite | Background particles |

## Props Interface

```typescript
interface ChatBubbleProps {
  apiKey?: string;          // ElevenLabs API key
  agentId?: string;         // ElevenLabs agent ID
  title?: string;           // Widget title (shown in connected state)
  theme?: {
    primary: string;        // Primary color (button, accents)
    background: string;     // Background color
    text: string;           // Text color
  };
  initiallyOpen?: boolean;  // Auto-open terms dialog
  useSolarSystemTheme?: boolean; // Use Solar System particles (default: true)
}
```

## Theme Variants

| ID | Name | Primary | Sun | Planet | Used By |
|----|------|---------|-----|--------|---------|
| purple-cosmos | Purple Cosmos | #5c078c | #FFCC00 | #00CCFF | SiteHQ |
| orange-fire | Orange Fire | #F95638 | #FFD700 | #FF6B35 | FuturNod |
| ocean-blue | Ocean Blue | #0066CC | #00CED1 | #4169E1 | Available |
| emerald-green | Emerald Green | #059669 | #34D399 | #10B981 | Available |
| midnight-dark | Midnight Dark | #1E1E2E | #CBA6F7 | #89B4FA | Available |

## Integrity Rules

1. **Never modify ChatBubble.tsx without diffing against commit `85a65b0`**
2. **Never modify index.css animation keyframes without diffing against commit `fac5155`**
3. **All particle sizes, colors, and timing values are deliberate — do not "improve" them**
4. **The Solar System particles (sun + planet) must always be present when `useSolarSystemTheme` is true**
5. **The float animation, pulse ring, and hover scaling are part of the core identity**
6. **Test any changes visually against the published version at sitehq-convo-ai.futurnod.com**

## Change Log

| Date | Change | Commit |
|------|--------|--------|
| 2024-11-01 | Initial chat bubble design | `13d6901` |
| 2024-11-01 | Added animations, dark mode, mic visualization | `fac5155` |
| 2024-11-01 | Added Solar System themed particles | `85a65b0` |
| 2026-02-23 | Bug fix: Added agentId to signed URL request | `a8c98d5` |
| 2026-02-23 | Bug fix: Changed hardcoded "SiteHQ Assistant" to use title prop | `a8c98d5` |
