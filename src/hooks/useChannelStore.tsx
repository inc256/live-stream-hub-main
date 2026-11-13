import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  BROWSABLE_CATEGORIES,
  CATEGORY_SOURCES,
  CategoryId,
  Channel,
  fetchClosedChannelIds,
  fetchPlaylist,
  isClosedChannel,
  isPermanentlyBroken,
  loadMyChannels,
  removeDuplicateChannels,
  saveMyChannels,
  SUPPLEMENTAL_SOURCE,
} from "@/lib/iptv";

type CategoryState = {
  channels: Channel[];
  loading: boolean;
  error?: string;
};

type Ctx = {
  byCategory: Record<CategoryId, CategoryState>;
  myChannels: Channel[];
  addMyChannels: (channels: Channel[]) => void;
  clearMy: () => void;
  allChannels: Channel[];
  current: Channel | null;
  setCurrent: (c: Channel | null) => void;
  playlist: Channel[]; // ordered list current channel belongs to
  setPlaylist: (list: Channel[]) => void;
  next: () => void;
  prev: () => void;
};

const ChannelCtx = createContext<Ctx | null>(null);

function createInitialCategories(): Record<CategoryId, CategoryState> {
  const states = {} as Record<CategoryId, CategoryState>;
  const categoryIds: CategoryId[] = [
    ...BROWSABLE_CATEGORIES.map(({ id }) => id),
    "lifestyle",
    "custom",
  ];
  for (const id of new Set(categoryIds)) {
    states[id] = { channels: [], loading: id !== "custom" };
  }
  return states;
}

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [byCategory, setByCategory] = useState<Record<CategoryId, CategoryState>>(createInitialCategories);
  const [myChannels, setMyChannels] = useState<Channel[]>(() => loadMyChannels());
  const [closedChannelIds, setClosedChannelIds] = useState<ReadonlySet<string>>(() => new Set());
  const [current, setCurrent] = useState<Channel | null>(null);
  const [playlist, setPlaylist] = useState<Channel[]>([]);

  useEffect(() => {
    let cancelled = false;
    const closedChannelIdsPromise = fetchClosedChannelIds().then((ids) => {
      if (!cancelled) setClosedChannelIds(ids);
      return ids;
    });

    const loadChannels = async () => {
      const sourceChannels = await Promise.all(CATEGORY_SOURCES.map(async (category) => {
        try {
          const [channels, closedIds] = await Promise.all([
            fetchPlaylist(category.url, category.id),
            closedChannelIdsPromise,
          ]);
          if (!cancelled) {
            setByCategory((previous) => ({
              ...previous,
              [category.id]: {
                channels: channels.filter((channel) =>
                  !isPermanentlyBroken(channel.id) && !isClosedChannel(channel, closedIds),
                ),
                loading: false,
              },
            }));
          }
          return channels;
        } catch (error: unknown) {
          if (!cancelled) {
            setByCategory((previous) => ({
              ...previous,
              [category.id]: {
                channels: [],
                loading: false,
                error: error instanceof Error ? error.message : `Failed to load ${category.label}`,
              },
            }));
          }
          return [];
        }
      }));

      if (cancelled) return;

      try {
        const supplementalChannels = await fetchPlaylist(
          SUPPLEMENTAL_SOURCE.url,
          SUPPLEMENTAL_SOURCE.id,
          true,
        );
        const closedIds = await closedChannelIdsPromise;
        if (cancelled) return;

        const uniqueChannels = removeDuplicateChannels(supplementalChannels, sourceChannels.flat())
          .filter((channel) =>
            !isPermanentlyBroken(channel.id) && !isClosedChannel(channel, closedIds),
          );
        const channelsByCategory = new Map<CategoryId, Channel[]>();
        for (const channel of uniqueChannels) {
          const channels = channelsByCategory.get(channel.category) ?? [];
          channels.push(channel);
          channelsByCategory.set(channel.category, channels);
        }

        setByCategory((previous) => {
          const next = { ...previous };
          for (const [categoryId, channels] of channelsByCategory) {
            const categoryState = next[categoryId] ?? { channels: [], loading: false };
            next[categoryId] = {
              ...categoryState,
              channels: [...categoryState.channels, ...channels],
            };
          }
          next[SUPPLEMENTAL_SOURCE.id] = {
            channels: channelsByCategory.get(SUPPLEMENTAL_SOURCE.id) ?? [],
            loading: false,
          };
          return next;
        });
      } catch (e: unknown) {
        if (cancelled) return;
        setByCategory((previous) => ({
          ...previous,
          [SUPPLEMENTAL_SOURCE.id]: {
            channels: [],
            loading: false,
            error: e instanceof Error ? e.message : "Failed to load additional channels",
          },
        }));
      }
    };

    void loadChannels();
    return () => {
      cancelled = true;
    };
  }, []);

  const addMyChannels = useCallback((channels: Channel[]) => {
    setMyChannels((prev) => {
      const seen = new Set(prev.map((c) => c.url));
      const merged = [...prev, ...channels.filter((c) => !seen.has(c.url))];
      saveMyChannels(merged);
      return merged;
    });
  }, []);

  const clearMy = useCallback(() => {
    setMyChannels([]);
    saveMyChannels([]);
  }, []);

  const allChannels = useMemo(() => {
    const all: Channel[] = [];
    Object.values(byCategory).forEach((s) => all.push(...s.channels));
    all.push(...myChannels);
    return all.filter((channel) => !isClosedChannel(channel, closedChannelIds));
  }, [byCategory, myChannels, closedChannelIds]);

  const next = useCallback(() => {
    if (!current || !playlist.length) return;
    const i = playlist.findIndex((c) => c.id === current.id);
    const n = playlist[(i + 1) % playlist.length];
    setCurrent(n);
  }, [current, playlist]);

  const prev = useCallback(() => {
    if (!current || !playlist.length) return;
    const i = playlist.findIndex((c) => c.id === current.id);
    const n = playlist[(i - 1 + playlist.length) % playlist.length];
    setCurrent(n);
  }, [current, playlist]);

  return (
    <ChannelCtx.Provider
      value={{ byCategory, myChannels, addMyChannels, clearMy, allChannels, current, setCurrent, playlist, setPlaylist, next, prev }}
    >
      {children}
    </ChannelCtx.Provider>
  );
}

export function useChannels() {
  const ctx = useContext(ChannelCtx);
  if (!ctx) throw new Error("useChannels must be used inside ChannelProvider");
  return ctx;
}
