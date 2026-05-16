# Decisions

Architecture, stack, and design decisions logged at the time they were made. Append-only — reversals are added as new entries.

---

## Dependency-free static build

**Date:** 2026-05-15
**Context:** The portfolio prototype needs to be reviewable by anyone without a terminal, Node install, or API key.
**Options considered:** React/Vite SPA; vanilla JS with a bundler; fully static vanilla JS with no build step.
**Decision:** Fully static — one HTML file, one CSS file, one model module, one app script. Open in browser, done.
**Tradeoffs:** Gained: zero setup friction, no supply chain surface, works offline. Given up: component reuse patterns, hot reload, tree shaking. Acceptable for a portfolio slice; the production version would introduce a build step.

---

## UMD module wrapper for the domain model

**Date:** 2026-05-15
**Context:** `src/kitchen-model.js` needs to be consumed both by the browser (as a global) and by Node's test runner (as a CommonJS module) without a build step.
**Options considered:** ES module with `type="module"` in HTML; two separate files (browser and Node); UMD wrapper that detects the environment.
**Decision:** UMD wrapper — `module.exports` in Node, `root.KitchenModel` in the browser.
**Tradeoffs:** Gained: single source file, no bundler, no import map needed. Given up: native `import/export` syntax, tree shaking. The wrapper is ~7 lines and adds no runtime cost.

---

## localStorage for state persistence

**Date:** 2026-05-15
**Context:** The prototype needs state to survive a page refresh so reviewers can explore without resetting on every load.
**Options considered:** In-memory only (resets on refresh); IndexedDB; localStorage; server-backed persistence.
**Decision:** localStorage with a versioned key (`kitchenos.portfolio.state.v1`) and shallow merge against seed state on load.
**Tradeoffs:** Gained: persistence with zero backend, simple read/write, works offline. Given up: storage size limits (~5 MB), no cross-device sync, no migration path beyond the version key. Acceptable for a portfolio prototype; auth-backed persistence is the first production milestone.

---

## Node built-in test runner — no test framework dependency

**Date:** 2026-05-15
**Context:** The project has no install step, so test dependencies would require `npm install` or bundling test files into the browser.
**Options considered:** Jest; Vitest; Node `--test` (built-in since Node 18); browser-based test harness.
**Decision:** Node built-in `node --test` with `node:assert/strict`. Zero dependencies, runs with `npm test`.
**Tradeoffs:** Gained: no install step, no version conflicts, minimal config. Given up: rich reporters, snapshot testing, watch mode, browser environment in tests. The model is environment-agnostic so Node is sufficient; browser rendering is covered by the manual test matrix.

---

## Generated covers instead of scraped source thumbnails

**Date:** 2026-05-15
**Context:** Recipe/video URL imports need a visual cover. Scraping the source thumbnail requires network access, raises copyright questions, and introduces visual inconsistency.
**Options considered:** Scrape og:image from source URL; use a placeholder image; generate a KitchenOS-styled CSS cover from recipe metadata.
**Decision:** CSS-generated cover using recipe title, ingredients, and a color theme. Original source URL is retained for attribution but no thumbnail is fetched or displayed.
**Tradeoffs:** Gained: visual consistency across all imports, no external network requests, no copyright risk, works offline. Given up: photorealistic food imagery. The production version would use an AI image generation adapter (based on recipe JSON, never scraped source images) — the portfolio design explicitly anticipates this handoff.

---

## Adopt vs build architecture split

**Date:** 2026-05-15
**Context:** A kitchen OS touches several well-solved domains (OCR, nutrition data, product catalogs) and several unique domains (depletion modeling, context-aware scoring, integrated graph).
**Options considered:** Build everything in-house; adopt commodity APIs for everything; explicit adopt/build split at the integration layer.
**Decision:** Adopt for OCR (receipt parsing), nutrition lookup (Open Food Facts / USDA), and product normalization. Build for the depletion model, pantry graph, meal scoring formula, and grocery recovery loop.
**Tradeoffs:** Gained: faster time to value on commodity problems, competitive differentiation focused on the unique layer. Given up: full control over data quality and API availability. The case study view in the prototype makes this split explicit.

---

## Score formula weights — 58 / 18 / 12 / 12 / −18

**Date:** 2026-05-15
**Context:** Meal recommendations need a ranking formula that is explainable to a user and defensible in a product review, not a black-box model.
**Options considered:** Equal weights across all signals; ML-trained weights; hand-tuned weights with documented rationale; binary pass/fail filtering.
**Decision:** Hand-tuned integer weights: coverage 58, mood 18, energy 12, time fit 12, time miss −18. Clamped 0–100.
**Tradeoffs:** Gained: legible formula, explainable in UI, easy to adjust without retraining, clearly defensible in an interview. Given up: personalization, weight learning from user behavior. The asymmetric time penalty (−18 vs +12) is intentional — a time overage actively misleads; a time match is a soft bonus. Designed to be replaced by a weighted service without changing the UI contract.

---

## Defer both scripts in index.html

**Date:** 2026-05-15
**Context:** Audit revealed `src/kitchen-model.js` was loaded synchronously, blocking HTML parse. `app.js` already had `defer`.
**Options considered:** Keep synchronous load (simple, already working); add `defer` to model script; convert to ES modules.
**Decision:** Add `defer` to `kitchen-model.js`. Both scripts download in parallel during HTML parse and execute in document order after parse completes.
**Tradeoffs:** Gained: non-blocking parse, parallel download. Given up: nothing — deferred scripts in document order preserve the dependency (model before app). ES modules were not adopted to avoid changing the UMD pattern and requiring an import map.

---

## Product spec audience — hiring manager over engineering handoff

**Date:** 2026-05-15
**Context:** `docs/product-design.md` needed to be expanded. Two audiences have different needs: a hiring manager wants to be impressed quickly; an engineering handoff wants precision.
**Options considered:** Optimize for engineering handoff (comprehensive, reference-style); optimize for hiring manager (scannable, opinionated, shows thinking); serve both with a longer document.
**Decision:** Optimize for hiring manager as primary reader. Every section must earn its length — dense, scannable, and opinionated. Edge cases, business rules, and scoring rationale are included because they demonstrate product discipline, not just for completeness.
**Tradeoffs:** Gained: stronger portfolio signal, faster to read, forces prioritization of what matters. Given up: exhaustive API-level precision. The business rules table and interaction states section partially bridge the gap for an engineering reader.

---

## Server-side URL extraction proxy using Node built-in http

**Date:** 2026-05-16
**Context:** The browser blocks cross-origin requests to recipe and social sites. URL extraction requires fetching external HTML server-side.
**Options considered:** Express or Fastify; Next.js API routes; Node built-in `http` module with manual routing; Bun server.
**Decision:** Node built-in `http.createServer` with hand-rolled routing. No framework dependency, no `npm install`, starts with `node server.js`.
**Tradeoffs:** Gained: zero dependencies, zero supply chain surface, consistent with the dependency-free constraint, trivial to audit. Given up: middleware ecosystem, body parsing utilities, structured routing. For three endpoints (recipe-import, recipe-correction, cover-generation) the trade is easily justified; the production version would adopt a real framework.

---

## Rednote multi-retry with shell detection

**Date:** 2026-05-16
**Context:** Rednote intermittently returns a generic shell page (`小红书`) with no post content. Saving that as a recipe creates poisoned local state.
**Options considered:** Single fetch and accept whatever returns; retry silently; retry with exponential backoff and reject on persistent shell; require user to paste text manually.
**Decision:** Up to 5 retries with 250 ms × attempt backoff. If all attempts return a shell, throw `ExtractionError` with code `REDNOTE_SHELL_ONLY` (HTTP 502). The client surfaces an actionable message instead of importing bad data.
**Tradeoffs:** Gained: no poisoned imports, explicit error state, user gets a clear prompt to paste text as fallback. Given up: faster single-attempt path. The 5-retry ceiling and backoff are tunable via server config; they reflect observed Rednote behavior during the 2026-05-16 audit.

---

## Speech-to-text as an opt-in adapter boundary

**Date:** 2026-05-16
**Context:** Rednote video posts expose a public MP4 stream but do not expose cooking steps as text. Extracting procedure requires audio transcription.
**Options considered:** Skip transcription entirely (leave steps empty); always transcribe on import; transcribe only when the extraction status is `needs-review` and a media URL was detected.
**Decision:** `src/transcript-extractor.js` is called only when the recipe status is `needs-review` and a `mediaUrl` was returned. If `OPENAI_API_KEY` is absent, returns an explicit `not-configured` payload — the UI surfaces a setup prompt, not a blank state.
**Tradeoffs:** Gained: no API calls when unnecessary, explicit opt-in with clear user messaging, testable boundary with mock fetch. Given up: always-on transcription for all imports. Gating on `needs-review` means a recipe with a schema but no audio never incurs the transcription cost.

---

## AI recipe structuring after transcript via OpenAI Responses API

**Date:** 2026-05-16
**Context:** Raw speech-to-text output from a cooking video lacks structured ingredient lists and numbered steps. A second LLM call can turn transcript text into a structured recipe.
**Options considered:** Parse transcript with the same regex/heuristic pipeline as manual text input; call an LLM with a schema; skip structured output and rely on heuristic parsing.
**Decision:** `src/recipe-structurer.js` calls the OpenAI Responses API with a strict `json_schema` response format. The schema enforces all required fields — `title`, `ingredients`, `steps`, `time`, `servings`, `confidence`, `warnings`. The fallback is heuristic parsing of the raw transcript text (same path as manual correction).
**Tradeoffs:** Gained: structured output with schema enforcement, ingredient category classification, confidence scoring, explicit warnings. Given up: latency and API cost of a second call; dependence on OpenAI structured output support. The fallback means the pipeline degrades gracefully when the structuring call is skipped or fails.

---

## AI cover generation via OpenAI image API

**Date:** 2026-05-16
**Context:** The CSS-generated cover was always a placeholder for a real food image. The production slice adds an opt-in AI image generation step.
**Options considered:** Scrape og:image from source (copyright risk, inconsistent quality); use a stock photo API; use an AI image generation API with a recipe-based prompt.
**Decision:** `src/cover-generator.js` calls `POST /v1/images/generations` with a structured prompt built from recipe title, ingredients, and cooking method. Image is stored as a base64 data URL. Without `OPENAI_API_KEY`, returns a `not-configured` payload that includes the prompt — the UI shows what would be generated.
**Tradeoffs:** Gained: food-accurate imagery, consistent KitchenOS editorial style, no scraping, no copyright risk. Given up: prompt engineering is approximate; model output varies. The prompt includes brand rules (no text, no logos, no hands) to maintain visual consistency across imports.

---

## Batch URL intake with per-job status tracking

**Date:** 2026-05-16
**Context:** Rednote-heavy use cases involve importing multiple URLs in one session. Serial single-URL submission was slow and gave no visibility into batch progress.
**Options considered:** Single URL input only; multiple URL input with single status; multiple URL input with per-URL job tracking; server-sent events for live progress.
**Decision:** Textarea accepts multiple URLs (line-separated or space-separated), parsed with a URL regex. Each URL becomes an `importJob` with `id`, `url`, `status`, and `message`. Jobs run serially (to avoid overwhelming the origin) and render inline as a job list.
**Tradeoffs:** Gained: batch visibility, clear per-URL failure reporting, no UI rewrite required. Given up: parallel extraction (serial is intentional to respect origin rate limits), server-sent events (adds complexity; polling via re-render is sufficient for a small batch). Queue-backed parallel extraction is the production upgrade path.

---

## Recipe library replaces in-browser URL intake

**Date:** 2026-05-16
**Context:** The "Intake" view was used for both URL processing and recipe display. Processing recipe URLs in the browser was slow, gave no batch capability, and cluttered the UI with progress states.
**Options considered:** Keep in-browser intake with better UX; move processing to a background job in the server; move processing to a CLI pipeline entirely.
**Decision:** URL processing moves to `cli/import.js`. The "Intake" view is renamed "Recipe" and becomes a clean grid library of processed recipes. The CLI writes to `recipes.json`; the server serves it; the UI displays it.
**Tradeoffs:** Gained: clean UI with no in-progress noise, batch import via queue.yaml, human notes as AI hints in the CLI. Given up: one-click browser import. The Re-extract action in the recipe panel provides a server-side fallback for one-off corrections.

---

## File-backed recipe library and takeout store

**Date:** 2026-05-16
**Context:** The recipe library and takeout favorites need to persist on disk so the CLI pipeline can write to them and the UI can read from them without going through localStorage only.
**Options considered:** Keep in localStorage only; SQLite via better-sqlite3; plain JSON files served by the Node server; a separate backend service.
**Decision:** `recipes.json` and `takeouts.json` are plain JSON arrays on disk. The server exposes `GET /api/recipes`, `PATCH /api/recipes/:id`, `GET /api/takeouts`, and `PATCH /api/takeouts/:id`. Files are the write target for the CLI and the read source for the UI.
**Tradeoffs:** Gained: zero new dependencies, CLI and UI share one source of truth, files are easily inspected and version-controlled. Given up: concurrent write safety, query capabilities, relational integrity. Acceptable for a single-user local tool; production would replace with a real database.

---

## CLI import pipeline with queue.yaml

**Date:** 2026-05-16
**Context:** Processing recipe URLs one at a time in the browser gave no way to batch imports or attach human notes as AI extraction hints.
**Options considered:** Keep in-browser URL intake; standalone Node script with single URL only; queue file with URL + notes + tags.
**Decision:** `cli/import.js` accepts a single URL or a `queue.yaml` file. YAML entries carry `url`, `notes` (free-form human context forwarded as LLM hints), and `tags`. Processed recipes are written to `recipes.json`. The queue file is the handoff point between human curation and AI extraction.
**Tradeoffs:** Gained: batch processing, human note integration, offline-capable pipeline, no UI noise during processing. Given up: real-time browser progress (replaced by terminal status lines). Queue-backed parallel processing is the production upgrade path.

---

## Claude API as default chat provider with OpenAI fallback

**Date:** 2026-05-16
**Context:** The "Eat" chatbot view needs an LLM provider to generate meal and restaurant recommendations based on pantry, recipe, and takeout context.
**Options considered:** OpenAI only; Claude API only; provider abstraction with env-based switching.
**Decision:** `src/chat-provider.js` wraps both APIs behind a single `chat()` function. `CHAT_PROVIDER=claude` (default) routes to the Anthropic Messages API with `claude-opus-4-7`; `CHAT_PROVIDER=openai` routes to OpenAI chat completions. Uses raw `fetch` throughout — consistent with all other API calls in the project, no SDK dependency.
**Tradeoffs:** Gained: easy A/B testing between providers, prompt caching on the stable system context prefix for Claude, no SDK dependency. Given up: provider-specific features (streaming events, function calling schema differences). The abstraction is a thin one-file shim; if provider differences grow the production version would adopt an SDK per provider.
