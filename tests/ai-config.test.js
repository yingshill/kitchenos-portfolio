"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { isAiFeatureEnabled } = require("../src/ai-config.js");

test("AI feature flag can disable provider calls", () => {
  assert.equal(isAiFeatureEnabled("OPENAI_COVER_ENABLED", { enabled: false }), false);
  assert.equal(isAiFeatureEnabled("OPENAI_COVER_ENABLED", { enabled: true }), true);
});
