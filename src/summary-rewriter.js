"use strict";

const { disabledResult, isAiFeatureEnabled } = require("./ai-config.js");

const DEFAULT_MODEL = "gpt-4o-mini";

async function rewriteRecipeSummary(recipe, options = {}) {
  const apiKey = Object.hasOwn(options, "apiKey") ? options.apiKey : process.env.OPENAI_API_KEY;
  const model = options.model || process.env.OPENAI_RECIPE_MODEL || DEFAULT_MODEL;

  if (!isAiFeatureEnabled("OPENAI_RECIPE_STRUCTURING_ENABLED", options)) {
    return disabledResult("not-configured", "AI summary rewrite is disabled.", { model });
  }
  if (!apiKey) {
    return { status: "not-configured", model, message: "Set OPENAI_API_KEY to rewrite recipe summaries." };
  }

  const title = String(recipe.title || "").trim();
  const ingredients = (recipe.ingredients || [])
    .map((i) => String(i.name || "").trim())
    .filter(Boolean)
    .join(", ");
  const steps = (recipe.steps || []).join(" ");
  const existing = String(recipe.summary || "").trim();

  const userContent = [
    `Recipe title: ${title}`,
    ingredients ? `Ingredients: ${ingredients}` : "",
    steps ? `Steps: ${steps}` : "",
    existing ? `Current summary: ${existing}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await (options.fetch || fetch)("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content:
            "You are a food writer. Given a recipe, write a single appetizing sentence (max 40 words) that captures the dish's character — texture, flavor, occasion, or mood. Match the language of the recipe title exactly. Return only the sentence, no quotes, no period needed.",
        },
        { role: "user", content: userContent },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { status: "error", message: payload.error?.message || "Summary rewrite failed.", model };
  }

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) return { status: "error", message: "No summary returned.", model };

  return { status: "complete", summary: text, model };
}

module.exports = { rewriteRecipeSummary };
