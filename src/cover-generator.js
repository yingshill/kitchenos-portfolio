"use strict";

const { disabledResult, isAiFeatureEnabled } = require("./ai-config.js");

const COVER_GUIDELINE_VERSION = "kitchenos-cover-v2";
const DEFAULT_IMAGE_MODEL = "gpt-image-1";

class CoverGenerationError extends Error {
  constructor(message, { status = 500, code = "COVER_GENERATION_ERROR" } = {}) {
    super(message);
    this.name = "CoverGenerationError";
    this.status = status;
    this.code = code;
  }
}

function buildCoverPrompt(recipe) {
  const title = cleanText(recipe.title || "Recipe");
  const ingredients = (Array.isArray(recipe.ingredients) ? recipe.ingredients : [])
    .map((ingredient) => cleanText(ingredient.name))
    .filter(Boolean)
    .slice(0, 8);
  const summary = cleanText(recipe.summary || "");

  return [
    `Editorial watercolor food illustration of ${title}.`,
    ingredients.length ? `The dish features: ${ingredients.join(", ")}.` : "",
    summary ? `Dish context: ${summary}` : "",
    "Style: detailed wet-on-wet watercolor, translucent layered washes, no ink outlines — paint defines all edges. Warm color temperature throughout: golden amber background, creamy whites, rich vivid food colors.",
    "Composition: main dish large and centered in foreground on a white ceramic plate, one or two smaller complementary dishes receding into the background, creating a warm table-spread depth.",
    "Lighting: soft diffused overhead light with crisp white specular highlights on the food surface. Hyper-detailed food texture — visible translucency, glossy sauces pooling, fine surface detail.",
    "No text, no labels, no logos, no watermark, no hands, no utensils as the main subject, no dark harsh shadows, no photography.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function generateCover(recipe, options = {}) {
  const prompt = buildCoverPrompt(recipe);
  const apiKey = Object.hasOwn(options, "apiKey") ? options.apiKey : process.env.OPENAI_API_KEY;
  const model = options.model || process.env.OPENAI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;

  if (!isAiFeatureEnabled("OPENAI_COVER_ENABLED", options)) {
    return disabledResult("not-configured", "AI cover generation is disabled by local configuration.", {
      guidelineVersion: COVER_GUIDELINE_VERSION,
      model,
      prompt,
    });
  }

  if (!apiKey) {
    return {
      status: "not-configured",
      guidelineVersion: COVER_GUIDELINE_VERSION,
      message: "Set OPENAI_API_KEY to generate AI recipe covers.",
      model,
      prompt,
    };
  }

  const fetchImpl = options.fetch || fetch;
  const response = await fetchImpl("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "low",
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new CoverGenerationError(payload.error?.message || "AI cover generation failed.", {
      status: response.status,
      code: payload.error?.code || "OPENAI_IMAGE_ERROR",
    });
  }

  const base64 = payload.data?.[0]?.b64_json;
  if (!base64) {
    throw new CoverGenerationError("Image provider did not return image data.", { code: "MISSING_IMAGE_DATA" });
  }

  return {
    status: "ai-generated",
    generatedAt: new Date().toISOString(),
    guidelineVersion: COVER_GUIDELINE_VERSION,
    imageDataUrl: `data:image/png;base64,${base64}`,
    model,
    prompt,
  };
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = {
  COVER_GUIDELINE_VERSION,
  CoverGenerationError,
  buildCoverPrompt,
  generateCover,
};
