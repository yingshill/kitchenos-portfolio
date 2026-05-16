# Rednote Import Audit — 2026-05-16

## Scope

Test URL:

```text
https://www.rednote.com/explore/69e88898000000001a02d944?xsec_token=AB57eA5y5HvR9hju1ciUGtOQpJOxUv-2FjPb4QnFm5SZw=&xsec_source=pc_user&source=web_user_page
```

This audit covers the Rednote import path, the screenshot output in `image.png`, manual correction, title override, speech-to-text readiness, AI cover-generation boundary, and automated regression suite.

## Test Plan

1. Run full automated checks with `npm run check`.
2. Import the exact Rednote URL through `/api/recipe-import`.
3. Verify stored URL canonicalization removes share/tracking params.
4. Verify source type, title, creator, ingredients, steps, warnings, and extraction status.
5. Run representative manual correction through `/api/recipe-correction`.
6. Verify title override, ingredients, cooking steps, summary, confidence, and completion status.
7. Run `/api/cover-generation` with the corrected recipe.
8. Verify the cover flow returns a visible state when `OPENAI_API_KEY` is not configured.
9. Inspect Rednote HTML for exposed video/subtitle/media evidence.
10. Add regression coverage for any issue found during audit and rerun `npm run check`.

## Results

| Area | Expected | Actual | Status |
| --- | --- | --- | --- |
| Automated suite | Syntax checks and tests pass | 24 tests passed | Pass |
| Rednote fetch | Server can fetch the shared Rednote URL | API returned structured recipe payload | Pass |
| Canonical URL | Tracking/share params removed for storage | `https://www.rednote.com/explore/69e88898000000001a02d944` | Pass |
| Source type | Social platform detected | `social` | Pass |
| Title extraction | Actual post title, not generic Rednote shell title | `被全家人夸的红糖花卷也太好吃了吧！` | Pass |
| Creator extraction | Public creator retained when exposed | `洺择` | Pass |
| Metadata ingredients | Extract available ingredient hints without false positives | Brown sugar, Flour | Pass after fix |
| Video media detection | Detect exposed public video stream | MP4 stream URL detected | Pass after fix |
| Cooking procedure | Do not fabricate from metadata-only post | Empty `steps`; speech-to-text required | Pass with gap |
| Review state | Metadata-only video/social import requires review | `needs-review` | Pass |
| Manual correction | Pasted procedure becomes structured steps | 3 ordered steps extracted | Pass |
| Title override | Manual title replaces wrong/long metadata title | `红糖花卷` | Pass |
| Corrected status | Complete when ingredients and steps exist | `complete`, confidence `93` | Pass |
| Cover boundary | No blank cover when image API key is absent | `not-configured` with setup message and prompt | Pass |

## Screenshot Findings

`image.png` exposed real product failures that the first endpoint-only audit underweighted:

- Ingredient inference showed `Noodles`; this was wrong for `面食` and is now fixed.
- Cooking procedure was absent. The app was correct not to fabricate it from tags, but the UI did not clearly show that a Rednote video stream exists and speech-to-text is the missing configured step.
- Cover displayed `AI not configured`, which is technically correct without `OPENAI_API_KEY`, but it is not an AI-generated cover. The product should not call that complete.
- The screen was testing stale local state with 2 saved sources, so repeated browser testing should use Reset demo or re-import after server restarts.

## Issues Found And Fixed

1. Ingredient false positive:

- Cause: localized ingredient rule included broad token `面`, which matched inside `面食`.
- Fix: restricted Noodles inference to `面条`.
- Regression: Rednote initial-state test now asserts `Noodles` is not extracted from this post.

2. Missing video evidence status:

- Cause: Rednote video stream was present in `window.__INITIAL_STATE__`, but the parser ignored it.
- Fix: parser now extracts the public MP4 stream URL and returns a speech-to-text-required warning.
- Regression: Rednote test now asserts media URL extraction and speech-to-text warning.

3. Correction summary bug:

During the correction audit, the summary extractor treated a capitalized instruction line (`Mix...`) as non-procedure text and could place a step in the summary. The root cause was case-sensitive cooking-action detection plus a weak fallback that summarized collapsed recipe sections.

Fix:

- Made cooking-action detection case-insensitive.
- Changed section-only correction text to use `Corrected from pasted recipe text.` unless a real narrative summary is supplied before the recipe sections.
- Added regression coverage in `tests/recipe-extractor.test.js`.

4. Speech-to-text adapter boundary:

- Added `src/transcript-extractor.js`.
- If `OPENAI_API_KEY` is missing, the import explicitly reports `Set OPENAI_API_KEY to transcribe public recipe videos.`
- If configured, the adapter downloads the public media and calls OpenAI audio transcription using `gpt-4o-mini-transcribe` by default.
- Regression: mocked tests cover not-configured state and transcription API request shape.

Post-fix result:

```text
summary: Corrected from pasted recipe text.
steps:
1. Mix flour, yeast, and warm water into a dough.
2. Knead until smooth, then let it rise.
3. Roll with brown sugar, shape the buns, and steam until fluffy.
```

## Remaining Gaps

- Live Rednote extraction still depends on Rednote exposing public page state; it can change by region, login state, or anti-bot behavior.
- The app correctly does not invent video procedure from metadata. Full automatic procedure extraction now has a speech-to-text adapter boundary, but a real run requires `OPENAI_API_KEY`.
- AI structuring beyond deterministic parsing of transcribed text is still a next step.
- Live AI cover image generation requires `OPENAI_API_KEY`; without it, the expected result is the visible `AI not configured` state.
- Browser UI interaction is still manually tested; no headless browser regression test is included yet.

## Follow-up Audit For Rednote-Heavy Use

The current Rednote-heavy workflow exposed two more product problems:

- Intake was laid out around a large decorative cover. This made extraction warnings, review text, and procedure data feel secondary.
- Rednote can intermittently return only a generic shell page. Saving that as a recipe creates bad local state.

Changes made:

- Intake now accepts multiple pasted URLs.
- Generated cover is capped as a compact 4:3 thumbnail so recipe evidence takes priority.
- Rednote imports retry up to 5 times.
- If all attempts return a generic shell, the server returns `REDNOTE_SHELL_ONLY` instead of saving `小红书`.
- Added AI recipe structuring after speech-to-text transcription through `src/recipe-structurer.js`.
- Added regression tests for shell-only Rednote responses and AI structuring request shape.

Latest exact-URL validation:

```text
title: 被全家人夸的红糖花卷也太好吃了吧！
creator: 洺择
sourceType: social
ingredients: Brown sugar, Flour
steps: []
mediaUrl: detected
transcript: not-configured without OPENAI_API_KEY
extractionStatus: needs-review
```
