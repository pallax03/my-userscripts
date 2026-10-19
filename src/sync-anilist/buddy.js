import { AniListAPI } from "../shared/anilist/api.js";
import { Storage } from "../shared/storage.js";
import { Settings } from "./settings.js";

const cache = new Map();
const CACHE_TTL_MS = 3 * 60 * 1000;

const avatarMap = new Map();

export const Buddy = {
  extract(notes) {
    if (!notes || typeof notes !== "string") return null;
    const match = notes.match(/\[sync:([a-zA-Z0-9_-]+)\]/i);
    return match ? match[1].trim() : null;
  },

  apply(notes, buddyName) {
    const clean = (notes || "").replace(/\s*\[sync:[^\]]+\]/gi, "").trim();
    if (buddyName && buddyName.trim()) {
      return clean ? `${clean} [sync:${buddyName.trim()}]` : `[sync:${buddyName.trim()}]`;
    }
    return clean;
  },

  getViewer() {
    return Storage.get("al_viewer") || null;
  },

  setViewer(viewer) {
    if (viewer) Storage.set("al_viewer", viewer);
    else Storage.del("al_viewer");
  },

  getAvatar(userName) {
    if (!userName) return null;
    const lower = userName.toLowerCase();
    if (avatarMap.has(lower)) return avatarMap.get(lower);
    const stored = Storage.get(`al_avatar_${lower}`);
    if (stored) {
      avatarMap.set(lower, stored);
      return stored;
    }
    return null;
  },

  setAvatar(userName, avatarUrl) {
    if (!userName || !avatarUrl) return;
    const lower = userName.toLowerCase();
    avatarMap.set(lower, avatarUrl);
    Storage.set(`al_avatar_${lower}`, avatarUrl);
  },

  async getFollowingCached(viewerId) {
    return Buddy.getFriendsCached(viewerId);
  },

  async getFriendsCached(viewerId) {
    const id = viewerId || Buddy.getViewer()?.id;
    if (!id) return [];
    const cacheKey = `al_friends_${id}`;
    const cached = Storage.get(cacheKey);
    if (cached && Array.isArray(cached.users) && Date.now() - cached.time < 6 * 60 * 60 * 1000) {
      for (const u of cached.users) {
        if (u.name && u.avatar?.medium) Buddy.setAvatar(u.name, u.avatar.medium);
      }
      return cached.users;
    }

    try {
      const [followingP1, followingP2, followersP1, followersP2] = await Promise.all([
        AniListAPI.getUserFollowing(id, 1).catch(() => null),
        AniListAPI.getUserFollowing(id, 2).catch(() => null),
        AniListAPI.getUserFollowers(id, 1).catch(() => null),
        AniListAPI.getUserFollowers(id, 2).catch(() => null)
      ]);

      const rawList = [
        ...(followingP1?.Page?.following || []),
        ...(followingP2?.Page?.following || []),
        ...(followersP1?.Page?.followers || []),
        ...(followersP2?.Page?.followers || [])
      ];

      const userMap = new Map();
      for (const u of rawList) {
        if (u && u.name && !userMap.has(u.name.toLowerCase())) {
          userMap.set(u.name.toLowerCase(), u);
          if (u.avatar?.medium) Buddy.setAvatar(u.name, u.avatar.medium);
        }
      }

      const users = Array.from(userMap.values());
      Storage.set(cacheKey, { users, time: Date.now() });
      return users;
    } catch (_) {
      return [];
    }
  },

  async searchFriends(query, viewerId) {
    const raw = (query || "").trim();
    const normalized = raw.toLowerCase();
    const id = viewerId || Buddy.getViewer()?.id;
    const friends = await Buddy.getFriendsCached(id);

    // Build list from followed & followers users, plus default buddy if not present
    const list = [...friends];
    const defaultBuddy = Settings.get().defaultBuddy;
    if (defaultBuddy && !list.some((u) => u.name.toLowerCase() === defaultBuddy.toLowerCase())) {
      list.unshift({
        name: defaultBuddy,
        avatar: { medium: Buddy.getAvatar(defaultBuddy) || "https://anilist.co/img/icons/icon.svg" }
      });
    }

    if (!raw) {
      return list;
    }

    // 1. Local filter among known followers & following
    const localMatches = list.filter((u) => u.name.toLowerCase().includes(normalized));
    const seenNames = new Set(localMatches.map((u) => u.name.toLowerCase()));

    // 2. Query AniList global user search so any friend is found immediately
    if (raw.length >= 2) {
      try {
        const searchRes = await AniListAPI.searchUsers(raw);
        const apiUsers = searchRes?.Page?.users || [];
        for (const u of apiUsers) {
          if (u && u.name && !seenNames.has(u.name.toLowerCase())) {
            seenNames.add(u.name.toLowerCase());
            localMatches.push(u);
            if (u.avatar?.medium) Buddy.setAvatar(u.name, u.avatar.medium);
          }
        }
      } catch (_) {}
    }

    return localMatches;
  },

  async getBuddyCollection(buddyName) {
    if (!buddyName) return new Map();
    const key = `buddy_col_${buddyName.toLowerCase()}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
      return cached.map;
    }

    try {
      const data = await AniListAPI.getFriendWatching(buddyName);
      const lists = data?.MediaListCollection?.lists || [];
      const map = new Map();
      for (const list of lists) {
        for (const entry of list.entries || []) {
          if (!map.has(entry.mediaId)) {
            map.set(entry.mediaId, entry);
          }
        }
      }
      cache.set(key, { map, time: Date.now() });
      return map;
    } catch (_) {
      return new Map();
    }
  },

  async getBuddyMediaEntry(buddyName, mediaId) {
    if (!buddyName || !mediaId) return null;
    const key = `buddy_col_${buddyName.toLowerCase()}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
      return cached.map.get(mediaId) || null;
    }

    try {
      const data = await AniListAPI.getFriendMediaEntry(buddyName, mediaId);
      const entry = data?.MediaList || null;
      if (entry?.user?.name && entry.user.avatar?.medium) {
        Buddy.setAvatar(entry.user.name, entry.user.avatar.medium);
      }
      return entry;
    } catch (_) {
      return null;
    }
  }
};
