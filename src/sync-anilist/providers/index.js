import { AnimeUnityProvider } from "./animeunity.js";
import { AnimeSaturnProvider } from "./animesaturn.js";

let currentProvider = null;

/**
 * Detects the provider name for a given hostname using domain-agnostic family matching.
 * @param {string} [hostname]
 * @returns {"AnimeUnity" | "AnimeSaturn" | null}
 */
export function detectProviderName(hostname = "") {
  if (typeof hostname !== "string") return null;
  const host = hostname.trim().toLowerCase();
  if (!host) return null;

  if (/(?:^|\.)animeunity\./i.test(host)) {
    return "AnimeUnity";
  }
  if (/(?:^|\.)(?:animesaturn|saturncdn)\./i.test(host)) {
    return "AnimeSaturn";
  }

  return null;
}

/**
 * Returns the matching provider instance for the current website hostname.
 * @returns {AnimeUnityProvider | AnimeSaturnProvider | null}
 */
export function getProvider() {
  if (currentProvider) return currentProvider;

  const providerName = detectProviderName(window.location.hostname);
  if (providerName === "AnimeUnity") {
    currentProvider = new AnimeUnityProvider();
  } else if (providerName === "AnimeSaturn") {
    currentProvider = new AnimeSaturnProvider();
  }

  return currentProvider;
}

export function getCurrentProvider() {
  return getProvider();
}
