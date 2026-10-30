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
        body: JSON.stringify({ query, variables }),
        keepalive: true
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
      `query($s:String){Media(search:$s,type:ANIME){id idMal episodes format status title{romaji english userPreferred}mediaListEntry{id status score progress notes repeat startedAt{year month day}completedAt{year month day}}}}`,
      { s: search },
      { silent: true }
    ),

  searchMedia: (search) =>
    AniListAPI.call(
      `query($s:String){Page(page:1,perPage:5){media(search:$s,type:ANIME,sort:SEARCH_MATCH){id idMal episodes format status title{romaji english userPreferred}mediaListEntry{id status score progress notes repeat startedAt{year month day}completedAt{year month day}}}}}`,
      { s: search },
      { silent: true }
    ),

  getMediaById: (id) =>
    AniListAPI.call(
      `query($id:Int){Media(id:$id,type:ANIME){id idMal episodes format status title{romaji english userPreferred}mediaListEntry{id status score progress notes repeat startedAt{year month day}completedAt{year month day}}}}`,
      { id: Number(id) },
      { silent: true }
    ),

  getMediaByMalId: (idMal) =>
    AniListAPI.call(
      `query($id:Int){Media(idMal:$id,type:ANIME){id idMal episodes format status title{romaji english userPreferred}mediaListEntry{id status score progress notes repeat startedAt{year month day}completedAt{year month day}}}}`,
      { id: Number(idMal) },
      { silent: true }
    ),

  getUserCollection: (userId) =>
    AniListAPI.call(
      `query($u:Int){MediaListCollection(userId:$u,type:ANIME){lists{entries{id mediaId status score progress notes repeat startedAt{year month day}completedAt{year month day} media{id idMal episodes title{romaji english}}}}}}`,
      { u: userId },
      { silent: true }
    ),

  getUserWatching: (userId) =>
    AniListAPI.call(
      `query($u:Int){MediaListCollection(userId:$u,type:ANIME,status_in:[CURRENT,REPEATING],sort:UPDATED_TIME_DESC){lists{entries{id mediaId status score progress notes repeat startedAt{year month day}completedAt{year month day}updatedAt media{id idMal episodes status siteUrl bannerImage coverImage{extraLarge large medium}title{romaji english}nextAiringEpisode{episode airingAt timeUntilAiring}}}}}}`,
      { u: userId },
      { silent: true }
    ),

  getUserFollowing: (userId, page = 1) =>
    AniListAPI.call(
      `query($u:Int!,$p:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage} following(userId:$u){id name avatar{medium}}}}`,
      { u: Number(userId), p: Number(page) },
      { silent: true }
    ),

  getUserFollowers: (userId, page = 1) =>
    AniListAPI.call(
      `query($u:Int!,$p:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage} followers(userId:$u){id name avatar{medium}}}}`,
      { u: Number(userId), p: Number(page) },
      { silent: true }
    ),

  searchUsers: (search) =>
    AniListAPI.call(
      `query($s:String){Page(page:1,perPage:15){users(search:$s){id name avatar{medium}}}}`,
      { s: String(search) },
      { silent: true }
    ),

  getUserByName: (userName) =>
    AniListAPI.call(
      `query($n:String){User(name:$n){id name avatar{medium}}}`,
      { n: String(userName) },
      { silent: true }
    ),

  getFriendWatching: (userName) =>
    AniListAPI.call(
      `query($u:String){MediaListCollection(userName:$u,type:ANIME,status_in:[CURRENT,REPEATING,COMPLETED],sort:UPDATED_TIME_DESC){lists{entries{mediaId status progress notes media{id episodes title{romaji english}}}}}}`,
      { u: String(userName) },
      { silent: true }
    ),

  getFriendMediaEntry: (userName, mediaId) =>
    AniListAPI.call(
      `query($u:String,$m:Int){MediaList(userName:$u,mediaId:$m,type:ANIME){id status progress user{name avatar{medium}}}}`,
      { u: String(userName), m: Number(mediaId) },
      { silent: true }
    ),

  saveEntry: (args) =>
    AniListAPI.call(
      `mutation($mediaId:Int,$status:MediaListStatus,$score:Float,$progress:Int,$notes:String,$startedAt:FuzzyDateInput,$completedAt:FuzzyDateInput,$repeat:Int){
        SaveMediaListEntry(mediaId:$mediaId,status:$status,score:$score,progress:$progress,notes:$notes,startedAt:$startedAt,completedAt:$completedAt,repeat:$repeat){
          id mediaId status score progress notes repeat startedAt{year month day} completedAt{year month day}
        }
      }`,
      args
    ),

  deleteEntry: (id) =>
    AniListAPI.call(`mutation($id:Int){DeleteMediaListEntry(id:$id){deleted}}`, { id })
};
