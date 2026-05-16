# UI Guidelines

KitchenOS is an operational kitchen tool. The UI should prioritize evidence, correction, and repeat use over decorative presentation.

## Intake Layout

- Recipe evidence comes first: title, source, status, warnings, ingredients, and procedure must be visible before decorative media dominates the page.
- Generated cover is supporting media, not the main work surface.
- Cover size target: compact 4:3 thumbnail, capped near 260px wide on desktop.
- Multiple pasted URLs are supported; batch Rednote testing should not require one-page reload per URL.
- Batch imports must show per-URL status: pending, extracting, needs review, imported, duplicate, or failed.
- Re-extract is available for stale or suspect imports and must preserve the fetch URL when a share token is required.
- Clear imports is available to remove stale local URL state without resetting pantry/meal data.
- `needs-review`, `not-configured`, and `error` states must be visible near the extracted data, not hidden behind controls.

## Rednote Import States

- Generic shell title such as `小红书` is a failed import, not a valid recipe.
- Metadata-only imports can show title, creator, tags, and evidence-backed ingredient hints, but must not invent cooking steps.
- If a public video stream is detected and transcription is unavailable, show speech-to-text setup guidance and keep the import in `needs-review`.
- If transcription succeeds, AI structuring should produce title, ingredients, steps, time, servings, confidence, and warnings.
- User correction is a first-class path: title override and review text must remain easy to reach.

## Cover Generation

- Never use scraped platform thumbnails as recipe covers.
- Generated covers must use current normalized recipe JSON after corrections.
- Cover states:
  - `prompt-ready`: recipe data can be sent to the image provider.
  - `ai-generated`: image data returned and rendered.
  - `not-configured`: API key or provider setup is missing.
  - `error`: provider rejected the request or billing/rate limit failed.
- Cover prompt rules: one finished dish, accurate ingredient cues, natural daylight, no text, no logos, no watermarks, no packaging, no hands, no collage.

## Controls

- Primary command on Intake is `Extract`; correction and generation actions are secondary.
- Disable actions that cannot work because required data is missing.
- Keep provider-dependent states honest: do not label blocked AI output as complete.
- Button labels should state the operation, not the implementation.

## Visual Density

- No oversized hero treatment inside the app workspace.
- No nested cards for recipe detail sections.
- Use compact rows, badges, and warnings so the user can compare many imported sources quickly.
- Long URLs, titles, and warnings must wrap without widening the layout.
