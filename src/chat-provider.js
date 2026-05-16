"use strict";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const DEFAULT_CLAUDE_MODEL = "claude-opus-4-7";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

class ChatError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "ChatError";
    this.status = status;
    this.code = "CHAT_ERROR";
  }
}

function isEnabled() {
  const provider = process.env.CHAT_PROVIDER || "claude";
  return provider === "openai" ? !!process.env.OPENAI_API_KEY : !!process.env.ANTHROPIC_API_KEY;
}

function notConfiguredResult(provider) {
  const key = provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
  return {
    status: "not-configured",
    provider,
    message: `Set ${key} in .env.local to enable chat.`,
  };
}

async function chatClaude(systemPrompt, messages) {
  const model = process.env.CLAUDE_CHAT_MODEL || DEFAULT_CLAUDE_MODEL;
  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new ChatError(payload.error?.message || "Claude API error", response.status);
  }
  const text = payload.content?.find((block) => block.type === "text")?.text || "";
  return { status: "ok", provider: "claude", model, text };
}

async function chatOpenAI(systemPrompt, messages) {
  const model = process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_MODEL;
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new ChatError(payload.error?.message || "OpenAI API error", response.status);
  }
  const text = payload.choices?.[0]?.message?.content || "";
  return { status: "ok", provider: "openai", model, text };
}

async function chat(systemPrompt, messages) {
  const provider = process.env.CHAT_PROVIDER || "claude";
  if (!isEnabled()) return notConfiguredResult(provider);
  return provider === "openai" ? chatOpenAI(systemPrompt, messages) : chatClaude(systemPrompt, messages);
}

module.exports = { ChatError, chat, isEnabled };
