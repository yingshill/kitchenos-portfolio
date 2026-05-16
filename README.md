# KitchenOS

A dependency-free kitchen management app that connects receipt parsing, live recipe/video URL intake, pantry inventory, meal recommendations, and grocery recovery.

## Project Status

This is an end-to-end app slice: interactive product UI, a local Node extraction server, shared domain model, automated tests, product design docs, and testing docs.

## What It Shows

- Receipt-to-pantry import flow with confidence and merge status.
- Recipe/video/social URL import with batch URL intake, server-side page fetching, Recipe JSON-LD parsing, public metadata fallback, original link retention, extracted ingredients, cooking steps, and a compact KitchenOS-generated cover.
- Pantry depletion, freshness risk, low-stock signals, and manual stock updates.
- Meal scoring based on current mood, energy, available time, and ingredient coverage.
- Grocery list generation from low-stock items and meal gaps.
- Case-study view that explains the adopt-versus-build architecture.

## Run

Run the local server:

```bash
npm run dev
```

Open the printed local URL, usually:

```text
http://localhost:4173
```

The URL extractor needs the Node server because browsers block direct cross-origin page fetching. Public recipe pages with Recipe JSON-LD extract best. Social platforms may hide captions behind JavaScript or login walls; in that case KitchenOS imports the public metadata it can verify and marks the extraction as needing review instead of fabricating recipe data.

AI cover generation and public video transcription are opt-in. Without an API key, the UI shows explicit not-configured states. To generate covers or transcribe public recipe videos locally, set `OPENAI_API_KEY` before starting the server. `OPENAI_IMAGE_MODEL` and `OPENAI_TRANSCRIPTION_MODEL` can override the default models.

Local environment files are supported. Put private values in `.env.local`; it is ignored by git.

## Test

```bash
npm test
```

```bash
npm run check
```

## Docs

- [Product Design](docs/product-design.md)
- [UI Guidelines](docs/ui-guidelines.md)
- [Testing](docs/testing.md)
- [Validation Discipline](docs/validation-discipline.md)

## Production Notes

The next production slice would add authenticated persistence, a receipt upload pipeline, queue-backed extraction retries, and optional authenticated connectors for platforms that do not expose recipe captions publicly.
