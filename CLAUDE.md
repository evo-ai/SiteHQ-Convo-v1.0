# Claude Code Instructions for SiteHQ Convo

## Rule Sync Protocol (CRITICAL)

**These rules MUST stay in sync with `.cursorrules`.**

When modifying this file (`CLAUDE.md`):
1. Apply the same changes to `.cursorrules`
2. Keep both files structurally aligned
3. Update the "Last Synced" timestamp in both files

When you notice `.cursorrules` has changes not reflected here:
1. Pull those changes into this file
2. Ensure consistency between both rule sets

**Last Synced**: 2026-02-24

---

## Handshake Protocol (CRITICAL)

This project is shared between multiple AI assistants (Claude Code, Cursor, Replit AI).
A living handshake document ensures continuity.

### At Session Start
1. **Read `docs/HANDSHAKE.md`** - Understand current project state
2. Check "Recent Changes Log" for context
3. Review "Pending Tasks" for work to pick up
4. Note "Known Issues & Gotchas"

### At Session End
1. **Update `docs/HANDSHAKE.md`**:
   - "Last Updated" date and "Updated By" field
   - "Quick Status" table
   - "Recent Changes Log" with your work summary
   - "Pending Tasks" (mark complete, add new)
   - Any new issues discovered
2. Run `npm run check` (TypeScript verification)
3. Run `npm run build` (build verification)

## Project Overview

**SiteHQ Convo** - Embeddable AI chat widget platform powered by ElevenLabs voice AI.

### Architecture

| Component | Technology | Entry Point |
|-----------|------------|-------------|
| Main App | React 18, Vite | `client/src/main.tsx` |
| Widget | Preact, Shadow DOM | `client/src/widget/index.tsx` |
| Server | Express, TypeScript | `server/index.ts` |

### Key Files

- `docs/HANDSHAKE.md` - **Living coordination document**
- `widget.vite.config.ts` - Widget build config
- `.env.example` - Environment variable template
- `replit.md` - Replit deployment instructions

## Code Standards

### TypeScript
- Strict mode - no `any` without justification
- Add interfaces for all data structures
- Use `import type` for type-only imports

### Security
- NEVER hardcode secrets
- Use `process.env` (server) or `import.meta.env` (client)
- Document new env vars in `.env.example` AND `docs/HANDSHAKE.md`

### Widget Constraints
- Bundle must stay under 30KB gzipped (currently ~16KB)
- Uses Preact, not React
- All CSS in `client/src/widget/styles.css`

## Quick Commands

```bash
npm run dev              # Dev server
npm run dev:widget       # Widget watch mode
npm run build            # Full build
npm run check            # TypeScript check
```

## Don't Do

- Don't skip HANDSHAKE.md updates
- Don't add heavy dependencies without checking bundle impact
- Don't modify `.replit` unless necessary
- Don't hardcode secrets
- Don't use console.log in production code

## Collaboration Notes

This codebase is shared between:
- **Claude Code / Cursor** - Feature development, refactoring
- **Replit AI** - Deployment, environment configuration

### Key Coordination Files

| File | Purpose | Sync With |
|------|---------|-----------|
| `docs/HANDSHAKE.md` | Living project state | — (single source of truth) |
| `CLAUDE.md` | Claude Code rules | `.cursorrules` |
| `.cursorrules` | Cursor AI rules | `CLAUDE.md` |
| `replit.md` | Replit AI context | — |

**Remember**: When updating `CLAUDE.md` or `.cursorrules`, always update BOTH files to keep them in sync!

## Related Docs

- [docs/HANDSHAKE.md](docs/HANDSHAKE.md) - AI coordination
- [docs/dev/](docs/dev/) - Development documentation
- [docs/deployment/](docs/deployment/) - Deployment guides
