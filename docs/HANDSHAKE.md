# AI Assistant Handshake Document

**Purpose**: Living document for seamless handoff between AI assistants (Claude Code, Cursor, Replit AI)
**Last Updated**: 2026-02-24 (Session 2)
**Updated By**: Claude Code (Opus 4.5)

## Document Scope

**This is a MAP, not the TERRITORY.**

### What belongs here:
- ✅ Current project state snapshot
- ✅ Quick reference information
- ✅ Recent changes **summary** (1-2 sentences)
- ✅ **References** to detailed docs in `docs/dev/`
- ✅ Pending tasks and known issues

### What does NOT belong here:
- ❌ Extensive technical details
- ❌ Full implementation plans
- ❌ Complete change logs
- ❌ Architecture deep-dives

**For detailed technical work**, see `docs/dev/` folder. Each dev work gets its own file with full planning + debrief.

---

## Quick Status

| Aspect | Status |
|--------|--------|
| **App State** | Functional - Development |
| **Last Major Work** | Widget embed redesign (Shadow DOM + Preact) |
| **Build Status** | Passing |
| **Pending Tasks** | Widget testing on host pages, deployment docs update |
| **Blocking Issues** | None |

---

## Project Identity

**Name**: SiteHQ Convo (Conversational AI Widget Platform)
**Type**: Full-stack TypeScript application
**Purpose**: Embeddable AI chat widget powered by ElevenLabs voice AI

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS, Radix UI |
| Backend | Express.js, TypeScript |
| Database | Drizzle ORM (SQLite/PostgreSQL) |
| Voice AI | ElevenLabs Conversational AI (@11labs/client) |
| Widget | Preact, Shadow DOM, IIFE bundle |
| Auth | Passport.js (local strategy) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      SiteHQ Convo                           │
├─────────────────────────────────────────────────────────────┤
│  client/                 │  server/                         │
│  ├── src/                │  ├── index.ts (entry)            │
│  │   ├── pages/          │  ├── routes.ts (API endpoints)   │
│  │   ├── components/     │  ├── chat.ts (conversation logic)│
│  │   └── widget/    ←────┼──┤  ├── auth.ts (authentication) │
│  │       (Preact bundle) │  └── storage.ts (data layer)     │
│  └── public/             │                                  │
├─────────────────────────────────────────────────────────────┤
│  Embeddable Widget (dist/widget/convo-widget.js)            │
│  - Shadow DOM isolated                                      │
│  - ~16KB gzipped                                            │
│  - Self-contained IIFE bundle                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Entry Points

| Purpose | File |
|---------|------|
| Server entry | `server/index.ts` |
| Client entry | `client/src/main.tsx` |
| Widget entry | `client/src/widget/index.tsx` |
| Main Vite config | `vite.config.ts` |
| Widget Vite config | `widget.vite.config.ts` |

---

## Environment & Secrets

### Required Environment Variables

```bash
# ElevenLabs API
ELEVENLABS_API_KEY=          # For signed URL generation

# Widget Authentication
VITE_WIDGET_API_KEY=         # Client-side widget API key
WIDGET_API_KEY=              # Server-side validation (must match)

# Session Security
COOKIE_SECRET=               # Express session encryption (required, no fallback)

# Database (if using PostgreSQL)
DATABASE_URL=                # Connection string
```

### Template File
See `.env.example` for full template with descriptions.

### Replit Secrets
In Replit, these are stored in the **Secrets** tab (not in git):
- `ELEVENLABS_API_KEY`
- `WIDGET_API_KEY`
- `COOKIE_SECRET`
- `DATABASE_URL` (if applicable)

**Important**: Replit injects secrets as environment variables at runtime. The `.env` file is NOT used in Replit - use their Secrets UI instead.

---

## Replit-Specific Configuration

### Files Replit Maintains

| File | Purpose | In Git? |
|------|---------|---------|
| `.replit` | Run configuration, build commands | Yes |
| `replit.nix` | Nix packages for environment | Yes |
| `.replit.deployments/` | Deployment history/config | No |
| `.cache/` | Build cache | No |
| `.config/` | User config | No |
| `.upm/` | Package manager cache | No |

### .replit Configuration

```toml
run = "npm run start"
entrypoint = "server/index.ts"

[deployment]
run = ["sh", "-c", "npm run start"]
build = ["sh", "-c", "npm run build"]

[nix]
channel = "stable-24_05"
```

### How Replit Deploys

1. **Build Phase**: Runs `npm run build` which:
   - Builds client with Vite → `dist/public/`
   - Builds widget with separate Vite config → `dist/widget/`
   - Bundles server with esbuild → `dist/index.js`

2. **Run Phase**: Executes `npm run start` which:
   - Sets `NODE_ENV=production`
   - Runs `node dist/index.js`

3. **Static Files**: Express serves from `dist/public/` and `dist/widget/`

4. **Domain**: Deployed at `convo-ai.futurnod.com` (custom domain) or `*.replit.app`

---

## Recent Changes Log

**Format**: Keep entries concise (2-3 lines). Link to detailed docs in `docs/dev/` for full information.

---

### 2026-02-24 (Session 2) - Documentation Scope Clarification

Clarified HANDSHAKE.md scope: it's a MAP (quick reference, summaries), not TERRITORY (detailed docs). Detailed technical work belongs in `docs/dev/`. Added Document Scope section and updated Recent Changes format to be concise with references.

---

### 2026-02-24 (Session 2) - AI Coordination System

Created handshake protocol and rule sync system for seamless AI assistant coordination. Added `HANDSHAKE.md`, `CLAUDE.md`, `.cursorrules` with bidirectional sync rules. Fixed TypeScript errors in widget files.

**Build**: ✅ Passing

---

### 2026-02-24 - Widget Embed Redesign

Replaced iframe-based widget with Shadow DOM + Preact injection. Eliminates white card problem, achieves 16KB gzipped bundle.

**Details**: [docs/dev/2026-02-24-widget-embed-redesign.md](dev/2026-02-24-widget-embed-redesign.md)

---

### 2026-02-24 - Codebase Cleanup

Production hardening: removed 39 unused files, fixed 5 security issues, improved type safety, removed hardcoded secrets.

**Details**: [docs/dev/2026-02-24-codebase-cleanup.md](dev/2026-02-24-codebase-cleanup.md)

---

## Pending Tasks

| Task | Priority | Notes |
|------|----------|-------|
| Test widget on various host pages | High | Light/dark themes, different CSP policies |
| Update deployment docs | Medium | New widget bundle location |
| Deploy widget to CDN | Medium | Production CDN distribution |
| Add widget size monitoring | Low | Ensure bundle stays < 30KB |

---

## Known Issues & Gotchas

### 1. Widget Bundle Size
The widget must stay under 30KB gzipped. Currently ~16KB. Monitor after changes.

### 2. ElevenLabs Agent IDs
Each agent has a unique ID from ElevenLabs dashboard. The default "Futurnod" agent ID is in `client/src/config/agents.ts`.

### 3. CORS Configuration
Server allows specific origins for widget embedding. See `server/routes.ts` CORS setup.

### 4. Session Storage
Using `memorystore` for sessions. In production with multiple instances, switch to Redis.

### 5. TypeScript Strict Mode
Project uses strict TypeScript. Don't use `any` - add proper types instead.

---

## File References

| Document | Purpose |
|----------|---------|
| [docs/dev/2026-02-24-codebase-cleanup.md](dev/2026-02-24-codebase-cleanup.md) | Detailed cleanup documentation |
| [docs/dev/2026-02-24-widget-embed-redesign.md](dev/2026-02-24-widget-embed-redesign.md) | Widget redesign (implemented) |
| [docs/deployment/sitehq-deploy.md](deployment/sitehq-deploy.md) | Deployment guide |
| [docs/README.md](README.md) | Documentation index |
| [replit.md](../replit.md) | Replit-specific instructions |
| [.env.example](../.env.example) | Environment variable template |

---

## Communication Protocol

### When Starting Work

1. **Read this document first** - Understand current state
2. **Check Recent Changes Log** - See what was done recently
3. **Check Pending Tasks** - Pick up where others left off
4. **Review any blocking issues** - Don't repeat failed approaches

### When Ending Work

1. **Update Quick Status** - Current app state
2. **Add to Recent Changes Log** - Concise summary (2-3 lines)
3. **Create detailed doc in `docs/dev/`** - For significant work (see below)
4. **Update Pending Tasks** - What's left to do
5. **Document any new issues** - Problems discovered
6. **Update "Last Updated" and "Updated By"** at top

### When to Create Detailed Docs in `docs/dev/`

Create a file in `docs/dev/{YYYY-MM-DD}-{feature-name}.md` for:
- ✅ New features or major refactors
- ✅ Bug investigations and fixes
- ✅ Architecture changes
- ✅ Security fixes
- ✅ Performance optimizations

**Detailed docs should include**:
- Problem statement / motivation
- Approach and alternatives considered
- Implementation details
- Files changed
- Testing notes
- Known limitations or follow-ups

### Handoff Checklist

Before pushing changes:
- [ ] Code compiles (`npm run check`)
- [ ] Build succeeds (`npm run build`)
- [ ] No hardcoded secrets
- [ ] This document updated
- [ ] Relevant docs updated if needed

---

## Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev:widget       # Watch widget changes

# Building
npm run build            # Full production build
npm run build:widget     # Widget only

# Verification
npm run check            # TypeScript check
npm run db:push          # Push database schema

# Production
npm run start            # Start production server
```

---

## Notes for Specific AIs

### For Replit AI
- You control deployment and the Secrets tab
- Update this doc after any `.replit` or deployment changes
- If adding new env vars, document them here AND in `.env.example`

### For Claude Code / Cursor
- You do most feature development and refactoring
- Update Recent Changes Log after significant work
- Don't modify `.replit` or `replit.nix` unless necessary
- Always run `npm run check` before finishing
- **SYNC RULE**: Keep `CLAUDE.md` and `.cursorrules` in sync — changes to one must be applied to the other

### Rule Files Sync Matrix

| If you modify... | Also update... |
|------------------|----------------|
| `CLAUDE.md` | `.cursorrules` |
| `.cursorrules` | `CLAUDE.md` |
| Either rule file | Update "Last Synced" timestamp in both |

---

*This is a living document. Keep it current for smooth handoffs.*
