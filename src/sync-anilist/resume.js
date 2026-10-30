import { Storage } from "../shared/storage.js";

/**
 * Utility module for parsing, applying, and caching playback resume timestamps in AniList notes
 */
export const Resume = {
  /**
   * Extracts playback resume info from an AniList entry notes string
   * @param {string|null} notes
   * @returns {{ ep: number, time: number, duration: number, percent: number }|null}
   */
  extract(notes) {
    if (!notes || typeof notes !== "string") return null;
    const match = notes.match(/\[resume:ep=(\d+),t=(\d+),d=(\d+)\]/i);
    if (!match) return null;

    const ep = parseInt(match[1], 10);
    const time = parseInt(match[2], 10);
    const duration = parseInt(match[3], 10);
    const percent = duration > 0 ? Math.min(100, Math.max(0, Math.round((time / duration) * 100))) : 0;

    return { ep, time, duration, percent };
  },

  /**
   * Applies or updates the [resume:...] tag in notes while preserving user notes and [sync:...] buddy tags
   * @param {string|null} notes
   * @param {Object} data
   * @param {number} data.ep
   * @param {number} data.time
   * @param {number} data.duration
   * @returns {string}
   */
  apply(notes, { ep, time, duration }) {
    const clean = (notes || "").replace(/\s*\[resume:[^\]]+\]/gi, "").trim();
    const tag = `[resume:ep=${Math.round(ep)},t=${Math.round(time)},d=${Math.round(duration)}]`;
    return clean ? `${clean} ${tag}` : tag;
  },

  /**
   * Removes the [resume:...] tag from notes when an episode is completed
   * @param {string|null} notes
   * @returns {string}
   */
  clear(notes) {
    return (notes || "").replace(/\s*\[resume:[^\]]+\]/gi, "").trim();
  },

  /**
   * Formats seconds into human-readable timestamp (e.g. 12:34 or 1:12:34)
   * @param {number} seconds
   * @returns {string}
   */
  formatTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return "0:00";
    const s = Math.round(seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${mins}:${String(secs).padStart(2, "0")}`;
  },

  /**
   * Retrieves local fast-cached resume state
   * @param {number|string} mediaId
   * @returns {{ ep: number, time: number, duration: number, percent: number, updatedAt: number }|null}
   */
  getLocal(mediaId) {
    if (!mediaId) return null;
    return Storage.get(`al_resume_${mediaId}`) || null;
  },

  /**
   * Saves local fast-cached resume state
   * @param {number|string} mediaId
   * @param {Object} data
   */
  setLocal(mediaId, data) {
    if (!mediaId || !data) return;
    Storage.set(`al_resume_${mediaId}`, {
      ...data,
      updatedAt: Date.now()
    });
  },

  /**
   * Clears local fast-cached resume state
   * @param {number|string} mediaId
   */
  clearLocal(mediaId) {
    if (!mediaId) return;
    Storage.del(`al_resume_${mediaId}`);
  }
};
