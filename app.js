"use strict";

const STORAGE_KEY = "kitchenos.portfolio.state.v1";

const icons = {
  layout:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="7" height="8" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="15" width="7" height="6" rx="1"></rect></svg>',
  scan:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3H5a2 2 0 0 0-2 2v2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><path d="M7 12h10"></path></svg>',
  boxes:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m7 16 5 3 5-3"></path><path d="m7 8 5-3 5 3"></path><path d="M12 5v14"></path><path d="m3 10 4-2 5 3 5-3 4 2v7l-9 5-9-5z"></path></svg>',
  chef:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 13.9V21h12v-7.1"></path><path d="M6.5 14a4.5 4.5 0 1 1 1.2-8.8 4.8 4.8 0 0 1 8.6 0A4.5 4.5 0 1 1 17.5 14"></path><path d="M9 17h6"></path></svg>',
  cart:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2 3h3l3 13h11l2-8H7"></path></svg>',
  briefcase:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M3 12h18"></path></svg>',
  download:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5"></path><path d="M12 15V3"></path></svg>',
  refresh:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"></path><path d="M3 12A9 9 0 0 1 18.5 5.8L21 8"></path><path d="M3 16v5h5"></path><path d="M21 8V3h-5"></path></svg>',
  spark:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13 2 9 14l-7 2 7 2 4 12 4-12 7-2-7-2z"></path></svg>',
  book:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
  "map-pin":
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  send:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
  close:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m18 6-12 12"></path><path d="m6 6 12 12"></path></svg>',
  edit:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
  plus:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>',
  minus:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14"></path></svg>',
  trash:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 15H6L5 6"></path></svg>',
  check:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m20 6-11 11-5-5"></path></svg>',
  clock:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>',
};

const viewMeta = {
  command: {
    eyebrow: "Command center",
    title: "Kitchen loop operating system",
  },
  receipts: {
    eyebrow: "Source intake",
    title: "Import receipts and recipe URLs into the kitchen graph",
  },
  pantry: {
    eyebrow: "Pantry graph",
    title: "Track stock, freshness, and depletion",
  },
  meals: {
    eyebrow: "Meal engine",
    title: "Match mood, time, energy, and available food",
  },
  grocery: {
    eyebrow: "Grocery loop",
    title: "Close the loop from gaps to shopping list",
  },
  case: {
    eyebrow: "Portfolio case study",
    title: "Production-grade system narrative",
  },
  recipe: {
    eyebrow: "Recipe library",
    title: "在吃苦和吃亏中，我选择「吃饭」",
  },
  takeouts: {
    eyebrow: "Takeout favorites",
    title: "Your go-to restaurants and saved orders",
  },
  eat: {
    eyebrow: "Eat decision engine",
    title: "What should I eat today?",
  },
};

const categoryStyles = {
  Produce: "leaf",
  Protein: "tomato",
  Dairy: "blue",
  Grain: "mustard",
  Pantry: "plum",
  Frozen: "blue",
  Household: "mustard",
};

const model = window.KitchenModel;
const seedState = model.seedState;

let state = loadState();
let derived = deriveState();

const root = document.querySelector("#view-root");
const title = document.querySelector("#view-title");
const eyebrow = document.querySelector("#view-eyebrow");
const sidebarStatus = document.querySelector("#sidebar-status");

function loadState() {
  const defaults = { takeouts: [], chatHistory: [], chatLoading: false, recipeSearch: "", recipeEditId: null };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const base = { ...clone(seedState), ...defaults };
    const merged = saved ? { ...base, ...JSON.parse(saved) } : base;
    if (merged.view === "receipts") merged.view = "recipe";
    merged.chatLoading = false;
    const params = new URLSearchParams(location.search);
    if (params.get("view")) merged.view = params.get("view");
    if (params.get("recipe")) merged.selectedRecipeImportId = params.get("recipe");
    return merged;
  } catch {
    return { ...clone(seedState), ...defaults };
  }
}

function clone(value) {
  return model.clone(value);
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    state.lastAction = "Local storage unavailable";
  }
}

function deriveState() {
  return {
    pantryValue: model.pantryValue(state),
    lowStockItems: model.lowStockItems(state),
    riskItems: model.riskItems(state),
    receiptQueue: model.receiptQueue(state),
    recommendedMeals: model.recommendedMeals(state),
    selectedReceiptIsImported: model.selectedReceiptIsImported(state),
    selectedRecipeImport:
      state.selectedRecipeImportId
        ? (state.recipeImports.find((item) => item.id === state.selectedRecipeImportId) || null)
        : null,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripHashtags(value) {
  return String(value || "").replace(/#\S+/g, "").replace(/\s{2,}/g, " ").trim();
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function fmtDate(value) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function icon(name) {
  return icons[name] || icons.spark;
}

function hydrateIcons(scope = document) {
  scope.querySelectorAll("[data-icon]").forEach((node) => {
    node.innerHTML = icon(node.dataset.icon);
  });
}

function categoryClass(category) {
  return categoryStyles[category] || "blue";
}

function pantryValue() {
  return derived.pantryValue;
}

function lowStockItems() {
  return derived.lowStockItems;
}

function riskItems() {
  return derived.riskItems;
}

function receiptQueue() {
  return derived.receiptQueue;
}

function selectedReceiptIsImported() {
  return derived.selectedReceiptIsImported;
}

function selectedRecipeImport() {
  return derived.selectedRecipeImport;
}

function recommendedMeals() {
  return derived.recommendedMeals;
}

function syncGrocery() {
  model.syncGrocery(state);
  persist();
  render();
}

function render() {
  derived = deriveState();
  const meta = viewMeta[state.view] || viewMeta.command;
  title.textContent = meta.title;
  eyebrow.textContent = meta.eyebrow;
  document.querySelectorAll("[data-view-link]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewLink === state.view);
  });
  sidebarStatus.innerHTML = renderSidebarStatus();

  const renderers = {
    command: renderCommand,
    receipts: renderRecipe,
    recipe: renderRecipe,
    pantry: renderPantry,
    meals: renderMeals,
    grocery: renderGrocery,
    takeouts: renderTakeouts,
    eat: renderEat,
    case: renderCaseStudy,
  };
  root.innerHTML = (renderers[state.view] || renderCommand)();
}

function renderSidebarStatus() {
  const topMeals = recommendedMeals().slice(0, 3);
  const readiness = topMeals.length
    ? Math.round(topMeals.reduce((sum, meal) => sum + meal.score, 0) / topMeals.length)
    : 0;
  const queuedReceipts = receiptQueue();
  const lowStock = lowStockItems();
  return `
    <strong>${escapeHtml(readiness)}% meal readiness</strong>
    <span>${escapeHtml(queuedReceipts.length)} receipt${queuedReceipts.length === 1 ? "" : "s"} in queue</span>
    <span>${escapeHtml(lowStock.length)} low-stock signals</span>
  `;
}

function renderCommand() {
  const recommendations = recommendedMeals();
  return `
    <div class="dashboard-grid">
      <div class="stack">
        ${renderMetrics()}
        <section class="panel" aria-labelledby="loop-heading">
          <div class="panel-header">
            <div>
              <h2 id="loop-heading">Kitchen graph</h2>
              <p class="status-note">Receipt data flows into inventory, meal fit, and grocery recovery.</p>
            </div>
            <button class="action-button" type="button" data-action="sync-grocery">
              ${icon("spark")}
              Sync gaps
            </button>
          </div>
          <div class="panel-body">
            ${renderGraph()}
          </div>
        </section>

        <section class="panel" aria-labelledby="command-meal-heading">
          <div class="panel-header">
            <div>
              <h2 id="command-meal-heading">Meal decision engine</h2>
              <p class="status-note">Current context: ${escapeHtml(state.mood)}, ${escapeHtml(state.energy)} energy, ${escapeHtml(state.maxTime)} minutes.</p>
            </div>
            ${renderMealControls()}
          </div>
          <div class="panel-body">
            <div class="recipe-list">
              ${recommendations.slice(0, 3).map(renderRecipeCard).join("")}
            </div>
          </div>
        </section>
      </div>

      <aside class="stack" aria-label="Operational detail">
        <section class="panel" aria-labelledby="receipt-ingest-heading">
          <div class="panel-header">
            <div>
              <h2 id="receipt-ingest-heading">Receipt ingest</h2>
              <p class="status-note">${escapeHtml(receiptQueue().length)} receipt${receiptQueue().length === 1 ? "" : "s"} ready for merge.</p>
            </div>
            <button class="action-button" type="button" data-action="parse-receipt" data-receipt-id="${escapeHtml(state.selectedReceiptId)}" ${selectedReceiptIsImported() ? "disabled" : ""}>
              ${icon("scan")}
              Import
            </button>
          </div>
          <div class="panel-body">
            ${renderReceiptAsset()}
          </div>
        </section>

        <section class="panel" aria-labelledby="activity-heading">
          <div class="panel-header">
            <h2 id="activity-heading">Activity</h2>
            <span class="badge blue">${escapeHtml(state.lastAction)}</span>
          </div>
          <div class="panel-body">
            ${renderTimeline()}
          </div>
        </section>
      </aside>
    </div>
  `;
}

function renderMetrics() {
  const readiness = recommendedMeals()[0]?.score || 0;
  const wasteRisk = riskItems().length;
  return `
    <section class="metric-grid" aria-label="Kitchen metrics">
      <article class="metric-card">
        <span>Receipt queue ${icon("scan")}</span>
        <strong>${escapeHtml(receiptQueue().length)}</strong>
        <small>${escapeHtml(state.receipts.length)} receipts tracked</small>
      </article>
      <article class="metric-card">
        <span>Pantry value ${icon("boxes")}</span>
        <strong>${escapeHtml(money(pantryValue()))}</strong>
        <small>${escapeHtml(state.pantry.length)} stocked ingredients</small>
      </article>
      <article class="metric-card">
        <span>Best meal fit ${icon("chef")}</span>
        <strong>${escapeHtml(readiness)}%</strong>
        <small>${escapeHtml(recommendedMeals()[0]?.name || "No meal selected")}</small>
      </article>
      <article class="metric-card">
        <span>Freshness risk ${icon("clock")}</span>
        <strong>${escapeHtml(wasteRisk)}</strong>
        <small>${wasteRisk > 0 ? "Use within four days" : "No urgent items"}</small>
      </article>
    </section>
  `;
}

function renderGraph() {
  const nodes = [
    ["Receipt", receiptQueue().length, "Unmerged purchases"],
    ["Items", state.receipts.reduce((sum, receipt) => sum + receipt.items.length, 0), "Parsed line items"],
    ["Pantry", state.pantry.length, "Tracked inventory"],
    ["Meals", recommendedMeals().filter((meal) => meal.score >= 70).length, "Ready options"],
    ["Grocery", state.grocery.filter((item) => !item.done).length, "Open list items"],
  ];
  return `
    <div class="graph">
      ${nodes
        .map(
          ([label, count, caption]) => `
            <div class="graph-node">
              <span class="node-count">${escapeHtml(count)}</span>
              <strong>${escapeHtml(label)}</strong>
              <small>${escapeHtml(caption)}</small>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderMealControls() {
  const moods = ["focused", "tired", "steady", "social"];
  return `
    <div class="toolbar" aria-label="Meal filters">
      <div class="segmented" role="group" aria-label="Mood">
        ${moods
          .map(
            (mood) => `
              <button type="button" class="${state.mood === mood ? "is-selected" : ""}" data-action="set-mood" data-mood="${escapeHtml(mood)}" aria-pressed="${state.mood === mood ? "true" : "false"}">
                ${escapeHtml(mood)}
              </button>
            `,
          )
          .join("")}
      </div>
      <label class="select-field">
        <span>Energy</span>
        <select data-action="set-energy">
          ${["low", "medium", "high"]
            .map((energy) => `<option value="${energy}" ${state.energy === energy ? "selected" : ""}>${energy}</option>`)
            .join("")}
        </select>
      </label>
      <label class="select-field">
        <span>Time</span>
        <select data-action="set-time">
          ${[15, 30, 45]
            .map((time) => `<option value="${time}" ${state.maxTime === time ? "selected" : ""}>${time} min</option>`)
            .join("")}
        </select>
      </label>
    </div>
  `;
}

function renderRecipeCard(meal) {
  const missingCount = meal.coverage.needs.filter((need) => need.missing > 0).length;
  return `
    <article class="recipe-card">
      <div class="recipe-top">
        <div>
          <h3>${escapeHtml(meal.name)}</h3>
          <p>${escapeHtml(meal.summary)}</p>
        </div>
        <span class="score-ring" aria-label="${escapeHtml(meal.score)} percent match">${escapeHtml(meal.score)}</span>
      </div>
      <div class="recipe-meta">
        <span class="badge blue">${escapeHtml(meal.time)} min</span>
        <span class="badge ${meal.energy === "low" ? "leaf" : meal.energy === "medium" ? "mustard" : "tomato"}">${escapeHtml(meal.energy)} energy</span>
        <span class="badge ${missingCount ? "mustard" : "leaf"}">${missingCount ? `${missingCount} gap${missingCount === 1 ? "" : "s"}` : "pantry ready"}</span>
      </div>
      <div class="need-list">
        ${meal.coverage.needs.map(renderNeedRow).join("")}
      </div>
      <button class="secondary-button" type="button" data-action="cook-meal" data-meal-id="${escapeHtml(meal.id)}">
        Cook and deplete pantry
      </button>
    </article>
  `;
}

function renderNeedRow(need) {
  const percentage = Math.round(need.covered * 100);
  return `
    <div class="meal-need-row">
      <span>${escapeHtml(need.item)}</span>
      <span class="bar-track" aria-label="${escapeHtml(percentage)} percent available">
        <span class="bar-fill ${percentage < 50 ? "is-danger" : percentage < 100 ? "is-warn" : ""}" style="width: ${percentage}%"></span>
      </span>
      <small class="row-meta">${escapeHtml(need.available)}/${escapeHtml(need.servings)} servings</small>
    </div>
  `;
}

function renderReceiptAsset() {
  const receipt = state.receipts.find((item) => item.id === state.selectedReceiptId) || receiptQueue()[0] || state.receipts[0];
  if (!receipt) return '<div class="empty-state">No receipts available.</div>';
  return `
    <div class="receipt-asset" aria-label="Receipt preview">
      <div class="receipt-paper">
        <header>
          <strong>${escapeHtml(receipt.merchant)}</strong>
          <small>${escapeHtml(fmtDate(receipt.date))}</small>
        </header>
        <ul>
          ${receipt.items
            .map((item) => `<li><span>${escapeHtml(item.name)}</span><span>${escapeHtml(money(item.price))}</span></li>`)
            .join("")}
        </ul>
        <footer>
          <span>Total</span>
          <span>${escapeHtml(money(receipt.total))}</span>
        </footer>
      </div>
      <span class="scan-line" aria-hidden="true"></span>
    </div>
    <div class="confidence-strip" aria-label="Receipt confidence">
      <div class="confidence-row">
        <strong>OCR confidence</strong>
        <span class="bar-track"><span class="bar-fill" style="width: ${Number(receipt.confidence)}%"></span></span>
        <small>${escapeHtml(receipt.confidence)}%</small>
      </div>
      <div class="confidence-row">
        <strong>Merge status</strong>
        <span class="bar-track"><span class="bar-fill ${receipt.status === "imported" ? "" : "is-warn"}" style="width: ${receipt.status === "imported" ? 100 : 62}%"></span></span>
        <small>${escapeHtml(receipt.status)}</small>
      </div>
    </div>
  `;
}

function renderTimeline() {
  if (state.events.length === 0) return '<div class="empty-state">No activity yet.</div>';
  return `
    <div class="timeline">
      ${state.events
        .map(
          (event) => `
            <div class="timeline-item">
              <span class="timeline-icon">${icon({ scan: "scan", meal: "chef", grocery: "cart" }[event.kind] || "boxes")}</span>
              <span>
                <strong>${escapeHtml(event.title)}</strong>
                <small>${escapeHtml(event.detail)}</small>
              </span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}



function renderExtractionWarnings(recipeImport) {
  if (!Array.isArray(recipeImport.warnings) || recipeImport.warnings.length === 0) return "";
  return `
    <div class="empty-state">
      ${recipeImport.warnings.map((warning) => `<p>${escapeHtml(warning)}</p>`).join("")}
    </div>
  `;
}


function categoryEmoji(category) {
  const emojis = { Produce: "🥬", Protein: "🥩", Dairy: "🥛", Grain: "🌾", Pantry: "🧂" };
  return emojis[category] || "🍽️";
}

function servingsUnit(count) {
  return count >= 3 ? "🍵" : "🥄";
}


function renderRecipeIngredientRow(ingredient) {
  const percentage = Math.round(ingredient.covered * 100);
  const unit = servingsUnit(ingredient.servings);
  return `
    <div class="meal-need-row">
      <span>${categoryEmoji(ingredient.category)} ${escapeHtml(ingredient.name)}</span>
      <span class="bar-track" aria-label="${escapeHtml(percentage)} percent available">
        <span class="bar-fill ${percentage < 50 ? "is-danger" : percentage < 100 ? "is-warn" : ""}" style="width: ${percentage}%"></span>
      </span>
      <small class="row-meta">${escapeHtml(ingredient.available)}${unit} / ${escapeHtml(ingredient.servings)}${unit}</small>
    </div>
  `;
}


function renderRecipe() {
  const search = state.recipeSearch || "";
  const selected = selectedRecipeImport();
  const filtered = state.recipeImports.filter(
    (item) => !search || item.title.toLowerCase().includes(search.toLowerCase()),
  );
  return `
    <div class="recipe-library">
      <div class="lib-bar">
        <h2 class="lib-title">Recipe library <span class="lib-count">${escapeHtml(state.recipeImports.length)}</span></h2>
        <div class="lib-controls">
          <div class="lib-search-wrap">
            <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="search" data-action="search-recipes" value="${escapeHtml(search)}" placeholder="Search recipes" aria-label="Search recipes" />
          </div>
          <button class="icon-button" type="button" data-action="sync-recipes" title="Sync from server" aria-label="Sync">
            ${icon("refresh")}
          </button>
        </div>
      </div>
      ${
        filtered.length
          ? `<div class="recipe-card-grid">${filtered.map((r) => renderRecipeLibraryCard(r, selected?.id === r.id)).join("")}</div>`
          : `<div class="empty-state"><p>${search ? "No recipes match your search." : "No recipes yet."}</p></div>`
      }
      ${selected ? renderRecipeDetailPanel(selected) : ""}
    </div>
  `;
}

function renderRecipeLibraryCard(recipe, isSelected) {
  const cover = recipe.cover || {};
  const theme = cover.theme || "leaf";
  return `
    <article class="recipe-card-item${isSelected ? " is-selected" : ""}" data-action="open-recipe" data-import-id="${escapeHtml(recipe.id)}" tabindex="0" role="button" aria-pressed="${isSelected ? "true" : "false"}">
      <div class="recipe-mini-cover ${escapeHtml(theme)}">
        ${cover.imageDataUrl ? `<img src="${escapeHtml(cover.imageDataUrl)}" alt="" />` : ""}
      </div>
      <div class="recipe-card-info">
        <strong class="recipe-card-title">${escapeHtml(stripHashtags(recipe.title))}</strong>
        <div class="recipe-meta">
          <a class="source-link" href="${escapeHtml(recipe.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(recipe.sourceHost)}</a>
          <span class="badge blue">${escapeHtml(recipe.sourceType)}</span>
          ${recipe.time > 0 ? `<span class="badge mustard">${escapeHtml(recipe.time)} min</span>` : ""}
        </div>
      </div>
      <span class="score-ring score-ring-sm" aria-label="${escapeHtml(recipe.confidence)} percent extraction confidence">${escapeHtml(recipe.confidence)}</span>
    </article>
  `;
}

function renderRecipeDetailPanel(recipe) {
  const isEditing = state.recipeEditId === recipe.id;
  const lastJob = (state.importJobs || []).find((job) => job.importId === recipe.id);
  const activeJob = lastJob && ["pending", "extracting"].includes(lastJob.status) ? lastJob : null;
  const failedJob = lastJob && lastJob.status === "failed" ? lastJob : null;
  const coverage = model.recipeImportCoverage(state, recipe);
  const missingCount = coverage.ingredients.filter((i) => i.missing > 0).length;
  const cover = recipe.cover || {};
  const coverBanner = cover.imageDataUrl
    ? `<img class="recipe-modal-cover-banner" src="${escapeHtml(cover.imageDataUrl)}" alt="" />`
    : "";
  return `
    <div class="recipe-modal-backdrop" data-action="close-recipe-panel" role="dialog" aria-modal="true" aria-label="Recipe detail">
      <div class="recipe-modal" role="document">
        <div class="recipe-modal-header">
          <div class="recipe-modal-title">
            <span class="eyebrow">Recipe</span>
            <strong>${escapeHtml(stripHashtags(recipe.title))}</strong>
          </div>
          <div class="row-actions">
            ${!isEditing ? `<button class="icon-button" type="button" data-action="toggle-recipe-edit" data-import-id="${escapeHtml(recipe.id)}" title="Edit recipe" aria-label="Edit recipe">${icon("edit")}</button>` : ""}
            <button class="icon-button" type="button" data-action="close-recipe-panel" title="Close" aria-label="Close">
              ${icon("close")}
            </button>
          </div>
        </div>
        ${coverBanner}
        <div class="recipe-modal-body">
          ${isEditing ? renderRecipeEditForm(recipe) : renderRecipeReadView(recipe)}
          ${!isEditing ? `<div class="button-row">
            <button class="secondary-button" type="button" data-action="sync-recipe-gaps" data-import-id="${escapeHtml(recipe.id)}" ${recipe.ingredients.length ? "" : "disabled"}>
              Add missing to grocery
            </button>
            <button class="secondary-button" type="button" data-action="save-recipe-meal" data-import-id="${escapeHtml(recipe.id)}" ${recipe.savedAsMeal || !recipe.ingredients.length ? "disabled" : ""}>
              ${recipe.savedAsMeal ? "Saved as meal" : "Save as meal"}
            </button>
            <button class="secondary-button" type="button" data-action="generate-cover" data-import-id="${escapeHtml(recipe.id)}">
              Generate AI cover
            </button>
            <button class="secondary-button" type="button" data-action="reextract-recipe" data-import-id="${escapeHtml(recipe.id)}" ${activeJob ? "disabled" : ""}>
              ${activeJob ? `${icon("refresh")} ${escapeHtml(activeJob.message || "Extracting…")}` : "Re-extract"}
            </button>
          </div>` : ""}
          ${failedJob ? `<div class="empty-state"><p>Re-extract failed: ${escapeHtml(failedJob.message || "Extraction error")}</p></div>` : ""}
          ${renderExtractionWarnings(recipe)}
          ${missingCount > 0 ? `<p class="status-note">${missingCount} ingredient${missingCount === 1 ? "" : "s"} missing from pantry.</p>` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderRecipeReadView(recipe) {
  const coverage = model.recipeImportCoverage(state, recipe);
  return `
    <div class="recipe-read-view">
      <div class="recipe-summary-row">
        <p class="recipe-summary-text">${escapeHtml(stripHashtags(recipe.summary || `Imported from ${recipe.sourceHost}.`))}</p>
        <span class="score-ring" aria-label="${escapeHtml(recipe.confidence)} percent extraction confidence">${escapeHtml(recipe.confidence)}</span>
      </div>
      ${
        coverage.ingredients.length
          ? `<div><p class="eyebrow" style="margin:0 0 8px">Ingredients</p><div class="need-list">${coverage.ingredients.map(renderRecipeIngredientRow).join("")}</div></div>`
          : ""
      }
      ${
        recipe.steps.length
          ? `<div><p class="eyebrow" style="margin:0 0 8px">Steps</p><ol class="step-list">${recipe.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol></div>`
          : ""
      }
      ${recipe.notes ? `<div><p class="eyebrow" style="margin:0 0 4px">Notes</p><p class="muted">${escapeHtml(recipe.notes)}</p></div>` : ""}
    </div>
  `;
}

function renderIngredientRow(ing) {
  return `
    <div class="ingredient-row">
      <input class="ingredient-name" type="text" value="${escapeHtml(ing.name)}" data-category="${escapeHtml(ing.category || "")}" placeholder="Ingredient name" autocomplete="off" />
      <input class="ingredient-servings" type="number" min="0" value="${escapeHtml(ing.servings ?? 1)}" title="Quantity" />
      <button class="icon-button" type="button" data-action="remove-ingredient" title="Remove">${icon("close")}</button>
    </div>`;
}

function renderStepRow(step, index) {
  return `
    <div class="step-row">
      <span class="step-num">${index + 1}</span>
      <textarea class="step-text" rows="2">${escapeHtml(step)}</textarea>
      <button class="icon-button" type="button" data-action="remove-step" title="Remove">${icon("close")}</button>
    </div>`;
}

function renderRecipeEditForm(recipe) {
  return `
    <form class="recipe-edit-form" data-action="save-recipe-edit" data-import-id="${escapeHtml(recipe.id)}">
      <label class="field">
        <span>Title</span>
        <input name="title" type="text" value="${escapeHtml(recipe.title)}" autocomplete="off" />
      </label>
      <div class="split-fields">
        <label class="field">
          <span>Time (min)</span>
          <input name="time" type="number" min="0" value="${escapeHtml(recipe.time)}" />
        </label>
        <label class="field">
          <span>Servings</span>
          <input name="servings" type="number" min="1" value="${escapeHtml(recipe.servings)}" />
        </label>
      </div>
      <label class="field">
        <span>Summary</span>
        <textarea name="summary" rows="2">${escapeHtml(recipe.summary || "")}</textarea>
      </label>
      <label class="field">
        <span>Notes</span>
        <textarea name="notes" rows="2" placeholder="Personal notes about this recipe">${escapeHtml(recipe.notes || "")}</textarea>
      </label>
      <div class="field">
        <span>Ingredients</span>
        <div class="ingredients-editor">
          ${(recipe.ingredients || []).map(renderIngredientRow).join("")}
        </div>
        <button class="add-row-button" type="button" data-action="add-ingredient">+ Add ingredient</button>
      </div>
      <div class="field">
        <span>Steps</span>
        <div class="steps-editor">
          ${(recipe.steps || []).map(renderStepRow).join("")}
        </div>
        <button class="add-row-button" type="button" data-action="add-step">+ Add step</button>
      </div>
      <div class="button-row">
        <button class="action-button" type="submit">${icon("check")} Save</button>
        <button class="secondary-button" type="button" data-action="toggle-recipe-edit" data-import-id="${escapeHtml(recipe.id)}">Cancel</button>
      </div>
    </form>
  `;
}

function renderTakeouts() {
  const takeouts = state.takeouts || [];
  return `
    <div class="stack">
      <section class="panel" aria-labelledby="takeouts-add-heading">
        <div class="panel-header">
          <div>
            <h2 id="takeouts-add-heading">Add restaurant</h2>
            <p class="status-note">${escapeHtml(takeouts.length)} saved restaurant${takeouts.length === 1 ? "" : "s"} · Track your go-to spots</p>
          </div>
        </div>
        <div class="panel-body">
          <form class="takeout-add-form" data-action="add-takeout">
            <div class="takeout-form-grid">
              <label class="field">
                <span>Name</span>
                <input name="name" type="text" autocomplete="off" placeholder="Restaurant name" required />
              </label>
              <label class="field">
                <span>Cuisine</span>
                <input name="cuisine" type="text" autocomplete="off" placeholder="e.g. Thai, Japanese" />
              </label>
              <label class="field">
                <span>Website or maps URL</span>
                <input name="url" type="url" autocomplete="off" placeholder="https://…" />
              </label>
            </div>
            <label class="field">
              <span>Notes</span>
              <textarea name="notes" rows="2" placeholder="What to order, best dishes, tips…"></textarea>
            </label>
            <button class="action-button" type="submit">${icon("plus")} Add restaurant</button>
          </form>
        </div>
      </section>
      ${
        takeouts.length
          ? `<div class="takeouts-grid" aria-label="Saved restaurants">${takeouts.map(renderTakeoutCard).join("")}</div>`
          : `<div class="empty-state">No restaurants saved yet. Add your first one above.</div>`
      }
    </div>
  `;
}

function renderTakeoutCard(takeout) {
  return `
    <article class="takeout-card">
      <div class="takeout-top">
        <div>
          <strong>${escapeHtml(takeout.name)}</strong>
          ${takeout.cuisine ? `<small>${escapeHtml(takeout.cuisine)}</small>` : ""}
        </div>
        <button class="mini-action" type="button" data-action="delete-takeout" data-takeout-id="${escapeHtml(takeout.id)}" title="Remove" aria-label="Remove ${escapeHtml(takeout.name)}">${icon("trash")}</button>
      </div>
      ${takeout.notes ? `<p class="muted">${escapeHtml(takeout.notes)}</p>` : ""}
      <div class="recipe-meta">
        ${takeout.url ? `<a class="source-link" href="${escapeHtml(takeout.url)}" target="_blank" rel="noreferrer">Visit</a>` : ""}
        ${(takeout.tags || []).map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderEat() {
  const history = state.chatHistory || [];
  return `
    <div class="eat-view">
      <section class="chat-panel panel" aria-labelledby="eat-heading">
        <div class="panel-header">
          <div>
            <h2 id="eat-heading">Ask KitchenOS</h2>
            <p class="status-note">${escapeHtml(state.mood)} mood · ${escapeHtml(state.energy)} energy · ${escapeHtml(state.maxTime)} min · ${escapeHtml(state.pantry.length)} pantry items · ${escapeHtml((state.takeouts || []).length)} restaurants</p>
          </div>
          ${history.length ? `<button class="secondary-button" type="button" data-action="clear-chat">Clear</button>` : ""}
        </div>
        <div class="chat-messages" id="chat-messages">
          ${
            history.length
              ? history.map(renderChatMessage).join("")
              : `<div class="chat-welcome">
                  <p>What should you eat today? I know your pantry, saved recipes, and favorite restaurants.</p>
                  <div class="chat-suggestions">
                    <button class="chip-button" type="button" data-action="chat-suggest" data-prompt="What can I cook with what I have in my pantry right now?">What can I cook?</button>
                    <button class="chip-button" type="button" data-action="chat-suggest" data-prompt="What's the quickest meal I can make?">Quick meal</button>
                    <button class="chip-button" type="button" data-action="chat-suggest" data-prompt="What should I order for takeout tonight?">Takeout ideas</button>
                    <button class="chip-button" type="button" data-action="chat-suggest" data-prompt="What pantry items are about to expire and what should I cook with them?">Use before they expire</button>
                  </div>
                </div>`
          }
          ${state.chatLoading ? `<div class="chat-message is-assistant is-loading"><p><span class="loading-dots"><span></span><span></span><span></span></span></p></div>` : ""}
        </div>
        <form class="chat-input-bar" data-action="send-chat">
          <label class="sr-only" for="chat-input">Message</label>
          <input id="chat-input" name="message" type="text" autocomplete="off" placeholder="Ask about your pantry, recipes, or where to order…" required />
          <button class="action-button" type="submit">${icon("send")} Send</button>
        </form>
      </section>
    </div>
  `;
}

function renderChatMessage(message) {
  const html = escapeHtml(message.content).replace(/\n/g, "<br>");
  return `
    <div class="chat-message ${message.role === "user" ? "is-user" : "is-assistant"}${message.isError ? " is-error" : ""}">
      <p>${html}</p>
    </div>
  `;
}

function renderPantry() {
  const categories = ["All", ...new Set(state.pantry.map((item) => item.category))];
  const filtered = state.pantry.filter((item) => {
    const searchMatch = item.name.toLowerCase().includes(state.search.toLowerCase());
    const categoryMatch = state.category === "All" || item.category === state.category;
    return searchMatch && categoryMatch;
  });
  return `
    <section class="panel" aria-labelledby="pantry-heading">
      <div class="panel-header">
        <div>
          <h2 id="pantry-heading">Inventory</h2>
          <p class="status-note">${escapeHtml(lowStockItems().length)} low-stock item${lowStockItems().length === 1 ? "" : "s"} and ${escapeHtml(riskItems().length)} freshness risk${riskItems().length === 1 ? "" : "s"}.</p>
        </div>
        <div class="toolbar">
          <label class="field">
            <span>Search</span>
            <input type="search" data-action="search-pantry" value="${escapeHtml(state.search)}" placeholder="Ingredient" />
          </label>
          <label class="field">
            <span>Category</span>
            <select data-action="filter-category">
              ${categories.map((category) => `<option value="${escapeHtml(category)}" ${state.category === category ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}
            </select>
          </label>
        </div>
      </div>
      <div class="panel-body">
        <div class="inventory-list">
          ${filtered.length ? filtered.map(renderInventoryRow).join("") : '<div class="empty-state">No pantry items match the current filters.</div>'}
        </div>
      </div>
    </section>
  `;
}

function renderInventoryRow(item) {
  const daysRemaining = item.weeklyUse > 0 ? Math.round(item.servings / (item.weeklyUse / 7)) : 999;
  const freshnessClass = item.expiresIn <= 2 ? "tomato" : item.expiresIn <= 4 ? "mustard" : "leaf";
  return `
    <article class="inventory-row">
      <span class="item-title">
        <strong>${escapeHtml(item.name)}</strong>
        <small>${escapeHtml(item.source)} - ${escapeHtml(money(item.price))}/serving</small>
      </span>
      <span class="badge ${categoryClass(item.category)}">${escapeHtml(item.category)}</span>
      <span>
        <strong>${escapeHtml(item.servings)} servings</strong>
        <small class="row-meta">min ${escapeHtml(item.minServings)}</small>
      </span>
      <span>
        <span class="badge ${freshnessClass}">${escapeHtml(item.expiresIn)} days fresh</span>
        <small class="row-meta">${escapeHtml(daysRemaining)} days projected</small>
      </span>
      <span class="row-actions">
        <button class="row-action" type="button" data-action="use-item" data-item-id="${escapeHtml(item.id)}" title="Use one serving" aria-label="Use one serving of ${escapeHtml(item.name)}">${icon("minus")}</button>
        <button class="row-action" type="button" data-action="restock-item" data-item-id="${escapeHtml(item.id)}" title="Add one serving" aria-label="Add one serving of ${escapeHtml(item.name)}">${icon("plus")}</button>
      </span>
    </article>
  `;
}

function renderMeals() {
  const meals = recommendedMeals();
  return `
    <section class="panel" aria-labelledby="meals-heading">
      <div class="panel-header">
        <div>
          <h2 id="meals-heading">Recommendations</h2>
          <p class="status-note">Ranked by pantry coverage, mood fit, energy level, and available time.</p>
        </div>
        ${renderMealControls()}
      </div>
      <div class="panel-body">
        <div class="recipe-list">
          ${meals.map(renderRecipeCard).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderGrocery() {
  const categories = [...new Set(state.grocery.map((item) => item.category))];
  const openCount = state.grocery.filter((item) => !item.done).length;
  return `
    <div class="stack">
      <section class="panel" aria-labelledby="grocery-heading">
        <div class="panel-header">
          <div>
            <h2 id="grocery-heading">Grocery list</h2>
            <p class="status-note">${escapeHtml(openCount)} open item${openCount === 1 ? "" : "s"} across ${escapeHtml(categories.length)} categories.</p>
          </div>
          <button class="action-button" type="button" data-action="sync-grocery">
            ${icon("spark")}
            Sync gaps
          </button>
        </div>
        <div class="panel-body">
          <form class="input-row" data-action="add-grocery">
            <label class="field">
              <span>Add item</span>
              <input name="name" type="text" autocomplete="off" placeholder="Ingredient or household item" required />
            </label>
            <button class="secondary-button" type="submit">Add</button>
          </form>
        </div>
      </section>
      <section class="grocery-layout" aria-label="Grocery categories">
        ${categories.map((category) => renderGroceryPanel(category)).join("")}
      </section>
    </div>
  `;
}

function renderGroceryPanel(category) {
  const items = state.grocery.filter((item) => item.category === category);
  return `
    <article class="grocery-panel">
      <div class="grocery-header">
        <h3>${escapeHtml(category)}</h3>
        <span class="badge ${categoryClass(category)}">${escapeHtml(items.length)}</span>
      </div>
      ${items.map(renderGroceryRow).join("")}
    </article>
  `;
}

function renderGroceryRow(item) {
  const inputId = `grocery-${item.id}`;
  return `
    <div class="grocery-row ${item.done ? "is-done" : ""}">
      <input id="${escapeHtml(inputId)}" type="checkbox" data-action="toggle-grocery" data-grocery-id="${escapeHtml(item.id)}" ${item.done ? "checked" : ""} />
      <label for="${escapeHtml(inputId)}">
        <strong>${escapeHtml(item.name)}</strong>
        <small class="row-meta">${escapeHtml(item.qty)} - ${escapeHtml(item.source)}</small>
      </label>
      <button class="mini-action" type="button" data-action="delete-grocery" data-grocery-id="${escapeHtml(item.id)}" title="Remove item" aria-label="Remove ${escapeHtml(item.name)}">${icon("trash")}</button>
    </div>
  `;
}

function renderCaseStudy() {
  return `
    <div class="stack">
      <section class="panel" aria-labelledby="architecture-heading">
        <div class="panel-header">
          <div>
            <h2 id="architecture-heading">System architecture</h2>
            <p class="status-note">Portfolio version models the integration layer while leaving OCR and nutrition APIs swappable.</p>
          </div>
          <span class="badge leaf">Build unique layer</span>
        </div>
        <div class="panel-body">
          <div class="architecture">
            <span><strong>Capture</strong><small>Receipt image, email, or manual line items</small></span>
            <span><strong>Normalize</strong><small>Items, quantities, confidence, and source metadata</small></span>
            <span><strong>Reason</strong><small>Freshness, depletion, meal fit, and gaps</small></span>
            <span><strong>Loop</strong><small>Grocery recovery and pantry state updates</small></span>
          </div>
        </div>
      </section>
      <section class="study-grid">
        <article class="study-card">
          <h3>Problem framing</h3>
          <p>Kitchen tools usually stop at one silo: receipts, pantry, meal planning, or grocery lists. This prototype presents the missing operating loop as one coherent product surface.</p>
          <div class="study-meta">
            <span class="badge blue">Receipts</span>
            <span class="badge leaf">Pantry</span>
            <span class="badge tomato">Meals</span>
            <span class="badge mustard">Grocery</span>
          </div>
        </article>
        <article class="study-card">
          <h3>Production posture</h3>
          <p>State is normalized enough for persistence, every dynamic value is escaped before rendering, controls are keyboard reachable, and the interface works without network dependencies.</p>
          <div class="study-meta">
            <span class="badge leaf">Accessible</span>
            <span class="badge blue">Responsive</span>
            <span class="badge plum">Portable</span>
          </div>
        </article>
        <article class="study-card">
          <h3>Adopt versus build</h3>
          <p>OCR, nutrition lookup, and product databases should be adopted. Depletion modeling, context-aware meal scoring, and the integrated kitchen graph are the differentiating build layer.</p>
          <div class="study-meta">
            <span class="badge mustard">LLM OCR</span>
            <span class="badge blue">Open Food Facts</span>
            <span class="badge leaf">Local graph</span>
          </div>
        </article>
        <article class="study-card">
          <h3>Next production slice</h3>
          <p>Replace mocked receipt parsing with an upload pipeline, add auth-backed persistence, and move meal scoring into a tested service boundary with explainable ranking traces.</p>
          <div class="study-meta">
            <span class="badge tomato">Upload API</span>
            <span class="badge plum">Tests</span>
            <span class="badge leaf">Auth</span>
          </div>
        </article>
      </section>
    </div>
  `;
}

function parseReceipt(receiptId) {
  model.importReceipt(state, receiptId);
  persist();
  render();
}

function cookMeal(mealId) {
  model.cookMeal(state, mealId);
  persist();
  render();
}

function exportState() {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), state }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "kitchenos-demo-state.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  state.lastAction = "State exported";
  persist();
  render();
}

function updateImportJob(jobId, patch) {
  if (!jobId) return;
  state.importJobs = (state.importJobs || []).map((job) => (job.id === jobId ? { ...job, ...patch } : job));
}

async function importRecipeFromUrl(url, options = {}) {
  updateImportJob(options.jobId, { status: "extracting", message: "Fetching source" });
  state.urlDraft = url;
  state.lastAction = "Extracting recipe URL";
  persist();
  render();

  try {
    const response = await fetch("/api/recipe-import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Recipe extraction failed");

    const result = model.importRecipeUrl(state, url, {
      extraction: payload.recipe,
      forceRefresh: options.forceRefresh,
    });
    if (result.status === "needs-extraction") {
      state.lastAction = "No recipe data was extracted";
      updateImportJob(options.jobId, { status: "failed", message: state.lastAction });
    } else if (
      (result.status === "imported" || result.status === "updated") &&
      result.recipeImport.extractionStatus === "needs-review"
    ) {
      state.lastAction = `${result.recipeImport.title} needs review`;
      updateImportJob(options.jobId, {
        importId: result.recipeImport.id,
        status: "needs-review",
        message: state.lastAction,
      });
    } else if (result.recipeImport) {
      updateImportJob(options.jobId, {
        importId: result.recipeImport.id,
        status: result.status,
        message: result.status === "duplicate" ? "Already imported" : `${result.recipeImport.title} ${result.status}`,
      });
    }
  } catch (error) {
    state.lastAction =
      window.location.protocol === "file:"
        ? "Run npm run dev for live URL extraction"
        : error.message || "Recipe extraction failed";
    updateImportJob(options.jobId, { status: "failed", message: state.lastAction });
  }

  persist();
  render();
}

async function importRecipesFromText(value) {
  const urls = importUrlsFromText(value);
  if (!urls.length) {
    state.lastAction = "Paste at least one valid URL";
    persist();
    render();
    return;
  }

  const runId = Date.now();
  state.importJobs = urls.map((url, index) => ({
    id: `import-${runId}-${index}`,
    url,
    status: "pending",
    message: "Queued",
  }));
  state.lastAction = `Processing ${urls.length} URL${urls.length === 1 ? "" : "s"}`;
  persist();
  render();

  for (const job of [...state.importJobs]) {
    await importRecipeFromUrl(job.url, { jobId: job.id });
  }

  if (urls.length > 1) {
    state.lastAction = `${urls.length} URL${urls.length === 1 ? "" : "s"} processed`;
    persist();
    render();
  }
}

async function reextractRecipeImport(importId) {
  const recipeImport = state.recipeImports.find((item) => item.id === importId);
  if (!recipeImport) return;
  const url = recipeImport.fetchUrl || recipeImport.sourceUrl;
  const jobId = `reextract-${Date.now()}`;
  state.importJobs = [
    {
      id: jobId,
      importId,
      url,
      status: "pending",
      message: "Queued re-extract",
    },
  ];
  persist();
  render();
  await importRecipeFromUrl(url, { forceRefresh: true, jobId });
  const updated = state.recipeImports.find((item) => item.id === importId);
  if (updated) patchRecipeToServer(importId, updated);
}

function importUrlsFromText(value) {
  const matches = String(value || "").match(/https?:\/\/[^\s,]+/gi) || [];
  const seen = new Set();
  return matches
    .map((item) => item.replace(/[)\].,;]+$/g, ""))
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

async function generateCoverForImport(importId) {
  const recipeImport = state.recipeImports.find((item) => item.id === importId);
  if (!recipeImport) return;

  state.lastAction = "Generating AI cover";
  persist();
  render();

  try {
    const response = await fetch("/api/cover-generation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recipe: recipeImport }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "AI cover generation failed");
    model.updateRecipeCover(state, importId, payload.cover);
  } catch (error) {
    const message =
      window.location.protocol === "file:"
        ? "Run npm run dev for AI cover generation"
        : error.message || "AI cover generation failed";
    model.updateRecipeCover(state, importId, { status: "error", message });
  }

  persist();
  render();
}

async function syncRecipesFromServer() {
  state.lastAction = "Syncing recipe library";
  persist();
  render();
  try {
    const response = await fetch("/api/recipes");
    if (!response.ok) throw new Error("Sync failed");
    const serverRecipes = await response.json();
    const existingById = new Map(state.recipeImports.map((r) => [r.id, r]));
    let added = 0;
    let updated = 0;
    for (const serverRecipe of serverRecipes) {
      if (!serverRecipe.id) continue;
      if (existingById.has(serverRecipe.id)) {
        const idx = state.recipeImports.findIndex((r) => r.id === serverRecipe.id);
        state.recipeImports[idx] = { ...existingById.get(serverRecipe.id), ...serverRecipe };
        updated++;
      } else {
        state.recipeImports.unshift(serverRecipe);
        added++;
      }
    }
    state.lastAction = `Library synced — ${added} added, ${updated} updated`;
  } catch {
    state.lastAction =
      window.location.protocol === "file:"
        ? "Run npm run dev to sync recipe library"
        : "Sync failed — server not available";
  }
  persist();
  render();
}

async function patchRecipeToServer(importId, recipe) {
  if (window.location.protocol === "file:") return;
  try {
    await fetch(`/api/recipes/${encodeURIComponent(importId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(recipe),
    });
  } catch {
    // silent fail — local state already updated
  }
}

function buildChatContext() {
  return {
    pantry: state.pantry.slice(0, 12).map((item) => ({
      name: item.name,
      servings: item.servings,
      category: item.category,
      expiresIn: item.expiresIn,
    })),
    meals: recommendedMeals()
      .slice(0, 5)
      .map((m) => ({ name: m.name, score: m.score, time: m.time })),
    recipes: state.recipeImports.slice(0, 5).map((r) => ({
      title: r.title,
      time: r.time,
      sourceType: r.sourceType,
      summary: r.summary || "",
    })),
    takeouts: (state.takeouts || []).map((t) => ({
      name: t.name,
      cuisine: t.cuisine || "",
      notes: t.notes || "",
    })),
    prefs: { mood: state.mood, energy: state.energy, maxTime: state.maxTime },
  };
}

async function sendChatMessage(content) {
  state.chatHistory = [...(state.chatHistory || []), { role: "user", content }];
  state.chatLoading = true;
  persist();
  render();
  const chatEl = document.querySelector("#chat-messages");
  if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: state.chatHistory, context: buildChatContext() }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status === "not-configured") {
      const text =
        payload.code === "CHAT_NOT_CONFIGURED"
          ? "Add ANTHROPIC_API_KEY to .env.local to enable AI chat."
          : payload.error || payload.message || "Chat request failed.";
      state.chatHistory = [...state.chatHistory, { role: "assistant", content: text, isError: true }];
    } else {
      state.chatHistory = [...state.chatHistory, { role: "assistant", content: payload.text }];
    }
  } catch (error) {
    const text =
      window.location.protocol === "file:"
        ? "Run npm run dev to enable AI chat."
        : error.message || "Chat request failed.";
    state.chatHistory = [...state.chatHistory, { role: "assistant", content: text, isError: true }];
  }

  state.chatLoading = false;
  persist();
  render();
  const chatElAfter = document.querySelector("#chat-messages");
  if (chatElAfter) chatElAfter.scrollTop = chatElAfter.scrollHeight;
}

document.addEventListener("click", (event) => {
  const viewLink = event.target.closest("[data-view-link]");
  if (viewLink) {
    state.view = viewLink.dataset.viewLink;
    persist();
    render();
    return;
  }

  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;
  const { action } = actionTarget.dataset;

  if (action === "export") exportState();
  if (action === "reset") {
    state = clone(seedState);
    persist();
    render();
  }
  if (action === "sync-grocery") syncGrocery();
  if (action === "parse-receipt") parseReceipt(actionTarget.dataset.receiptId);
  if (action === "select-receipt") {
    state.selectedReceiptId = actionTarget.dataset.receiptId;
    state.lastAction = "Receipt selected";
    persist();
    render();
  }
  if (action === "clear-recipe-imports") {
    state.recipeImports = [];
    state.selectedRecipeImportId = null;
    state.importJobs = [];
    state.lastAction = "Recipe imports cleared";
    persist();
    render();
    return;
  }
  if (action === "sync-recipe-gaps") {
    model.syncRecipeImportGaps(state, actionTarget.dataset.importId);
    persist();
    render();
  }
  if (action === "generate-cover") {
    generateCoverForImport(actionTarget.dataset.importId);
    return;
  }
  if (action === "reextract-recipe") {
    reextractRecipeImport(actionTarget.dataset.importId);
    return;
  }
  if (action === "save-recipe-meal") {
    model.saveRecipeImportAsMeal(state, actionTarget.dataset.importId);
    persist();
    render();
  }
  if (action === "set-mood") {
    state.mood = actionTarget.dataset.mood;
    state.lastAction = `Mood set to ${state.mood}`;
    persist();
    render();
  }
  if (action === "open-recipe") {
    if (event.target.closest("a")) return;
    state.selectedRecipeImportId = actionTarget.dataset.importId;
    state.recipeEditId = null;
    persist();
    render();
  }
  if (action === "close-recipe-panel") {
    // ignore if click landed inside the modal card rather than on the backdrop itself
    if (actionTarget.classList.contains("recipe-modal-backdrop") && event.target.closest(".recipe-modal")) return;
    state.selectedRecipeImportId = null;
    state.recipeEditId = null;
    persist();
    render();
  }
  if (action === "toggle-recipe-edit") {
    const importId = actionTarget.dataset.importId;
    state.recipeEditId = state.recipeEditId === importId ? null : importId;
    persist();
    render();
  }
  if (action === "add-ingredient") {
    const editor = document.querySelector(".ingredients-editor");
    if (editor) {
      const row = document.createElement("div");
      row.className = "ingredient-row";
      row.innerHTML = `<input class="ingredient-name" type="text" data-category="" placeholder="Ingredient name" autocomplete="off" /><input class="ingredient-servings" type="number" min="0" value="1" title="Quantity" /><button class="icon-button" type="button" data-action="remove-ingredient" title="Remove">${icon("close")}</button>`;
      editor.appendChild(row);
      row.querySelector(".ingredient-name").focus();
    }
    return;
  }
  if (action === "remove-ingredient") {
    actionTarget.closest(".ingredient-row")?.remove();
    return;
  }
  if (action === "add-step") {
    const editor = document.querySelector(".steps-editor");
    if (editor) {
      const num = editor.querySelectorAll(".step-row").length + 1;
      const row = document.createElement("div");
      row.className = "step-row";
      row.innerHTML = `<span class="step-num">${num}</span><textarea class="step-text" rows="2"></textarea><button class="icon-button" type="button" data-action="remove-step" title="Remove">${icon("close")}</button>`;
      editor.appendChild(row);
      row.querySelector(".step-text").focus();
    }
    return;
  }
  if (action === "remove-step") {
    actionTarget.closest(".step-row")?.remove();
    document.querySelectorAll(".step-row .step-num").forEach((el, i) => { el.textContent = i + 1; });
    return;
  }
  if (action === "sync-recipes") {
    syncRecipesFromServer();
    return;
  }
  if (action === "delete-takeout") {
    state.takeouts = (state.takeouts || []).filter((t) => t.id !== actionTarget.dataset.takeoutId);
    state.lastAction = "Restaurant removed";
    persist();
    render();
  }
  if (action === "clear-chat") {
    state.chatHistory = [];
    persist();
    render();
  }
  if (action === "chat-suggest") {
    sendChatMessage(actionTarget.dataset.prompt);
    return;
  }
  if (action === "cook-meal") cookMeal(actionTarget.dataset.mealId);
  if (action === "use-item" || action === "restock-item") {
    model.adjustPantryItem(state, actionTarget.dataset.itemId, action === "restock-item" ? 1 : -1);
    persist();
    render();
  }
  if (action === "delete-grocery") {
    model.deleteGroceryItem(state, actionTarget.dataset.groceryId);
    persist();
    render();
  }
});

document.addEventListener("change", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const { action } = target.dataset;
  if (action === "set-energy") {
    state.energy = target.value;
    state.lastAction = `Energy set to ${state.energy}`;
  }
  if (action === "set-time") {
    state.maxTime = Number(target.value);
    state.lastAction = `${state.maxTime} minute window selected`;
  }
  if (action === "filter-category") {
    state.category = target.value;
  }
  if (action === "toggle-grocery") {
    model.toggleGroceryItem(state, target.dataset.groceryId, target.checked);
  }
  persist();
  render();
});

document.addEventListener("input", (event) => {
  const pantryTarget = event.target.closest("[data-action='search-pantry']");
  if (pantryTarget) {
    const cursor = pantryTarget.selectionStart;
    state.search = pantryTarget.value;
    persist();
    render();
    const nextTarget = document.querySelector("[data-action='search-pantry']");
    if (nextTarget) {
      nextTarget.focus();
      nextTarget.setSelectionRange(cursor, cursor);
    }
    return;
  }

  const urlInput = event.target.closest("[data-action='import-recipe-url'] [name='url']");
  if (urlInput) {
    state.urlDraft = urlInput.value;
    persist();
  }

  const recipeSearch = event.target.closest("[data-action='search-recipes']");
  if (recipeSearch) {
    const cursor = recipeSearch.selectionStart;
    state.recipeSearch = recipeSearch.value;
    persist();
    render();
    const next = document.querySelector("[data-action='search-recipes']");
    if (next) {
      next.focus();
      next.setSelectionRange(cursor, cursor);
    }
  }
});

document.addEventListener("submit", async (event) => {
  const urlForm = event.target.closest("[data-action='import-recipe-url']");
  if (urlForm) {
    event.preventDefault();
    const formData = new FormData(urlForm);
    await importRecipesFromText(String(formData.get("url") || ""));
    return;
  }

  const takeoutForm = event.target.closest("[data-action='add-takeout']");
  if (takeoutForm) {
    event.preventDefault();
    const fd = new FormData(takeoutForm);
    const name = String(fd.get("name") || "").trim();
    if (!name) return;
    const takeout = {
      id: `tko-${Date.now()}`,
      name,
      cuisine: String(fd.get("cuisine") || "").trim(),
      url: String(fd.get("url") || "").trim(),
      notes: String(fd.get("notes") || "").trim(),
      tags: [],
      addedAt: new Date().toISOString(),
    };
    state.takeouts = [takeout, ...(state.takeouts || [])];
    state.lastAction = `${name} added`;
    persist();
    render();
    takeoutForm.reset();
    return;
  }

  const recipeEditForm = event.target.closest("[data-action='save-recipe-edit']");
  if (recipeEditForm) {
    event.preventDefault();
    const fd = new FormData(recipeEditForm);
    const importId = recipeEditForm.dataset.importId;
    const recipeImport = state.recipeImports.find((r) => r.id === importId);
    if (recipeImport) {
      const title = String(fd.get("title") || "").trim();
      if (title) recipeImport.title = title;
      const time = parseInt(fd.get("time"), 10);
      if (!isNaN(time) && time >= 0) recipeImport.time = time;
      const servings = parseInt(fd.get("servings"), 10);
      if (!isNaN(servings) && servings >= 1) recipeImport.servings = servings;
      recipeImport.summary = String(fd.get("summary") || "").trim();
      recipeImport.notes = String(fd.get("notes") || "").trim();
      const ingredients = [];
      recipeEditForm.querySelectorAll(".ingredient-row").forEach((row) => {
        const nameEl = row.querySelector(".ingredient-name");
        const name = (nameEl?.value || "").trim();
        if (!name) return;
        const qty = parseInt(row.querySelector(".ingredient-servings")?.value || "1", 10);
        ingredients.push({ name, category: nameEl?.dataset.category || "", servings: isNaN(qty) || qty < 0 ? 1 : qty });
      });
      recipeImport.ingredients = ingredients;
      const steps = [];
      recipeEditForm.querySelectorAll(".step-text").forEach((el) => {
        const text = el.value.trim();
        if (text) steps.push(text);
      });
      recipeImport.steps = steps;
      recipeImport.updatedAt = new Date().toISOString();
      state.lastAction = `${recipeImport.title} updated`;
      await patchRecipeToServer(importId, recipeImport);
    }
    state.recipeEditId = null;
    persist();
    render();
    return;
  }

  const chatForm = event.target.closest("[data-action='send-chat']");
  if (chatForm) {
    event.preventDefault();
    const fd = new FormData(chatForm);
    const message = String(fd.get("message") || "").trim();
    if (!message) return;
    chatForm.reset();
    sendChatMessage(message);
    return;
  }

  const form = event.target.closest("[data-action='add-grocery']");
  if (!form) return;
  event.preventDefault();
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  model.addGroceryItem(state, name);
  persist();
  render();
});

hydrateIcons(document);
render();
