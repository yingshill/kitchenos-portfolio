"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { COVER_GUIDELINE_VERSION, buildCoverPrompt, generateCover } = require("../src/cover-generator.js");

const recipe = {
  title: "Brown Sugar Steamed Buns",
  summary: "Soft steamed buns with a brown sugar swirl.",
  ingredients: [
    { name: "Flour" },
    { name: "Brown sugar" },
    { name: "Yeast" },
  ],
  steps: ["Mix the dough.", "Roll with brown sugar.", "Steam until fluffy."],
};

test("builds a cover prompt from recipe data and brand rules", () => {
  const prompt = buildCoverPrompt(recipe);

  assert.equal(prompt.includes("Brown Sugar Steamed Buns"), true);
  assert.equal(prompt.includes("Flour, Brown sugar, Yeast"), true);
  assert.equal(prompt.includes("Steam until fluffy."), true);
  assert.equal(prompt.includes("no text, no logos, no watermark"), true);
});

test("cover generation returns an explicit not-configured state without an API key", async () => {
  const cover = await generateCover(recipe, { apiKey: "" });

  assert.equal(cover.status, "not-configured");
  assert.equal(cover.guidelineVersion, COVER_GUIDELINE_VERSION);
  assert.equal(cover.prompt.includes("Brown Sugar Steamed Buns"), true);
});

test("cover generation stores base64 image data from the image provider", async () => {
  let capturedRequest;
  const cover = await generateCover(recipe, {
    apiKey: "test-key",
    fetch: async (url, options) => {
      capturedRequest = { url, options };
      return {
        ok: true,
        json: async () => ({ data: [{ b64_json: "abc123" }] }),
      };
    },
    model: "gpt-image-1",
  });

  const body = JSON.parse(capturedRequest.options.body);

  assert.equal(capturedRequest.url, "https://api.openai.com/v1/images/generations");
  assert.equal(body.model, "gpt-image-1");
  assert.equal(body.size, "1024x1024");
  assert.equal(cover.status, "ai-generated");
  assert.equal(cover.imageDataUrl, "data:image/png;base64,abc123");
});
