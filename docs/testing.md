# Testing

## Test Strategy

The current portfolio build is static and dependency-free, so the test plan focuses on the domain model that drives the UI. Browser rendering is kept simple and native; product-critical logic lives in `src/kitchen-model.js` and is covered by Node's built-in test runner.

## Automated Coverage

Run:

```bash
npm test
```

Full check:

```bash
npm run check
```

`npm run check` performs JavaScript syntax checks for the app and model, then runs the automated test suite.

Current tests cover:

- Meal scoring from pantry coverage, mood, energy, and time.
- Receipt import, pantry merge, and idempotent re-import behavior.
- Recipe/video URL import, original-link retention, generated-cover metadata, and no scraped-thumbnail field.
- Recipe URL grocery-gap sync and save-as-meal behavior.
- Grocery candidate generation and duplicate prevention.
- Pantry depletion when a stocked meal is cooked.
- Grocery-gap creation when a meal is missing ingredients.
- Manual pantry and grocery mutations.

## Manual Test Matrix

### Smoke

- Open `index.html`.
- Confirm the Command dashboard renders with metrics, graph, receipt preview, recommendations, and activity.
- Navigate through Command, Intake, Pantry, Meals, Grocery, and Case Study.

### Receipt Flow

- Open Intake.
- Select the ready Fresh Market receipt.
- Click Import.
- Confirm receipt status changes to imported.
- Confirm pantry includes Blueberries, Oat milk, Tofu, Broccoli, and Peanut sauce.
- Click Import again and confirm pantry count does not increase.

### Recipe URL Flow

- Open Intake.
- Paste a recipe, article, or video URL.
- Click Extract.
- Confirm the original source link is retained.
- Confirm the visible cover is KitchenOS-generated and no scraped source thumbnail is shown.
- Confirm extracted ingredients and detailed cooking steps render.
- Click Add missing to grocery.
- Confirm missing ingredients appear in Grocery.
- Click Save as meal.
- Confirm the imported recipe appears in meal recommendations.

### Pantry Flow

- Open Pantry.
- Search for `spinach`.
- Confirm only matching inventory remains.
- Clear search.
- Filter by Produce.
- Use one serving of Cherry tomatoes and confirm the count does not go below zero after repeated clicks.
- Restock one serving and confirm the count increases.

### Meal Flow

- Open Meals.
- Change mood to tired and energy to low.
- Confirm low-effort meals move up in ranking.
- Cook Salmon rice bowl from the default state.
- Confirm Wild salmon, Jasmine rice, Baby spinach, and Greek yogurt servings decrease.
- Reset demo.
- Cook Peanut soba tofu.
- Confirm missing ingredients are added to Grocery instead of depleting Soba noodles.

### Grocery Flow

- Open Grocery.
- Click Sync gaps.
- Confirm Wild salmon and Cherry tomatoes appear once.
- Click Sync gaps again.
- Confirm no duplicates are added.
- Add a manual item.
- Check, reopen, and delete it.

### Persistence

- Make a state change.
- Refresh the browser.
- Confirm the state persists.
- Click Reset demo.
- Confirm the seed state returns.

### Export

- Click Export JSON.
- Confirm the browser downloads `kitchenos-demo-state.json`.
- Inspect the JSON shape for `exportedAt` and `state`.

### Responsive

- Test around 1440px, 1024px, 768px, and 390px widths.
- Confirm navigation remains reachable.
- Confirm cards and rows do not overlap.
- Confirm long grocery names wrap within their container.

### Accessibility

- Navigate with keyboard only.
- Confirm focus states are visible.
- Confirm buttons and checkbox labels are reachable.
- Confirm form fields have labels.
- Confirm icon-only controls have accessible names through `aria-label` or `title`.

## Known Gaps

- No headless browser test is included because the project intentionally has no install step.
- No visual regression screenshots are included.
- No live OCR or network integration tests exist in this portfolio slice.
- AI cover generation is represented as deterministic generated-cover metadata and a style-consistent UI cover; production generation requires an image model adapter.
- Local storage migration tests should be added before changing the saved state schema.
