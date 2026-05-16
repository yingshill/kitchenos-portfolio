"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { DEFAULT_RECIPE_MODEL, structureRecipeFromTranscript } = require("../src/recipe-structurer.js");

test("recipe structuring returns not-configured without an API key", async () => {
  const result = await structureRecipeFromTranscript({ transcript: "Mix flour and steam the buns." }, { apiKey: "" });

  assert.equal(result.status, "not-configured");
  assert.equal(result.model, DEFAULT_RECIPE_MODEL);
});

test("recipe structuring requests structured JSON from the Responses API", async () => {
  let captured;
  const result = await structureRecipeFromTranscript(
    {
      metadata: { title: "Brown sugar rolls", sourceType: "social" },
      transcript: "Mix flour with yeast. Roll brown sugar into the dough. Steam until fluffy.",
    },
    {
      apiKey: "test-key",
      fetch: async (url, options) => {
        captured = { url, options };
        return {
          ok: true,
          json: async () => ({
            output_text: JSON.stringify({
              title: "Brown Sugar Flower Rolls",
              summary: "Steamed rolls with brown sugar.",
              ingredients: [
                { name: "Flour", category: "Grain", servings: 2 },
                { name: "Brown sugar", category: "Pantry", servings: 1 },
              ],
              steps: ["Mix flour with yeast.", "Roll brown sugar into the dough.", "Steam until fluffy."],
              time: 45,
              servings: 2,
              confidence: 88,
              warnings: [],
            }),
          }),
        };
      },
    },
  );
  const body = JSON.parse(captured.options.body);

  assert.equal(captured.url, "https://api.openai.com/v1/responses");
  assert.equal(captured.options.headers.authorization, "Bearer test-key");
  assert.equal(body.text.format.type, "json_schema");
  assert.equal(result.status, "complete");
  assert.equal(result.recipe.title, "Brown Sugar Flower Rolls");
  assert.equal(result.recipe.steps.length, 3);
});
