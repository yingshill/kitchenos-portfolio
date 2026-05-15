# Product Design

## Product Summary

KitchenOS is a personal kitchen management system that connects receipt intake, recipe/video URL intake, pantry state, meal recommendations, and grocery recovery. The portfolio build demonstrates the integrated loop that most kitchen apps split across separate tools.

## Target User

Primary user: a busy individual or household operator who buys groceries across multiple stores, wants less waste, and wants practical meal suggestions based on what is already available.

Secondary audience: hiring managers and technical reviewers evaluating product thinking, frontend execution, domain modeling, and test discipline.

## Problem

Kitchen planning usually breaks at handoff points. Each existing tool solves one silo and drops the data at the boundary:

| Silo | What existing tools do | Where the handoff fails |
|---|---|---|
| Receipts | Store purchase history as static records | Never become live inventory |
| Recipe/video sources | Live on external platforms | Never enter the kitchen model; ingredients stay unstructured |
| Pantry | Track stock in isolation | No awareness of meal intent or freshness urgency |
| Meal planning | Suggest recipes from a fixed catalog | Ignore what is actually available, expiring, or low |
| Grocery lists | Accept manual entry | Never close the loop after cooking or low-stock events |

KitchenOS treats each handoff as a first-class product problem. The receipt becomes inventory. The video URL becomes a structured recipe with pantry coverage. The pantry drives meal recommendations. The meal recommendations drive the grocery list.

## Product Goals

- Convert receipt line items into pantry inventory with confidence and source metadata.
- Convert recipe/video URLs into structured ingredients, detailed cooking steps, pantry coverage, and grocery gaps.
- Store original recipe links for attribution while displaying only KitchenOS-generated covers for visual consistency.
- Maintain a useful pantry graph: quantity, freshness risk, projected depletion, and stock thresholds.
- Recommend meals using both context and constraints: mood, energy, time, and pantry coverage.
- Generate grocery gaps from low stock and meal requirements without duplicating existing list items.
- Present the product as a portfolio case study without turning the first screen into marketing copy.

## Non-Goals

- Live OCR integration in this static portfolio version.
- Nutrition macro optimization.
- Multi-user collaboration.
- Payment, delivery, or retailer checkout integrations.

## User Stories

**Returning from the store.**
As someone who just got home from the store, I want to import my receipt so my pantry reflects what I actually bought — not what I planned to buy. The result is that meal recommendations and low-stock signals are accurate from the moment I walk in the door.

**Deciding what to cook tonight.**
As someone deciding what to make tonight, I want ranked meal suggestions that account for my current mood, energy level, available time, and what I already have on hand. The result is a short list I can act on immediately, with transparent ingredient coverage so I know why each meal ranked where it did.

**Planning a shopping trip.**
As someone planning a shopping trip, I want a grocery list that combines low-stock items and missing meal ingredients automatically, without requiring me to remember what I ran out of. The result is a categorized list I can check off in the store, knowing it was generated from real pantry state.

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
2. System saves the original URL and source host.
3. System extracts title, ingredients, servings, cook time, and detailed cooking steps.
4. System generates a KitchenOS-style cover from the structured recipe data.
5. User adds missing ingredients to Grocery or saves the imported source as a meal.

**Edge cases**

- Non-HTTP/HTTPS URL (`ftp:`, `mailto:`, or malformed): rejected before any state change; `lastAction` returns a prompt to enter a valid URL.
- URL with a hash fragment: hash is stripped before deduplication and storage; the stored `sourceUrl` never contains a fragment.
- Duplicate URL (same normalized href already in `recipeImports`): no new import is created; the existing record is selected and displayed.
- Imported recipe saved as meal a second time: operation is a no-op; `savedAsMeal` is already `true` and the button is disabled.
- All ingredients already in pantry: "Add missing to grocery" adds nothing and `lastAction` confirms coverage is complete.

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
- Intake: recipe/video URL extraction, generated cover, source link, receipt preview, confidence state, and import queue.
- Pantry: searchable, filterable inventory with stock and freshness signals.
- Meals: ranked recommendations and pantry coverage explanations.
- Grocery: grouped grocery list and gap sync.
- Case Study: architecture, product rationale, build-versus-adopt decision, and next production slice.

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
- `sourceUrl` — normalized, hash-stripped
- `sourceHost` — hostname with `www.` removed
- `sourceType` — `"video"` or `"article"`
- `title`
- `creator`
- `confidence` — extraction confidence percentage
- `time`
- `servings`
- `cover` — `{ status, theme, prompt }`; always `"generated"`, never a scraped thumbnail
- `ingredients` — array of `{ name, category, servings }`
- `steps` — array of instruction strings
- `summary`
- `savedAsMeal` — boolean; once true, the save action is disabled

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
| `sourceHost` normalization | `www.` prefix removed for display |
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
- Dense but readable: dashboard and work surfaces prioritize scanning over decorative content.
- Local sovereignty: the portfolio version runs without external APIs and persists demo state locally.
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
- Extract button: primary action inside the URL form; pressing Enter in the URL field triggers submission.
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

- A reviewer can open the app by opening `index.html` with no install, build step, or API key.
- Importing a receipt adds new items to pantry and updates existing ones; re-importing the same receipt changes nothing.
- Importing a URL stores the original source link, extracts ingredients and steps, and shows a KitchenOS-generated cover. No scraped thumbnail is displayed.
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
2. URL extraction service with transcript/page parsing and structured recipe extraction.
3. AI image generation adapter for KitchenOS covers based on recipe JSON, never scraped thumbnails.
4. Authenticated persistence with user-scoped kitchen data.
5. Product normalization through Open Food Facts or USDA where available.
6. Tested service boundary for scoring, depletion, freshness, URL extraction, cover generation, and grocery sync.
7. Explainable recommendation trace shown in the UI.
8. Import/export and backup controls for personal data ownership.
