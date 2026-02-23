# SiteHQ — Widget Deployment Guide

This guide is for the SiteHQ development team to integrate the Conversational AI chat widget into the SiteHQ website.

---

## Agent Details

| Field | Value |
|-------|-------|
| Agent Name | SiteHQ |
| Agent ID | `KRGVz0f5HAU0E7u6BbA5` |
| API Key | `sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500` |
| Widget Title | SiteHQ Assistant |
| Primary Color | `#5c078c` |

---

## Integration Options

Choose the method that best fits your website setup.

### Option 1: Script Tag (Easiest)

Add a single script tag to your website. The widget will auto-initialize in the bottom-right corner.

```html
<script 
  src="https://convo-ai.futurnod.com/convo-widget.js" 
  data-auto-init="true" 
  data-api-key="sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500" 
  data-agent-id="KRGVz0f5HAU0E7u6BbA5"
  data-theme='{"primary":"#5c078c","background":"#ffffff","text":"#333333"}'>
</script>
```

### Option 2: Custom Element (More Control)

Use a custom HTML element for more control over placement and initialization.

```html
<!-- Step 1: Include the script -->
<script src="https://convo-ai.futurnod.com/convo-widget.js"></script>

<!-- Step 2: Add the custom element anywhere on your page -->
<convo-chat-widget 
  api-key="sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500"
  agent-id="KRGVz0f5HAU0E7u6BbA5"
  title="SiteHQ Assistant"
  theme='{"primary":"#5c078c","background":"#ffffff","text":"#333333"}'
  dark-mode="false">
</convo-chat-widget>
```

### Option 3: IFrame (Fully Isolated)

Use an iframe for complete isolation from your website's styles and scripts.

```html
<iframe 
  src="https://convo-ai.futurnod.com/widget-embed?apiKey=sk_d30f51b33804638dd5e2af1f942f1685ccacd0d95ef30500&agentId=KRGVz0f5HAU0E7u6BbA5&theme=%7B%22primary%22%3A%22%235c078c%22%2C%22background%22%3A%22%23ffffff%22%2C%22text%22%3A%22%23333333%22%7D&title=SiteHQ%20Assistant" 
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
  "primary": "#5c078c",
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
