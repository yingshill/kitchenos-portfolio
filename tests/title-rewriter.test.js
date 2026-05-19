"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { rewriteRecipeTitle } = require("../src/title-rewriter.js");

test("returns not-configured without an API key", async () => {
  const result = await rewriteRecipeTitle({ title: "红糖流心糍粑🔥蓬松酥脆还流心，糯叽叽的～" }, { apiKey: "" });
  assert.equal(result.status, "not-configured");
});

test("calls the chat completions API with the raw title", async () => {
  let capturedBody;
  const result = await rewriteRecipeTitle(
    { title: "两个土豆带来的快乐！免油炸脆脆薯饼巨好吃" },
    {
      apiKey: "test-key",
      fetch: async (_url, options) => {
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: "🥔两个土豆带来的快乐｜免油炸脆脆薯饼" } }],
          }),
        };
      },
    },
  );

  assert.equal(result.status, "complete");
  assert.equal(result.title, "🥔两个土豆带来的快乐｜免油炸脆脆薯饼");
  assert.ok(capturedBody.messages.some((m) => m.content.includes("两个土豆带来的快乐")));
});

test("returns error when API responds with no content", async () => {
  const result = await rewriteRecipeTitle(
    { title: "芥末奶油鸡🇫🇷法式乡村菜" },
    {
      apiKey: "test-key",
      fetch: async () => ({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "" } }] }),
      }),
    },
  );

  assert.equal(result.status, "error");
});
