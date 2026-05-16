#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { loadEnvFiles } = require("../src/env-loader.js");

const ROOT = path.resolve(__dirname, "..");
const RECIPES_PATH = path.join(ROOT, "recipes.json");

loadEnvFiles(ROOT);

const { extractRecipeFromUrl } = require("../src/recipe-extractor.js");

async function readRecipes() {
  try {
    const text = await fs.readFile(RECIPES_PATH, "utf-8");
    return JSON.parse(text);
  } catch {
    return [];
  }
}

async function writeRecipes(recipes) {
  await fs.writeFile(RECIPES_PATH, JSON.stringify(recipes, null, 2) + "\n");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    [...url.searchParams.keys()].forEach((key) => {
      if (isTrackingParam(key)) url.searchParams.delete(key);
    });
    return url.href;
  } catch {
    return null;
  }
}

function isTrackingParam(key) {
  return (
    key.startsWith("utm_") ||
    ["fbclid", "gclid", "igshid", "mc_cid", "mc_eid", "source", "spm", "xsec_source", "xsec_token"].includes(key)
  );
}

async function importUrl(rawUrl, { notes = "", tags = [], forceRefresh = false } = {}) {
  const normalizedUrl = normalizeUrl(rawUrl);
  if (!normalizedUrl) {
    console.error(`  ✗ Invalid URL: ${rawUrl}`);
    return;
  }

  const recipes = await readRecipes();
  const existing = recipes.find((r) => r.sourceUrl === normalizedUrl);

  if (existing && !forceRefresh) {
    console.log(`  ✓ Already imported: ${existing.title} (use --refresh to overwrite)`);
    return;
  }

  console.log(`  → ${normalizedUrl}`);

  let extraction;
  try {
    extraction = await extractRecipeFromUrl(normalizedUrl, { notes });
  } catch (error) {
    console.error(`  ✗ Extraction failed: ${error.message}`);
    return;
  }

  if (!extraction || !extraction.title) {
    console.error("  ✗ No recipe data returned");
    return;
  }

  const id = existing ? existing.id : `url-${slugify(extraction.title)}-${Date.now()}`;
  const recipe = {
    ...(existing || {}),
    id,
    sourceUrl: normalizedUrl,
    fetchUrl: extraction.fetchUrl || normalizedUrl,
    sourceHost: new URL(normalizedUrl).hostname.replace(/^www\./, ""),
    sourceType: extraction.sourceType || "article",
    title: extraction.title,
    creator: extraction.creator || "",
    confidence: extraction.confidence || 0,
    time: extraction.time || 0,
    servings: extraction.servings || 1,
    summary: extraction.summary || "",
    extractionStatus: extraction.extractionStatus || "complete",
    warnings: extraction.warnings || [],
    cover: {
      status: "prompt-ready",
      theme: extraction.coverTheme || "leaf",
      prompt: `KitchenOS editorial food cover for ${extraction.title}. Clean overhead composition, natural light, no text, no logos, no brand packaging.`,
    },
    ingredients: extraction.ingredients || [],
    steps: extraction.steps || [],
    notes: notes || existing?.notes || "",
    tags: tags.length ? tags : existing?.tags || [],
    importedAt: existing?.importedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    const index = recipes.indexOf(existing);
    recipes[index] = recipe;
    console.log(`  ✓ Updated: ${recipe.title}`);
  } else {
    recipes.unshift(recipe);
    console.log(`  ✓ Imported: ${recipe.title}`);
  }

  await writeRecipes(recipes);
}

// Minimal YAML parser for the queue format — no external dep required
function parseQueueYaml(text) {
  const entries = [];
  const lines = text.split("\n");
  let current = null;
  let inNotes = false;
  let notesIndent = 0;

  for (const line of lines) {
    if (line.trimStart().startsWith("#")) continue;

    const urlMatch = line.match(/^[ \t]*-\s+url:\s*(.+)/);
    if (urlMatch) {
      if (current) entries.push(current);
      current = { url: urlMatch[1].trim(), notes: "", tags: [] };
      inNotes = false;
      continue;
    }

    if (!current) continue;

    const notesBlockMatch = line.match(/^([ \t]*)notes:\s*\|\s*$/);
    if (notesBlockMatch) {
      inNotes = true;
      notesIndent = notesBlockMatch[1].length + 2;
      continue;
    }

    const notesInlineMatch = line.match(/^[ \t]*notes:\s*(.+)/);
    if (notesInlineMatch) {
      current.notes = notesInlineMatch[1].trim().replace(/^['"]|['"]$/g, "");
      inNotes = false;
      continue;
    }

    if (line.match(/^[ \t]*tags:/)) {
      inNotes = false;
      continue;
    }

    // List item — could be a tag or notes continuation
    const listItemMatch = line.match(/^([ \t]*)-\s+(.+)/);
    if (listItemMatch && !inNotes) {
      const indent = listItemMatch[1].length;
      // Tags are typically indented 6+ chars (under "    tags:")
      if (indent >= 4) {
        current.tags.push(listItemMatch[2].trim().replace(/^['"]|['"]$/g, ""));
      }
      continue;
    }

    if (inNotes) {
      const indent = (line.match(/^([ \t]*)/)?.[1] || "").length;
      if (line.trim() === "" || indent >= notesIndent) {
        current.notes += (current.notes ? "\n" : "") + line.slice(notesIndent);
      } else {
        inNotes = false;
      }
    }
  }

  if (current) entries.push(current);
  return entries.filter((e) => e.url);
}

async function importQueue(filePath) {
  let yaml;
  try {
    yaml = await fs.readFile(filePath, "utf-8");
  } catch {
    console.error(`Cannot read queue file: ${filePath}`);
    process.exit(1);
  }

  const entries = parseQueueYaml(yaml);
  if (!entries.length) {
    console.log("No entries found in queue.");
    return;
  }

  console.log(`Processing ${entries.length} URL${entries.length === 1 ? "" : "s"} from ${path.basename(filePath)}...`);
  for (const entry of entries) {
    await importUrl(entry.url, { notes: entry.notes, tags: entry.tags });
  }
  console.log(`Done.`);
}

async function main() {
  const args = process.argv.slice(2);
  const arg = args.find((a) => !a.startsWith("--"));
  const forceRefresh = args.includes("--refresh");

  if (!arg) {
    console.log("Usage: node cli/import.js <url>|<queue.yaml> [--refresh]");
    console.log("  <url>         Import a single recipe URL");
    console.log("  <queue.yaml>  Process all URLs in the queue file");
    console.log("  --refresh     Re-import even if the URL already exists");
    process.exit(0);
  }

  if (arg.endsWith(".yaml") || arg.endsWith(".yml")) {
    await importQueue(arg);
  } else {
    console.log("Importing 1 URL...");
    await importUrl(arg, { forceRefresh });
    console.log("Done.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
