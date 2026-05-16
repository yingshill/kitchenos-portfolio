# Testing

## Test Strategy

KitchenOS now has three test surfaces:

- Domain/model logic in `src/kitchen-model.js`.
- Local extraction server logic in `server.js` and `src/recipe-extractor.js`.
- AI cover prompt/provider boundary in `src/cover-generator.js`.

The highest-risk behavior is URL intake: public source fetching, Rednote/social metadata parsing, transcript/procedure evidence handling, AI-ready structuring boundaries, review/correction, and downstream pantry/grocery/meal updates.

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

Focused audits must also follow [Validation Discipline](validation-discipline.md) and [UI Guidelines](ui-guidelines.md): reproduce the exact user input, validate the same UI/API surface the user tested, and record pass/fail results instead of relying on endpoint success alone.

Current tests cover:

- Meal scoring from pantry coverage, mood, energy, and time.
- Receipt import, pantry merge, and idempotent re-import behavior.
- Recipe/video/social URL import, original-link retention, prompt-ready cover metadata, and no scraped-thumbnail field.
- Rednote tracking-parameter normalization.
- Rednote public initial-state metadata extraction.
- Recipe JSON-LD extraction from article pages.
- Review/correction text extraction into title, ingredients, and steps.
- AI cover prompt rules, not-configured state, and provider image-data handling.
- Rednote video stream detection and speech-to-text adapter boundary.
- Refreshing old fixture-shaped imports with live extraction metadata.
- Regenerating cover data after corrected recipe extraction.
- Recipe URL grocery-gap sync and save-as-meal behavior.
- Grocery candidate generation and duplicate prevention.
- Pantry depletion when a stocked meal is cooked.
- Grocery-gap creation when a meal is missing ingredients.
- Manual pantry and grocery mutations.

## Manual Test Matrix

### Smoke

- Run `npm run dev`.
- Open `http://localhost:4173`.
- Confirm the Command dashboard renders with metrics, graph, receipt preview, recommendations, and activity.
- Navigate through Command, Intake, Pantry, Meals, Grocery, and Case Study.

### Priority Pass

If you only have time for one pass, test these in order:

1. Rednote URL extraction.
2. Review/correction flow.
3. AI cover status/generation flow.
4. Add missing to Grocery.
5. Save as meal.
6. Cook saved/imported meal.
7. Reset and persistence.

### Receipt Flow

- Open Intake.
- Select the ready Fresh Market receipt.
- Click Import.
- Confirm receipt status changes to imported.
- Confirm pantry includes Blueberries, Oat milk, Tofu, Broccoli, and Peanut sauce.
- Click Import again and confirm pantry count does not increase.

### Recipe URL Flow

- Open Intake.
- Paste a recipe, article, social, or video URL. For batch testing, paste multiple URLs on separate lines.
- Click Extract.
- Confirm the import run panel shows each URL status.
- Confirm the original source link is retained.
- Confirm the visible cover is KitchenOS-generated and no scraped source thumbnail is shown.
- Confirm extracted ingredients and detailed cooking steps render when the source exposes enough evidence.
- Confirm incomplete video/social imports show `needs review` and warnings instead of fake cooking steps.
- Click Add missing to grocery.
- Confirm missing ingredients appear in Grocery.
- Click Save as meal.
- Confirm the imported recipe appears in meal recommendations.

### Rednote Video Flow

- Open Intake.
- Paste the Rednote URL.
- Click Extract.
- Confirm the cover remains a compact thumbnail and does not dominate the extraction workspace.
- Confirm the source link is canonicalized without tracking params.
- Confirm the title is the actual post title or the corrected manual title, not generic `小红书`.
- Confirm creator displays when Rednote exposes it.
- Confirm source type is `social`.
- Confirm the app does not invent procedure if no transcript/subtitle/speech-to-text evidence is available.
- Confirm warning says speech-to-text is required when a public video stream is detected but transcription is not configured.
- If Rednote returns only a generic shell title, confirm the app reports an extraction failure instead of saving a `小红书` recipe.
- Click Re-extract and confirm the source refreshes without losing the Rednote share token.
- Click Clear imports and confirm only URL imports are cleared.
- Confirm `needs review` appears when steps are missing.
- Confirm warnings explain what evidence was missing.

### Review/Correction Flow

- After an incomplete Rednote import, paste caption/procedure text into Review text.
- If the extracted title is wrong, enter a title in Title override.
- Click Apply and regenerate.
- Confirm the title changes when Title override was supplied.
- Confirm ingredients update from the pasted text.
- Confirm cooking steps render as an ordered list.
- Confirm `complete` appears when both ingredients and steps are present.
- Confirm the cover caption and visual ingredient colors update from the corrected ingredients.
- Confirm Add missing to grocery is enabled after ingredients exist.
- Confirm Save as meal is enabled when ingredients exist.

### AI Cover Flow

- After extraction or correction, confirm the cover shows `Prompt ready`.
- Click Generate AI cover.
- Without `OPENAI_API_KEY`, confirm the cover shows `AI not configured` and includes setup guidance instead of going blank.
- With `OPENAI_API_KEY` configured, confirm an image appears in the cover area.
- Correct the recipe again and confirm the cover returns to `Prompt ready` before regenerating.

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

- No headless browser test is included yet.
- No visual regression screenshots are included.
- Live URL extraction depends on third-party source behavior; Rednote can return different public HTML across requests.
- Full video speech-to-text, AI structuring, and live AI cover generation require configured provider credentials and should be tested with fixtures plus opt-in live runs.
- No live OCR integration tests exist yet.
- AI cover generation has a provider adapter boundary and mocked tests; live provider runs should remain opt-in because they can incur API cost.
- Local storage migration tests should be added before changing the saved state schema.
