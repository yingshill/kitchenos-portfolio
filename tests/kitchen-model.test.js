"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const model = require("../src/kitchen-model.js");

function idFactory() {
  let index = 0;
  return (prefix, name) => `${prefix}-${model.slugify(name || "event")}-${++index}`;
}

function extractedRecipe(overrides = {}) {
  return {
    sourceType: "article",
    title: "Peanut Soba Tofu",
    creator: "KitchenOS Extractor",
    confidence: 91,
    time: 18,
    servings: 2,
    coverTheme: "leaf",
    summary: "Fast noodles with tofu, broccoli, and a glossy peanut sauce.",
    ingredients: [
      { name: "Soba noodles", category: "Grain", servings: 2 },
      { name: "Tofu", category: "Protein", servings: 2 },
      { name: "Broccoli", category: "Produce", servings: 2 },
      { name: "Peanut sauce", category: "Pantry", servings: 2 },
      { name: "Limes", category: "Produce", servings: 1 },
    ],
    steps: [
      "Boil soba noodles until just tender, then rinse under cool water to stop cooking.",
      "Press tofu dry, cube it, and sear until the edges are golden.",
      "Steam or saute broccoli until bright green with a firm bite.",
      "Warm peanut sauce with a splash of water until glossy and pourable.",
      "Toss noodles, tofu, broccoli, and sauce together, then finish with lime.",
    ],
    ...overrides,
  };
}

test("scores meals from pantry coverage and user context", () => {
  const state = model.createState();
  const meals = model.recommendedMeals(state);

  assert.equal(meals[0].id, "meal-bowl");
  assert.equal(meals[0].score, 100);

  const soba = meals.find((meal) => meal.id === "meal-soba");
  assert.equal(soba.score, 45);
  assert.deepEqual(
    soba.coverage.needs.filter((need) => need.missing > 0).map((need) => need.item),
    ["Tofu", "Broccoli", "Peanut sauce"],
  );
});

test("imports a receipt into pantry once and marks it imported", () => {
  const state = model.createState();
  const beforeCount = state.pantry.length;

  const result = model.importReceipt(state, "rcp-1024", { idFactory: idFactory() });

  assert.equal(result.status, "imported");
  assert.equal(state.receipts.find((receipt) => receipt.id === "rcp-1024").status, "imported");
  assert.equal(state.pantry.length, beforeCount + 5);
  assert.equal(model.getPantryItem(state, "Tofu").servings, 3);
  assert.equal(state.events[0].title, "Receipt imported");

  const skipped = model.importReceipt(state, "rcp-1024", { idFactory: idFactory() });

  assert.equal(skipped.status, "skipped");
  assert.equal(state.pantry.length, beforeCount + 5);
});

test("builds and syncs grocery candidates without duplicating existing items", () => {
  const state = model.createState();
  const candidates = model.buildGroceryCandidates(state);

  assert.deepEqual(
    candidates.map((item) => item.name).sort(),
    ["Cherry tomatoes", "Wild salmon"],
  );

  const additions = model.syncGrocery(state, { idFactory: idFactory() });
  assert.equal(additions.length, 2);
  assert.equal(state.grocery.some((item) => item.name === "Wild salmon"), true);

  const secondPass = model.syncGrocery(state, { idFactory: idFactory() });
  assert.equal(secondPass.length, 0);
});

test("cooking a stocked meal depletes pantry servings", () => {
  const state = model.createState();
  const result = model.cookMeal(state, "meal-bowl", { idFactory: idFactory() });

  assert.equal(result.status, "cooked");
  assert.equal(model.getPantryItem(state, "Wild salmon").servings, 1);
  assert.equal(model.getPantryItem(state, "Jasmine rice").servings, 9);
  assert.equal(model.getPantryItem(state, "Baby spinach").servings, 2);
  assert.equal(state.events[0].title, "Meal cooked");
});

test("cooking a meal with missing ingredients creates grocery gaps", () => {
  const state = model.createState();
  const beforePantry = model.getPantryItem(state, "Soba noodles").servings;

  const result = model.cookMeal(state, "meal-soba", { idFactory: idFactory() });

  assert.equal(result.status, "missing");
  assert.deepEqual(
    result.missing.map((need) => need.item),
    ["Tofu", "Broccoli", "Peanut sauce"],
  );
  assert.equal(model.getPantryItem(state, "Soba noodles").servings, beforePantry);
  assert.equal(state.grocery.some((item) => item.name === "Peanut sauce"), true);
});

test("manual pantry and grocery mutations protect against invalid state", () => {
  const state = model.createState();

  model.adjustPantryItem(state, "itm-salmon", -99);
  assert.equal(model.getPantryItem(state, "Wild salmon").servings, 0);

  const added = model.addGroceryItem(state, "Cilantro", { idFactory: idFactory() });
  assert.equal(added.name, "Cilantro");

  model.toggleGroceryItem(state, added.id, true);
  assert.equal(state.grocery.find((item) => item.id === added.id).done, true);

  assert.equal(model.deleteGroceryItem(state, added.id), true);
  assert.equal(state.grocery.some((item) => item.id === added.id), false);
});

test("imports recipe URLs with a generated KitchenOS cover and no scraped thumbnail", () => {
  const state = model.createState();
  const result = model.importRecipeUrl(state, "https://youtube.example.com/watch?v=soba-tofu", {
    extraction: extractedRecipe({ sourceType: "video" }),
    idFactory: idFactory(),
  });

  assert.equal(result.status, "imported");
  assert.equal(result.recipeImport.sourceUrl, "https://youtube.example.com/watch?v=soba-tofu");
  assert.equal(result.recipeImport.sourceHost, "youtube.example.com");
  assert.equal(result.recipeImport.cover.status, "prompt-ready");
  assert.equal(Object.hasOwn(result.recipeImport, "sourceThumbnail"), false);
  assert.equal(result.recipeImport.ingredients.some((ingredient) => ingredient.name === "Tofu"), true);
  assert.equal(result.recipeImport.steps.length >= 5, true);
});

test("imports Rednote social recipe links and removes tracking noise", () => {
  const state = model.createState();
  const url =
    "https://www.rednote.com/explore/69e88898000000001a02d944?xsec_token=AB57eA5y5HvR9hju1ciUGtOQpJOxUv-2FjPb4QnFm5SZw=&xsec_source=pc_user&source=web_user_page";

  const result = model.importRecipeUrl(state, url, {
    extraction: extractedRecipe({
      sourceType: "social",
      title: "Rednote Garlic Chili Noodles",
      creator: "Rednote Extractor",
      confidence: 72,
    }),
    idFactory: idFactory(),
  });

  assert.equal(result.status, "imported");
  assert.equal(result.recipeImport.sourceUrl, "https://www.rednote.com/explore/69e88898000000001a02d944");
  assert.equal(result.recipeImport.sourceHost, "rednote.com");
  assert.equal(result.recipeImport.sourceType, "social");
  assert.equal(result.recipeImport.title, "Rednote Garlic Chili Noodles");
  assert.equal(result.recipeImport.fetchUrl, url);
  assert.equal(result.recipeImport.ingredients.some((ingredient) => ingredient.name === "Broccoli"), true);

  const duplicate = model.importRecipeUrl(state, `${url}&utm_source=copy`, {
    extraction: extractedRecipe({ title: "Duplicate should not be used" }),
    idFactory: idFactory(),
  });
  assert.equal(duplicate.status, "duplicate");
  assert.equal(duplicate.recipeImport.id, result.recipeImport.id);
});

test("force refresh updates an already complete duplicate recipe import", () => {
  const state = model.createState();
  const imported = model.importRecipeUrl(state, "https://recipe.example.com/soba-tofu", {
    extraction: extractedRecipe({ title: "Original Soba" }),
    idFactory: idFactory(),
  }).recipeImport;

  const duplicate = model.importRecipeUrl(state, "https://recipe.example.com/soba-tofu", {
    extraction: extractedRecipe({ title: "Ignored Soba" }),
    idFactory: idFactory(),
  });
  const refreshed = model.importRecipeUrl(state, "https://recipe.example.com/soba-tofu", {
    extraction: extractedRecipe({ title: "Refreshed Soba" }),
    forceRefresh: true,
    idFactory: idFactory(),
  });

  assert.equal(duplicate.status, "duplicate");
  assert.equal(refreshed.status, "updated");
  assert.equal(refreshed.recipeImport.id, imported.id);
  assert.equal(refreshed.recipeImport.title, "Refreshed Soba");
});

test("refreshes old URL imports that predate live extraction metadata", () => {
  const state = model.createState();
  state.recipeImports.unshift({
    id: "url-old-rednote",
    sourceUrl: "https://www.rednote.com/explore/69e88898000000001a02d944",
    sourceHost: "rednote.com",
    sourceType: "article",
    title: "Tomato Chickpea Skillet",
    creator: "KitchenOS Import",
    confidence: 84,
    time: 30,
    servings: 2,
    savedAsMeal: false,
    cover: { status: "generated", theme: "mustard", prompt: "old fixture" },
    ingredients: [{ name: "Chickpeas", category: "Pantry", servings: 2 }],
    steps: ["Old fixture step"],
    summary: "Old fixture summary.",
  });

  const result = model.importRecipeUrl(
    state,
    "https://www.rednote.com/explore/69e88898000000001a02d944?xsec_token=secret",
    {
      extraction: extractedRecipe({
        sourceType: "social",
        title: "Rednote Garlic Chili Noodles",
        creator: "Rednote Extractor",
      }),
      idFactory: idFactory(),
    },
  );

  assert.equal(result.status, "updated");
  assert.equal(result.recipeImport.id, "url-old-rednote");
  assert.equal(result.recipeImport.title, "Rednote Garlic Chili Noodles");
  assert.equal(result.recipeImport.sourceType, "social");
  assert.equal(result.recipeImport.extractionStatus, "complete");
});

test("refreshes incomplete duplicate imports when live metadata improves", () => {
  const state = model.createState();
  const imported = model.importRecipeUrl(state, "https://www.rednote.com/explore/buns", {
    extraction: extractedRecipe({
      sourceType: "social",
      title: "小红书",
      confidence: 30,
      ingredients: [{ name: "Brown sugar", category: "Pantry", servings: 1 }],
      steps: [],
      extractionStatus: "needs-review",
    }),
    idFactory: idFactory(),
  }).recipeImport;

  const result = model.importRecipeUrl(state, "https://www.rednote.com/explore/buns?xsec_token=secret", {
    extraction: extractedRecipe({
      sourceType: "social",
      title: "被全家人夸的红糖花卷也太好吃了吧！",
      confidence: 50,
      ingredients: [
        { name: "Brown sugar", category: "Pantry", servings: 1 },
        { name: "Flour", category: "Grain", servings: 1 },
      ],
      steps: [],
      extractionStatus: "needs-review",
    }),
    idFactory: idFactory(),
  });

  assert.equal(result.status, "updated");
  assert.equal(result.recipeImport.id, imported.id);
  assert.equal(result.recipeImport.title, "被全家人夸的红糖花卷也太好吃了吧！");
  assert.equal(result.recipeImport.cover.status, "prompt-ready");
});

test("updates an imported recipe from reviewed extraction text and regenerates cover data", () => {
  const state = model.createState();
  const imported = model.importRecipeUrl(state, "https://www.rednote.com/explore/buns", {
    extraction: extractedRecipe({
      sourceType: "social",
      title: "Rednote placeholder",
      ingredients: [{ name: "Brown sugar", category: "Pantry", servings: 1 }],
      steps: [],
      extractionStatus: "needs-review",
    }),
    idFactory: idFactory(),
  }).recipeImport;

  const result = model.updateRecipeImport(
    state,
    imported.id,
    extractedRecipe({
      sourceType: "social",
      title: "Brown Sugar Steamed Buns",
      ingredients: [
        { name: "Flour", category: "Grain", servings: 2 },
        { name: "Brown sugar", category: "Pantry", servings: 1 },
      ],
      coverTheme: undefined,
      steps: ["Mix the dough.", "Roll with brown sugar.", "Steam until fluffy."],
      extractionStatus: "complete",
    }),
  );

  assert.equal(result.status, "updated");
  assert.equal(result.recipeImport.title, "Brown Sugar Steamed Buns");
  assert.equal(result.recipeImport.cover.status, "prompt-ready");
  assert.equal(result.recipeImport.cover.theme, "mustard");
  assert.equal(result.recipeImport.cover.prompt.includes("Flour"), true);
  assert.equal(result.recipeImport.steps.length, 3);
});

test("updates generated cover state after AI cover generation", () => {
  const state = model.createState();
  const imported = model.importRecipeUrl(state, "https://recipe.example.com/soba-tofu", {
    extraction: extractedRecipe(),
    idFactory: idFactory(),
  }).recipeImport;

  const result = model.updateRecipeCover(state, imported.id, {
    status: "ai-generated",
    imageDataUrl: "data:image/png;base64,abc123",
    guidelineVersion: "kitchenos-cover-v1",
  });

  assert.equal(result.status, "updated");
  assert.equal(result.recipeImport.cover.status, "ai-generated");
  assert.equal(result.recipeImport.cover.imageDataUrl, "data:image/png;base64,abc123");
  assert.equal(state.lastAction, "Peanut Soba Tofu cover generated");
});

test("recipe URL gaps sync to grocery and imported recipes can become meals", () => {
  const state = model.createState();
  const imported = model.importRecipeUrl(state, "https://recipe.example.com/soba-tofu", {
    extraction: extractedRecipe(),
    idFactory: idFactory(),
  }).recipeImport;

  const additions = model.syncRecipeImportGaps(state, imported.id, { idFactory: idFactory() });
  assert.deepEqual(
    additions.map((item) => item.name).sort(),
    ["Broccoli", "Limes", "Peanut sauce", "Tofu"],
  );

  const saved = model.saveRecipeImportAsMeal(state, imported.id, { idFactory: idFactory() });
  assert.equal(saved.status, "saved");
  assert.equal(state.meals[0].sourceImportId, imported.id);
  assert.equal(model.saveRecipeImportAsMeal(state, imported.id, { idFactory: idFactory() }).status, "duplicate");
});
