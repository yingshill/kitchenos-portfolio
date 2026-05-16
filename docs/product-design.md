# Product Design

## Product Summary

KitchenOS is a personal kitchen management system that connects receipt intake, recipe/article/video URL intake, pantry state, meal recommendations, and grocery recovery. The product treats external cooking sources as evidence to be fetched, transcribed when needed, and structured into a kitchen graph rather than copied as static bookmarks.

## Target User

Primary user: a busy individual or household operator who buys groceries across multiple stores, wants less waste, and wants practical meal suggestions based on what is already available.

Secondary audience: technical reviewers evaluating product thinking, frontend execution, service boundaries, AI extraction architecture, domain modeling, and test discipline.

## Problem

Kitchen planning usually breaks at handoff points. Each existing tool solves one silo and drops the data at the boundary:

| Silo | What existing tools do | Where the handoff fails |
|---|---|---|
| Receipts | Store purchase history as static records | Never become live inventory |
| Recipe/video sources | Live on external platforms | Metadata may expose only a title or tags; cooking procedure often lives in video audio/subtitles |
| Pantry | Track stock in isolation | No awareness of meal intent or freshness urgency |
| Meal planning | Suggest recipes from a fixed catalog | Ignore what is actually available, expiring, or low |
| Grocery lists | Accept manual entry | Never close the loop after cooking or low-stock events |

KitchenOS treats each handoff as a first-class product problem. The receipt becomes inventory. A video URL becomes metadata plus transcript evidence, then AI-structured ingredients and procedure. The pantry drives meal recommendations. The meal recommendations drive the grocery list.

## Product Goals

- Convert receipt line items into pantry inventory with confidence and source metadata.
- Convert recipe/article/video URLs into structured ingredients, detailed cooking steps, pantry coverage, and grocery gaps.
- For video sources, derive procedure from subtitles/transcripts or speech-to-text over the media, not from metadata alone.
- Use AI to transform transcript and source metadata into structured recipe data, with confidence and review state.
- Store original recipe links for attribution while displaying only KitchenOS-generated covers for visual consistency.
- Maintain a useful pantry graph: quantity, freshness risk, projected depletion, and stock thresholds.
- Recommend meals using both context and constraints: mood, energy, time, and pantry coverage.
- Generate grocery gaps from low stock and meal requirements without duplicating existing list items.
- Present the product as a portfolio case study without turning the first screen into marketing copy.

## Non-Goals

- Live OCR integration for uploaded receipts.
- Nutrition macro optimization.
- Multi-user collaboration.
- Payment, delivery, or retailer checkout integrations.
- Bypassing login walls, DRM, private APIs, or platform terms to access unavailable video/caption data.
- Fabricating cooking procedure when no transcript, subtitle, caption, or media evidence is available.

## User Stories

**Returning from the store.**
As someone who just got home from the store, I want to import my receipt so my pantry reflects what I actually bought — not what I planned to buy. The result is that meal recommendations and low-stock signals are accurate from the moment I walk in the door.

**Deciding what to cook tonight.**
As someone deciding what to make tonight, I want ranked meal suggestions that account for my current mood, energy level, available time, and what I already have on hand. The result is a short list I can act on immediately, with transparent ingredient coverage so I know why each meal ranked where it did.

**Planning a shopping trip.**
As someone planning a shopping trip, I want a grocery list that combines low-stock items and missing meal ingredients automatically, without requiring me to remember what I ran out of. The result is a categorized list I can check off in the store, knowing it was generated from real pantry state.

**Importing a cooking video.**
As someone saving a cooking video, I want KitchenOS to inspect the public post, find the video or transcript, use AI to infer the actual cooking procedure, and tell me when the evidence is incomplete. The result is that I can trust the imported recipe instead of hand-auditing a guessed list.

## Core User Flows

### Receipt to Pantry

1. User opens Intake.
2. User reviews parsed merchant, date, total, confidence, and line items.
3. User imports a ready receipt.
4. System merges known items, creates new pantry records, marks the receipt imported, and logs an activity event.

**Edge cases**

- Receipt already imported: import is blocked and no pantry mutation occurs. Status remains `"imported"`.
- Receipt item matches an existing pantry item (case-insensitive name match): servings are added together, `expiresIn` takes the longer of the two values, and `source` updates to the new merchant.
- Receipt item is new to the pantry: created with category-based `minServings` default (Produce = 2, all other categories = 1).
- Receipt with zero line items: import completes with no pantry effect; an activity event is still logged.

### Recipe URL to Meal

1. User pastes a recipe, article, or video URL.
2. Browser accepts one or more URLs and sends each URL to the local extraction server.
3. Server normalizes tracking-heavy URLs for storage while preserving the original URL for fetching when a share token is required.
4. Server fetches public page HTML and extracts source metadata: title, creator, host, tags, social post state, JSON-LD Recipe schema, and video/media URLs when exposed.
5. If Recipe schema exists, the system parses ingredients and instructions directly.
6. If the source is a video and no structured recipe exists, the system attempts evidence extraction in this order:
   - platform-provided subtitles or caption text;
   - embedded transcript fields;
   - speech-to-text transcription from the public media URL when `OPENAI_API_KEY` is configured;
   - visible caption/description text as partial evidence.
7. AI receives transcript/caption evidence plus metadata and returns structured recipe JSON: title, summary, ingredients, servings, time, steps, confidence, warnings, and cover prompt inputs.
8. System generates or regenerates a KitchenOS-style cover from the structured recipe data.
9. User adds missing ingredients to Grocery or saves the imported source as a meal.

**Edge cases**

- Non-HTTP/HTTPS URL (`ftp:`, `mailto:`, or malformed): rejected before any state change; `lastAction` returns a prompt to enter a valid URL.
- URL with a hash fragment: hash is stripped before deduplication and storage; the stored `sourceUrl` never contains a fragment.
- Tracking parameters (`utm_*`, `xsec_token`, `xsec_source`, `source`, etc.): removed from the stored canonical URL after fetch-sensitive share tokens have been used.
- Duplicate URL (same normalized href already in `recipeImports`): no new import is created; the existing record is selected and displayed. Older fixture-shaped imports can be refreshed with live extraction metadata.
- Re-extract selected import: uses the original fetch URL when available, including share tokens needed to resolve Rednote posts.
- Rednote returns only a generic shell page (`小红书`) after retries: import fails with a retry/manual-review message instead of saving a bogus recipe.
- Video source exposes only title/tags and no transcript/media: import is marked `needs-review`; the UI must not invent procedure.
- Video transcript exists but AI confidence is low: structured fields are shown with warnings and review state.
- Speech-to-text adapter is not configured: metadata/caption extraction still runs; video procedure remains `needs-review`.
- Video stream exposed but no transcript configured: warning explains that speech-to-text is required; procedure is not fabricated.
- AI extraction fails or times out: deterministic metadata extraction is preserved, warning is shown, and manual correction remains available.
- Imported recipe saved as meal a second time: operation is a no-op; `savedAsMeal` is already `true` and the button is disabled.
- All ingredients already in pantry: "Add missing to grocery" adds nothing and `lastAction` confirms coverage is complete.

### Review and Correction

1. If extraction is incomplete or wrong, user opens the imported recipe review area.
2. User can paste source caption, transcript text, or corrected procedure, and can optionally override a wrong extracted title.
3. System re-runs text extraction and AI structuring against the provided evidence.
4. Existing recipe import is updated in place: ingredients, steps, summary, confidence, warnings, cover theme, and cover prompt are regenerated.
5. Pantry coverage, grocery gaps, and save-as-meal output update from the corrected recipe.

**Edge cases**

- Empty correction text: rejected before any state mutation.
- Blank title override: pasted text can provide a title; otherwise the prior metadata title is retained.
- Correction removes all steps or all ingredients: recipe remains `needs-review`; grocery and save actions are disabled where appropriate.
- Correcting an import already saved as a meal: future implementation should either update the derived meal or prompt the user to refresh the saved meal. Current model keeps saved-meal mutation explicit.

### AI Cover Generation

1. Every recipe import stores a KitchenOS cover prompt derived from the current normalized recipe JSON.
2. When recipe fields change through extraction or review, any prior AI image is invalidated and cover status returns to `prompt-ready`.
3. User clicks Generate AI cover to request a provider image from the local server.
4. If `OPENAI_API_KEY` is configured, the server sends the cover prompt to the image provider and stores the returned image data URL.
5. If image generation is not configured or fails, the UI shows an explicit cover status and message rather than an empty cover.

**Cover guideline**

- Source of truth: use the corrected recipe JSON, not the scraped platform thumbnail.
- Subject: one finished dish that matches the title, ingredients, and cooking method.
- Composition: square editorial food photography, overhead or 3/4 angle, clean home-kitchen plating, natural daylight.
- Brand safety: no text, logos, watermarks, packaging, hands, collage layouts, or unrelated ingredients.
- Regeneration: title, ingredients, steps, and summary changes must regenerate the prompt before any new image is requested.

### Pantry Monitoring

1. User opens Pantry.
2. User filters by category or searches by ingredient.
3. User sees stock level, minimum threshold, freshness window, projected depletion, and source.
4. User manually uses or restocks servings.

**Edge cases**

- Use-one-serving at zero servings: floored at 0; repeated clicks do not produce negative values.
- Item with `expiresIn = 0`: renders under freshness risk with the danger (tomato) badge; projected-depletion calculation is unaffected.
- Search with no matches: an empty-state message is shown within the list area; the active category filter is preserved.
- Search and category filter active simultaneously: both conditions must match for an item to appear.

### Meal Decision

1. User selects mood, energy, and available time.
2. System ranks meals by pantry coverage, mood fit, energy fit, and time fit.
3. User cooks a stocked meal.
4. System depletes pantry servings.
5. If the meal has missing ingredients, the system adds grocery gaps instead of depleting pantry.

**Edge cases**

- Meal time exceeds `maxTime`: an 18-point penalty is applied; the meal still appears in the ranked list and can be cooked.
- All meals have missing ingredients: every card shows gap count; cooking any of them creates grocery entries rather than depleting pantry.
- Cooking a meal with missing ingredients: grocery gaps are created; pantry is NOT depleted until a subsequent cook attempt after gaps are filled.
- Missing ingredient already exists in grocery list: deduplication prevents a second entry (case-insensitive name match).

### Grocery Recovery

1. User opens Grocery.
2. User syncs low-stock and meal-gap candidates.
3. System adds missing items that are not already on the list.
4. User checks off, reopens, deletes, or manually adds items.

**Edge cases**

- Sync with no new candidates: `lastAction` confirms the list already covers current gaps; no event is logged.
- Manually added item with the same name as a gap candidate: the case-insensitive duplicate check prevents the candidate from being added by a subsequent sync.
- Recipe gap sync and low-stock sync both reference the same item: the first operation to add the item wins; the second is silently deduplicated.
- Checking off an item then syncing again: checked items are not removed from the list and do not affect gap detection, so they will not be re-added by sync.

## Information Architecture

- Command: operational overview, graph, top meal recommendations, and recent events.
- Intake: recipe/article/video URL extraction, transcript/review state, generated cover, source link, receipt preview, confidence state, and import queue.
- Pantry: searchable, filterable inventory with stock and freshness signals.
- Meals: ranked recommendations and pantry coverage explanations.
- Grocery: grouped grocery list and gap sync.
- Case Study: architecture, product rationale, build-versus-adopt decision, and next production slice.

## Extraction Architecture

The URL intake path is split into service stages so the product can distinguish verified evidence from AI inference.

1. Browser UI collects the URL and sends it to the local server. The browser never tries to scrape third-party pages directly because CORS blocks many public sources.
2. URL normalizer strips fragments and tracking params for storage, but the fetcher can retain share tokens needed to resolve a social post.
3. Page fetcher retrieves public HTML with normal browser-like headers and follows redirects.
4. Page parser extracts Recipe JSON-LD, Open Graph metadata, social initial-state data, title, creator, tags, descriptions, video duration, and media URLs.
5. Transcript resolver checks for platform subtitles, embedded transcript fields, caption text, and public video/audio media.
6. Speech-to-text adapter transcribes accessible public media when subtitles are unavailable.
7. AI structuring adapter receives only evidence text plus metadata and returns structured recipe JSON with ingredients, steps, time, servings, confidence, and warnings.
8. Domain model validates and normalizes the AI result before mutating app state.
9. Cover generation uses the normalized recipe JSON, not scraped thumbnails, so the visual result updates whenever the recipe is corrected.
10. Review UI shows warnings and lets the user provide missing evidence when the pipeline cannot access enough public data.

**Trust contract:** metadata can identify a video, but metadata alone cannot prove cooking procedure. A complete video import requires transcript, subtitle, caption, or speech-to-text evidence. If none exists, the product must keep the import in `needs-review`.

## Data Model

Pantry item:

- `id`
- `name`
- `category`
- `servings`
- `minServings` — low-stock threshold; category-defaulted on receipt import
- `weeklyUse` — used to compute projected depletion in days
- `expiresIn` — days remaining at last update; not an absolute date
- `price` — stored per serving, not per purchase unit
- `source` — merchant name or `"Pantry"` for pre-existing items

Receipt:

- `id`
- `merchant`
- `date`
- `total`
- `confidence` — OCR confidence percentage (0–100)
- `status` — `"ready"` or `"imported"`; one-way transition
- `items` — array of line items with `name`, `category`, `servings`, `price`, `expiresIn`

Meal:

- `id`
- `name`
- `summary`
- `time` — cook time in minutes
- `energy` — `"low"`, `"medium"`, or `"high"`
- `moods` — array of mood strings the meal is suited for
- `needs` — array of `{ item, servings }` references to pantry item names
- `sourceImportId` — present when created from a recipe URL import

Grocery item:

- `id`
- `name`
- `category`
- `qty` — display string (e.g. `"2 servings"`, `"1 bottle"`)
- `source` — `"Manual"`, `"Low stock"`, `"Meal gap"`, or `"URL recipe gap"`
- `done` — boolean; persisted

Recipe URL import:

- `id`
- `sourceUrl` — canonical, hash-stripped, tracking-stripped after fetch
- `sourceHost` — hostname with `www.` removed
- `sourceType` — `"article"`, `"video"`, `"social"`, or `"manual"`
- `title`
- `creator`
- `confidence` — extraction confidence percentage
- `time`
- `servings`
- `cover` — `{ status, theme, prompt, guidelineVersion, imageDataUrl, message }`; status is `"prompt-ready"`, `"not-configured"`, `"ai-generated"`, or `"error"`; never a scraped thumbnail
- `ingredients` — array of `{ name, category, servings }`
- `steps` — array of instruction strings
- `summary`
- `extractionStatus` — `"complete"` or `"needs-review"`
- `warnings` — array of extraction caveats visible in the review UI
- `savedAsMeal` — boolean; once true, the save action is disabled

Extraction artifact:

- `sourceUrl`
- `sourceHost`
- `sourceType`
- `metadata` — title, creator, description, tags, video duration, social stats where public
- `media` — public video/audio URL and duration when exposed
- `transcript` — `{ status, source, language, text }`; source can be `"subtitle"`, `"embedded"`, `"speech-to-text"`, or `"manual"`
- `aiExtraction` — structured recipe JSON, confidence, warnings, and model/provider metadata
- `rawEvidenceRefs` — references to fetched artifacts; large media should not be persisted in local app state

Event:

- `id`
- `kind` — `"scan"`, `"pantry"`, `"meal"`, or `"grocery"`
- `title`
- `detail`

## Business Rules

These rules are enforced in the domain model (`src/kitchen-model.js`) and are documented here to keep the spec self-contained.

| Rule | Value |
|---|---|
| `minServings` default — Produce | 2 |
| `minServings` default — all other categories | 1 |
| `weeklyUse` default — Produce | 3 |
| `weeklyUse` default — all other categories | 2 |
| Price stored as per-serving | `receipt line price ÷ max(servings, 1)` |
| Freshness risk threshold | `expiresIn ≤ 4 days` |
| Low-stock threshold | `servings ≤ minServings` |
| `expiresIn` merge on receipt import | `Math.max(existing, incoming)` — keeps the longer window |
| Event log cap | 6 most recent entries; older events are discarded |
| Grocery sync scope | Low-stock items plus gaps from the top 2 ranked meals |
| URL hash stripping | Fragment removed before deduplication and storage |
| URL tracking cleanup | Tracking params stripped from stored canonical URL; original fetch URL may retain required share token during fetch |
| `sourceHost` normalization | `www.` prefix removed for display |
| Video procedure source of truth | Transcript/subtitle/speech-to-text evidence, not title/tags alone |
| AI extraction output | Must include ingredients, steps, confidence, warnings, and status |
| No transcript/media available | Mark `needs-review`; do not fabricate cooking steps |
| Meal energy inferred on URL import | `time ≤ 20 min → "low"`, `time > 20 min → "medium"` |
| Meal moods inferred on URL import | `time ≤ 20 min → ["tired", "focused"]`, else `["steady", "social"]` |
| Meal serving needs cap on URL import | `Math.min(ingredient.servings, 2)` per need item |
| Grocery category for meal-gap items | Pantry item category if the item exists in pantry; `"Pantry"` otherwise |

## Recommendation Logic

Meal score is intentionally explainable:

- Pantry coverage: up to 58 points.
- Mood match: 18 points.
- Energy match: 12 points.
- Time fit: 12 points.
- Time miss: −18 point penalty.

The score is clamped from 0 to 100.

**Weight rationale.** Pantry coverage earns 58 of 100 points because the system's core promise is to use what is already on hand — a meal that requires a full grocery run is not a recommendation, it is a shopping list. Mood is the next-highest signal (18 pts) because it reflects how the user actually feels in the moment, which determines whether a meal will be started at all. Energy and time each earn 12 pts — meaningful filters but secondary to whether the ingredients exist and whether the user is in the right state to cook. A time overage carries a larger penalty (−18) than any individual positive signal because recommending a 45-minute meal to someone with 20 minutes actively misleads them. The asymmetry is intentional: penalties for hard constraints should outweigh bonuses for soft preferences.

The formula is designed to be legible in a product review and explainable in the UI. It can be replaced with a weighted service or ML model without changing the UI contract.

**Coverage computation.** For each meal need, coverage = `min(available servings / required servings, 1)`. Meal coverage = average across all needs. A meal where half the ingredients are fully stocked and half are completely missing scores 0.5 coverage, or 29 points from the coverage component.

## Design Principles

- Operational first: the first screen is the app, not a landing page.
- Explainable decisions: every recommendation exposes ingredient coverage and missing gaps.
- Evidence before inference: AI may structure and infer from transcript/caption evidence, but the product must show warnings when evidence is thin.
- No fake completeness: a video import with only metadata is not a complete recipe.
- Dense but readable: dashboard and work surfaces prioritize scanning over decorative content.
- Local-first state: pantry and demo state persist locally; extraction runs through a local server boundary so browser CORS does not block public source fetching.
- Visual consistency: imported recipes use generated covers only, not scraped source images.
- Accessible controls: native buttons, labels, checkboxes, selects, and visible focus states are used throughout.

## Interaction States

### Command

- Receipt Import button: disabled when the selected receipt status is `"imported"`.
- Meal readiness in sidebar footer: average score of top 3 ranked meals, rounded to the nearest integer.
- Sync gaps: fires immediately on click; no confirmation dialog.

### Intake

- Import button: disabled when the selected receipt status is `"imported"`; re-enables if a different (ready) receipt is selected.
- URL input draft: persisted to state on every keystroke so a page refresh does not lose the typed URL.
- URL intake accepts multiple pasted URLs so Rednote-heavy testing can be processed in a queue.
- Import run panel: each submitted URL shows pending, extracting, imported, needs review, duplicate, or failed status.
- Clear imports: removes stale recipe URL state without resetting pantry, grocery, or meal data.
- Extract button: primary action inside the URL form; pressing Enter in the URL field triggers submission.
- Extraction status badge: `complete` means ingredients and procedure were extracted; `needs review` means evidence was partial.
- Warnings: shown inline whenever the source lacks Recipe schema, transcript, ingredients, or cooking procedure.
- Review text: fallback/correction path for pasted captions, subtitles, or manually captured procedure; applying review regenerates recipe fields and cover prompt.
- Title override: optional manual correction when metadata title is wrong.
- Generate AI cover: creates or refreshes the KitchenOS cover from the current corrected recipe JSON.
- Generated cover: compact visual support; extraction evidence, warnings, ingredients, and steps take layout priority.
- "Save as meal" button: disabled once `savedAsMeal` is `true`; label changes to "Saved as meal".
- Recipe import switcher: rendered only when more than one URL has been imported.
- Pantry coverage ring: reflects the currently selected recipe import, not a global average.

### Pantry

- Search: live-filters on every keystroke; cursor position is preserved after re-render so typing is not interrupted.
- Category filter: combined with search — both conditions must match.
- Use and restock buttons: row-level actions; servings are floored at 0, never go negative.
- Empty filtered state: message rendered within the list area, not as a full-page replacement.

### Meals

- Mood (segmented control), energy (select), time (select): all update meal scores and re-rank the list immediately on change.
- "Cook and deplete pantry": if all needs are covered, depletes pantry servings; if any need is missing, creates grocery gaps and does not touch pantry.

### Grocery

- Checkbox: toggles `done` state; `line-through` styling applied immediately; state persists across refresh.
- Delete: removes item immediately with no undo.
- Sync gaps: idempotent — safe to run multiple times without creating duplicates.
- Add item form: cleared after submit; empty or whitespace-only names are rejected before state mutation.

## Acceptance Criteria

- A reviewer can run `npm run dev` and open the printed localhost URL.
- Importing a receipt adds new items to pantry and updates existing ones; re-importing the same receipt changes nothing.
- Importing a URL calls the local extraction server, stores the canonical source link, extracts available metadata, and shows a KitchenOS-generated cover. No scraped thumbnail is displayed.
- Importing a Recipe-schema article extracts ingredients and steps without AI.
- Importing a video/social URL attempts transcript/subtitle/media extraction before falling back to metadata-only review state.
- A video/social import with no accessible transcript or media is marked `needs-review`; cooking steps are not fabricated.
- If AI/transcription is configured, transcript evidence is converted into structured ingredients and steps with warnings and confidence.
- Applying reviewed text updates the recipe in place and regenerates cover data from the corrected ingredient set.
- Applying a title override updates the imported recipe title while retaining source attribution.
- Clicking Generate AI cover either stores an AI-generated image or displays a clear not-configured/error state; the cover area is never blank.
- Importing a URL with a hash fragment strips the fragment; re-importing the same URL without the fragment is recognized as a duplicate.
- A non-HTTP/HTTPS URL is rejected before any state change.
- Missing ingredients from an imported recipe can be added to Grocery in one action.
- Imported recipes can be saved into meal recommendations; saving twice is a no-op.
- Meal recommendations re-rank immediately when mood, energy, or time changes.
- Cooking a fully stocked meal depletes pantry servings.
- Cooking a meal with missing ingredients creates grocery gaps and does not deplete pantry.
- Pantry use-one-serving at zero servings stays at zero.
- Grocery sync does not duplicate items already on the list, regardless of how many times it runs.
- State persists across browser refresh.
- Clicking Reset returns the app to seed state.
- The app renders correctly at desktop (1440px), tablet (1024px), and mobile (390px) widths.
- All interactive controls are reachable by keyboard; focus states are visible.

## Production Roadmap

1. Receipt upload API with OCR provider adapter.
2. Video extraction service that discovers media URLs, subtitle tracks, and embedded transcripts.
3. Speech-to-text quality hardening for public video/audio media when platform captions are unavailable.
4. AI structuring adapter that converts transcript plus metadata into validated recipe JSON.
5. AI image generation adapter for KitchenOS covers based on recipe JSON, never scraped thumbnails.
6. Authenticated persistence with user-scoped kitchen data.
7. Product normalization through Open Food Facts or USDA where available.
8. Tested service boundary for scoring, depletion, freshness, URL extraction, transcript extraction, AI structuring, cover generation, and grocery sync.
9. Explainable recommendation trace shown in the UI.
10. Import/export and backup controls for personal data ownership.
