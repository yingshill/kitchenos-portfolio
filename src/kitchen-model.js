(function kitchenModelModule(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.KitchenModel = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function buildKitchenModel() {
  "use strict";

  const seedState = {
    view: "command",
    mood: "focused",
    energy: "medium",
    maxTime: 30,
    search: "",
    category: "All",
    selectedReceiptId: "rcp-1024",
    selectedMealId: "meal-bowl",
    selectedRecipeImportId: "url-peanut-soba-tofu",
    urlDraft: "",
    importJobs: [],
    lastAction: "Demo data loaded",
    pantry: [
      {
        id: "itm-spinach",
        name: "Baby spinach",
        category: "Produce",
        servings: 3,
        minServings: 2,
        weeklyUse: 4,
        expiresIn: 3,
        price: 4.29,
        source: "Fresh Market",
      },
      {
        id: "itm-eggs",
        name: "Pasture eggs",
        category: "Protein",
        servings: 8,
        minServings: 4,
        weeklyUse: 6,
        expiresIn: 14,
        price: 6.99,
        source: "Fresh Market",
      },
      {
        id: "itm-rice",
        name: "Jasmine rice",
        category: "Grain",
        servings: 10,
        minServings: 3,
        weeklyUse: 5,
        expiresIn: 120,
        price: 7.49,
        source: "Pantry",
      },
      {
        id: "itm-salmon",
        name: "Wild salmon",
        category: "Protein",
        servings: 2,
        minServings: 2,
        weeklyUse: 2,
        expiresIn: 1,
        price: 13.8,
        source: "Fresh Market",
      },
      {
        id: "itm-yogurt",
        name: "Greek yogurt",
        category: "Dairy",
        servings: 5,
        minServings: 2,
        weeklyUse: 3,
        expiresIn: 8,
        price: 5.89,
        source: "Fresh Market",
      },
      {
        id: "itm-chickpeas",
        name: "Chickpeas",
        category: "Pantry",
        servings: 4,
        minServings: 2,
        weeklyUse: 2,
        expiresIn: 240,
        price: 3.18,
        source: "Pantry",
      },
      {
        id: "itm-tomatoes",
        name: "Cherry tomatoes",
        category: "Produce",
        servings: 2,
        minServings: 2,
        weeklyUse: 3,
        expiresIn: 4,
        price: 4.5,
        source: "Fresh Market",
      },
      {
        id: "itm-noodles",
        name: "Soba noodles",
        category: "Grain",
        servings: 3,
        minServings: 1,
        weeklyUse: 2,
        expiresIn: 180,
        price: 4.75,
        source: "Pantry",
      },
    ],
    receipts: [
      {
        id: "rcp-1024",
        merchant: "Fresh Market",
        date: "2026-05-15",
        total: 47.35,
        confidence: 96,
        status: "ready",
        items: [
          { name: "Blueberries", category: "Produce", servings: 4, price: 5.49, expiresIn: 5 },
          { name: "Oat milk", category: "Dairy", servings: 6, price: 4.99, expiresIn: 12 },
          { name: "Tofu", category: "Protein", servings: 3, price: 3.89, expiresIn: 9 },
          { name: "Broccoli", category: "Produce", servings: 3, price: 3.49, expiresIn: 4 },
          { name: "Peanut sauce", category: "Pantry", servings: 8, price: 6.99, expiresIn: 180 },
        ],
      },
      {
        id: "rcp-1021",
        merchant: "Corner Co-op",
        date: "2026-05-12",
        total: 31.2,
        confidence: 89,
        status: "imported",
        items: [
          { name: "Greek yogurt", category: "Dairy", servings: 5, price: 5.89, expiresIn: 8 },
          { name: "Cherry tomatoes", category: "Produce", servings: 2, price: 4.5, expiresIn: 4 },
        ],
      },
    ],
    meals: [
      {
        id: "meal-bowl",
        name: "Salmon rice bowl",
        summary: "High-protein bowl with spinach, tomatoes, rice, and yogurt sauce.",
        time: 25,
        energy: "medium",
        moods: ["focused", "steady"],
        needs: [
          { item: "Wild salmon", servings: 1 },
          { item: "Jasmine rice", servings: 1 },
          { item: "Baby spinach", servings: 1 },
          { item: "Greek yogurt", servings: 1 },
        ],
      },
      {
        id: "meal-soba",
        name: "Peanut soba tofu",
        summary: "Fast noodles with broccoli, tofu, and pantry sauce.",
        time: 18,
        energy: "low",
        moods: ["tired", "focused"],
        needs: [
          { item: "Soba noodles", servings: 1 },
          { item: "Tofu", servings: 1 },
          { item: "Broccoli", servings: 1 },
          { item: "Peanut sauce", servings: 1 },
        ],
      },
      {
        id: "meal-shakshuka",
        name: "Tomato chickpea eggs",
        summary: "Skillet meal using eggs, chickpeas, tomatoes, and greens.",
        time: 30,
        energy: "medium",
        moods: ["steady", "social"],
        needs: [
          { item: "Pasture eggs", servings: 2 },
          { item: "Chickpeas", servings: 1 },
          { item: "Cherry tomatoes", servings: 1 },
          { item: "Baby spinach", servings: 1 },
        ],
      },
      {
        id: "meal-yogurt",
        name: "Blueberry yogurt bowl",
        summary: "Low-effort meal for tired evenings or quick breakfasts.",
        time: 8,
        energy: "low",
        moods: ["tired", "steady"],
        needs: [
          { item: "Greek yogurt", servings: 1 },
          { item: "Blueberries", servings: 1 },
        ],
      },
    ],
    grocery: [
      { id: "gro-olive", name: "Olive oil", category: "Pantry", qty: "1 bottle", source: "Manual", done: false },
      { id: "gro-lemons", name: "Lemons", category: "Produce", qty: "4", source: "Meal gap", done: false },
      { id: "gro-towels", name: "Paper towels", category: "Household", qty: "1 pack", source: "Recurring", done: true },
    ],
    recipeImports: [
      {
        id: "url-peanut-soba-tofu",
        sourceUrl: "https://video.example.com/weeknight-peanut-soba-tofu",
        fetchUrl: "https://video.example.com/weeknight-peanut-soba-tofu",
        sourceHost: "video.example.com",
        sourceType: "video",
        title: "Peanut Soba Tofu",
        creator: "Weeknight Lab",
        confidence: 91,
        time: 18,
        servings: 2,
        summary: "Fast noodles with broccoli, tofu, and a glossy peanut sauce.",
        savedAsMeal: false,
        extractionStatus: "complete",
        warnings: [],
        cover: {
          status: "generated",
          theme: "leaf",
          prompt:
            "KitchenOS editorial food cover for peanut soba tofu with soba noodles, tofu, broccoli, and peanut sauce. Clean overhead composition, natural light, no text, no logos.",
        },
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
      },
    ],
    events: [
      { id: "evt-1", kind: "scan", title: "Receipt parsed", detail: "Fresh Market receipt is ready for pantry merge." },
      { id: "evt-2", kind: "pantry", title: "Freshness risk", detail: "Wild salmon expires in 1 day." },
      { id: "evt-3", kind: "meal", title: "Recommendation generated", detail: "Salmon rice bowl matches focused mood and 25 minute window." },
    ],
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createState() {
    return clone(seedState);
  }

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function normalizeName(value) {
    return String(value).toLowerCase();
  }

  function createPantryIndex(state) {
    const pantryByName = new Map();
    state.pantry.forEach((item) => {
      const key = normalizeName(item.name);
      if (!pantryByName.has(key)) pantryByName.set(key, item);
    });
    return pantryByName;
  }

  function createNameSet(items) {
    return new Set(items.map((item) => normalizeName(item.name)));
  }

  function getPantryItemFromIndex(pantryIndex, name) {
    return pantryIndex.get(normalizeName(name));
  }

  function defaultIdFactory(prefix, name) {
    const suffix = name ? `-${slugify(name)}` : "";
    return `${prefix}${suffix}-${Date.now()}`;
  }

  function normalizeUrl(value) {
    try {
      const url = new URL(String(value || "").trim());
      if (!["http:", "https:"].includes(url.protocol)) return null;
      url.hash = "";
      stripTrackingParams(url);
      return url;
    } catch {
      return null;
    }
  }

  function fetchUrlForValue(value) {
    try {
      const url = new URL(String(value || "").trim());
      if (!["http:", "https:"].includes(url.protocol)) return "";
      url.hash = "";
      return url.href;
    } catch {
      return "";
    }
  }

  function stripTrackingParams(url) {
    [...url.searchParams.keys()].forEach((key) => {
      if (isTrackingParam(key)) url.searchParams.delete(key);
    });
  }

  function isTrackingParam(key) {
    return (
      key.startsWith("utm_") ||
      [
        "fbclid",
        "gclid",
        "igshid",
        "mc_cid",
        "mc_eid",
        "source",
        "spm",
        "xsec_source",
        "xsec_token",
      ].includes(key)
    );
  }

  function sourceHost(url) {
    return url.hostname.replace(/^www\./, "");
  }

  function isRednoteUrl(url) {
    const host = sourceHost(url);
    return host === "rednote.com" || host === "xiaohongshu.com" || host.endsWith(".xiaohongshu.com");
  }

  function sourceTypeForUrl(url) {
    const text = `${url.href} ${url.hostname}`.toLowerCase();
    if (isRednoteUrl(url) || text.includes("instagram") || text.includes("tiktok")) return "social";
    if (text.includes("youtu") || text.includes("video") || text.includes("vimeo")) return "video";
    return "article";
  }

  function categoryForIngredient(name) {
    const text = normalizeName(name);
    if (/(spinach|broccoli|tomato|lime|lemon|blueberr|garlic|onion|pepper|cilantro|basil|lettuce|greens?)/.test(text)) {
      return "Produce";
    }
    if (/(salmon|tofu|egg|chicken|beef|pork|turkey|shrimp|fish|beans?|lentils?)/.test(text)) return "Protein";
    if (/(yogurt|milk|cheese|cream|butter)/.test(text)) return "Dairy";
    if (/(rice|noodle|pasta|soba|bread|flour|oat|quinoa|tortilla)/.test(text)) return "Grain";
    return "Pantry";
  }

  function coverThemeForIngredients(ingredients) {
    if (ingredients.some((ingredient) => ingredient.category === "Produce")) return "leaf";
    if (ingredients.some((ingredient) => ingredient.category === "Protein")) return "tomato";
    if (ingredients.some((ingredient) => ingredient.category === "Grain")) return "mustard";
    return "plum";
  }

  function normalizeServings(value, fallback = 1) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return fallback;
    return Math.max(1, Math.round(number));
  }

  function normalizeRecipeExtraction(url, extraction) {
    if (!extraction || typeof extraction !== "object") return null;
    const title = String(extraction.title || "").trim();
    if (!title) return null;
    const ingredients = (Array.isArray(extraction.ingredients) ? extraction.ingredients : [])
      .map((ingredient) => ({
        name: String(ingredient.name || "").trim(),
        category: ingredient.category || categoryForIngredient(ingredient.name || ""),
        servings: normalizeServings(ingredient.servings),
      }))
      .filter((ingredient) => ingredient.name);
    const steps = (Array.isArray(extraction.steps) ? extraction.steps : [])
      .map((step) => String(step || "").trim())
      .filter(Boolean);
    return {
      sourceType: extraction.sourceType || sourceTypeForUrl(url),
      title,
      creator: String(extraction.creator || sourceHost(url)).trim(),
      confidence: Math.max(0, Math.min(100, Math.round(Number(extraction.confidence) || 0))),
      time: Math.max(0, Math.round(Number(extraction.time) || 0)),
      servings: normalizeServings(extraction.servings, 1),
      fetchUrl: String(extraction.fetchUrl || url.href).trim(),
      coverTheme: extraction.coverTheme || coverThemeForIngredients(ingredients),
      summary: String(extraction.summary || `Imported from ${sourceHost(url)}.`).trim(),
      ingredients,
      steps,
      extractionStatus: extraction.extractionStatus || (ingredients.length && steps.length ? "complete" : "needs-review"),
      warnings: Array.isArray(extraction.warnings) ? extraction.warnings.map(String).filter(Boolean) : [],
    };
  }

  function createCoverPrompt(recipe) {
    const ingredients = recipe.ingredients.map((ingredient) => ingredient.name).join(", ");
    const ingredientPrompt = ingredients ? ` with ${ingredients}` : "";
    return `KitchenOS editorial food cover for ${recipe.title}${ingredientPrompt}. Clean overhead composition, natural light, no text, no logos, no brand packaging.`;
  }

  function getPantryItem(state, name) {
    const targetName = normalizeName(name);
    return state.pantry.find((item) => normalizeName(item.name) === targetName);
  }

  function pantryValue(state) {
    return state.pantry.reduce((total, item) => total + item.price * Math.max(item.servings, 0), 0);
  }

  function lowStockItems(state) {
    return state.pantry.filter((item) => item.servings <= item.minServings);
  }

  function riskItems(state) {
    return state.pantry.filter((item) => item.expiresIn <= 4);
  }

  function receiptQueue(state) {
    return state.receipts.filter((receipt) => receipt.status !== "imported");
  }

  function selectedReceiptIsImported(state) {
    const receipt = state.receipts.find((item) => item.id === state.selectedReceiptId);
    return !receipt || receipt.status === "imported";
  }

  function getRecipeImport(state, importId) {
    return state.recipeImports.find((item) => item.id === importId);
  }

  function mealCoverage(state, meal, pantryIndex = createPantryIndex(state)) {
    const needs = meal.needs.map((need) => {
      const pantryItem = getPantryItemFromIndex(pantryIndex, need.item);
      const available = pantryItem ? pantryItem.servings : 0;
      return {
        ...need,
        available,
        covered: Math.min(available / need.servings, 1),
        missing: Math.max(need.servings - available, 0),
      };
    });
    const coverage = needs.length ? needs.reduce((total, need) => total + need.covered, 0) / needs.length : 0;
    return { needs, coverage };
  }

  function scoreMealFromCoverage(state, meal, coverage) {
    let score = Math.round(coverage * 58);
    if (meal.moods.includes(state.mood)) score += 18;
    if (meal.energy === state.energy) score += 12;
    if (meal.time <= state.maxTime) score += 12;
    if (meal.time > state.maxTime) score -= 18;
    return Math.max(0, Math.min(100, score));
  }

  function scoreMeal(state, meal) {
    return scoreMealFromCoverage(state, meal, mealCoverage(state, meal).coverage);
  }

  function recommendedMeals(state, pantryIndex = createPantryIndex(state)) {
    return state.meals
      .map((meal) => {
        const coverage = mealCoverage(state, meal, pantryIndex);
        return { ...meal, score: scoreMealFromCoverage(state, meal, coverage.coverage), coverage };
      })
      .sort((a, b) => b.score - a.score);
  }

  function buildGroceryCandidates(state) {
    const candidates = new Map();
    const pantryIndex = createPantryIndex(state);
    const groceryNames = createNameSet(state.grocery);
    lowStockItems(state).forEach((item) => {
      candidates.set(normalizeName(item.name), {
        name: item.name,
        category: item.category,
        qty: `${Math.max(item.minServings * 2 - item.servings, 1)} servings`,
        source: "Low stock",
      });
    });
    recommendedMeals(state, pantryIndex)
      .slice(0, 2)
      .forEach((meal) => {
        meal.coverage.needs
          .filter((need) => need.missing > 0)
          .forEach((need) => {
            const candidateName = normalizeName(need.item);
            if (!candidates.has(candidateName)) {
              const pantryEntry = getPantryItemFromIndex(pantryIndex, need.item);
              candidates.set(candidateName, {
                name: need.item,
                category: pantryEntry ? pantryEntry.category : "Pantry",
                qty: `${need.missing} serving`,
                source: "Meal gap",
              });
            }
          });
      });
    return [...candidates.values()].filter((candidate) => !groceryNames.has(normalizeName(candidate.name)));
  }

  function recipeImportCoverage(state, recipeImport, pantryIndex = createPantryIndex(state)) {
    const ingredients = recipeImport.ingredients.map((ingredient) => {
      const pantryItem = getPantryItemFromIndex(pantryIndex, ingredient.name);
      const available = pantryItem ? pantryItem.servings : 0;
      return {
        ...ingredient,
        available,
        covered: Math.min(available / ingredient.servings, 1),
        missing: Math.max(ingredient.servings - available, 0),
      };
    });
    const coverage = ingredients.length
      ? ingredients.reduce((total, ingredient) => total + ingredient.covered, 0) / ingredients.length
      : 0;
    return { ingredients, coverage };
  }

  function assignRecipeImportData(recipeImport, url, recipe) {
    recipeImport.sourceUrl = url.href;
    recipeImport.fetchUrl = recipe.fetchUrl || url.href;
    recipeImport.sourceHost = sourceHost(url);
    recipeImport.sourceType = recipe.sourceType;
    recipeImport.title = recipe.title;
    recipeImport.creator = recipe.creator;
    recipeImport.confidence = recipe.confidence;
    recipeImport.time = recipe.time;
    recipeImport.servings = recipe.servings;
    recipeImport.cover = {
      status: "prompt-ready",
      theme: recipe.coverTheme,
      prompt: createCoverPrompt(recipe),
    };
    recipeImport.ingredients = recipe.ingredients;
    recipeImport.steps = recipe.steps;
    recipeImport.summary = recipe.summary;
    recipeImport.extractionStatus = recipe.extractionStatus;
    recipeImport.warnings = recipe.warnings;
    return recipeImport;
  }

  function updateRecipeCover(state, importId, cover) {
    const recipeImport = getRecipeImport(state, importId);
    if (!recipeImport || !cover || typeof cover !== "object") return { status: "not-found" };
    recipeImport.cover = {
      ...recipeImport.cover,
      ...cover,
    };
    state.lastAction =
      recipeImport.cover.status === "ai-generated"
        ? `${recipeImport.title} cover generated`
        : recipeImport.cover.message || "Cover generation updated";
    return { status: "updated", recipeImport };
  }

  function shouldRefreshRecipeImport(existing, recipe) {
    if (!existing.extractionStatus) return true;
    if (existing.extractionStatus !== "needs-review") return false;
    if (recipe.extractionStatus === "complete") return true;
    if (recipe.confidence > existing.confidence) return true;
    return (
      Array.isArray(existing.steps) &&
      existing.steps.length === 0 &&
      recipe.title &&
      recipe.title !== existing.title
    );
  }

  function importRecipeUrl(state, value, options = {}) {
    const url = normalizeUrl(value);
    if (!url) {
      state.lastAction = "Enter a valid recipe or video URL";
      return { status: "invalid" };
    }

    const normalizedUrl = url.href;
    const extraction = options.extraction || options.recipe;
    const recipe = normalizeRecipeExtraction(url, extraction);
    if (recipe && !extraction?.fetchUrl) recipe.fetchUrl = fetchUrlForValue(value) || normalizedUrl;
    const existing = state.recipeImports.find((item) => item.sourceUrl === normalizedUrl);
    if (existing) {
      if (recipe && (options.forceRefresh || shouldRefreshRecipeImport(existing, recipe))) {
        assignRecipeImportData(existing, url, recipe);
        state.selectedRecipeImportId = existing.id;
        state.urlDraft = "";
        state.lastAction = `${existing.title} refreshed`;
        addEvent(state, "meal", "Recipe URL refreshed", `${existing.title} refreshed from ${existing.sourceHost}.`, options);
        return { status: "updated", recipeImport: existing };
      }
      state.selectedRecipeImportId = existing.id;
      state.lastAction = "Recipe URL already imported";
      return { status: "duplicate", recipeImport: existing };
    }

    const idFactory = options.idFactory || defaultIdFactory;
    if (!recipe) {
      state.lastAction = "Live extraction did not return recipe data";
      return { status: "needs-extraction" };
    }
    const recipeImport = {
      id: idFactory("url", recipe.title),
      savedAsMeal: false,
    };
    assignRecipeImportData(recipeImport, url, recipe);

    state.recipeImports = [recipeImport, ...state.recipeImports];
    state.selectedRecipeImportId = recipeImport.id;
    state.urlDraft = "";
    state.lastAction = `${recipeImport.title} extracted`;
    addEvent(state, "meal", "Recipe URL imported", `${recipeImport.title} extracted from ${recipeImport.sourceHost}.`, options);
    return { status: "imported", recipeImport };
  }

  function updateRecipeImport(state, importId, extraction, options = {}) {
    const recipeImport = getRecipeImport(state, importId);
    if (!recipeImport) return { status: "not-found" };
    const url = normalizeUrl(recipeImport.sourceUrl);
    const recipe = normalizeRecipeExtraction(url, extraction);
    if (!url || !recipe) {
      state.lastAction = "Recipe correction did not return usable data";
      return { status: "invalid" };
    }

    assignRecipeImportData(recipeImport, url, recipe);
    state.selectedRecipeImportId = recipeImport.id;
    state.lastAction = `${recipeImport.title} corrected`;
    addEvent(state, "meal", "Recipe corrected", `${recipeImport.title} updated from reviewed text.`, options);
    return { status: "updated", recipeImport };
  }

  function syncRecipeImportGaps(state, importId, options = {}) {
    const recipeImport = getRecipeImport(state, importId);
    if (!recipeImport) return [];
    const idFactory = options.idFactory || defaultIdFactory;
    const groceryNames = createNameSet(state.grocery);
    const additions = [];
    recipeImportCoverage(state, recipeImport).ingredients
      .filter((ingredient) => ingredient.missing > 0)
      .forEach((ingredient) => {
        const ingredientName = normalizeName(ingredient.name);
        if (groceryNames.has(ingredientName)) return;
        additions.push({
          id: idFactory("gro", ingredient.name),
          name: ingredient.name,
          category: ingredient.category,
          qty: `${ingredient.missing} serving${ingredient.missing === 1 ? "" : "s"}`,
          source: "URL recipe gap",
          done: false,
        });
        groceryNames.add(ingredientName);
      });

    if (additions.length > 0) {
      state.grocery = [...state.grocery, ...additions];
      state.lastAction = `${additions.length} recipe gap${additions.length === 1 ? "" : "s"} added`;
      addEvent(state, "grocery", "Recipe gaps added", `${recipeImport.title} missing items moved to grocery.`, options);
    } else {
      state.lastAction = "Recipe gaps already covered";
    }
    return additions;
  }

  function saveRecipeImportAsMeal(state, importId, options = {}) {
    const recipeImport = getRecipeImport(state, importId);
    if (!recipeImport) return { status: "not-found" };
    const existing = state.meals.find((meal) => meal.sourceImportId === recipeImport.id);
    if (existing) {
      recipeImport.savedAsMeal = true;
      state.lastAction = "Recipe already saved as meal";
      return { status: "duplicate", meal: existing };
    }

    const idFactory = options.idFactory || defaultIdFactory;
    const meal = {
      id: idFactory("meal", recipeImport.title),
      sourceImportId: recipeImport.id,
      name: recipeImport.title,
      summary: recipeImport.summary || `Imported from ${recipeImport.sourceHost}.`,
      time: recipeImport.time,
      energy: recipeImport.time <= 20 ? "low" : "medium",
      moods: recipeImport.time <= 20 ? ["tired", "focused"] : ["steady", "social"],
      needs: recipeImport.ingredients.map((ingredient) => ({
        item: ingredient.name,
        servings: Math.min(ingredient.servings, 2),
      })),
    };
    state.meals = [meal, ...state.meals];
    recipeImport.savedAsMeal = true;
    state.lastAction = `${recipeImport.title} saved as meal`;
    addEvent(state, "meal", "Imported recipe saved", `${recipeImport.title} added to meal recommendations.`, options);
    return { status: "saved", meal };
  }

  function addEvent(state, kind, title, detail, options = {}) {
    const idFactory = options.idFactory || defaultIdFactory;
    const event = { id: idFactory("evt", title), kind, title, detail };
    state.events = [event, ...state.events].slice(0, 6);
    return event;
  }

  function importReceipt(state, receiptId, options = {}) {
    const idFactory = options.idFactory || defaultIdFactory;
    const receipt = state.receipts.find((item) => item.id === receiptId);
    if (!receipt || receipt.status === "imported") {
      state.lastAction = "Receipt already imported";
      return { status: "skipped", receipt };
    }

    const added = [];
    const updated = [];
    const pantryIndex = createPantryIndex(state);
    receipt.items.forEach((lineItem) => {
      const existing = getPantryItemFromIndex(pantryIndex, lineItem.name);
      if (existing) {
        existing.servings += lineItem.servings;
        existing.expiresIn = Math.max(existing.expiresIn, lineItem.expiresIn);
        existing.source = receipt.merchant;
        updated.push(existing.name);
      } else {
        const pantryItem = {
          id: idFactory("itm", lineItem.name),
          name: lineItem.name,
          category: lineItem.category,
          servings: lineItem.servings,
          minServings: lineItem.category === "Produce" ? 2 : 1,
          weeklyUse: lineItem.category === "Produce" ? 3 : 2,
          expiresIn: lineItem.expiresIn,
          price: lineItem.price / Math.max(lineItem.servings, 1),
          source: receipt.merchant,
        };
        state.pantry.push(pantryItem);
        pantryIndex.set(normalizeName(pantryItem.name), pantryItem);
        added.push(pantryItem.name);
      }
    });

    receipt.status = "imported";
    state.lastAction = `${receipt.merchant} imported`;
    addEvent(state, "scan", "Receipt imported", `${receipt.items.length} items merged into pantry.`, options);
    return { status: "imported", receipt, added, updated };
  }

  function syncGrocery(state, options = {}) {
    const idFactory = options.idFactory || defaultIdFactory;
    const additions = buildGroceryCandidates(state).map((item) => ({
      ...item,
      id: idFactory("gro", item.name),
      done: false,
    }));
    if (additions.length > 0) {
      state.grocery = [...state.grocery, ...additions];
      state.lastAction = `${additions.length} grocery gap${additions.length === 1 ? "" : "s"} synced`;
      addEvent(
        state,
        "grocery",
        "Grocery gaps synced",
        `${additions.length} item${additions.length === 1 ? "" : "s"} added.`,
        options,
      );
    } else {
      state.lastAction = "Grocery list already covers current gaps";
    }
    return additions;
  }

  function cookMeal(state, mealId, options = {}) {
    const idFactory = options.idFactory || defaultIdFactory;
    const meal = state.meals.find((item) => item.id === mealId);
    if (!meal) return { status: "not-found" };
    const coverage = mealCoverage(state, meal);
    const missing = coverage.needs.filter((need) => need.missing > 0);

    if (missing.length > 0) {
      const groceryNames = createNameSet(state.grocery);
      missing.forEach((need) => {
        const needName = normalizeName(need.item);
        if (!groceryNames.has(needName)) {
          state.grocery.push({
            id: idFactory("gro", need.item),
            name: need.item,
            category: "Pantry",
            qty: `${need.missing} serving`,
            source: "Meal gap",
            done: false,
          });
          groceryNames.add(needName);
        }
      });
      state.lastAction = `${meal.name} needs ${missing.length} grocery gap${missing.length === 1 ? "" : "s"}`;
      addEvent(state, "grocery", "Meal gaps added", `${meal.name} missing items moved to grocery.`, options);
      return { status: "missing", meal, missing };
    }

    const pantryIndex = createPantryIndex(state);
    meal.needs.forEach((need) => {
      const pantryItem = getPantryItemFromIndex(pantryIndex, need.item);
      pantryItem.servings = Math.max(0, pantryItem.servings - need.servings);
    });
    state.lastAction = `${meal.name} cooked`;
    addEvent(state, "meal", "Meal cooked", `${meal.name} depleted pantry inventory.`, options);
    return { status: "cooked", meal, missing: [] };
  }

  function adjustPantryItem(state, itemId, delta) {
    const item = state.pantry.find((entry) => entry.id === itemId);
    if (!item) return null;
    item.servings = Math.max(0, item.servings + delta);
    state.lastAction = `${item.name} ${delta > 0 ? "restocked" : "used"}`;
    return item;
  }

  function addGroceryItem(state, name, options = {}) {
    const idFactory = options.idFactory || defaultIdFactory;
    const trimmed = String(name || "").trim();
    if (!trimmed) return null;
    const item = {
      id: idFactory("gro", trimmed),
      name: trimmed,
      category: options.category || "Pantry",
      qty: options.qty || "1",
      source: options.source || "Manual",
      done: false,
    };
    state.grocery.push(item);
    state.lastAction = `${trimmed} added`;
    return item;
  }

  function toggleGroceryItem(state, groceryId, done) {
    const item = state.grocery.find((entry) => entry.id === groceryId);
    if (!item) return null;
    item.done = Boolean(done);
    state.lastAction = `${item.name} ${item.done ? "checked" : "reopened"}`;
    return item;
  }

  function deleteGroceryItem(state, groceryId) {
    const originalLength = state.grocery.length;
    state.grocery = state.grocery.filter((item) => item.id !== groceryId);
    if (state.grocery.length !== originalLength) state.lastAction = "Grocery item removed";
    return state.grocery.length !== originalLength;
  }

  return {
    seedState,
    addEvent,
    addGroceryItem,
    adjustPantryItem,
    buildGroceryCandidates,
    clone,
    cookMeal,
    createState,
    deleteGroceryItem,
    getPantryItem,
    importReceipt,
    importRecipeUrl,
    lowStockItems,
    mealCoverage,
    pantryValue,
    recipeImportCoverage,
    receiptQueue,
    recommendedMeals,
    riskItems,
    saveRecipeImportAsMeal,
    scoreMeal,
    selectedReceiptIsImported,
    slugify,
    syncGrocery,
    syncRecipeImportGaps,
    toggleGroceryItem,
    updateRecipeCover,
    updateRecipeImport,
  };
});
