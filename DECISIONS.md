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
