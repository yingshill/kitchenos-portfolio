"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  extractRecipeFromHtml,
  extractRecipeFromText,
  extractRecipeFromUrl,
  normalizeRecipeUrl,
} = require("../src/recipe-extractor.js");

test("normalizes recipe URLs by removing tracking parameters", () => {
  const url = normalizeRecipeUrl(
    "https://www.rednote.com/explore/69e88898000000001a02d944?xsec_token=secret&xsec_source=pc_user&source=web_user_page&utm_source=copy",
  );

  assert.equal(url.href, "https://www.rednote.com/explore/69e88898000000001a02d944");
});

test("extracts structured Recipe JSON-LD from a page", () => {
  const html = `
    <!doctype html>
    <html>
      <head>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Recipe",
            "name": "Citrus Salmon Rice Bowl",
            "author": { "name": "Kitchen Lab" },
            "description": "A fast salmon bowl with rice and greens.",
            "totalTime": "PT25M",
            "recipeYield": "2 servings",
            "recipeIngredient": [
              "2 fillets wild salmon",
              "1 cup jasmine rice",
              "2 cups baby spinach",
              "1 lemon"
            ],
            "recipeInstructions": [
              { "@type": "HowToStep", "text": "Cook rice until fluffy." },
              { "@type": "HowToStep", "text": "Sear salmon until just cooked." }
            ]
          }
        </script>
      </head>
    </html>
  `;

  const recipe = extractRecipeFromHtml("https://recipe.example.com/salmon?utm_source=test", html);

  assert.equal(recipe.sourceUrl, "https://recipe.example.com/salmon");
  assert.equal(recipe.title, "Citrus Salmon Rice Bowl");
  assert.equal(recipe.creator, "Kitchen Lab");
  assert.equal(recipe.time, 25);
  assert.equal(recipe.servings, 2);
  assert.equal(recipe.ingredients.some((ingredient) => ingredient.name === "Wild Salmon"), true);
  assert.equal(recipe.steps.length, 2);
  assert.equal(recipe.extractionStatus, "complete");
});

test("returns review warnings when a social page exposes metadata but no recipe schema", () => {
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta property="og:title" content="Garlic tofu noodles on Rednote" />
        <meta property="og:description" content="A quick tofu noodle dinner with broccoli and chili crisp." />
      </head>
      <body>This page requires JavaScript.</body>
    </html>
  `;

  const recipe = extractRecipeFromHtml("https://www.rednote.com/explore/post?xsec_token=secret", html);

  assert.equal(recipe.sourceType, "social");
  assert.equal(recipe.title, "Garlic tofu noodles on Rednote");
  assert.equal(recipe.ingredients.some((ingredient) => ingredient.name === "Tofu"), true);
  assert.equal(recipe.extractionStatus, "needs-review");
  assert.equal(recipe.warnings.some((warning) => warning.includes("No Recipe schema")), true);
});

test("extracts Rednote embedded post metadata from initial state", () => {
  const html = `
    <!doctype html>
    <html>
      <head><title>小红书</title></head>
      <body>
        <script>window.__INITIAL_STATE__={
          "note": {
            "noteDetailMap": {
              "69e88898000000001a02d944": {
                "note": {
                  "type": "video",
                  "title": "被全家人夸的红糖花卷也太好吃了吧！",
                  "desc": "#红糖馒头[话题]# #花样馒头[话题]# #面食[话题]#",
                  "user": { "nickname": "洺择" },
                  "video": {
                    "media": {
                      "stream": {
                        "h264": [
                          { "masterUrl": "http://sns-v8.rednotecdn.com/stream/rednote.mp4", "qualityType": "HD" }
                        ]
                      }
                    }
                  },
                  "tagList": [
                    { "name": "红糖馒头" },
                    { "name": "花样馒头" },
                    { "name": "面食" }
                  ]
                }
              }
            }
          },
          "global": { "disableBanAlert": undefined }
        }</script>
      </body>
    </html>
  `;

  const recipe = extractRecipeFromHtml("https://www.rednote.com/explore/69e88898000000001a02d944?xsec_token=secret", html);

  assert.equal(recipe.title, "被全家人夸的红糖花卷也太好吃了吧！");
  assert.equal(recipe.creator, "洺择");
  assert.equal(recipe.ingredients.some((ingredient) => ingredient.name === "Brown sugar"), true);
  assert.equal(recipe.ingredients.some((ingredient) => ingredient.name === "Flour"), true);
  assert.equal(recipe.ingredients.some((ingredient) => ingredient.name === "Noodles"), false);
  assert.equal(recipe.mediaUrl, "https://sns-v8.rednotecdn.com/stream/rednote.mp4");
  assert.equal(recipe.warnings.some((warning) => warning.includes("speech-to-text")), true);
  assert.equal(recipe.extractionStatus, "needs-review");
});

test("rejects Rednote responses that never expose post state", async () => {
  const shellHtml = `
    <!doctype html>
    <html>
      <head>
        <title>小红书</title>
        <meta name="description" content="300 million life experiences, all on rednote" />
      </head>
      <body>Generic shell</body>
    </html>
  `;

  await assert.rejects(
    () =>
      extractRecipeFromUrl("https://www.rednote.com/explore/69e88898000000001a02d944?xsec_token=secret", {
        attempts: 2,
        fetch: async () => ({
          ok: true,
          headers: new Map([["content-type", "text/html"]]),
          text: async () => shellHtml,
        }),
      }),
    { code: "REDNOTE_SHELL_ONLY" },
  );
});

test("extracts reviewed recipe text into ingredients and steps", () => {
  const recipe = extractRecipeFromText(
    `
    Ingredients:
    - 2 cups flour
    - 1/2 cup brown sugar
    - 1 tsp yeast

    Steps:
    1. Mix flour, yeast, and warm water into a dough.
    2. Knead until smooth, then let it rise.
    3. Roll with brown sugar, shape the buns, and steam until fluffy.
    `,
    { sourceType: "social", title: "Brown Sugar Steamed Buns" },
  );

  assert.equal(recipe.title, "Brown Sugar Steamed Buns");
  assert.equal(recipe.ingredients.some((ingredient) => ingredient.name === "Flour"), true);
  assert.equal(recipe.ingredients.some((ingredient) => ingredient.name === "Brown Sugar"), true);
  assert.equal(recipe.steps.length, 3);
  assert.equal(recipe.summary, "Corrected from pasted recipe text.");
  assert.equal(recipe.extractionStatus, "complete");
});

test("uses pasted title when present and metadata title when text has only recipe sections", () => {
  const titled = extractRecipeFromText(
    `
    Title: Brown Sugar Flower Rolls
    Ingredients:
    - 2 cups flour
    Steps:
    1. Mix the dough.
    `,
    { metadataTitle: "Bad Rednote title", sourceType: "social" },
  );
  const sectionOnly = extractRecipeFromText(
    `
    Ingredients:
    - 2 cups flour
    Steps:
    1. Mix the dough.
    `,
    { metadataTitle: "Brown Sugar Steamed Buns", sourceType: "social" },
  );

  assert.equal(titled.title, "Brown Sugar Flower Rolls");
  assert.equal(sectionOnly.title, "Brown Sugar Steamed Buns");
});
