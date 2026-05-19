"use strict";

const { isAiFeatureEnabled } = require("./ai-config.js");

const DEFAULT_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `You are a food content editor for a Chinese recipe app. Rewrite recipe titles to be clean, evocative, and styled — not raw social media copy.

Style template: [emoji/hook] + [sensory or texture word] ｜ [recipe name] + [tag / cuisine / mood]

Rules:
- 1–3 emojis max, used as accents not spam
- Keep texture and mimetic words that fit: 软糯 酥脆 流心 糯叽叽 云朵般 拉丝
- Keep good hooks if they fit naturally: 一口X｜ X带来的快乐 X分钟get 你吃过吗
- Use ｜ as the main separator; commas and ～ for secondary breaks
- Include an optional cuisine flag emoji (🇫🇷 🇰🇷 🇮🇳 etc.) only if the dish is clearly from that cuisine
- Strip: pure marketing filler ("巨好吃", "超好吃", "全网最详细"), redundant hashtags, repeated emojis, usernames, channel names, foreign words not part of the dish name (e.g. "Mutfak")
- Keep the core dish name intact — never translate or change what the dish is
- Output must be Chinese (with optional emoji/flag). No English unless the dish name is English.
- Return only the rewritten title. No quotes, no explanation.

Examples (raw → rewritten):
抖臀酸奶蛋糕,轻盈的像空气,低卡版 → ✨云朵般轻盈｜低卡抖臀酸奶蛋糕
广州梦中情糕, 你吃过吗 → 广州梦中情糕，你吃过吗？
只需把酸奶倒入面粉里，云朵一样柔软的面包, 舒芙蕾 → 🍞云朵般柔软｜酸奶舒芙蕾面包
🐧微醺一人食｜韩式白切肉➕泡菜饼➕气泡果酒 → 🐧微醺一人食｜🇰🇷韩式白切肉 · 泡菜饼 · 气泡果酒
芥末奶油鸡🇫🇷法式乡村菜 → 🇫🇷芥末奶油鸡｜法式乡村风
两个土豆带来的快乐！免油炸脆脆薯饼巨好吃 → 🥔两个土豆带来的快乐｜免油炸脆脆薯饼
🧄✨地中海风味芝麻蒜香酸奶酱 🌿 🧄 Mutfak → 🧄✨芝麻蒜香酸奶酱｜地中海风味
一口惊艳🍌10分钟get泰式超🔥香蕉煎饼 → 🍌一口惊艳｜10分钟泰式香蕉煎饼
红糖流心糍粑🔥蓬松酥脆还流心，糯叽叽的～ → 🔥流心红糖糍粑｜蓬松酥脆，糯叽叽的～`;

async function rewriteRecipeTitle(recipe, options = {}) {
  const apiKey = Object.hasOwn(options, "apiKey") ? options.apiKey : process.env.OPENAI_API_KEY;
  const model = options.model || process.env.OPENAI_RECIPE_MODEL || DEFAULT_MODEL;

  if (!isAiFeatureEnabled("OPENAI_RECIPE_STRUCTURING_ENABLED", options)) {
    return { status: "not-configured", model, message: "AI title rewrite is disabled." };
  }
  if (!apiKey) {
    return { status: "not-configured", model, message: "Set OPENAI_API_KEY to rewrite recipe titles." };
  }

  const rawTitle = String(recipe.title || "").trim();
  if (!rawTitle) return { status: "error", model, message: "No title to rewrite." };

  const response = await (options.fetch || fetch)("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 80,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: rawTitle },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { status: "error", message: payload.error?.message || "Title rewrite failed.", model };
  }

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) return { status: "error", message: "No title returned.", model };

  return { status: "complete", title: text, model };
}

module.exports = { rewriteRecipeTitle };
