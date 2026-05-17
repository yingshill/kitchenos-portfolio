"use strict";

const { disabledResult, isAiFeatureEnabled } = require("./ai-config.js");

const DEFAULT_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";
const MAX_TRANSCRIPTION_BYTES = 25 * 1024 * 1024;

class TranscriptExtractionError extends Error {
  constructor(message, { status = 500, code = "TRANSCRIPT_EXTRACTION_ERROR" } = {}) {
    super(message);
    this.name = "TranscriptExtractionError";
    this.status = status;
    this.code = code;
  }
}

async function extractTranscriptFromMedia(mediaUrl, options = {}) {
  const url = String(mediaUrl || "").trim();
  if (!url) return { status: "unavailable", message: "No public video or audio stream was exposed." };

  const apiKey = Object.hasOwn(options, "apiKey") ? options.apiKey : process.env.OPENAI_API_KEY;
  const model = options.model || process.env.OPENAI_TRANSCRIPTION_MODEL || DEFAULT_TRANSCRIPTION_MODEL;
  if (!isAiFeatureEnabled("OPENAI_TRANSCRIPTION_ENABLED", options)) {
    return disabledResult("not-configured", "Video transcription is disabled by local configuration.", {
      source: "speech-to-text",
      mediaUrl: url,
      model,
    });
  }
  if (!apiKey) {
    return {
      status: "not-configured",
      source: "speech-to-text",
      mediaUrl: url,
      model,
      message: "Set OPENAI_API_KEY to transcribe public recipe videos.",
    };
  }

  const fetchImpl = options.fetch || fetch;
  const mediaResponse = await fetchImpl(url, {
    headers: {
      "referer": options.referer || "https://www.rednote.com/",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    },
  });
  if (!mediaResponse.ok) {
    throw new TranscriptExtractionError("Could not download public video stream for transcription.", {
      status: mediaResponse.status,
      code: "MEDIA_DOWNLOAD_FAILED",
    });
  }

  const contentType = mediaResponse.headers?.get?.("content-type") || "video/mp4";
  const mediaBuffer = await mediaResponse.arrayBuffer();
  if (mediaBuffer.byteLength > MAX_TRANSCRIPTION_BYTES) {
    throw new TranscriptExtractionError("Video stream is too large for transcription.", {
      status: 413,
      code: "MEDIA_TOO_LARGE",
    });
  }

  const form = new FormData();
  form.append("model", model);
  form.append("response_format", "json");
  form.append("file", new Blob([mediaBuffer], { type: contentType }), filenameForContentType(contentType));

  const transcriptResponse = await fetchImpl("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });
  const payload = await transcriptResponse.json().catch(() => ({}));
  if (!transcriptResponse.ok) {
    throw new TranscriptExtractionError(payload.error?.message || "Speech-to-text transcription failed.", {
      status: transcriptResponse.status,
      code: payload.error?.code || "OPENAI_TRANSCRIPTION_ERROR",
    });
  }

  const text = String(payload.text || "").trim();
  return {
    status: text ? "complete" : "empty",
    source: "speech-to-text",
    mediaUrl: url,
    model,
    text,
  };
}

function filenameForContentType(contentType) {
  if (/webm/i.test(contentType)) return "recipe-video.webm";
  if (/mpeg|mp3/i.test(contentType)) return "recipe-audio.mp3";
  if (/m4a/i.test(contentType)) return "recipe-audio.m4a";
  return "recipe-video.mp4";
}

module.exports = {
  DEFAULT_TRANSCRIPTION_MODEL,
  TranscriptExtractionError,
  extractTranscriptFromMedia,
};
