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

const root = document.querySelector("#view-root");
const title = document.querySelector("#view-title");
const eyebrow = document.querySelector("#view-eyebrow");
const sidebarStatus = document.querySelector("#sidebar-status");

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return clone(seedState);
    return { ...clone(seedState), ...JSON.parse(saved) };
  } catch {
    return clone(seedState);
  }
}

function clone(value) {
  return model.clone(value);
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  return model.pantryValue(state);
}

function lowStockItems() {
  return model.lowStockItems(state);
}

function riskItems() {
  return model.riskItems(state);
}

function receiptQueue() {
  return model.receiptQueue(state);
}

function selectedReceiptIsImported() {
  return model.selectedReceiptIsImported(state);
}

function selectedRecipeImport() {
  return (
    state.recipeImports.find((item) => item.id === state.selectedRecipeImportId) ||
    state.recipeImports[0] ||
    null
  );
}

function recommendedMeals() {
  return model.recommendedMeals(state);
}

function syncGrocery() {
  model.syncGrocery(state);
  persist();
  render();
}

function render() {
  const meta = viewMeta[state.view] || viewMeta.command;
  title.textContent = meta.title;
  eyebrow.textContent = meta.eyebrow;
  document.querySelectorAll("[data-view-link]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewLink === state.view);
  });
  sidebarStatus.innerHTML = renderSidebarStatus();

  const renderers = {
    command: renderCommand,
    receipts: renderReceipts,
    pantry: renderPantry,
    meals: renderMeals,
    grocery: renderGrocery,
    case: renderCaseStudy,
  };
  root.innerHTML = (renderers[state.view] || renderCommand)();
  hydrateIcons(root);
}

function renderSidebarStatus() {
  const readiness = Math.round(recommendedMeals().slice(0, 3).reduce((sum, meal) => sum + meal.score, 0) / 3);
  return `
    <strong>${escapeHtml(readiness)}% meal readiness</strong>
    <span>${escapeHtml(receiptQueue().length)} receipt${receiptQueue().length === 1 ? "" : "s"} in queue</span>
    <span>${escapeHtml(lowStockItems().length)} low-stock signals</span>
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
              <p class="status-note">${escapeHtml(receiptQueue().length)} receipt ready for merge.</p>
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

function renderReceipts() {
  return `
    <div class="stack">
      ${renderRecipeUrlImport()}
      <div class="split-grid">
        <section class="panel" aria-labelledby="receipt-preview-heading">
          <div class="panel-header">
            <div>
              <h2 id="receipt-preview-heading">Selected receipt</h2>
              <p class="status-note">Structured extraction with line-item confidence and pantry merge.</p>
            </div>
            <button class="action-button" type="button" data-action="parse-receipt" data-receipt-id="${escapeHtml(state.selectedReceiptId)}" ${selectedReceiptIsImported() ? "disabled" : ""}>
              ${icon("scan")}
              Import
            </button>
          </div>
          <div class="panel-body">${renderReceiptAsset()}</div>
        </section>
        <section class="panel" aria-labelledby="receipt-list-heading">
          <div class="panel-header">
            <h2 id="receipt-list-heading">Receipt queue</h2>
            <span class="badge blue">${escapeHtml(state.receipts.length)} total</span>
          </div>
          <div class="panel-body">
            <div class="receipt-list">
              ${state.receipts.map(renderReceiptCard).join("")}
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderRecipeUrlImport() {
  const recipeImport = selectedRecipeImport();
  return `
    <section class="panel" aria-labelledby="url-import-heading">
      <div class="panel-header">
        <div>
          <h2 id="url-import-heading">Recipe URL intake</h2>
          <p class="status-note">${escapeHtml(state.recipeImports.length)} saved source${state.recipeImports.length === 1 ? "" : "s"} with KitchenOS-generated covers.</p>
        </div>
        <form class="url-import-form" data-action="import-recipe-url">
          <label class="field">
            <span>URL</span>
            <input name="url" type="url" autocomplete="off" placeholder="https://..." value="${escapeHtml(state.urlDraft || "")}" required />
          </label>
          <button class="action-button" type="submit">
            ${icon("spark")}
            Extract
          </button>
        </form>
      </div>
      <div class="panel-body">
        ${recipeImport ? renderRecipeImportDetail(recipeImport) : '<div class="empty-state">Import a recipe or video URL to extract ingredients and cooking steps.</div>'}
      </div>
    </section>
  `;
}

function renderRecipeImportDetail(recipeImport) {
  const coverage = model.recipeImportCoverage(state, recipeImport);
  const missingCount = coverage.ingredients.filter((ingredient) => ingredient.missing > 0).length;
  return `
    <div class="recipe-import-layout">
      ${renderGeneratedCover(recipeImport)}
      <div class="recipe-import-detail">
        <div class="recipe-top">
          <div>
            <h3>${escapeHtml(recipeImport.title)}</h3>
            <p>${escapeHtml(recipeImport.summary || `Imported from ${recipeImport.sourceHost}.`)}</p>
          </div>
          <span class="score-ring" aria-label="${escapeHtml(Math.round(coverage.coverage * 100))} percent pantry coverage">${escapeHtml(Math.round(coverage.coverage * 100))}</span>
        </div>
        <div class="recipe-meta">
          <a class="source-link" href="${escapeHtml(recipeImport.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(recipeImport.sourceHost)}</a>
          <span class="badge blue">${escapeHtml(recipeImport.sourceType)}</span>
          <span class="badge mustard">${escapeHtml(recipeImport.time)} min</span>
          <span class="badge ${missingCount ? "mustard" : "leaf"}">${missingCount ? `${missingCount} grocery gap${missingCount === 1 ? "" : "s"}` : "pantry ready"}</span>
          <span class="badge plum">${escapeHtml(recipeImport.confidence)}% extraction</span>
        </div>
        <div class="recipe-import-grid">
          <div class="need-list">
            ${coverage.ingredients.map(renderRecipeIngredientRow).join("")}
          </div>
          <ol class="step-list">
            ${recipeImport.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
          </ol>
        </div>
        <div class="button-row">
          <button class="secondary-button" type="button" data-action="sync-recipe-gaps" data-import-id="${escapeHtml(recipeImport.id)}">
            Add missing to grocery
          </button>
          <button class="secondary-button" type="button" data-action="save-recipe-meal" data-import-id="${escapeHtml(recipeImport.id)}" ${recipeImport.savedAsMeal ? "disabled" : ""}>
            ${recipeImport.savedAsMeal ? "Saved as meal" : "Save as meal"}
          </button>
        </div>
        ${state.recipeImports.length > 1 ? renderRecipeImportSwitcher(recipeImport.id) : ""}
      </div>
    </div>
  `;
}

function renderGeneratedCover(recipeImport) {
  const ingredients = recipeImport.ingredients.slice(0, 4);
  return `
    <figure class="generated-cover ${escapeHtml(recipeImport.cover.theme)}" aria-label="KitchenOS generated cover for ${escapeHtml(recipeImport.title)}">
      <span class="cover-mark">KitchenOS</span>
      <span class="cover-plate" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <figcaption>
        <strong>${escapeHtml(recipeImport.title)}</strong>
        <small>${ingredients.map((ingredient) => escapeHtml(ingredient.name)).join(" / ")}</small>
      </figcaption>
    </figure>
  `;
}

function renderRecipeIngredientRow(ingredient) {
  const percentage = Math.round(ingredient.covered * 100);
  return `
    <div class="meal-need-row">
      <span>${escapeHtml(ingredient.name)}</span>
      <span class="bar-track" aria-label="${escapeHtml(percentage)} percent available">
        <span class="bar-fill ${percentage < 50 ? "is-danger" : percentage < 100 ? "is-warn" : ""}" style="width: ${percentage}%"></span>
      </span>
      <small class="row-meta">${escapeHtml(ingredient.available)}/${escapeHtml(ingredient.servings)} servings</small>
    </div>
  `;
}

function renderRecipeImportSwitcher(selectedId) {
  return `
    <div class="recipe-import-switcher" aria-label="Imported recipe URLs">
      ${state.recipeImports
        .map(
          (item) => `
            <button class="chip-button ${item.id === selectedId ? "is-selected" : ""}" type="button" data-action="select-recipe-import" data-import-id="${escapeHtml(item.id)}">
              ${escapeHtml(item.title)}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderReceiptCard(receipt) {
  return `
    <article class="receipt-card">
      <div class="receipt-top">
        <div>
          <h3>${escapeHtml(receipt.merchant)}</h3>
          <p>${escapeHtml(fmtDate(receipt.date))} - ${escapeHtml(receipt.items.length)} line items - ${escapeHtml(money(receipt.total))}</p>
        </div>
        <span class="badge ${receipt.status === "imported" ? "leaf" : "mustard"}">${escapeHtml(receipt.status)}</span>
      </div>
      <div class="receipt-meta">
        <span class="badge blue">${escapeHtml(receipt.confidence)}% confidence</span>
        ${receipt.items.map((item) => `<span class="badge ${categoryClass(item.category)}">${escapeHtml(item.name)}</span>`).join("")}
      </div>
      <button class="secondary-button" type="button" data-action="select-receipt" data-receipt-id="${escapeHtml(receipt.id)}">
        Select receipt
      </button>
    </article>
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
  if (action === "select-recipe-import") {
    state.selectedRecipeImportId = actionTarget.dataset.importId;
    state.lastAction = "Recipe source selected";
    persist();
    render();
  }
  if (action === "sync-recipe-gaps") {
    model.syncRecipeImportGaps(state, actionTarget.dataset.importId);
    persist();
    render();
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

  const urlInput = event.target.closest("[data-action='import-recipe-url'] input[name='url']");
  if (urlInput) {
    state.urlDraft = urlInput.value;
    persist();
  }
});

document.addEventListener("submit", (event) => {
  const urlForm = event.target.closest("[data-action='import-recipe-url']");
  if (urlForm) {
    event.preventDefault();
    const formData = new FormData(urlForm);
    model.importRecipeUrl(state, String(formData.get("url") || ""));
    persist();
    render();
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
