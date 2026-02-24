# System Architecture

**Document Version**: 1.0
**Last Updated**: 2026-02-24

---

## Overview

FuturNod Agent Hub is a full-stack web application built with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Neon serverless)
- **Real-time**: WebSockets
- **AI Provider**: ElevenLabs Conversational AI

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT WEBSITES                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│   │  SiteHQ.com  │  │ FuturNod.com │  │  Client N    │                  │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│          │                 │                 │                           │
│          │    Embed via script/iframe/custom element                     │
│          │                 │                 │                           │
└──────────┼─────────────────┼─────────────────┼───────────────────────────┘
           │                 │                 │
           └────────────────┬┴─────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    FUTURNOD AGENT HUB                                    │
│                  (convo-ai.futurnod.com)                                 │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      FRONTEND (React)                            │   │
│   │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐  │   │
│   │  │ Agent Hub  │  │  Landing   │  │   Deploy   │  │  Widget   │  │   │
│   │  │    (/)     │  │   Pages    │  │   Guides   │  │   Embed   │  │   │
│   │  └────────────┘  └────────────┘  └────────────┘  └───────────┘  │   │
│   │                                                                  │   │
│   │  ┌────────────────────────────────────────────────────────────┐ │   │
│   │  │              ChatBubble (Solar System Bubble)               │ │   │
│   │  │  - Voice conversation UI                                    │ │   │
│   │  │  - Animated avatar                                          │ │   │
│   │  │  - postMessage communication                                │ │   │
│   │  └────────────────────────────────────────────────────────────┘ │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                │                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      BACKEND (Express)                           │   │
│   │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐  │   │
│   │  │  Signed    │  │  Static    │  │ Analytics  │  │   Auth    │  │   │
│   │  │  URL API   │  │   Files    │  │    API     │  │   API     │  │   │
│   │  └─────┬──────┘  └────────────┘  └─────┬──────┘  └───────────┘  │   │
│   │        │                               │                         │   │
│   └────────┼───────────────────────────────┼─────────────────────────┘   │
│            │                               │                             │
│   ┌────────┼───────────────────────────────┼─────────────────────────┐   │
│   │        │          DATABASE             │                         │   │
│   │        │  ┌────────────────────────────┴───────────────────────┐│   │
│   │        │  │  PostgreSQL (Neon)                                 ││   │
│   │        │  │  - admins            - conversations               ││   │
│   │        │  │  - widget_configs    - conversation_metrics        ││   │
│   │        │  │                      - conversation_feedback       ││   │
│   │        │  └────────────────────────────────────────────────────┘│   │
│   └────────┼────────────────────────────────────────────────────────┘   │
│            │                                                             │
└────────────┼─────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        ELEVENLABS API                                    │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │  WebSocket: wss://api.elevenlabs.io/v1/convai/conversation     │    │
│   │  - Real-time voice conversation                                 │    │
│   │  - Audio streaming                                              │    │
│   │  - Agent intelligence                                           │    │
│   └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Widget Embed Flow

```
1. Client loads page with embed code
              │
              ▼
2. convo-widget.js creates iframe pointing to /widget-embed
              │
              ▼
3. Widget-embed page renders ChatBubble component
              │
              ▼
4. User clicks bubble → Terms dialog opens
              │
              ▼
5. User accepts → ChatBubble requests /api/get-signed-url
              │
              ▼
6. Server validates API key, returns ElevenLabs WebSocket URL
              │
              ▼
7. ChatBubble connects to ElevenLabs WebSocket
              │
              ▼
8. Real-time voice conversation begins
              │
              ▼
9. postMessage events resize parent iframe as needed
```

### Configuration Flow

```
1. Agent created in ElevenLabs dashboard
              │
              ▼
2. Config entry added to client/src/config/agents.ts
              │
              ▼
3. Platform build triggered
              │
              ▼
4. Routes auto-generated:
   - /agents/{slug}          → Landing page
   - /agents/{slug}/deploy   → Deployment guide
              │
              ▼
5. Widget embed available at /widget-embed?agentId=X&apiKey=Y
              │
              ▼
6. Client receives embed code from deployment guide
```

---

## Directory Structure

```
SiteHQ-Convo-v1.0/
├── client/                          # React frontend
│   ├── public/
│   │   ├── convo-widget.js          # Embeddable widget loader
│   │   └── assets/                  # Static images
│   ├── src/
│   │   ├── App.tsx                  # Root component + routing
│   │   ├── main.tsx                 # React entry point
│   │   ├── index.css                # Global styles + animations
│   │   ├── config/
│   │   │   ├── agents.ts            # Agent registry (THE source of truth)
│   │   │   └── avatars.ts           # Avatar designs + theme variants
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   └── ChatBubble.tsx   # Solar System Bubble (616 lines)
│   │   │   ├── conversation/
│   │   │   │   └── ConversationFlow.tsx
│   │   │   └── ui/                  # shadcn/ui components (40+)
│   │   ├── pages/
│   │   │   ├── demo.tsx             # Home - Agent Hub
│   │   │   ├── analytics.tsx        # Analytics dashboard
│   │   │   ├── widget-embed.tsx     # Standalone widget for iframe
│   │   │   ├── standalone-widget-docs.tsx
│   │   │   ├── not-found.tsx
│   │   │   ├── agents/
│   │   │   │   ├── AgentPage.tsx         # Route: /agents/:slug
│   │   │   │   ├── AgentDeployPage.tsx   # Route: /agents/:slug/deploy
│   │   │   │   ├── AgentLandingPage.tsx  # Reusable template
│   │   │   │   └── AgentDeployGuide.tsx  # Reusable template
│   │   │   └── admin/
│   │   │       ├── login.tsx
│   │   │       ├── register.tsx
│   │   │       ├── forgot-password.tsx
│   │   │       └── reset-password.tsx
│   │   ├── hooks/
│   │   │   ├── use-toast.ts
│   │   │   └── use-mobile.tsx
│   │   └── lib/
│   │       ├── queryClient.ts
│   │       └── utils.ts
│   └── index.html
│
├── server/                          # Express backend
│   ├── index.ts                     # Server initialization
│   ├── routes.ts                    # API routes + WebSocket setup
│   ├── auth.ts                      # Authentication middleware
│   ├── chat.ts                      # WebSocket chat handler
│   └── vite.ts                      # Vite dev server integration
│
├── db/                              # Database layer
│   ├── schema.ts                    # Drizzle ORM schema
│   └── index.ts                     # Database connection
│
├── docs/                            # Documentation
│   ├── README.md                    # Documentation index
│   ├── overview/
│   │   └── philosophy.md            # Platform philosophy
│   ├── architecture/
│   │   └── system-architecture.md   # This document
│   ├── process/
│   │   └── new-agent-setup.md       # How to add agents
│   ├── agents/
│   │   ├── sitehq.md
│   │   └── futurnod.md
│   ├── avatars/
│   │   └── solar-system-bubble.md   # Design spec
│   ├── deployment/
│   │   ├── sitehq-deploy.md
│   │   └── futurnod-deploy.md
│   ├── roadmap/
│   │   └── future-features.md       # Planned features
│   └── dev/
│       └── 2026-02-24-widget-embed-fixes.md
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
└── replit.md                        # Replit-specific docs
```

---

## Key Components

### Agent Registry (`client/src/config/agents.ts`)

The single source of truth for all deployed agents.

```typescript
interface AgentConfig {
  id: string;           // Unique identifier
  slug: string;         // URL-friendly ID
  name: string;         // Display name
  description: string;  // Short description
  tagline: string;      // Marketing tagline
  logoUrl?: string;     // Logo image path
  agentId: string;      // ElevenLabs agent ID
  apiKey: string;       // Widget API key
  avatarId: string;     // Avatar design to use
  theme: AgentTheme;    // Color theme
  widgetTitle: string;  // Title shown in widget
  brandingUrl: string;  // "Powered by" link
  brandingLabel: string;// "Powered by" text
  createdAt: string;    // Date added
}
```

### Avatar Registry (`client/src/config/avatars.ts`)

Defines avatar designs and their color variants.

```typescript
interface AvatarConfig {
  id: string;
  name: string;
  description: string;
  themeVariants: AvatarThemeVariant[];
  defaultVariantId: string;
}

interface AvatarThemeVariant {
  id: string;
  name: string;
  primary: string;   // Main color
  accent1: string;   // Sun/particle color
  accent2: string;   // Planet/particle color
  glow: string;      // Shadow/glow color
}
```

### ChatBubble (`client/src/components/chat/ChatBubble.tsx`)

The flagship Solar System Bubble widget. 616 lines of:
- Voice conversation UI
- Animated avatar
- Microphone visualization
- Dark mode toggle
- Terms consent dialog
- postMessage iframe communication

### Signed URL Endpoint (`server/routes.ts`)

Validates widget API keys and returns ElevenLabs WebSocket URL.

```
GET /api/get-signed-url?agentId={id}
Authorization: Bearer {apiKey}

Response: { signedUrl: "wss://..." }
```

---

## Database Schema

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│     admins      │     │   widget_configs    │     │    conversations     │
├─────────────────┤     ├─────────────────────┤     ├──────────────────────┤
│ id (PK)         │──┐  │ id (PK)             │──┐  │ id (PK)              │
│ email           │  └──│ admin_id (FK)       │  └──│ config_id (FK)       │
│ password        │     │ name                │     │ agent_id             │
│ created_at      │     │ elevenlabs_api_key  │     │ messages (JSONB)     │
└─────────────────┘     │ agent_id            │     │ started_at           │
                        │ theme (JSONB)       │     │ ended_at             │
                        │ active              │     │ duration             │
                        │ created_at          │     │ total_turns          │
                        │ updated_at          │     │ interruptions        │
                        └─────────────────────┘     │ overall_sentiment    │
                                                    │ sentiment_trend      │
                                                    │ emotional_states     │
                                                    │ created_at           │
                                                    │ updated_at           │
                                                    └──────────┬───────────┘
                                                               │
                        ┌──────────────────────────────────────┼────────────────────────┐
                        │                                      │                        │
                        ▼                                      ▼                        │
            ┌───────────────────────┐          ┌────────────────────────┐              │
            │ conversation_metrics  │          │ conversation_feedback  │              │
            ├───────────────────────┤          ├────────────────────────┤              │
            │ id (PK)               │          │ id (PK)                │              │
            │ conversation_id (FK)  │          │ conversation_id (FK)   │──────────────┘
            │ avg_response_time     │          │ rating                 │
            │ user_engagement_score │          │ feedback               │
            │ completion_rate       │          │ sentiment              │
            │ successful_interrupts │          │ created_at             │
            │ failed_interruptions  │          └────────────────────────┘
            │ created_at            │
            └───────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend Framework | React 18 | UI components |
| Language | TypeScript 5 | Type safety |
| Build Tool | Vite 5 | Fast dev/build |
| Styling | Tailwind CSS | Utility-first CSS |
| UI Components | shadcn/ui + Radix | Accessible primitives |
| Animations | Framer Motion | Smooth animations |
| State Management | TanStack Query | Server state |
| Routing | Wouter | Lightweight routing |
| Backend | Express.js | API server |
| Database | PostgreSQL 16 | Data persistence |
| ORM | Drizzle | Type-safe queries |
| Real-time | WebSocket (ws) | Live conversation |
| AI | ElevenLabs API | Voice conversation |
| NLP | Natural.js | Sentiment analysis |
| Auth | Passport + bcrypt | Authentication |
| Hosting | Replit | Deployment |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create admin account |
| POST | /api/auth/login | Admin login |
| POST | /api/auth/logout | Admin logout |
| GET | /api/auth/status | Check auth status |
| POST | /api/auth/forgot-password | Request reset |
| POST | /api/auth/reset-password | Reset password |

### Widget
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/get-signed-url | Get ElevenLabs WebSocket URL |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/analytics/metrics | Aggregate metrics |
| GET | /api/analytics/feedback | Feedback data |
| GET | /api/analytics/conversation | Conversation details |

### Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /embed* | Redirect to /widget-embed |

---

## Embed Methods

### 1. Script Tag (Recommended)

```html
<script
  src="https://convo-ai.futurnod.com/convo-widget.js"
  data-auto-init="true"
  data-api-key="sk_..."
  data-agent-id="..."
  data-theme='{"primary":"#F95638"}'>
</script>
```

### 2. Custom Element

```html
<script src="https://convo-ai.futurnod.com/convo-widget.js"></script>
<convo-chat-widget
  api-key="sk_..."
  agent-id="..."
  theme='{"primary":"#F95638"}'>
</convo-chat-widget>
```

### 3. IFrame

```html
<iframe
  id="convo-widget-iframe"
  src="https://convo-ai.futurnod.com/widget-embed?apiKey=...&agentId=..."
  style="position: fixed; bottom: 0; right: 0; width: 260px; height: 140px;"
  allow="microphone">
</iframe>
<script>
  window.addEventListener('message', function(e) {
    if (e.data.type === 'convo-widget-toggle') {
      var iframe = document.getElementById('convo-widget-iframe');
      iframe.style.width = e.data.isOpen ? '420px' : '260px';
      iframe.style.height = e.data.isOpen ? '700px' : '140px';
    }
  });
</script>
```

---

## Security Considerations

1. **API Key Validation**: Widget API keys validated server-side
2. **CORS**: Configured to allow cross-origin requests
3. **Session Security**: HTTP-only, secure cookies
4. **Password Hashing**: bcrypt with 10 salt rounds
5. **HTTPS**: All production traffic encrypted
6. **ElevenLabs Key**: Stored server-side only, never exposed to client
