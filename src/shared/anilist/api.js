import { Storage } from "../storage.js";
import { showToast } from "../toast.js";

export const AniListAPI = {
  url: "https://graphql.anilist.co",
  clientId: "43750",
  oauthUrl: "https://anilist.co/api/v2/oauth/authorize?client_id=43750&response_type=token",

  statuses: {
    CURRENT: "Watching",
    COMPLETED: "Completed",
    PAUSED: "Paused",
    DROPPED: "Dropped",
    PLANNING: "Planning",
    REPEATING: "Rewatching"
  },

  async call(query, variables = {}, { silent = false, onAuthError = null } = {}) {
    const token = Storage.get("anilist_token");
    if (!token) return null;

    try {
      const res = await fetch(AniListAPI.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query, variables })
      });

      const { data, errors } = await res.json();
      if (errors) {
        const first = errors[0];
        if (first?.status === 401 || first?.message?.includes("Invalid token")) {
          if (!silent) showToast("AniList token invalid or expired", true);
          if (typeof onAuthError === "function") onAuthError();
          return null;
        }
        if (first?.status === 404 || first?.message?.includes("Not Found")) {
          return null;
        }
        throw new Error(first.message);
      }
      return data;
    } catch (err) {
      if (!silent) showToast(`AniList error: ${err.message || "Network"}`, true);
      return null;
    }
  },

  getViewer: (onAuthError) =>
    AniListAPI.call(`query { Viewer { id name avatar { medium } } }`, {}, { silent: true, onAuthError }),

  getMedia: (search) =>
    AniListAPI.call(
      `query($s:String){Media(search:$s,type:ANIME){id episodes title{romaji english}mediaListEntry{id status score progress startedAt{year month day}completedAt{year month day}}}}`,
      { s: search },
      { silent: true }
    ),

  getMediaById: (id) =>
    AniListAPI.call(
      `query($id:Int){Media(id:$id,type:ANIME){id episodes title{romaji english}mediaListEntry{id status score progress startedAt{year month day}completedAt{year month day}}}}`,
      { id: Number(id) },
      { silent: true }
    ),

  getUserCollection: (userId) =>
    AniListAPI.call(
      `query($u:Int){MediaListCollection(userId:$u,type:ANIME){lists{entries{id mediaId status score progress media{id episodes title{romaji english}}}}}}`,
      { u: userId },
      { silent: true }
    ),

  getUserWatching: (userId) =>
    AniListAPI.call(
      `query($u:Int){MediaListCollection(userId:$u,type:ANIME,status_in:[CURRENT,REPEATING],sort:UPDATED_TIME_DESC){lists{entries{id mediaId status score progress updatedAt media{id episodes status siteUrl bannerImage coverImage{extraLarge large medium}title{romaji english}nextAiringEpisode{episode airingAt timeUntilAiring}}}}}}`,
      { u: userId },
      { silent: true }
    ),

  saveEntry: (args) =>
    AniListAPI.call(
      `mutation($mediaId:Int,$status:MediaListStatus,$score:Float,$progress:Int,$startedAt:FuzzyDateInput,$completedAt:FuzzyDateInput){
        SaveMediaListEntry(mediaId:$mediaId,status:$status,score:$score,progress:$progress,startedAt:$startedAt,completedAt:$completedAt){
          id mediaId status score progress startedAt{year month day} completedAt{year month day}
        }
      }`,
      args
    ),

  deleteEntry: (id) =>
    AniListAPI.call(`mutation($id:Int){DeleteMediaListEntry(id:$id){deleted}}`, { id })
};
