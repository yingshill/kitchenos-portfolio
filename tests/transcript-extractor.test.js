"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { DEFAULT_TRANSCRIPTION_MODEL, extractTranscriptFromMedia } = require("../src/transcript-extractor.js");

test("transcript extraction returns not-configured without an API key", async () => {
  const transcript = await extractTranscriptFromMedia("https://cdn.example.com/video.mp4", { apiKey: "" });

  assert.equal(transcript.status, "not-configured");
  assert.equal(transcript.source, "speech-to-text");
  assert.equal(transcript.model, DEFAULT_TRANSCRIPTION_MODEL);
});

test("transcript extraction downloads media and calls the transcription API", async () => {
  const calls = [];
  const transcript = await extractTranscriptFromMedia("https://cdn.example.com/video.mp4", {
    apiKey: "test-key",
    fetch: async (url, options = {}) => {
      calls.push({ url, options });
      if (url === "https://cdn.example.com/video.mp4") {
        return {
          ok: true,
          headers: new Map([["content-type", "video/mp4"]]),
          arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
        };
      }
      return {
        ok: true,
        json: async () => ({ text: "Ingredients: flour. Steps: steam until fluffy." }),
      };
    },
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, "https://api.openai.com/v1/audio/transcriptions");
  assert.equal(calls[1].options.method, "POST");
  assert.equal(calls[1].options.headers.authorization, "Bearer test-key");
  assert.equal(transcript.status, "complete");
  assert.equal(transcript.text, "Ingredients: flour. Steps: steam until fluffy.");
});
