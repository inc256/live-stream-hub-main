// IPTV M3U Parser Engine for SupaMax Live
export type Channel = {
  id: string;
  name: string;
  logo?: string;
  group?: string;
  tvgId?: string;
  countries?: string[];
  url: string;
  category: CategoryId;
};

export type CategoryId =
  | "entertainment"
  | "family"
  | "lifestyle"
  | "sports"
  | "movies"
  | "news"
  | "kids"
  | "international"
  | "custom";

export function getChannelCountries(channel: Channel): string[] {
  if (channel.countries?.length) return channel.countries;
  return [...channel.id.matchAll(/\.([a-z]{2})(?=@|$)/gi)].map((match) => match[1].toUpperCase());
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function getCountryName(country: string): string {
  if (!/^[a-z]{2}$/i.test(country)) return country;
  return regionNames.of(country.toUpperCase()) ?? country.toUpperCase();
}

export const CATEGORY_SOURCES: { id: CategoryId; label: string; url: string }[] = [
  { id: "entertainment", label: "Entertainment", url: "https://iptv-org.github.io/iptv/categories/entertainment.m3u" },
  { id: "sports", label: "Sports", url: "https://iptv-org.github.io/iptv/categories/sports.m3u" },
  { id: "movies", label: "Movies", url: "https://iptv-org.github.io/iptv/categories/movies.m3u" },
  { id: "news", label: "News", url: "https://iptv-org.github.io/iptv/categories/news.m3u" },
  { id: "family", label: "Family", url: "https://iptv-org.github.io/iptv/categories/family.m3u" },
  { id: "kids", label: "Kids", url: "https://iptv-org.github.io/iptv/categories/kids.m3u" },
];

export const SUPPLEMENTAL_SOURCE = {
  id: "international" as const,
  label: "International",
  url: "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8",
};

export const BROWSABLE_CATEGORIES: { id: CategoryId; label: string }[] = [
  ...CATEGORY_SOURCES.map(({ id, label }) => ({ id, label })),
  { id: SUPPLEMENTAL_SOURCE.id, label: SUPPLEMENTAL_SOURCE.label },
];

export function getChannelDeduplicationKeys(channel: Channel): string[] {
  const keys: string[] = [];
  const tvgId = channel.tvgId?.trim().toLowerCase().replace(/@.*$/, "");
  if (tvgId) keys.push(`id:${tvgId}`);

  try {
    const url = new URL(channel.url);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    keys.push(`url:${url.toString().toLowerCase()}`);
  } catch {
    keys.push(`url:${channel.url.trim().toLowerCase()}`);
  }
  return keys;
}

export function removeDuplicateChannels(channels: Channel[], existing: Channel[]): Channel[] {
  const seen = new Set(existing.flatMap(getChannelDeduplicationKeys));
  return channels.filter((channel) => {
    const keys = getChannelDeduplicationKeys(channel);
    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

const CHANNEL_METADATA_URL = "https://iptv-org.github.io/api/channels.json";
const CLOSED_CHANNEL_CACHE_KEY = "supamax:iptv:closed-channel-ids:v1";
const CLOSED_CHANNEL_CACHE_TTL = 1000 * 60 * 60 * 6;

function normalizeChannelId(id: string): string {
  return id.trim().toLowerCase().replace(/@.*$/, "");
}

export function isClosedChannel(channel: Channel, closedChannelIds: ReadonlySet<string>): boolean {
  return Boolean(channel.tvgId && closedChannelIds.has(normalizeChannelId(channel.tvgId)));
}

export async function fetchClosedChannelIds(): Promise<Set<string>> {
  try {
    const raw = localStorage.getItem(CLOSED_CHANNEL_CACHE_KEY);
    if (raw) {
      const cached: unknown = JSON.parse(raw);
      if (
        typeof cached === "object" &&
        cached !== null &&
        "timestamp" in cached &&
        "ids" in cached &&
        typeof cached.timestamp === "number" &&
        Date.now() - cached.timestamp < CLOSED_CHANNEL_CACHE_TTL &&
        Array.isArray(cached.ids) &&
        cached.ids.every((id: unknown) => typeof id === "string")
      ) {
        return new Set(cached.ids.map(normalizeChannelId));
      }
    }
  } catch (error) {
    console.warn("Unable to read cached IPTV channel status metadata", error);
  }

  const response = await fetch(CHANNEL_METADATA_URL, { mode: "cors" });
  if (!response.ok) throw new Error(`Failed to load IPTV channel status metadata: HTTP ${response.status}`);

  const metadata: unknown = await response.json();
  if (!Array.isArray(metadata)) throw new Error("IPTV channel status metadata has an invalid format");

  const closedIds = metadata
    .filter((channel): channel is { id: string; closed: string } =>
      typeof channel === "object" &&
      channel !== null &&
      "id" in channel &&
      typeof channel.id === "string" &&
      "closed" in channel &&
      typeof channel.closed === "string" &&
      channel.closed.length > 0
    )
    .map((channel) => normalizeChannelId(channel.id));

  try {
    localStorage.setItem(
      CLOSED_CHANNEL_CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), ids: closedIds }),
    );
  } catch (error) {
    console.warn("Unable to cache IPTV channel status metadata", error);
  }

  return new Set(closedIds);
}

const CACHE_PREFIX = "supamax:iptv:v3:";
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6h

const KEYWORD_MAP: { kw: RegExp; cat: CategoryId }[] = [
  { kw: /kid|cartoon|child|disney|nick|baby|toon|animation/i, cat: "kids" },
  { kw: /entertainment|variety|reality|comedy|music|show/i, cat: "entertainment" },
  { kw: /sport|espn|football|soccer|nba|nfl|cricket|tennis|rugby/i, cat: "sports" },
  { kw: /news|cnn|bbc|aljazeera|fox.?news|reuters|bloomberg/i, cat: "news" },
  { kw: /movie|cinema|film|hollywood|bollywood/i, cat: "movies" },
  { kw: /lifestyle|fashion|food|travel|cook|home/i, cat: "lifestyle" },
];

function detectCategory(name: string, group?: string, fallback: CategoryId = "lifestyle"): CategoryId {
  const hay = `${name} ${group ?? ""}`;
  for (const { kw, cat } of KEYWORD_MAP) if (kw.test(hay)) return cat;
  return fallback;
}

function attr(line: string, key: string): string | undefined {
  const m = line.match(new RegExp(`${key}="([^"]*)"`, "i"));
  return m?.[1];
}

export function parseM3U(text: string, fallbackCategory: CategoryId = "custom"): Channel[] {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const channels: Channel[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("#EXTINF")) continue;

    // Find next non-comment URL line
    let urlLine: string | undefined;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const cand = lines[j];
      if (cand.startsWith("#")) continue;
      urlLine = cand;
      i = j;
      break;
    }
    if (!urlLine) continue;
    if (!/^https?:\/\//i.test(urlLine)) continue;
    if (seen.has(urlLine)) continue;
    seen.add(urlLine);

    const comma = line.indexOf(",");
    const name = (comma >= 0 ? line.slice(comma + 1) : "Unknown").trim();
    if (!name || name.length > 120) continue;

    const logo = attr(line, "tvg-logo");
    const group = attr(line, "group-title");
    const tvgId = attr(line, "tvg-id");
    const countries = attr(line, "tvg-country")
      ?.split(/[;,]/)
      .map((country) => {
        const value = country.trim();
        return /^[a-z]{2}$/i.test(value) ? value.toUpperCase() : value;
      })
      .filter(Boolean);
    const countryCodes = countries?.length
      ? countries
      : [...(tvgId ?? "").matchAll(/\.([a-z]{2})(?=@|$)/gi)].map((match) => match[1].toUpperCase());

    channels.push({
      id: `${tvgId || name}-${urlLine.slice(-24)}`,
      name,
      logo,
      group,
      tvgId,
      countries: countryCodes.length ? countryCodes : undefined,
      url: urlLine,
      category: detectCategory(name, group, fallbackCategory),
    });
  }
  return channels;
}

export async function fetchPlaylist(
  url: string,
  category: CategoryId,
  classifyByContent = false,
): Promise<Channel[]> {
  const cacheKey = `${CACHE_PREFIX}${category}:${url}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL && Array.isArray(data)) return data as Channel[];
    }
  } catch (error) {
    console.warn("Unable to read the cached IPTV playlist", error);
  }

  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const text = await res.text();
  const channels = parseM3U(text, category).map((channel) => ({
    ...channel,
    category: classifyByContent ? channel.category : category,
  }));

  try {
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: channels }));
  } catch (error) {
    console.warn("Unable to cache the IPTV playlist", error);
  }

  return channels;
}

// Custom user playlist storage
const MY_KEY = "supamax:my-playlist";
export function loadMyChannels(): Channel[] {
  try {
    const raw = localStorage.getItem(MY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
export function saveMyChannels(channels: Channel[]) {
  localStorage.setItem(MY_KEY, JSON.stringify(channels));
}

// Broken stream tracking
const BROKEN_KEY = "supamax:broken";
export function getBroken(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(BROKEN_KEY) || "{}");
  } catch {
    return {};
  }
}
export function markBroken(id: string) {
  const b = getBroken();
  b[id] = (b[id] || 0) + 1;
  localStorage.setItem(BROKEN_KEY, JSON.stringify(b));
}
export function isPermanentlyBroken(id: string): boolean {
  return (getBroken()[id] || 0) >= 3;
}
