"use strict";

const fs = require("node:fs");
const path = require("node:path");

function loadEnvFiles(root, filenames = [".env.local", ".env"]) {
  filenames.forEach((filename) => {
    const filePath = path.join(root, filename);
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, "utf8");
    parseEnvContent(content).forEach(([key, value]) => {
      if (!Object.hasOwn(process.env, key)) process.env[key] = value;
    });
  });
}

function parseEnvContent(content) {
  return String(content || "")
    .split(/\r?\n/)
    .map((line) => parseEnvLine(line))
    .filter(Boolean);
}

function parseEnvLine(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!match) return null;
  return [match[1], stripQuotes(match[2].trim())];
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

module.exports = {
  loadEnvFiles,
  parseEnvContent,
};
