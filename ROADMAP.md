# KitchenOS Roadmap

## Done

- Initial portfolio prototype — receipt parsing, pantry tracking, meal recommendations, grocery automation
- Shared domain model (`src/kitchen-model.js`) with UMD wrapper for browser + Node
- Automated test suite — Node built-in test runner covering core flows
- Product spec redesign — edge cases, business rules table, scoring weight rationale
- GitHub repository: https://github.com/yingshill/kitchenos-portfolio
- Recipe URL import pipeline — paste URL → extract → display
- OpenAI integration — recipe structuring, cover generation (gpt-image-1), chat assistant
- 8-view UI — Library, Detail, Import, Pantry, Meals, Grocery, Scan, Chat
- AI cover generation — acrylic marker sketchbook zine style (v1), watercolor style saved as v2
- Cover generation moved to CLI import pipeline (no UI button)
- AI summary rewrite — single appetizing sentence, auto-runs on import (`src/summary-rewriter.js`)
- Per-ingredient enrichment — AI assigns emoji + original quantity text (`src/recipe-enricher.js`)
- Recipe tags — 13 categories (soup, bread, dessert, etc.) with filter chips in library
- Auto re-structure low-quality extractions — detects ≤2 ingredients or blob-step, reruns structurer
- Serving display redesign — shows original measurement text ("250g", "2个") instead of numeric
- Sync fix — server always wins; localStorage never preserves stale covers
- Tag filter UI — chip row in library view, filters recipes client-side
- Removed UI buttons: "Generate AI cover", "Re-extract" (both are CLI-only operations)
- `.env.local` refactored with section headers and inline comments
- `DECISIONS.md` up to date with all architectural changes through 2026-05-17

## Active

- **Notion integration** — single source of truth for recipe collection
  - Schema: one row per recipe, `Primary URL` (Xiachufang) + `Video URL` (Rednote)
  - Build: `src/notion-client.js`, `cli/notion-sync.js`, update `GET /api/recipes` to read Notion
  - User is building Notion DB; Notion credentials already in `.env.local`

## Backlog

### Features

- **Xiachufang scraper** — dedicated extractor for 下厨房 URLs (primary text source)
- **Rednote video transcription** — ffmpeg + Whisper pipeline for video-only posts
- **Notion sync CLI** — `cli/notion-sync.js` polls for `saved` status rows, runs extraction, writes back
- Recipe title cleanup — strip leading emojis and pipe-separated suffixes from display
- Auth-backed persistence — replace `localStorage` with user-scoped server storage
- Tested service boundaries — extraction, enrichment, cover generation unit tests
- Depletion forecast view — project pantry levels forward based on `weeklyUse`
- Import/export and backup controls

### Portfolio artifacts

- Demo video / GIF — import URL → AI cover → recipe detail loop
- System architecture diagram — CLI pipeline, AI enrichment chain, Notion sync, server
- Case study post (LinkedIn) — recipe collection system: sourcing strategy, AI pipeline, decisions

## Artifacts Tracker

| Name | Status | Themes | Placement |
|---|---|---|---|
| Demo video / GIF | Not started | Import → cover → browse loop | GitHub README, Portfolio |
| Architecture diagram | Not started | CLI pipeline, AI chain, Notion sync | GitHub README, Portfolio, LinkedIn |
| Case study post | Not started | Recipe sourcing strategy, AI enrichment | LinkedIn |

## Open Questions

- Notion sync: should confidence threshold gate auto-publish, or should all extractions be reviewed?
- Rednote video: ffmpeg download first or GPT-4o Vision on keyframes as a lightweight fallback?
- Should Xiachufang extractor reuse the existing HTML extraction path or get a dedicated parser?
