
# SiteHQ Chat Widget Implementation Guide

This guide provides step-by-step instructions for building and deploying the SiteHQ voice-enabled chat widget.

## 1. Project Setup

1. Create a new Node.js project structure:
```bash
mkdir -p client/public client/src server
touch server/index.ts server/chat.ts server/routes.ts
touch client/public/standalone-chat-bubble.js
```

2. Initialize package.json and install dependencies:
```bash
npm init -y
npm install express ws @types/ws cors natural drizzle-orm better-sqlite3
npm install --save-dev typescript ts-node @types/express @types/node
```

## 2. Server Implementation

1. Create `server/index.ts`:
```typescript
import express, { Request, Response } from "express";
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/public')));

app.get('/api/get-signed-url', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = authHeader.split('Bearer ')[1];
  const agentId = req.query.agentId as string;
  
  if (!agentId) {
    return res.status(400).json({ error: 'Missing agentId' });
  }

  try {
    const signedUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
    res.json({ signedUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 3. Chat Widget Implementation

1. Create `client/public/standalone-chat-bubble.js`:
```javascript
class SiteHQChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.config = {
      apiKey: this.getAttribute('api-key'),
      agentId: this.getAttribute('agent-id'),
      position: this.getAttribute('position') || 'bottom-right',
      darkMode: this.getAttribute('dark-mode') === 'true',
      initiallyOpen: this.getAttribute('initially-open') === 'true',
      title: this.getAttribute('title') || 'Chat Assistant',
      theme: JSON.parse(this.getAttribute('theme') || '{}'),
      solarSystemTheme: this.getAttribute('solar-system-theme') === 'true'
    };
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    // Add your chat bubble HTML/CSS here
    this.shadowRoot.innerHTML = `
      <style>
        .chat-container {
          position: fixed;
          ${this.config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
          ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
          z-index: 9999;
        }
        .chat-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #5c078c;
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
      </style>
      <div class="chat-container">
        <button class="chat-button">Chat</button>
      </div>
    `;
  }

  setupEventListeners() {
    // Add your event listeners here
  }
}

customElements.define('sitehq-chat', SiteHQChat);
```

## 4. Testing Implementation

1. Create `client/public/test-widget.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>SiteHQ Chat Widget Test</title>
</head>
<body>
    <h1>Chat Widget Test Page</h1>
    
    <sitehq-chat
      api-key="YOUR_API_KEY"
      agent-id="YOUR_AGENT_ID"
      position="bottom-right"
      theme='{"primary":"#5c078c","background":"#ffffff","text":"#333333"}'
      solar-system-theme="true"
    ></sitehq-chat>
    
    <script src="/standalone-chat-bubble.js"></script>
</body>
</html>
```

## 5. Deployment on Replit

1. Push your code to Replit
2. Add environment variables for API keys in Replit Secrets
3. Configure the run command in the workflow:
```bash
npm run dev
```

## 6. Embed Code for External Websites

Use one of these methods to embed the chat widget:

### Method 1: Script Tag (Recommended)
```html
<script 
  src="https://your-replit-url/standalone-chat-bubble.js" 
  data-sitehq-chat="auto"
  data-api-key="YOUR_API_KEY"
  data-agent-id="YOUR_AGENT_ID"
  data-position="bottom-right"
  data-theme='{"primary":"#5c078c","background":"#ffffff","text":"#333333"}'
  data-solar-system-theme="true">
</script>
```

### Method 2: Custom Element
```html
<script src="https://your-replit-url/standalone-chat-bubble.js"></script>
<sitehq-chat
  api-key="YOUR_API_KEY"
  agent-id="YOUR_AGENT_ID"
  position="bottom-right"
  theme='{"primary":"#5c078c","background":"#ffffff","text":"#333333"}'
  solar-system-theme="true">
</sitehq-chat>
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| api-key | Your SiteHQ API key | Required |
| agent-id | Your agent ID | Required |
| position | Widget position (bottom-right, bottom-left, top-right, top-left) | bottom-right |
| dark-mode | Enable dark mode | false |
| theme | JSON object with theme colors | {} |
| solar-system-theme | Enable solar system animation | false |

## Testing the Widget

1. Access your Replit deployment URL
2. Navigate to `/test-widget.html`
3. Test the following functionality:
   - Chat button appears in correct position
   - Click opens chat window
   - Voice input works
   - Messages display correctly
   - Theme applies properly

## Troubleshooting

Common issues and solutions:

1. Widget not appearing:
   - Check if script URL is correct
   - Verify API key and agent ID
   - Check browser console for errors

2. Voice not working:
   - Ensure page is served over HTTPS
   - Check microphone permissions
   - Verify WebSocket connection

3. Styling issues:
   - Check theme configuration
   - Verify CSS loads correctly
   - Check for conflicts with page styles

## Security Considerations

1. Always use environment variables for API keys
2. Implement proper CORS policies
3. Use HTTPS for all connections
4. Validate user input

Your widget should now be ready for deployment. Replace `YOUR_API_KEY` and `YOUR_AGENT_ID` with your actual credentials when implementing.
