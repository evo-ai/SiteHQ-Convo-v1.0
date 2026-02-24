# Widget Embed System Fixes

**Date**: 2026-02-24
**Issue**: Embeddable widget not working when deployed on third-party websites
**Status**: Fixed

---

## Executive Summary

The embeddable chat widget system had multiple critical bugs preventing it from working when deployed on client websites. This document details the root causes, fixes applied, and verification steps for Replit deployment.

---

## Problem Statement

When embedding the chat widget on external websites using any of the three methods (script tag, custom element, or iframe), the following issues occurred:

1. **WebSocket Connection Failed**: Console showed `WebSocket connection to 'ws://localhost:8081/' failed`
2. **Widget Positioning Issues**: White rectangular card behind bubble, incorrect positioning
3. **Script Tag Method Not Working**: `<convo-chat-widget>` custom element failed silently
4. **"Failed to start conversation" Error**: Terms dialog showed error after clicking Agree

---

## Root Cause Analysis

### Issue 1: Duplicate API Endpoints Causing Confusion

**Location**: `server/index.ts` and `server/routes.ts`

**Problem**: Two `/api/get-signed-url` endpoints were defined:
- One in `server/index.ts` (lines 27-68) - simplified version
- One in `server/routes.ts` (lines 181-244) - full version with validation

Express routes are matched in order, so the `index.ts` endpoint was sometimes taking precedence, causing inconsistent behavior.

**Root Cause**: Code duplication from iterative development without cleanup.

---

### Issue 2: Redirect Bug Doubling Query Parameters

**Location**: `server/routes.ts` lines 409-416 (before fix)

**Problem**: The `/embed` to `/widget-embed` redirect was malformed:

```javascript
// BEFORE (buggy)
const queryParams = req.url.includes('?') ? req.url.split('?')[1] : '';
const redirectUrl = req.url.replace('/embed', '/widget-embed');
const fullRedirectUrl = queryParams ? `${redirectUrl}?${queryParams}` : redirectUrl;
```

If `req.url` was `/embed?agentId=xxx&apiKey=yyy`:
1. `queryParams` = `'agentId=xxx&apiKey=yyy'`
2. `redirectUrl` = `/widget-embed?agentId=xxx&apiKey=yyy` (replace kept query string)
3. `fullRedirectUrl` = `/widget-embed?agentId=xxx&apiKey=yyy?agentId=xxx&apiKey=yyy` (BROKEN!)

**Root Cause**: Logic error in string manipulation.

---

### Issue 3: Mock URL Using Localhost When ELEVENLABS_API_KEY Not Set

**Location**: `server/routes.ts` lines 211-216 (before fix)

**Problem**: When `ELEVENLABS_API_KEY` environment variable was not set, the server returned a mock WebSocket URL:

```javascript
const mockSignedUrl = `wss://${req.headers.host}/api/chat?agentId=${agentId}`;
```

In some Replit configurations, `req.headers.host` resolved to `localhost:8081` instead of the public domain, causing the WebSocket connection to fail.

**Root Cause**: Fallback logic designed for local testing doesn't work in all deployment scenarios.

---

### Issue 4: IFrame Sizing Not Accounting for Widget UI

**Location**: `client/public/convo-widget.js`

**Problem**: The iframe was sized at 80x80px (just the bubble circle), but the widget also renders:
- Tooltip "Ask me anything! I'm here to help." (above bubble)
- "Powered by Futur Nod" footer (below bubble)
- Solar system particles (around bubble)

These elements were clipped or caused the white background appearance.

**Root Cause**: Iframe dimensions didn't account for full widget UI in collapsed state.

---

### Issue 5: Widget Embed Page Styling Issues

**Location**: `client/src/pages/widget-embed.tsx`

**Problem**: The widget-embed page had:
- Container divs with implicit backgrounds
- Positioning that didn't work correctly inside iframe
- Missing CSS for dialog/modal rendering in iframe context

**Root Cause**: Page was designed for standalone viewing, not iframe embedding.

---

## Fixes Applied

### Fix 1: Remove Duplicate Endpoint

**File**: `server/index.ts`

**Change**: Removed the duplicate `/api/get-signed-url` endpoint (lines 27-68). Now only the endpoint in `routes.ts` handles signed URL requests.

```javascript
// AFTER - Comment indicating endpoint is in routes.ts
// Note: The /api/get-signed-url endpoint is defined in routes.ts
// It handles API key validation and ElevenLabs signed URL generation
```

---

### Fix 2: Correct Redirect Logic

**File**: `server/routes.ts` lines 409-415

**Change**: Fixed query string handling:

```javascript
// AFTER (fixed)
app.get('/embed*', (req, res) => {
  const urlParts = req.url.split('?');
  const queryString = urlParts.length > 1 ? '?' + urlParts[1] : '';
  res.redirect(307, '/widget-embed' + queryString);
});
```

---

### Fix 3: Use Public WebSocket URL as Fallback

**File**: `server/routes.ts` lines 218-225

**Change**: When `ELEVENLABS_API_KEY` is not set, use ElevenLabs public WebSocket URL instead of a mock localhost URL:

```javascript
// AFTER (fixed)
if (!elevenLabsApiKey) {
  console.warn('ELEVENLABS_API_KEY not set, using public WebSocket URL');
  const publicWsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
  return res.json({ signedUrl: publicWsUrl });
}
```

This works for public agents. Private agents still require `ELEVENLABS_API_KEY` to be set.

---

### Fix 4: Update IFrame Sizing

**File**: `client/public/convo-widget.js`

**Change**: Updated collapsed/expanded dimensions:

```javascript
// Collapsed state: room for bubble (56px) + tooltip above + footer below + padding
var COLLAPSED_WIDTH = 260;
var COLLAPSED_HEIGHT = 140;

// Expanded state: dialog/connected view
var EXPANDED_WIDTH = 420;
var EXPANDED_HEIGHT = 700;
```

Also added:
- `allowtransparency="true"` attribute
- `pointer-events: none` on container, `pointer-events: auto` on iframe
- Window resize handler to prevent overflow

---

### Fix 5: Fix Widget Embed Page Styling

**File**: `client/src/pages/widget-embed.tsx`

**Changes**:
1. Set transparent background on html, body, and #root
2. Position widget container at bottom-right within iframe
3. Add CSS to ensure Radix dialogs work in iframe context
4. Add validation for required parameters
5. Hide dark mode toggle in embed context

```css
html, body, #root {
  background: transparent !important;
}
.widget-embed-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
}
```

---

### Fix 6: Simplify PostMessage Communication

**File**: `client/src/components/chat/ChatBubble.tsx` lines 170-178

**Change**: Always use `'*'` as target origin for cross-origin iframe communication:

```javascript
// AFTER (simplified)
useEffect(() => {
  const isInIframe = window.parent !== window;
  if (isInIframe) {
    const isOpen = conversation.status === 'connected' || showTerms;
    window.parent.postMessage({ type: 'convo-widget-toggle', isOpen }, '*');
  }
}, [conversation.status, showTerms]);
```

---

### Fix 7: Update Deploy Guide Embed Codes

**Files**:
- `client/src/pages/agents/AgentDeployGuide.tsx`
- `docs/deployment/sitehq-deploy.md`
- `docs/deployment/futurnod-deploy.md`

**Change**: Updated iframe embed code to include postMessage resize handler:

```html
<iframe
  id="convo-widget-iframe"
  src="..."
  style="position: fixed; bottom: 0; right: 0; width: 260px; height: 140px; ..."
  allow="microphone">
</iframe>
<script>
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'convo-widget-toggle') {
      var iframe = document.getElementById('convo-widget-iframe');
      if (e.data.isOpen) {
        iframe.style.width = '420px';
        iframe.style.height = '700px';
      } else {
        iframe.style.width = '260px';
        iframe.style.height = '140px';
      }
    }
  });
</script>
```

---

## Files Modified

| File | Type | Changes |
|------|------|---------|
| `server/index.ts` | Backend | Removed duplicate endpoint |
| `server/routes.ts` | Backend | Fixed redirect, improved signed URL fallback |
| `client/public/convo-widget.js` | Static JS | Updated sizing, added transparency |
| `client/src/pages/widget-embed.tsx` | Frontend | Fixed styling for iframe context |
| `client/src/components/chat/ChatBubble.tsx` | Frontend | Simplified postMessage |
| `client/src/pages/agents/AgentDeployGuide.tsx` | Frontend | Updated embed code template |
| `docs/deployment/sitehq-deploy.md` | Docs | Updated iframe embed code |
| `docs/deployment/futurnod-deploy.md` | Docs | Updated iframe embed code |

---

## Verification Steps for Replit

After pushing to GitHub and syncing with Replit:

### 1. Verify Build Succeeds

```bash
npm run build
```

Should complete without errors.

### 2. Verify Server Starts

```bash
npm run start
```

Check logs for:
- `serving on port 5000`
- No errors about missing modules

### 3. Test Landing Page Chat Bubble

1. Open `https://<replit-url>/agents/sitehq`
2. Click the chat bubble
3. Accept terms
4. Verify conversation starts (microphone permission required)

### 4. Test Widget Embed Page Directly

1. Open `https://<replit-url>/widget-embed?apiKey=sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500&agentId=KRGVz0f5HAU0E7u6BbA5`
2. Should see chat bubble at bottom-right with tooltip and footer
3. Background should be transparent (checkerboard pattern in browser)

### 5. Test Script Tag Embed

Create a test HTML file and open in browser:

```html
<!DOCTYPE html>
<html>
<head><title>Widget Test</title></head>
<body>
  <h1>Test Page</h1>
  <script
    src="https://<replit-url>/convo-widget.js"
    data-auto-init="true"
    data-api-key="sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500"
    data-agent-id="KRGVz0f5HAU0E7u6BbA5"
    data-theme='{"primary":"#5c078c"}'>
  </script>
</body>
</html>
```

Verify:
- Chat bubble appears at bottom-right
- Clicking opens terms dialog
- Accepting terms starts conversation

### 6. Check Console for Errors

Open browser DevTools Console and verify:
- No `localhost` WebSocket errors
- No 401/403 API errors
- `Successfully retrieved signed URL` or `using public WebSocket URL` in logs

---

## Environment Variables

For full functionality with private agents, ensure these are set in Replit Secrets:

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs API key for private agents. If not set, uses public WebSocket URL (works for public agents). |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `COOKIE_SECRET` | Yes | Session cookie secret |

---

## Rollback Instructions

If issues occur, revert to the previous commit:

```bash
git revert HEAD
git push origin main
```

Then sync Replit with GitHub.

---

## Related Documentation

- [Solar System Bubble Design Spec](../avatars/solar-system-bubble.md)
- [New Agent Setup Process](../process/new-agent-setup.md)
- [SiteHQ Deployment Guide](../deployment/sitehq-deploy.md)
- [FuturNod Deployment Guide](../deployment/futurnod-deploy.md)
