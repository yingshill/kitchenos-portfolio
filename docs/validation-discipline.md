# Validation Discipline

KitchenOS changes are not considered complete until the tested behavior matches the user-visible product behavior, not just the server endpoint response.

## Required Before Calling A Fix Done

1. Reproduce with the user's exact input.
2. Validate the same surface the user used: screenshot/UI state for UI issues, API response for API issues, and persisted local state when the app uses local storage.
3. Compare actual output against the expected product behavior in a pass/fail table.
4. Inspect raw source evidence for external imports: fetched HTML, embedded state, media URLs, transcript availability, warnings, and canonicalized URL.
5. Mark provider-dependent behavior honestly:
   - `not-configured` is acceptable as a visible state.
   - `not-configured` is not the same as "feature complete".
   - generated images and video transcription require configured provider credentials.
6. Add or update regression tests for every parser/model bug found.
7. Rerun `npm run check`.
8. Update the relevant audit document when the user supplied a concrete failing case.

## Rednote Import Checklist

- Exact Rednote URL is used, including share token when needed for fetch.
- Stored URL is canonicalized and stripped of tracking params.
- Title is the real post title, not a generic shell title.
- Source type is `social`.
- Creator is retained when public state exposes it.
- Ingredients are evidence-backed; broad localized tokens must not create false positives.
- Public video/media stream is detected when exposed.
- Procedure is extracted from transcript/subtitle/speech-to-text evidence only.
- If transcription is not configured, UI must show a warning and remain `needs-review`.
- Cover state must be visible: `prompt-ready`, `not-configured`, `ai-generated`, or `error`; blank cover is a failure.
- Browser-local stale state is checked with Reset demo or a clean re-import.

## Reporting Format

Use this minimum result shape for focused audits:

| Check | Expected | Actual | Status |
| --- | --- | --- | --- |
| Exact input reproduced | User-provided input | Observed input | Pass/Fail |
| User-visible output | Expected behavior | Screenshot/UI/API result | Pass/Fail |
| Regression coverage | Test added or existing | Test name/command | Pass/Fail |
