"use strict";

const { extractTranscriptFromMedia } = require("./transcript-extractor.js");
const { structureRecipeFromTranscript } = require("./recipe-structurer.js");

const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "source",
  "spm",
  "xsec_source",
  "xsec_token",
]);

const SOCIAL_HOSTS = [
  "instagram.com",
  "rednote.com",
  "tiktok.com",
  "xiaohongshu.com",
];

const VIDEO_HOSTS = ["youtu.be", "youtube.com", "vimeo.com"];

const INGREDIENT_LEXICON = [
  "baby spinach",
  "blueberries",
  "broccoli",
  "cherry tomatoes",
  "chickpeas",
  "chili crisp",
  "eggs",
  "garlic",
  "greek yogurt",
  "jasmine rice",
  "lemons",
  "limes",
  "noodles",
  "olive oil",
  "peanut sauce",
  "rice",
  "salmon",
  "soba noodles",
  "soy sauce",
  "spinach",
  "tofu",
];

const LOCALIZED_INGREDIENTS = [
  { tokens: ["红糖"], name: "Brown sugar", category: "Pantry" },
  { tokens: ["馒头", "花卷", "面食"], name: "Flour", category: "Grain" },
  { tokens: ["豆腐"], name: "Tofu", category: "Protein" },
  { tokens: ["西兰花"], name: "Broccoli", category: "Produce" },
  { tokens: ["蒜", "大蒜"], name: "Garlic", category: "Produce" },
  { tokens: ["辣椒", "辣油"], name: "Chili crisp", category: "Pantry" },
  { tokens: ["面条"], name: "Noodles", category: "Grain" },
  { tokens: ["米饭"], name: "Rice", category: "Grain" },
  { tokens: ["鸡蛋", "蛋"], name: "Eggs", category: "Protein" },
  { tokens: ["酸奶"], name: "Greek yogurt", category: "Dairy" },
  { tokens: ["三文鱼"], name: "Salmon", category: "Protein" },
];

class ExtractionError extends Error {
  constructor(message, { status = 500, code = "EXTRACTION_ERROR" } = {}) {
    super(message);
    this.name = "ExtractionError";
    this.status = status;
    this.code = code;
  }
}

function normalizeRecipeUrl(value) {
  const url = parseHttpUrl(value);
  if (!url) return null;
  stripTrackingParams(url);
  return url;
}

function parseHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function stripTrackingParams(url) {
  [...url.searchParams.keys()].forEach((key) => {
    if (key.startsWith("utm_") || TRACKING_PARAMS.has(key)) url.searchParams.delete(key);
  });
}

function sourceHost(url) {
  return url.hostname.replace(/^www\./, "");
}

function hostMatches(host, candidates) {
  return candidates.some((candidate) => host === candidate || host.endsWith(`.${candidate}`));
}

function sourceTypeForUrl(url) {
  const host = sourceHost(url);
  if (hostMatches(host, SOCIAL_HOSTS)) return "social";
  if (hostMatches(host, VIDEO_HOSTS)) return "video";
  return "article";
}

function isRednoteUrl(url) {
  const host = sourceHost(url);
  return host === "rednote.com" || host === "xiaohongshu.com" || host.endsWith(".xiaohongshu.com");
}

async function extractRecipeFromUrl(value, options = {}) {
  const fetchUrl = parseHttpUrl(value);
  if (!fetchUrl) {
    throw new ExtractionError("Enter a valid http or https URL.", { status: 400, code: "INVALID_URL" });
  }

  if (options.html) {
    const recipe = await enhanceRecipeWithTranscript(extractRecipeFromHtml(fetchUrl.href, options.html, options), options);
    if (recipe) recipe.fetchUrl = fetchUrl.href;
    return recipe;
  }

  const attempts = options.attempts || (isRednoteUrl(fetchUrl) ? 5 : 1);
  let lastRecipe = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const html = await fetchHtml(fetchUrl, options);
    const recipe = extractRecipeFromHtml(fetchUrl.href, html, options);
    if (!isWeakRednoteShell(fetchUrl, recipe)) {
      const enhanced = await enhanceRecipeWithTranscript(recipe, options);
      if (enhanced) enhanced.fetchUrl = fetchUrl.href;
      return enhanced;
    }
    lastRecipe = recipe;
    if (attempt < attempts) await sleep(250 * attempt);
  }
  if (lastRecipe && isWeakRednoteShell(fetchUrl, lastRecipe)) {
    throw new ExtractionError("Rednote returned only a generic shell. Try again or paste the caption/transcript.", {
      status: 502,
      code: "REDNOTE_SHELL_ONLY",
    });
  }
  const enhanced = await enhanceRecipeWithTranscript(lastRecipe, options);
  if (enhanced) enhanced.fetchUrl = fetchUrl.href;
  return enhanced;
}

async function enhanceRecipeWithTranscript(recipe, options = {}) {
  if (!recipe || recipe.extractionStatus !== "needs-review" || !recipe.mediaUrl) return recipe;

  let transcript;
  try {
    transcript = await extractTranscriptFromMedia(recipe.mediaUrl, options.transcript || options);
  } catch (error) {
    recipe.warnings = [...recipe.warnings, error.message || "Speech-to-text transcription failed."];
    return recipe;
  }

  recipe.transcript = transcript;
  if (transcript.status !== "complete" || !transcript.text) {
    if (transcript.message) recipe.warnings = [...recipe.warnings, transcript.message];
    return recipe;
  }

  const structuredRecipe = await structureTranscriptRecipe(recipe, transcript, options);
  if (structuredRecipe) return structuredRecipe;

  const transcriptRecipe = extractRecipeFromText(transcript.text, {
    creator: recipe.creator,
    metadataTitle: recipe.title,
    sourceType: recipe.sourceType,
  });
  const ingredients = transcriptRecipe.ingredients.length ? transcriptRecipe.ingredients : recipe.ingredients;
  const steps = transcriptRecipe.steps.length ? transcriptRecipe.steps : recipe.steps;
  return {
    ...recipe,
    title: transcriptRecipe.title || recipe.title,
    confidence: Math.max(recipe.confidence, transcriptRecipe.confidence),
    time: transcriptRecipe.time || recipe.time,
    servings: transcriptRecipe.servings || recipe.servings,
    coverTheme: coverThemeForIngredients(ingredients),
    summary: transcriptRecipe.summary || recipe.summary,
    ingredients,
    steps,
    warnings: transcriptRecipe.warnings.length
      ? transcriptRecipe.warnings
      : recipe.warnings.filter((warning) => !/No cooking steps|metadata, but not structured recipe instructions/i.test(warning)),
    extractionStatus: ingredients.length && steps.length ? "complete" : "needs-review",
  };
}

async function structureTranscriptRecipe(recipe, transcript, options = {}) {
  let structured;
  try {
    structured = await structureRecipeFromTranscript(
      {
        metadata: {
          title: recipe.title,
          creator: recipe.creator,
          summary: recipe.summary,
          sourceType: recipe.sourceType,
        },
        transcript: transcript.text,
      },
      options.structurer || options,
    );
  } catch (error) {
    recipe.warnings = [...recipe.warnings, error.message || "AI recipe structuring failed."];
    return null;
  }

  if (structured.status !== "complete" || !structured.recipe) {
    if (structured.message) recipe.warnings = [...recipe.warnings, structured.message];
    return null;
  }

  const structuredRecipe = structured.recipe;
  const ingredients = Array.isArray(structuredRecipe.ingredients) ? structuredRecipe.ingredients : recipe.ingredients;
  const steps = Array.isArray(structuredRecipe.steps) ? structuredRecipe.steps.filter(Boolean) : recipe.steps;
  return {
    ...recipe,
    title: cleanTitle(structuredRecipe.title || recipe.title),
    confidence: Math.max(recipe.confidence, Math.round(Number(structuredRecipe.confidence) || 0)),
    time: Math.max(0, Math.round(Number(structuredRecipe.time) || recipe.time || 0)),
    servings: Math.max(1, Math.round(Number(structuredRecipe.servings) || recipe.servings || 1)),
    coverTheme: coverThemeForIngredients(ingredients),
    summary: cleanText(structuredRecipe.summary || recipe.summary),
    ingredients: uniqueIngredients(
      ingredients
        .map((ingredient) => ({
          name: cleanText(ingredient.name),
          category: ingredient.category || categoryForIngredient(ingredient.name),
          servings: Math.max(1, Math.round(Number(ingredient.servings) || 1)),
        }))
        .filter((ingredient) => ingredient.name),
    ),
    steps,
    warnings: Array.isArray(structuredRecipe.warnings) ? structuredRecipe.warnings.map(cleanText).filter(Boolean) : [],
    extractionStatus: ingredients.length && steps.length ? "complete" : "needs-review",
    aiExtraction: {
      status: structured.status,
      model: structured.model,
    },
  };
}

async function fetchHtml(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15000);
  try {
    const response = await (options.fetch || fetch)(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      },
    });
    if (!response.ok) {
      throw new ExtractionError(`Source returned HTTP ${response.status}.`, {
        status: 502,
        code: "SOURCE_HTTP_ERROR",
      });
    }
    const contentType = response.headers.get("content-type") || "";
    if (contentType && !/(text\/html|application\/xhtml\+xml|text\/plain)/i.test(contentType)) {
      throw new ExtractionError(`Source returned ${contentType}, not an HTML recipe page.`, {
        status: 415,
        code: "UNSUPPORTED_CONTENT",
      });
    }
    return await response.text();
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    if (error.name === "AbortError") {
      throw new ExtractionError("Timed out fetching the source URL.", { status: 504, code: "FETCH_TIMEOUT" });
    }
    throw new ExtractionError(`Could not fetch the source URL: ${error.message}`, {
      status: 502,
      code: "FETCH_FAILED",
    });
  } finally {
    clearTimeout(timeout);
  }
}

function isWeakRednoteShell(url, recipe) {
  return (
    isRednoteUrl(url) &&
    (!recipe.title || recipe.title === "小红书" || recipe.title.toLowerCase() === "rednote") &&
    recipe.ingredients.length === 0 &&
    recipe.steps.length === 0
  );
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function extractRecipeFromText(value, options = {}) {
  const text = cleanText(value);
  if (!text) {
    throw new ExtractionError("Paste recipe text before extracting.", { status: 400, code: "EMPTY_RECIPE_TEXT" });
  }

  const ingredients = ingredientsFromRecipeText(value);
  const steps = stepsFromRecipeText(value);
  const recipe = {
    sourceType: options.sourceType || "manual",
    title: cleanTitle(options.title || titleFromRecipeText(value) || options.metadataTitle || "Corrected recipe"),
    creator: options.creator || "Manual correction",
    confidence: 0,
    time: inferTimeMinutes(text),
    servings: inferServings(text),
    coverTheme: coverThemeForIngredients(ingredients),
    summary: summaryFromRecipeText(value),
    ingredients,
    steps,
    warnings: [],
  };
  recipe.extractionStatus = recipe.ingredients.length && recipe.steps.length ? "complete" : "needs-review";
  if (recipe.ingredients.length === 0) recipe.warnings.push("No ingredients were found in the pasted text.");
  if (recipe.steps.length === 0) recipe.warnings.push("No cooking steps were found in the pasted text.");
  recipe.confidence = scoreConfidence(recipe, true);
  return recipe;
}

function extractRecipeFromHtml(value, html, options = {}) {
  const url = normalizeRecipeUrl(value);
  if (!url) {
    throw new ExtractionError("Enter a valid http or https URL.", { status: 400, code: "INVALID_URL" });
  }

  const sourceType = sourceTypeForUrl(url);
  const schemaRecipe = extractJsonLdRecipes(html)[0];
  const meta = extractMetadata(html);
  const visibleText = extractVisibleText(html);
  const rednoteRecipe = isRednoteUrl(url) ? recipeFromRednoteState(url, html, meta) : null;
  const recipe =
    rednoteRecipe ||
    (schemaRecipe ? recipeFromSchema(url, schemaRecipe, meta) : recipeFromMetadata(url, meta, visibleText, sourceType));

  recipe.sourceUrl = url.href;
  recipe.sourceHost = sourceHost(url);
  recipe.sourceType = recipe.sourceType || sourceType;
  recipe.extractionStatus = recipe.ingredients.length && recipe.steps.length ? "complete" : "needs-review";
  recipe.warnings = [...(recipe.warnings || [])];
  if (!schemaRecipe) recipe.warnings.push("No Recipe schema found; extracted from public page metadata and visible text.");
  if (recipe.ingredients.length === 0) recipe.warnings.push("No ingredients were exposed in the public page content.");
  if (recipe.steps.length === 0) recipe.warnings.push("No cooking steps were exposed in the public page content.");
  recipe.confidence = scoreConfidence(recipe, Boolean(schemaRecipe), options);
  return recipe;
}

function recipeFromSchema(url, schemaRecipe, meta) {
  const ingredients = arrayify(schemaRecipe.recipeIngredient || schemaRecipe.ingredients)
    .map(parseIngredientLine)
    .filter(Boolean);
  const steps = parseInstructions(schemaRecipe.recipeInstructions);
  return {
    sourceType: "article",
    title: textValue(schemaRecipe.name) || meta.title || sourceHost(url),
    creator: authorName(schemaRecipe.author) || meta.author || sourceHost(url),
    confidence: 0,
    time: parseDurationMinutes(schemaRecipe.totalTime || schemaRecipe.cookTime || schemaRecipe.prepTime),
    servings: parseServings(schemaRecipe.recipeYield || schemaRecipe.yield),
    coverTheme: coverThemeForIngredients(ingredients),
    summary: textValue(schemaRecipe.description) || meta.description || `Imported from ${sourceHost(url)}.`,
    ingredients,
    steps,
    warnings: [],
  };
}

function recipeFromMetadata(url, meta, visibleText, sourceType) {
  const combinedText = [meta.title, meta.description, visibleText].filter(Boolean).join(" ");
  const ingredients = ingredientsFromText(combinedText);
  const steps = stepsFromText(visibleText);
  return {
    sourceType,
    title: cleanTitle(meta.title || firstSentence(visibleText) || sourceHost(url)),
    creator: meta.author || sourceHost(url),
    confidence: 0,
    time: inferTimeMinutes(combinedText),
    servings: inferServings(combinedText),
    coverTheme: coverThemeForIngredients(ingredients),
    summary: meta.description || firstSentence(visibleText) || `Imported from ${sourceHost(url)}.`,
    ingredients,
    steps,
    warnings: [],
  };
}

function recipeFromRednoteState(url, html, meta) {
  const note = extractRednoteNote(html);
  if (!note) return null;
  const tagText = Array.isArray(note.tagList) ? note.tagList.map((tag) => tag.name).join(" ") : "";
  const combinedText = [note.title, note.desc, tagText, meta.description].filter(Boolean).join(" ");
  const ingredients = ingredientsFromText(combinedText);
  const mediaUrl = rednoteMediaUrl(note);
  const warnings = ["Rednote exposed public post metadata, but not structured recipe instructions."];
  if (mediaUrl) warnings.push("Rednote exposes a public video stream; speech-to-text is required for procedure extraction.");
  return {
    sourceType: "social",
    title: cleanTitle(note.title || meta.title || sourceHost(url)),
    creator: note.user?.nickname || meta.author || sourceHost(url),
    confidence: 0,
    time: 0,
    servings: 1,
    coverTheme: coverThemeForIngredients(ingredients),
    summary: cleanText(note.desc || meta.description || `Imported from ${sourceHost(url)}.`),
    ingredients,
    steps: stepsFromText(note.desc || ""),
    warnings,
    mediaUrl,
  };
}

function extractRednoteNote(html) {
  const match = html.match(/window\.__INITIAL_STATE__=([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    const state = JSON.parse(match[1].replace(/:\s*undefined/g, ":null"));
    const noteMap = state.note?.noteDetailMap;
    if (!noteMap || typeof noteMap !== "object") return null;
    const detail = Object.values(noteMap).find((item) => item?.note && Object.keys(item.note).length > 0);
    return detail?.note || null;
  } catch {
    return null;
  }
}

function rednoteMediaUrl(note) {
  const h264Streams = note?.video?.media?.stream?.h264;
  if (!Array.isArray(h264Streams) || h264Streams.length === 0) return "";
  const stream =
    h264Streams.find((item) => item.defaultStream || item.qualityType === "HD") ||
    h264Streams.find((item) => item.masterUrl || item.backupUrls?.length) ||
    h264Streams[0];
  const value = stream.masterUrl || stream.backupUrls?.[0] || "";
  return String(value || "").replace(/^http:/, "https:");
}

function extractJsonLdRecipes(html) {
  const recipes = [];
  const scriptPattern = /<script\b(?=[^>]*type=["']?application\/ld\+json["']?)[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    const payload = decodeHtml(stripHtmlComments(match[1])).trim();
    if (!payload) continue;
    try {
      collectRecipeNodes(JSON.parse(payload), recipes);
    } catch {
      const cleaned = payload.replace(/[\u0000-\u001F]+/g, " ");
      try {
        collectRecipeNodes(JSON.parse(cleaned), recipes);
      } catch {
        // Ignore malformed structured data and continue with metadata extraction.
      }
    }
  }
  return recipes;
}

function collectRecipeNodes(value, recipes) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectRecipeNodes(item, recipes));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (isType(value, "Recipe")) recipes.push(value);
  if (value["@graph"]) collectRecipeNodes(value["@graph"], recipes);
  if (value.mainEntity) collectRecipeNodes(value.mainEntity, recipes);
}

function isType(value, type) {
  const nodeType = value["@type"];
  if (Array.isArray(nodeType)) return nodeType.some((item) => String(item).toLowerCase() === type.toLowerCase());
  return String(nodeType || "").toLowerCase() === type.toLowerCase();
}

function extractMetadata(html) {
  const metaTags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => parseAttributes(match[0]));
  const byName = new Map();
  metaTags.forEach((attrs) => {
    const key = (attrs.property || attrs.name || "").toLowerCase();
    if (key && attrs.content && !byName.has(key)) byName.set(key, decodeHtml(attrs.content).trim());
  });
  return {
    title:
      byName.get("og:title") ||
      byName.get("twitter:title") ||
      textBetween(html, /<title\b[^>]*>/i, /<\/title>/i),
    description:
      byName.get("og:description") ||
      byName.get("twitter:description") ||
      byName.get("description") ||
      "",
    author: byName.get("author") || byName.get("article:author") || "",
  };
}

function parseAttributes(tag) {
  const attrs = {};
  const pattern = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(pattern)) {
    attrs[match[1].toLowerCase()] = match[3] || match[4] || match[5] || "";
  }
  return attrs;
}

function extractVisibleText(html) {
  return decodeHtml(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function parseInstructions(value) {
  return arrayify(value)
    .flatMap((step) => {
      if (typeof step === "string") return step;
      if (step && typeof step === "object" && step.itemListElement) return parseInstructions(step.itemListElement);
      if (step && typeof step === "object") return textValue(step.text || step.name);
      return "";
    })
    .map((step) => cleanText(step))
    .filter(Boolean);
}

function parseIngredientLine(line) {
  const original = cleanText(line);
  if (!original) return null;
  let name = original
    .replace(/\([^)]*\)/g, " ")
    .replace(/^[\d\s./¼½¾⅓⅔⅛⅜⅝⅞-]+/, " ")
    .trim()
    .replace(
      /^(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|grams?|g|kg|pounds?|lbs?|lb|fillets?|cloves?|cans?|packages?|pkg|bunch(?:es)?|slices?|large|small|medium)\b\s*/i,
      " ",
    )
    .replace(/\b(to taste|divided|optional|plus more.*)$/i, " ")
    .split(",")[0]
    .trim();
  const ofMatch = name.match(/\bof\s+(.+)$/i);
  if (ofMatch) name = ofMatch[1].trim();
  name = titleCase(name.replace(/\s+/g, " "));
  if (!name) return null;
  return {
    name,
    category: categoryForIngredient(name),
    servings: Math.max(1, Math.min(4, Math.round(parseLeadingNumber(original) || 1))),
  };
}

function ingredientsFromText(text) {
  const normalized = text.toLowerCase();
  const ingredients = [];
  INGREDIENT_LEXICON.forEach((name) => {
    const pattern = new RegExp(`\\b${escapeRegExp(name)}\\b`, "i");
    if (pattern.test(normalized) && !ingredients.some((item) => item.name.toLowerCase() === name)) {
      ingredients.push({
        name: titleCase(name),
        category: categoryForIngredient(name),
        servings: name.includes("noodle") || name.includes("rice") ? 2 : 1,
      });
    }
  });
  LOCALIZED_INGREDIENTS.forEach((ingredient) => {
    if (
      ingredient.tokens.some((token) => text.includes(token)) &&
      !ingredients.some((item) => item.name.toLowerCase() === ingredient.name.toLowerCase())
    ) {
      ingredients.push({
        name: ingredient.name,
        category: ingredient.category,
        servings: 1,
      });
    }
  });
  return ingredients.slice(0, 10);
}

function ingredientsFromRecipeText(text) {
  const lines = recipeLines(text);
  const ingredientLines = sectionLines(lines, /^(ingredients?|材料|食材|用料)[:：]?$/i, /^(instructions?|directions?|method|steps?|做法|步骤|过程)[:：]?$/i);
  const parsed = uniqueIngredients(
    ingredientLines
      .map((line) => localizedIngredientFromLine(line) || parseIngredientLine(line))
      .filter(Boolean),
  );
  return parsed.length ? parsed : ingredientsFromText(text);
}

function localizedIngredientFromLine(line) {
  const match = LOCALIZED_INGREDIENTS.find((ingredient) => ingredient.tokens.some((token) => line.includes(token)));
  if (!match) return null;
  return {
    name: match.name,
    category: match.category,
    servings: Math.max(1, Math.min(4, Math.round(parseLeadingNumber(line) || 1))),
  };
}

function uniqueIngredients(ingredients) {
  const seen = new Set();
  return ingredients.filter((ingredient) => {
    const key = ingredient.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stepsFromText(text) {
  const sentences = cleanText(text)
    .split(/(?<=[.!?。！？])\s+/)
    .filter(hasCookingAction);
  return sentences.slice(0, 6);
}

function stepsFromRecipeText(text) {
  const lines = recipeLines(text);
  const explicitSteps = sectionLines(
    lines,
    /^(instructions?|directions?|method|steps?|做法|步骤|过程)[:：]?$/i,
    /^(ingredients?|材料|食材|用料)[:：]?$/i,
  )
    .map(cleanStepLine)
    .filter(Boolean);
  if (explicitSteps.length) return explicitSteps.slice(0, 10);

  const listedSteps = lines.map(cleanStepLine).filter((line) => hasCookingAction(line));
  if (listedSteps.length) return listedSteps.slice(0, 10);
  return stepsFromText(text);
}

function recipeLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => cleanText(line).replace(/^[-*•]\s*/, ""))
    .filter(Boolean);
}

function sectionLines(lines, startPattern, endPattern) {
  const start = lines.findIndex((line) => startPattern.test(line));
  if (start < 0) return [];
  const collected = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (endPattern.test(lines[index])) break;
    collected.push(lines[index]);
  }
  return collected;
}

function cleanStepLine(line) {
  return cleanText(line).replace(/^(step\s*)?\d+[.)、：:\s-]*/i, "");
}

function hasCookingAction(value) {
  return /\b(add|bake|boil|cook|fold|fry|knead|mix|roast|roll|saute|sauté|season|serve|steam|stir|toss|whisk)\b|蒸|煮|炒|拌|揉|发酵|醒发|擀|卷|切|搅|混合|烤|煎|倒入|加入|出锅/.test(
    String(value || "").toLowerCase(),
  );
}

function titleFromRecipeText(text) {
  const lines = recipeLines(text);
  let seenRecipeSection = false;
  for (const line of lines) {
    if (/^(ingredients?|材料|食材|用料|instructions?|directions?|method|steps?|做法|步骤|过程)[:：]?$/i.test(line)) {
      seenRecipeSection = true;
      continue;
    }
    const labeledTitle = line.match(/^(?:title|recipe|name|菜名)[:：]\s*(.+)$/i);
    if (labeledTitle) return labeledTitle[1].trim();
    if (seenRecipeSection) continue;
    if (/^(?:step\s*)?\d+[.)、：:\s-]/i.test(line)) continue;
    if (/^(?:\d+(?:[./]\d+)?|\d+\s+\d+\/\d+)\s*(?:cups?|tbsp|tablespoons?|tsp|teaspoons?|g|kg|ml|l|oz|lb|pounds?|grams?|pinch|pcs?|pieces?)\b/i.test(line)) continue;
    if (hasCookingAction(line)) continue;
    if (line.length <= 80) return line;
  }
  return "";
}

function summaryFromRecipeText(text) {
  const lines = recipeLines(text);
  for (const line of lines) {
    if (/^(ingredients?|材料|食材|用料|instructions?|directions?|method|steps?|做法|步骤|过程)[:：]?$/i.test(line)) break;
    const labeledSummary = line.match(/^(?:summary|description|desc|简介)[:：]\s*(.+)$/i);
    if (labeledSummary) return labeledSummary[1].trim();
    if (/^(?:title|recipe|name|菜名)[:：]/i.test(line)) continue;
    if (line.length > 20 && !hasCookingAction(line)) return line;
  }
  return "Corrected from pasted recipe text.";
}

function categoryForIngredient(name) {
  const text = String(name || "").toLowerCase();
  if (/(spinach|broccoli|tomato|lime|lemon|blueberr|garlic|onion|pepper|cilantro|basil|lettuce|greens?)/.test(text)) {
    return "Produce";
  }
  if (/(salmon|tofu|egg|chicken|beef|pork|turkey|shrimp|fish|beans?|lentils?)/.test(text)) return "Protein";
  if (/(yogurt|milk|cheese|cream|butter)/.test(text)) return "Dairy";
  if (/(rice|noodle|pasta|soba|bread|flour|oat|quinoa|tortilla)/.test(text)) return "Grain";
  return "Pantry";
}

function coverThemeForIngredients(ingredients) {
  if (ingredients.some((item) => item.category === "Produce")) return "leaf";
  if (ingredients.some((item) => item.category === "Protein")) return "tomato";
  if (ingredients.some((item) => item.category === "Grain")) return "mustard";
  return "plum";
}

function scoreConfidence(recipe, hasSchema) {
  let score = hasSchema ? 58 : 24;
  if (recipe.title) score += 8;
  if (recipe.summary) score += 6;
  score += Math.min(recipe.ingredients.length * 4, 20);
  score += Math.min(recipe.steps.length * 3, 12);
  if (recipe.time) score += 4;
  return Math.max(10, Math.min(98, score));
}

function parseDurationMinutes(value) {
  const text = textValue(value);
  if (!text) return 0;
  const iso = text.match(/P(?:T)?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (iso) return Number(iso[1] || 0) * 60 + Number(iso[2] || 0);
  const hourMatch = text.match(/(\d+)\s*h(?:ours?)?/i);
  const minuteMatch = text.match(/(\d+)\s*m(?:in(?:utes?)?)?/i);
  return Number(hourMatch?.[1] || 0) * 60 + Number(minuteMatch?.[1] || 0);
}

function inferTimeMinutes(text) {
  const minutes = parseDurationMinutes(text);
  if (minutes) return minutes;
  const match = text.match(/(\d{1,3})\s*(?:minute|min)\b/i);
  return match ? Number(match[1]) : 0;
}

function parseServings(value) {
  const match = textValue(value).match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function inferServings(text) {
  const match = text.match(/serv(?:es|ings?)\s*(\d+)/i) || text.match(/(\d+)\s*servings?/i);
  return match ? Number(match[1]) : 1;
}

function authorName(value) {
  if (Array.isArray(value)) return authorName(value[0]);
  if (value && typeof value === "object") return textValue(value.name);
  return textValue(value);
}

function textValue(value) {
  if (Array.isArray(value)) return textValue(value[0]);
  if (value && typeof value === "object") return textValue(value.name || value.text);
  return cleanText(value);
}

function arrayify(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanText(value) {
  return decodeHtml(String(value || ""))
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(value) {
  return cleanText(value).replace(/\s+[|-]\s+.+$/, "");
}

function firstSentence(value) {
  return cleanText(value).split(/(?<=[.!?])\s+/)[0] || "";
}

function textBetween(html, startPattern, endPattern) {
  const start = html.search(startPattern);
  if (start < 0) return "";
  const afterStart = html.slice(start).replace(startPattern, "");
  const end = afterStart.search(endPattern);
  return cleanText(end >= 0 ? afterStart.slice(0, end) : afterStart);
}

function stripHtmlComments(value) {
  return String(value || "").replace(/<!--|-->/g, "");
}

function decodeHtml(value) {
  const named = {
    amp: "&",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
    apos: "'",
    "#039": "'",
  };
  return String(value || "").replace(/&(#x?[0-9a-f]+|[a-z0-9]+);/gi, (entity, key) => {
    const lower = key.toLowerCase();
    if (lower[0] === "#") {
      const codePoint = lower[1] === "x" ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }
    return Object.hasOwn(named, lower) ? named[lower] : entity;
  });
}

function parseLeadingNumber(value) {
  const match = String(value || "").match(/^\s*(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  ExtractionError,
  extractRecipeFromHtml,
  extractRecipeFromText,
  extractRecipeFromUrl,
  normalizeRecipeUrl,
};
