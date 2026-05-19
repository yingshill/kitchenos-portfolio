"use strict";

// Minimal YAML parser for the queue format — no external dep required.
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

    const listItemMatch = line.match(/^([ \t]*)-\s+(.+)/);
    if (listItemMatch && !inNotes) {
      const indent = listItemMatch[1].length;
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

// One URL per line; lines starting with # are comments.
function parseTxtList(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.startsWith("http"))
    .map((url) => ({ url }));
}

// RFC 4180-compliant CSV parser (handles quoted fields with "" escapes and BOM).
function parseCsvLine(line) {
  const fields = [];
  let i = 0;
  while (i <= line.length) {
    if (line[i] === '"') {
      i++;
      let field = "";
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
        else if (line[i] === '"') { i++; break; }
        else { field += line[i++]; }
      }
      fields.push(field);
      if (line[i] === ",") i++;
    } else {
      const end = line.indexOf(",", i);
      if (end === -1) { fields.push(line.slice(i)); break; }
      fields.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return fields;
}

// Parses a CSV and returns entries with { url, name, status } from the named URL column.
// Skips rows where the URL is blank or contains "undefined".
function parseCsvUrls(text, { urlColumn = "Video URL", statusFilter } = {}) {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // strip BOM
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]);
  const urlIdx = headers.findIndex((h) => h.trim() === urlColumn);
  const nameIdx = headers.findIndex((h) => h.trim() === "Name");
  const statusIdx = headers.findIndex((h) => h.trim() === "Status");

  if (urlIdx === -1) throw new Error(`Column "${urlColumn}" not found in CSV. Headers: ${headers.join(", ")}`);

  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const url = (row[urlIdx] || "").trim();
    const status = statusIdx !== -1 ? (row[statusIdx] || "").trim() : "";
    const name = nameIdx !== -1 ? (row[nameIdx] || "").trim() : "";

    if (!url || !url.startsWith("http") || url.includes("undefined")) continue;
    if (statusFilter && status !== statusFilter) continue;

    entries.push({ url, name, status });
  }
  return entries;
}

module.exports = { parseQueueYaml, parseTxtList, parseCsvUrls };
