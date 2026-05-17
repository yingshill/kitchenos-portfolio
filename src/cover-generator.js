"use strict";

const { disabledResult, isAiFeatureEnabled } = require("./ai-config.js");

// Active style — switch COVER_GUIDELINE_VERSION and buildCoverPrompt assignment below to change.
const COVER_GUIDELINE_VERSION = "kitchenos-cover-v1";
const DEFAULT_IMAGE_MODEL = "gpt-image-1";

class CoverGenerationError extends Error {
  constructor(message, { status = 500, code = "COVER_GENERATION_ERROR" } = {}) {
    super(message);
    this.name = "CoverGenerationError";
    this.status = status;
    this.code = code;
  }
}

// — Style v1: acrylic marker sketchbook zine (Image 1) —
function buildCoverPromptV1(recipe) {
  const title = cleanText(recipe.title || "Recipe");
  const ingredients = (Array.isArray(recipe.ingredients) ? recipe.ingredients : [])
    .map((ingredient) => cleanText(ingredient.name))
    .filter(Boolean)
    .slice(0, 8);
  const summary = cleanText(recipe.summary || "");

  return [
    `Acrylic and marker food illustration of ${title}.`,
    ingredients.length ? `The dish features: ${ingredients.join(", ")}.` : "",
    summary ? `Dish context: ${summary}` : "",
    "Style: bold opaque acrylic paint with confident marker ink outlines defining every edge. Vivid saturated colors — bright greens, oranges, blues, purples. Flat graphic coverage, no translucency. Playful sketchbook zine aesthetic.",
    "Composition: food centered and large in frame, served in a bowl or on a plate, viewed from a slight overhead angle. White or lightly tinted paper background. Small sparkle star doodles scattered around the food as decoration.",
    "Texture: opaque paint strokes with visible brushwork, crisp white highlights on glossy surfaces, rich color contrast between food and background.",
    "No text, no labels, no logos, no watermark, no hands, no photography.",
  ]
    .filter(Boolean)
    .join("\n");
}

// — Style v2: editorial watercolor dim sum (Image 2) —
function buildCoverPromptV2(recipe) {
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

// Active prompt builder
const buildCoverPrompt = buildCoverPromptV1;

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
