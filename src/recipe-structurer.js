"use strict";

const { disabledResult, isAiFeatureEnabled } = require("./ai-config.js");

const DEFAULT_RECIPE_MODEL = "gpt-5-mini";

class RecipeStructuringError extends Error {
  constructor(message, { status = 500, code = "RECIPE_STRUCTURING_ERROR" } = {}) {
    super(message);
    this.name = "RecipeStructuringError";
    this.status = status;
    this.code = code;
  }
}

const RECIPE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "ingredients", "steps", "time", "servings", "confidence", "warnings"],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "category", "servings"],
        properties: {
          name: { type: "string" },
          category: { type: "string", enum: ["Produce", "Protein", "Grain", "Dairy", "Pantry"] },
          servings: { type: "number" },
        },
      },
    },
    steps: {
      type: "array",
      items: { type: "string" },
    },
    time: { type: "number" },
    servings: { type: "number" },
    confidence: { type: "number" },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
  },
};

async function structureRecipeFromTranscript(input, options = {}) {
  const transcript = String(input?.transcript || "").trim();
  if (!transcript) {
    return { status: "unavailable", message: "No transcript text was available for AI recipe structuring." };
  }

  const apiKey = Object.hasOwn(options, "apiKey") ? options.apiKey : process.env.OPENAI_API_KEY;
  const model = options.model || process.env.OPENAI_RECIPE_MODEL || DEFAULT_RECIPE_MODEL;
  if (!isAiFeatureEnabled("OPENAI_RECIPE_STRUCTURING_ENABLED", options)) {
    return disabledResult("not-configured", "AI recipe structuring is disabled by local configuration.", {
      model,
    });
  }
  if (!apiKey) {
    return {
      status: "not-configured",
      model,
      message: "Set OPENAI_API_KEY to structure video transcripts into recipes.",
    };
  }

  const response = await (options.fetch || fetch)("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "Extract a recipe from cooking video transcript evidence. Use only the transcript and metadata. Do not invent missing steps. Return concise user-facing fields.",
        },
        {
          role: "user",
          content: JSON.stringify({
            metadata: input.metadata || {},
            transcript,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "recipe_extraction",
          strict: true,
          schema: RECIPE_SCHEMA,
        },
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new RecipeStructuringError(payload.error?.message || "AI recipe structuring failed.", {
      status: response.status,
      code: payload.error?.code || "OPENAI_RECIPE_STRUCTURING_ERROR",
    });
  }

  const outputText = outputTextFromResponse(payload);
  if (!outputText) {
    throw new RecipeStructuringError("AI recipe structuring returned no JSON output.", { code: "MISSING_RECIPE_JSON" });
  }

  try {
    return {
      status: "complete",
      model,
      recipe: JSON.parse(outputText),
    };
  } catch {
    throw new RecipeStructuringError("AI recipe structuring returned invalid JSON.", { code: "INVALID_RECIPE_JSON" });
  }
}

function outputTextFromResponse(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const contentItems = Array.isArray(payload.output)
    ? payload.output.flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    : [];
  const textItem = contentItems.find((item) => typeof item.text === "string");
  return textItem?.text || "";
}

module.exports = {
  DEFAULT_RECIPE_MODEL,
  RecipeStructuringError,
  RECIPE_SCHEMA,
  structureRecipeFromTranscript,
};
