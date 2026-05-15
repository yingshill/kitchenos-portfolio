# KitchenOS Roadmap

## Done

- Initial portfolio prototype — receipt parsing, pantry tracking, meal recommendations, grocery automation
- Shared domain model (`src/kitchen-model.js`) with UMD wrapper for browser + Node
- Automated test suite — 8 tests covering all core flows using Node built-in test runner
- Manual test matrix (`docs/testing.md`) across all views and responsive breakpoints
- Initial product design spec (`docs/product-design.md`)
- Audit pass — `defer` on model script, icon hydration scoped to `root`, pluralization fix, meal-gap category lookup
- Product spec redesign — edge cases for all 5 flows, business rules table, scoring weight rationale, per-view interaction states
- GitHub repository created at https://github.com/yingshill/kitchenos-portfolio

## Active

_(nothing in progress)_

## Backlog

### Features

- Receipt upload pipeline — replace mocked OCR with a real image upload and provider adapter
- URL extraction service — replace fixture matching with actual web/transcript parsing
- AI cover generation adapter — real image model output replacing CSS-generated cover
- Auth-backed persistence — replace `localStorage` with user-scoped server storage
- Product normalization — Open Food Facts or USDA integration for item matching
- Tested service boundaries — scoring, depletion, freshness, URL extraction, cover generation
- Explainable recommendation trace — show per-factor score breakdown in the UI
- Import/export and backup controls for personal data ownership
- Depletion forecast view — project pantry levels forward in time based on `weeklyUse`

### Portfolio artifacts

- Demo video or GIF — full receipt → pantry → meal → grocery loop
- System architecture diagram — end-to-end with adopt vs build layer callouts
- Case study post (LinkedIn) — problem framing, design decisions, production posture

## Artifacts Tracker

| Name | Status | Themes | Placement |
|---|---|---|---|
| Demo video / GIF | Not started | Full kitchen loop | GitHub README, Portfolio |
| Architecture diagram | Not started | System design, adopt vs build | GitHub README, Portfolio, LinkedIn |
| Case study post | Not started | Product thinking, integrated loop | LinkedIn |

## Open Questions

- Should the next production slice prioritize auth/persistence or the receipt upload pipeline?
- Should docs live in `docs/` only or should key spec sections move into the GitHub wiki?
