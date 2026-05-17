"use strict";

const { isAiFeatureEnabled } = require("./ai-config.js");

const DEFAULT_MODEL = "gpt-4o-mini";
const VALID_TAGS = ["soup", "noodles", "rice", "bread", "steamed", "stir-fry", "braise", "fried", "pastry", "dessert", "salad", "breakfast", "snack"];

const ENRICH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["tags", "ingredients"],
  properties: {
    tags: { type: "array", items: { type: "string", enum: VALID_TAGS } },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["emoji", "quantity"],
        properties: {
          emoji: { type: "string" },
          quantity: { type: "string" },
        },
      },
    },
  },
};

async function enrichRecipeMeta(recipe, options = {}) {
  const apiKey = Object.hasOwn(options, "apiKey") ? options.apiKey : process.env.OPENAI_API_KEY;
  const model = options.model || process.env.OPENAI_RECIPE_MODEL || DEFAULT_MODEL;

  const needsTags = !recipe.tags?.length;
  const needsIngredients = (recipe.ingredients || []).some((i) => !i.emoji || !i.quantity);

  if (!needsTags && !needsIngredients) return recipe;
  if (!isAiFeatureEnabled("OPENAI_RECIPE_STRUCTURING_ENABLED", options) || !apiKey) return recipe;

  const ingredientLines = (recipe.ingredients || [])
    .map((i, idx) => `${idx}. ${i.name} (${i.servings})`)
    .join("\n");

  const userContent = [
    `Title: ${recipe.title}`,
    recipe.summary ? `Summary: ${recipe.summary}` : "",
    ingredientLines ? `Ingredients:\n${ingredientLines}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await (options.fetch || fetch)("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_output_tokens: 600,
      input: [
        {
          role: "system",
          content: `You are a recipe metadata assistant. Given a recipe:
1. Assign 1–3 tags from: ${VALID_TAGS.join(", ")}.
2. For each ingredient (in the same order), assign one emoji and a quantity string (e.g. "250g", "2个", "1 cup", "适量"). Use the number in parentheses as a hint for the numeric value.
Return exactly one ingredients entry per input ingredient, in the same order.`,
        },
        { role: "user", content: userContent },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "recipe_enrichment",
          strict: true,
          schema: ENRICH_SCHEMA,
        },
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return recipe;

  const outputText =
    typeof payload.output_text === "string"
      ? payload.output_text
      : payload.output?.flatMap?.((o) => o.content || []).find?.((c) => c.text)?.text || "";

  if (!outputText) return recipe;

  let enriched;
  try {
    enriched = JSON.parse(outputText);
  } catch {
    return recipe;
  }

  if (needsTags && Array.isArray(enriched.tags)) {
    recipe.tags = enriched.tags.filter((t) => VALID_TAGS.includes(t));
  }

  if (needsIngredients && Array.isArray(enriched.ingredients)) {
    recipe.ingredients = recipe.ingredients.map((ing, i) => {
      const e = enriched.ingredients[i];
      if (!e) return ing;
      return {
        ...ing,
        ...((!ing.emoji && e.emoji) ? { emoji: e.emoji } : {}),
        ...((!ing.quantity && e.quantity) ? { quantity: e.quantity } : {}),
      };
    });
  }

  return recipe;
}

module.exports = { enrichRecipeMeta };
