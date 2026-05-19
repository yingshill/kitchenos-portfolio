#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { loadEnvFiles } = require("../src/env-loader.js");

const ROOT = path.resolve(__dirname, "..");
const RECIPES_PATH = path.join(ROOT, "recipes.json");
loadEnvFiles(ROOT);

const execFileAsync = promisify(execFile);

const { transcribeLocalFile } = require("../src/transcript-extractor.js");
const { structureRecipeFromTranscript } = require("../src/recipe-structurer.js");
const { rewriteRecipeTitle } = require("../src/title-rewriter.js");
const { rewriteRecipeSummary } = require("../src/summary-rewriter.js");
const { enrichRecipeMeta } = require("../src/recipe-enricher.js");
const { buildCoverPrompt, generateCover } = require("../src/cover-generator.js");
const { parseQueueYaml, parseTxtList, parseCsvUrls } = require("./parse-queue.js");

async function readRecipes() {
  try { return JSON.parse(await fs.readFile(RECIPES_PATH, "utf-8")); }
  catch { return []; }
}

async function writeRecipes(recipes) {
  await fs.writeFile(RECIPES_PATH, JSON.stringify(recipes, null, 2) + "\n");
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function checkYtDlp() {
  try {
    const { stdout } = await execFileAsync("yt-dlp", ["--version"]);
    return stdout.trim();
  } catch {
    throw new Error("yt-dlp is not installed.\n  Install: brew install yt-dlp");
  }
}

function buildYtDlpArgs(url, cookiesPath, extra = []) {
  const args = [];
  if (cookiesPath) args.push("--cookies", cookiesPath);
  args.push("--no-playlist", "--no-warnings", "-o", "%(id)s.%(ext)s", ...extra, url);
  return args;
}

async function fetchMetadata(url, tmpDir, cookiesPath) {
  await execFileAsync(
    "yt-dlp",
    buildYtDlpArgs(url, cookiesPath, ["--write-info-json", "--skip-download"]),
    { cwd: tmpDir, maxBuffer: 5 * 1024 * 1024 },
  );
  const files = await fs.readdir(tmpDir);
  const infoFile = files.find((f) => f.endsWith(".info.json"));
  if (!infoFile) throw new Error("yt-dlp produced no info.json — check the URL or add --cookies.");
  return JSON.parse(await fs.readFile(path.join(tmpDir, infoFile), "utf-8"));
}

async function downloadAudio(url, tmpDir, cookiesPath) {
  await execFileAsync(
    "yt-dlp",
    buildYtDlpArgs(url, cookiesPath, ["-x", "--audio-format", "mp3"]),
    { cwd: tmpDir, maxBuffer: 5 * 1024 * 1024 },
  );
  const files = await fs.readdir(tmpDir);
  const audioFile = files.find((f) => /\.(mp3|m4a|webm|ogg|opus)$/i.test(f));
  if (!audioFile) throw new Error("yt-dlp produced no audio file.");
  return path.join(tmpDir, audioFile);
}

async function downloadAndImport(rawUrl, { cookiesPath } = {}) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "kitchenos-"));

  try {
    // Check duplicate before doing any work
    const existingRecipes = await readRecipes();
    const alreadyImported = existingRecipes.find((r) => r.fetchUrl === rawUrl || r.sourceUrl === rawUrl);
    if (alreadyImported) {
      console.log(`  ✓ Already imported: ${alreadyImported.title}`);
      return;
    }

    // Step 1: metadata (title, description, uploader) — no LLM cost
    console.log("  → Fetching post metadata...");
    const info = await fetchMetadata(rawUrl, tmpDir, cookiesPath);
    const rawTitle = info.title || info.fulltitle || "";
    const description = info.description || "";
    const creator = info.uploader || info.channel || "";
    const sourceUrl = info.webpage_url || rawUrl;
    console.log(`  ✓ "${rawTitle}" by ${creator || "unknown"}`);

    // Step 2: download audio — no LLM cost
    console.log("  → Downloading audio...");
    const audioPath = await downloadAudio(rawUrl, tmpDir, cookiesPath);
    const audioSize = ((await fs.stat(audioPath)).size / 1024 / 1024).toFixed(1);
    console.log(`  ✓ Audio: ${path.basename(audioPath)} (${audioSize} MB)`);

    // Step 3: Whisper STT
    console.log("  → Transcribing...");
    const transcript = await transcribeLocalFile(audioPath);
    if (transcript.status === "not-configured") throw new Error(transcript.message);
    if (transcript.status !== "complete" || !transcript.text) throw new Error("Transcription returned no text.");
    console.log(`  ✓ Transcript (${transcript.text.length} chars): ${transcript.text.slice(0, 80)}...`);

    // Step 4: structure — one GPT call on combined text
    console.log("  → Structuring recipe...");
    const combinedText = [
      description && `Post caption:\n${description}`,
      `Video transcript:\n${transcript.text}`,
    ].filter(Boolean).join("\n\n");

    const structured = await structureRecipeFromTranscript({
      transcript: combinedText,
      metadata: { title: rawTitle, creator, sourceType: "video" },
    });
    if (structured.status !== "complete" || !structured.recipe) {
      throw new Error("Recipe structuring failed — no recipe returned.");
    }
    const s = structured.recipe;
    console.log(`  ✓ Structured: ${s.ingredients?.length || 0} ingredients, ${s.steps?.length || 0} steps`);

    // Build recipe object
    let recipe = {
      id: `yt-${slugify(s.title || rawTitle)}-${Date.now()}`,
      sourceUrl,
      fetchUrl: rawUrl,
      sourceHost: (() => { try { return new URL(sourceUrl).hostname.replace(/^www\./, ""); } catch { return ""; } })(),
      sourceType: "video",
      title: s.title || rawTitle,
      creator,
      confidence: s.confidence || 0,
      time: s.time || 0,
      servings: s.servings || 1,
      summary: s.summary || "",
      extractionStatus: "complete",
      warnings: s.warnings || [],
      cover: {
        status: "prompt-ready",
        prompt: buildCoverPrompt({ title: s.title || rawTitle, ingredients: s.ingredients || [], summary: s.summary || "" }),
      },
      ingredients: s.ingredients || [],
      steps: s.steps || [],
      notes: "",
      tags: s.tags || [],
      importedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Step 5: enrich — title rewrite + summary rewrite + emoji/quantity — all parallel
    console.log("  → Enriching...");
    const [titleRewrite, summaryRewrite] = await Promise.all([
      rewriteRecipeTitle(recipe).catch(() => null),
      rewriteRecipeSummary(recipe).catch(() => null),
      enrichRecipeMeta(recipe).catch(() => null),   // mutates recipe.ingredients + recipe.tags in place
    ]);
    if (titleRewrite?.status === "complete" && titleRewrite.title) recipe.title = titleRewrite.title;
    if (summaryRewrite?.status === "complete" && summaryRewrite.summary) recipe.summary = summaryRewrite.summary;
    console.log(`  ✓ Title: ${recipe.title}`);

    // Save
    const allRecipes = await readRecipes();
    allRecipes.unshift(recipe);
    await writeRecipes(allRecipes);
    console.log(`  ✓ Saved`);

    // Step 6: cover generation
    console.log("  → Generating cover...");
    try {
      const coverResult = await generateCover(recipe);
      if (coverResult.status === "ai-generated") {
        recipe.cover = {
          status: "ai-generated",
          generatedAt: coverResult.generatedAt,
          guidelineVersion: coverResult.guidelineVersion,
          imageDataUrl: coverResult.imageDataUrl,
          model: coverResult.model,
          prompt: coverResult.prompt,
        };
        const saved = await readRecipes();
        const idx = saved.findIndex((r) => r.id === recipe.id);
        if (idx !== -1) { saved[idx] = recipe; await writeRecipes(saved); }
        console.log("  ✓ Cover generated");
      } else {
        console.log(`  ✗ Cover skipped: ${coverResult.message || coverResult.status}`);
      }
    } catch (e) {
      console.log(`  ✗ Cover failed: ${e.message}`);
    }

  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function runQueue(entries, { cookiesPath }) {
  const total = entries.length;
  let done = 0;
  let failed = 0;

  for (const entry of entries) {
    done++;
    console.log(`\n[${done}/${total}] ${entry.name || entry.url}`);
    try {
      await downloadAndImport(entry.url, { cookiesPath });
    } catch (e) {
      console.error(`  ✗ Failed: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${done - failed}/${total} succeeded${failed ? `, ${failed} failed` : ""}.`);
}

async function loadEntries(filePath, { statusFilter } = {}) {
  let text;
  try {
    text = await fs.readFile(filePath, "utf-8");
  } catch {
    throw new Error(`Cannot read file: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".yaml" || ext === ".yml") return parseQueueYaml(text);
  if (ext === ".txt") return parseTxtList(text);
  if (ext === ".csv") return parseCsvUrls(text, { statusFilter });
  throw new Error(`Unsupported file type: ${ext}. Use .yaml, .txt, or .csv`);
}

async function main() {
  const args = process.argv.slice(2);
  const positional = args.find((a) => !a.startsWith("--"));
  const cookiesIdx = args.indexOf("--cookies");
  const cookiesPath = cookiesIdx !== -1 ? args[cookiesIdx + 1] : null;
  const statusIdx = args.indexOf("--status");
  const statusFilter = statusIdx !== -1 ? args[statusIdx + 1] : null;

  if (!positional) {
    console.log("Usage: node cli/download.js <url|file> [--cookies <cookies.txt>] [--status <value>]");
    console.log("");
    console.log("  <url>              Single Rednote (or any yt-dlp supported) video URL");
    console.log("  <file.yaml>        YAML queue — same format as import.js");
    console.log("  <file.txt>         One URL per line (# for comments)");
    console.log("  <file.csv>         CSV with a 'Video URL' column");
    console.log("  --cookies <file>   Netscape cookies.txt from your logged-in browser");
    console.log("  --status <value>   CSV only: filter rows by Status column value");
    console.log("");
    console.log("Requires: yt-dlp (brew install yt-dlp)");
    console.log("Pipeline: yt-dlp metadata → audio → Whisper STT → GPT structure → enrich → cover");
    process.exit(0);
  }

  const version = await checkYtDlp();
  console.log(`yt-dlp ${version}`);

  const isFile = positional.includes(".") && !positional.startsWith("http");
  if (isFile) {
    const entries = await loadEntries(positional, { statusFilter });
    if (!entries.length) {
      console.log("No valid URLs found in file.");
      return;
    }
    console.log(`Processing ${entries.length} URL${entries.length === 1 ? "" : "s"} from ${path.basename(positional)}...`);
    await runQueue(entries, { cookiesPath });
  } else {
    console.log(`Downloading: ${positional}`);
    await downloadAndImport(positional, { cookiesPath });
    console.log("Done.");
  }
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
