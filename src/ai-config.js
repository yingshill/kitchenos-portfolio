"use strict";

function isAiFeatureEnabled(featureName, options = {}) {
  if (Object.hasOwn(options, "enabled")) return Boolean(options.enabled);
  const globalFlag = flagValue(process.env.OPENAI_API_ENABLED);
  if (globalFlag !== null) return globalFlag;
  const featureFlag = flagValue(process.env[featureName]);
  return featureFlag === null ? true : featureFlag;
}

function disabledResult(status, message, extra = {}) {
  return {
    status,
    message,
    ...extra,
  };
}

function flagValue(value) {
  if (value === undefined) return null;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
}

module.exports = {
  disabledResult,
  isAiFeatureEnabled,
};
