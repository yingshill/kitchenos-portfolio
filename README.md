# KitchenOS Portfolio Prototype

A dependency-free portfolio build for a kitchen management system that connects receipt parsing, recipe/video URL intake, pantry inventory, meal recommendations, and grocery recovery.

## Project Status

This is an end-to-end portfolio slice: interactive product UI, shared domain model, automated tests, product design docs, and testing docs. It is production-oriented but intentionally static so a reviewer can open it without setup.

## What It Shows

- Receipt-to-pantry import flow with confidence and merge status.
- Recipe/video URL import with original link retention, extracted ingredients, detailed cooking steps, and a KitchenOS-generated cover.
- Pantry depletion, freshness risk, low-stock signals, and manual stock updates.
- Meal scoring based on current mood, energy, available time, and ingredient coverage.
- Grocery list generation from low-stock items and meal gaps.
- Case-study view that explains the adopt-versus-build architecture.

## Run

Open `index.html` in a browser. No package install, API key, or build step is required.

## Test

```bash
npm test
```

```bash
npm run check
```

## Docs

- [Product Design](docs/product-design.md)
- [Testing](docs/testing.md)

## Production Notes

This version is a self-contained interactive prototype. The next production slice would add a receipt upload pipeline, server-backed persistence, authentication, and tested service boundaries for item normalization and meal scoring.
