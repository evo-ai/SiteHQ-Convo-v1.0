# Widget Embed Redesign: Eliminating the White Card Problem

**Date**: 2026-02-24  
**Status**: Proposal (Phase 1 — Documentation Only)  
**Related**: [Previous Widget Embed Fixes](./2026-02-24-widget-embed-fixes.md)

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Why the White Card Appears](#why-the-white-card-appears)
3. [Visual Comparison](#visual-comparison)
4. [Proposed Solution](#proposed-solution)
5. [How the New Approach Works](#how-the-new-approach-works)
6. [New Embed Script Usage](#new-embed-script-usage)
7. [Trade-offs and Considerations](#trade-offs-and-considerations)

---

## Problem Statement

### The Core Issue

On the landing page (`/agents/futurnod`), the `ChatBubble` component renders **directly on the page** — it lives in the same DOM as everything else. There is no wrapper, no extra layer, no background card. The result is a clean floating bubble with animated particles, a tooltip, and a "Powered by" footer, all sitting transparently on top of whatever the page background is.

However, when a customer embeds the widget on their own website using the shareable script (`convo-widget.js`), the experience looks completely different. A visible **white rectangular card** appears behind the chat bubble. This card is not part of the ChatBubble design — it's an artifact of how the widget is currently delivered.

### Why This Matters

- **Brand inconsistency**: The widget on client websites looks different from the widget on our own pages. Customers expect it to look exactly as it does on `/agents/futurnod`.
- **Poor visual integration**: The white card clashes with dark-themed or colorful websites. It looks like a foreign object pasted on the page rather than a natural part of it.
- **Trust erosion**: A visible "box" around the bubble makes it feel like a cheap third-party popup rather than a premium embedded assistant.
- **Previous fixes were insufficient**: We already attempted to fix this (see the previous embed fixes doc) by setting `background: transparent`, `allowtransparency="true"`, and adjusting iframe sizing. These helped, but they did not eliminate the fundamental problem — because the fundamental problem is the iframe itself.

---

## Why the White Card Appears

### The Root Cause: iframes Are Rectangular Boxes

The current `convo-widget.js` script works like this:

```
Host Website
└── <div id="convo-widget-container"> (fixed position, bottom-right)
    └── <iframe src="/widget-embed?agentId=...&apiKey=...">
        └── Entire separate HTML document
            └── <html> <body> <div id="root">
                └── React app boots up
                    └── ChatBubble component renders
```

The iframe is an HTML element — specifically a rectangular box that loads an entirely separate HTML document inside it. Even though we set `background: transparent` on the iframe and on the page inside it, the iframe itself has inherent behaviors that cause the white card:

1. **Default white background**: Every iframe loads an `<html>` document. Browsers paint a white background on documents by default, and `background: transparent` on the iframe element only works if the inner document also cooperates — and even then, browser support varies.

2. **Rectangular bounding box**: The iframe must have explicit `width` and `height`. Currently:
   - Collapsed: `260px × 140px` — this rectangular area is visible even though only the 56px round bubble is meaningful.
   - Expanded: `420px × 700px` — this is needed for the dialog and connected state.
   
   That 260×140 area around the bubble is the "white card" users see.

3. **Cross-origin rendering quirks**: When the widget is embedded on a different domain than where it's hosted, browsers may apply additional security restrictions that prevent transparent rendering from working correctly.

### Visual Breakdown of the Problem

```
┌──────────────────────────────────────────────┐
│  Customer's Website                          │
│                                              │
│  ┌─ Their content ─────────────────────┐     │
│  │  Header, navigation, etc.           │     │
│  └─────────────────────────────────────┘     │
│                                              │
│                      ┌─────────────────────┐ │
│                      │ ← IFRAME (260×140)  │ │
│                      │                     │ │
│                      │  "Ask me anything"  │ │
│                      │      ┌──────┐       │ │
│                      │      │ 💬   │       │ │
│                      │      └──────┘       │ │
│                      │  "Powered by..."    │ │
│                      │                     │ │
│                      └─────────────────────┘ │
│                      ↑                       │
│                      This entire rectangle   │
│                      has a white background  │
│                      — THAT is the card.     │
│                                              │
└──────────────────────────────────────────────┘
```

### What It Should Look Like (as on `/agents/futurnod`)

```
┌──────────────────────────────────────────────┐
│  Customer's Website                          │
│                                              │
│  ┌─ Their content ─────────────────────┐     │
│  │  Header, navigation, etc.           │     │
│  └─────────────────────────────────────┘     │
│                                              │
│                                              │
│                         "Ask me anything"    │
│                              ┌──────┐        │
│                              │ 💬   │        │
│                              └──────┘        │
│                          "Powered by..."     │
│                                              │
│              No box. No card. Just the       │
│              bubble floating directly on     │
│              the page, exactly like on       │
│              /agents/futurnod.               │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Visual Comparison

| Aspect | On `/agents/futurnod` | Embedded via iframe |
|--------|----------------------|---------------------|
| Background | Transparent — page shows through | White rectangular card behind bubble |
| Particles | Float freely, no clipping | Clipped by iframe boundary |
| Tooltip | Appears naturally above bubble | Constrained within iframe box |
| Terms dialog | Opens as full-page modal overlay | Opens inside small iframe, often broken |
| Hover effects | Smooth, no boundary artifacts | Edges visible at iframe boundary |
| Feel | Native, part of the page | Foreign object pasted on top |

---

## Proposed Solution

### Approach: Direct DOM Injection via Shadow DOM

Instead of loading the ChatBubble inside an iframe, the embed script should **inject the widget directly into the host page's DOM** — the same way it already works on `/agents/futurnod`.

To prevent style conflicts between the widget and the host page, we use the browser's **Shadow DOM** API. Shadow DOM creates an isolated styling boundary without creating a separate document (which is what an iframe does).

### How It Differs from the Current Approach

| | Current (iframe) | New (Shadow DOM) |
|---|---|---|
| **Isolation** | Full document isolation via iframe | Style isolation via Shadow DOM |
| **Background** | Separate HTML doc = white background | No document = no background |
| **Rendering** | Loads entire React app in iframe | Injects pre-bundled widget into host page DOM |
| **Sizing** | Fixed rectangle that must resize | No fixed size — widget elements position themselves |
| **Cross-origin** | Loads page from widget server | Script runs on host page, only API calls go to server |
| **Terms dialog** | Opens inside tiny iframe (broken) | Opens as proper overlay on host page |
| **Performance** | Downloads full HTML doc + boots React | Loads one JS bundle, mounts component |
| **Communication** | postMessage between frames | Direct — no cross-frame messaging needed |

---

## How the New Approach Works

### Architecture

```
Host Website
└── <script src="https://convo-ai.futurnod.com/convo-widget.js">
    │
    ├── Creates a <div id="convo-widget-root"> (fixed, bottom-right, pointer-events: none)
    │
    └── Attaches Shadow DOM to it
        └── <shadow-root>
            ├── <style> (all widget CSS, fully isolated from host page)
            └── <div class="widget-container"> (pointer-events: auto)
                └── ChatBubble renders here
                    ├── Tooltip ("Ask me anything!")
                    ├── Circular button with particles
                    ├── "Powered by" footer
                    └── Terms dialog (when clicked)
```

### Step-by-Step Flow

1. **Host site adds the script tag** — same as before, just a single `<script>` tag.

2. **Script loads and runs** — creates a container `<div>` positioned `fixed` at `bottom: 0; right: 0` with `pointer-events: none` so it doesn't block clicks on the host page.

3. **Shadow DOM is attached** — `container.attachShadow({ mode: 'open' })` creates an isolated style boundary. CSS inside the shadow root cannot leak out, and host page CSS cannot leak in.

4. **Widget CSS is injected** — all styles needed by the ChatBubble (animations, particles, dialog, dark mode) are injected as a `<style>` tag inside the shadow root.

5. **Widget HTML/JS is rendered** — the ChatBubble UI (bubble, tooltip, footer, particles) is rendered inside the shadow root. This can be done either as:
   - A pre-bundled standalone React component (self-contained, includes React runtime)
   - A vanilla JS recreation of the ChatBubble UI (lighter weight, no React dependency)

6. **User clicks bubble** — Terms dialog opens as an overlay within the shadow root, properly positioned over the host page.

7. **User accepts terms** — API call goes to `https://convo-ai.futurnod.com/api/get-signed-url`, conversation starts via WebSocket. No iframe, no cross-origin document issues.

### Why Shadow DOM Solves the Problem

- **No separate document**: Shadow DOM is part of the host page's document, so there's no second `<html>` with a default white background.
- **No bounding box**: The container div can be transparent with `pointer-events: none`. Only the actual bubble element captures clicks.
- **Style isolation**: Host page CSS won't break the widget, and widget CSS won't affect the host page.
- **Native positioning**: The bubble, tooltip, and dialog all position relative to the viewport using `position: fixed`, exactly like on `/agents/futurnod`.

---

## New Embed Script Usage

The customer-facing API stays the same — just a script tag:

```html
<!-- Script Tag (auto-init) -->
<script
  src="https://convo-ai.futurnod.com/convo-widget.js"
  data-auto-init="true"
  data-agent-id="YOUR_AGENT_ID"
  data-api-key="YOUR_API_KEY"
  data-theme='{"primary":"#F95638","background":"#ffffff","text":"#333333"}'
  data-title="AI Assistant">
</script>
```

Or via custom element:

```html
<script src="https://convo-ai.futurnod.com/convo-widget.js"></script>
<convo-chat-widget
  agent-id="YOUR_AGENT_ID"
  api-key="YOUR_API_KEY"
  theme='{"primary":"#F95638"}'
  title="AI Assistant">
</convo-chat-widget>
```

The embed code looks identical to what we already provide. Customers don't need to change anything. The difference is entirely under the hood — no iframe is created.

---

## Trade-offs and Considerations

### Advantages

1. **Pixel-perfect match** with `/agents/futurnod` — same rendering approach, same result.
2. **No white card** — the fundamental cause is eliminated, not worked around.
3. **Better dialog experience** — Terms dialog can overlay the full page properly.
4. **Simpler code** — no postMessage, no iframe resize logic, no cross-origin hacks.
5. **Better performance** — one JS bundle vs. loading an entire HTML page + React app in an iframe.
6. **Same embed API** — customers don't need to change their embed code.

### Things to Watch Out For

1. **Bundle size**: The standalone widget JS file must include all the UI logic (and possibly a minimal React runtime). Need to keep this small — ideally under 100KB gzipped.
2. **Host page CSS leakage**: Shadow DOM prevents most CSS leakage, but inherited properties (like `font-family`, `color`) can still cross the boundary. The widget's styles must explicitly set all inherited properties.
3. **Content Security Policy (CSP)**: Some host pages have strict CSP headers that block inline styles or scripts. The widget must work within common CSP policies.
4. **Z-index wars**: The widget uses `z-index: 2147483647` (max value). Some host pages may also use extreme z-index values. Shadow DOM doesn't isolate z-index stacking contexts.
5. **React dependency**: If we bundle React into the widget, it adds ~40KB gzipped. Alternative: rewrite the bubble UI in vanilla JS to avoid this dependency entirely. The ChatBubble component is primarily CSS animations + a few event handlers — it's feasible to port.

### Implementation Options

| Option | Bundle Size | Effort | Fidelity |
|--------|------------|--------|----------|
| **A: Bundle React + ChatBubble** | ~80-100KB gzipped | Medium — use Vite to build standalone bundle | Exact match — same React component |
| **B: Vanilla JS recreation** | ~15-25KB gzipped | Higher — rewrite animations and UI in vanilla JS | Very close — may differ in animation details |
| **C: Preact + ChatBubble** | ~30-40KB gzipped | Medium — swap React for Preact in widget build | Exact match — Preact is API-compatible with React |

**Recommended**: Option A for initial release (fastest to build, guaranteed visual match), with Option C as a follow-up optimization.

---

## Next Steps (Phase 2 — Implementation)

Once this design is approved:

1. Create a Vite build config for the standalone widget bundle
2. Build the shadow DOM container and style injection in `convo-widget.js`
3. Create the widget entry point that mounts ChatBubble into the shadow root
4. Update the deploy guide pages with new embed instructions
5. Test on various host pages (light/dark themes, different CSP policies)
6. Update deployment documentation

---

## References

- [MDN: Using Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- [MDN: Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
- Previous fix doc: `docs/dev/2026-02-24-widget-embed-fixes.md`
- ChatBubble component: `client/src/components/chat/ChatBubble.tsx`
- Current widget script: `client/public/convo-widget.js`
- Widget embed page: `client/src/pages/widget-embed.tsx`
