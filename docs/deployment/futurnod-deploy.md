# Nod for FuturNod — Widget Deployment Guide

This guide is for the FuturNod development team to integrate the Conversational AI chat widget into the FuturNod website.

> **Before you begin**: Replace `YOUR_DOMAIN` in the code examples below with the widget hosting URL provided by the FuturNod team (e.g., `your-app.replit.app` or your custom domain).

---

## Agent Details

| Field | Value |
|-------|-------|
| Agent Name | Nod for FuturNod |
| Agent ID | `x8uXlbP4xF2fnv352D7P` |
| API Key | `sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500` |
| Widget Title | Nod for FuturNod |
| Primary Color | `#F95638` |

---

## Integration Options

Choose the method that best fits your website setup.

### Option 1: Script Tag (Easiest)

Add a single script tag to your website. The widget will auto-initialize in the bottom-right corner.

```html
<script 
  src="https://YOUR_DOMAIN/convo-widget.js" 
  data-auto-init="true" 
  data-api-key="sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500" 
  data-agent-id="x8uXlbP4xF2fnv352D7P"
  data-theme='{"primary":"#F95638","background":"#ffffff","text":"#333333"}'>
</script>
```

### Option 2: Custom Element (More Control)

Use a custom HTML element for more control over placement and initialization.

```html
<!-- Step 1: Include the script -->
<script src="https://YOUR_DOMAIN/convo-widget.js"></script>

<!-- Step 2: Add the custom element anywhere on your page -->
<convo-chat-widget 
  api-key="sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500"
  agent-id="x8uXlbP4xF2fnv352D7P"
  title="Nod for FuturNod"
  theme='{"primary":"#F95638","background":"#ffffff","text":"#333333"}'
  dark-mode="false">
</convo-chat-widget>
```

### Option 3: IFrame (Fully Isolated)

Use an iframe for complete isolation from your website's styles and scripts.

```html
<iframe 
  src="https://YOUR_DOMAIN/widget-embed?apiKey=sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500&agentId=x8uXlbP4xF2fnv352D7P&theme=%7B%22primary%22%3A%22%23F95638%22%2C%22background%22%3A%22%23ffffff%22%2C%22text%22%3A%22%23333333%22%7D&title=Nod%20for%20FuturNod" 
  style="width: 400px; height: 600px; position: fixed; bottom: 20px; right: 20px; border: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 9999;" 
  allow="microphone">
</iframe>
```

---

## Configuration Options

| Attribute | Description |
|-----------|-------------|
| `api-key` | Your API key for authentication |
| `agent-id` | Your agent's unique ID |
| `theme` | JSON object with color settings (see below) |
| `dark-mode` | Set to `"true"` to enable dark mode |
| `title` | Widget title displayed in the header |

## Theme Customization

Customize the widget appearance using a JSON theme object:

```json
{
  "primary": "#F95638",
  "background": "#ffffff",
  "text": "#333333"
}
```

| Property | Description |
|----------|-------------|
| `primary` | Primary brand color used for buttons, accents |
| `background` | Widget background color |
| `text` | Text color inside the widget |

---

## Placement Recommendations

- Place the script tag just before the closing `</body>` tag for best performance.
- The widget appears as a floating chat bubble in the bottom-right corner by default.
- Works on all modern browsers (Chrome, Firefox, Safari, Edge).
- Mobile responsive — adapts to screen size automatically.

---

## Support

For any integration issues, contact the FuturNod team at [futurnod.com](https://www.futurnod.com/).
