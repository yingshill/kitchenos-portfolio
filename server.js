"use strict";

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { loadEnvFiles } = require("./src/env-loader.js");

const ROOT = __dirname;

loadEnvFiles(ROOT);

const { CoverGenerationError, generateCover } = require("./src/cover-generator.js");
const { ExtractionError, extractRecipeFromText, extractRecipeFromUrl } = require("./src/recipe-extractor.js");
const { ChatError, chat } = require("./src/chat-provider.js");

const PORT = Number(process.env.PORT || 4173);
const MAX_BODY_BYTES = 1024 * 1024;
const RECIPES_PATH = path.join(ROOT, "recipes.json");
const TAKEOUTS_PATH = path.join(ROOT, "takeouts.json");

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
};

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/recipe-import") {
      await handleRecipeImport(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/recipe-correction") {
      await handleRecipeCorrection(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/cover-generation") {
      await handleCoverGeneration(request, response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/chat") {
      await handleChat(request, response);
      return;
    }

    if (request.method === "GET" && request.url === "/api/recipes") {
      await handleGetRecipes(request, response);
      return;
    }

    const recipesPatch = request.url.match(/^\/api\/recipes\/([^/?]+)$/);
    if (request.method === "PATCH" && recipesPatch) {
      await handlePatchRecipe(request, response, decodeURIComponent(recipesPatch[1]));
      return;
    }

    if (request.method === "GET" && request.url === "/api/takeouts") {
      await handleGetTakeouts(request, response);
      return;
    }

    const takeoutsPatch = request.url.match(/^\/api\/takeouts\/([^/?]+)$/);
    if (request.method === "PATCH" && takeoutsPatch) {
      await handlePatchTakeout(request, response, decodeURIComponent(takeoutsPatch[1]));
      return;
    }

    if (request.method === "GET" || request.method === "HEAD") {
      await serveStatic(request, response);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    const status =
      error instanceof ExtractionError ||
      error instanceof CoverGenerationError ||
      error instanceof ChatError
        ? error.status
        : 500;
    sendJson(response, status, {
      error: error.message || "Unexpected server error.",
      code: error.code || "SERVER_ERROR",
    });
  }
});

async function handleRecipeImport(request, response) {
  const body = await readJsonBody(request);
  const recipe = await extractRecipeFromUrl(body.url);
  sendJson(response, 200, { recipe });
}

async function handleRecipeCorrection(request, response) {
  const body = await readJsonBody(request);
  const recipe = extractRecipeFromText(body.text, {
    creator: body.creator,
    metadataTitle: body.metadataTitle,
    sourceType: body.sourceType,
    title: body.title,
  });
  sendJson(response, 200, { recipe });
}

async function handleCoverGeneration(request, response) {
  const body = await readJsonBody(request);
  const cover = await generateCover(body.recipe || {});
  sendJson(response, 200, { cover });
}

async function handleGetRecipes(request, response) {
  const recipes = await readJsonFile(RECIPES_PATH);
  sendJson(response, 200, recipes);
}

async function handlePatchRecipe(request, response, id) {
  const body = await readJsonBody(request);
  const recipes = await readJsonFile(RECIPES_PATH);
  const index = recipes.findIndex((r) => r.id === id);
  if (index === -1) {
    sendJson(response, 404, { error: "Recipe not found.", code: "NOT_FOUND" });
    return;
  }
  recipes[index] = { ...recipes[index], ...body, id };
  await writeJsonFile(RECIPES_PATH, recipes);
  sendJson(response, 200, recipes[index]);
}

async function handleGetTakeouts(request, response) {
  const takeouts = await readJsonFile(TAKEOUTS_PATH);
  sendJson(response, 200, takeouts);
}

async function handlePatchTakeout(request, response, id) {
  const body = await readJsonBody(request);
  const takeouts = await readJsonFile(TAKEOUTS_PATH);
  const index = takeouts.findIndex((t) => t.id === id);
  if (index === -1) {
    sendJson(response, 404, { error: "Takeout not found.", code: "NOT_FOUND" });
    return;
  }
  takeouts[index] = { ...takeouts[index], ...body, id };
  await writeJsonFile(TAKEOUTS_PATH, takeouts);
  sendJson(response, 200, takeouts[index]);
}

async function handleChat(request, response) {
  const body = await readJsonBody(request);
  const { messages = [], context = {} } = body;
  const systemPrompt = buildChatSystemPrompt(context);
  const result = await chat(systemPrompt, messages);
  if (result.status === "not-configured") {
    sendJson(response, 503, { error: result.message, code: "CHAT_NOT_CONFIGURED" });
    return;
  }
  sendJson(response, 200, result);
}

function buildChatSystemPrompt(context) {
  const { pantry = [], meals = [], recipes = [], takeouts = [], prefs = {} } = context;

  const pantryText = pantry.length
    ? pantry
        .map(
          (item) =>
            `- ${item.name}: ${item.servings} servings (${item.category}${item.expiresIn <= 4 ? `, expires in ${item.expiresIn} days` : ""})`,
        )
        .join("\n")
    : "Pantry is empty.";

  const mealsText = meals.length
    ? meals.map((m) => `- ${m.name} (${m.score}% match, ${m.time} min)`).join("\n")
    : "No meal recommendations.";

  const recipesText = recipes.length
    ? recipes.map((r) => `- ${r.title} (${r.time} min, ${r.sourceType})${r.summary ? ": " + r.summary : ""}`).join("\n")
    : "No saved recipes.";

  const takeoutsText = takeouts.length
    ? takeouts.map((t) => `- ${t.name}${t.cuisine ? ` (${t.cuisine})` : ""}${t.notes ? ": " + t.notes : ""}`).join("\n")
    : "No saved takeout favorites.";

  return `You are KitchenOS, a personal kitchen assistant. Help the user decide what to eat or cook based on their pantry, saved recipes, and favorite restaurants. Be practical and specific.

Current user context:
- Mood: ${prefs.mood || "steady"}
- Energy level: ${prefs.energy || "medium"}
- Available time: ${prefs.maxTime || 30} minutes

Pantry:
${pantryText}

Top meal matches:
${mealsText}

Saved recipes:
${recipesText}

Takeout favorites:
${takeoutsText}

Keep responses brief and actionable. Suggest 2–3 specific options with reasoning. Prioritize items that are about to expire.`;
}

async function readJsonFile(filePath, fallback = []) {
  try {
    const text = await fs.readFile(filePath, "utf-8");
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n");
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      throw new ExtractionError("Request body is too large.", { status: 413, code: "REQUEST_TOO_LARGE" });
    }
  }
  try {
    return JSON.parse(body || "{}");
  } catch {
    throw new ExtractionError("Request body must be valid JSON.", { status: 400, code: "INVALID_JSON" });
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(ROOT, requestedPath));
  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    sendJson(response, 403, { error: "Forbidden." });
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": CONTENT_TYPES[path.extname(filePath)] || "application/octet-stream",
    });
    if (request.method !== "HEAD") response.end(content);
    else response.end();
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    throw error;
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

server.listen(PORT, () => {
  console.log(`KitchenOS running at http://localhost:${PORT}`);
});
