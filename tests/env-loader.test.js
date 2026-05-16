"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { parseEnvContent } = require("../src/env-loader.js");

test("parses env files without leaking comments or quotes", () => {
  const values = parseEnvContent(`
    # local secrets
    OPENAI_API_KEY="test-key"
    OPENAI_IMAGE_MODEL=gpt-image-1
    INVALID LINE
    EMPTY=
  `);

  assert.deepEqual(values, [
    ["OPENAI_API_KEY", "test-key"],
    ["OPENAI_IMAGE_MODEL", "gpt-image-1"],
    ["EMPTY", ""],
  ]);
});
