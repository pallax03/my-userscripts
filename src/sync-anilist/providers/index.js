import { AnimeUnityProvider } from "./animeunity.js";
import { AnimeSaturnProvider } from "./animesaturn.js";

let currentProvider = null;

/**
 * Returns the matching provider instance for the current website hostname.
 * @returns {AnimeUnityProvider | AnimeSaturnProvider | null}
 */
export function getProvider() {
  if (currentProvider) return currentProvider;

  const host = window.location.hostname.toLowerCase();

  if (host.includes("animeunity")) {
    currentProvider = new AnimeUnityProvider();
  } else if (host.includes("animesaturn") || host.includes("saturncdn")) {
    currentProvider = new AnimeSaturnProvider();
  }

  return currentProvider;
}

export function getCurrentProvider() {
  return getProvider();
}
