"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const model = require("../src/kitchen-model.js");

function idFactory() {
  let index = 0;
  return (prefix, name) => `${prefix}-${model.slugify(name || "event")}-${++index}`;
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
    idFactory: idFactory(),
  });

  assert.equal(result.status, "imported");
  assert.equal(result.recipeImport.sourceUrl, "https://youtube.example.com/watch?v=soba-tofu");
  assert.equal(result.recipeImport.sourceHost, "youtube.example.com");
  assert.equal(result.recipeImport.cover.status, "generated");
  assert.equal(Object.hasOwn(result.recipeImport, "sourceThumbnail"), false);
  assert.equal(result.recipeImport.ingredients.some((ingredient) => ingredient.name === "Tofu"), true);
  assert.equal(result.recipeImport.steps.length >= 5, true);
});

test("recipe URL gaps sync to grocery and imported recipes can become meals", () => {
  const state = model.createState();
  const imported = model.importRecipeUrl(state, "https://recipe.example.com/soba-tofu", {
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
