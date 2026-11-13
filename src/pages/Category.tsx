import { ChannelCard } from "@/components/iptv/ChannelCard";
import { Layout } from "@/components/iptv/Layout";
import { useChannels } from "@/hooks/useChannelStore";
import { BROWSABLE_CATEGORIES } from "@/lib/iptv";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const CHANNELS_PER_BATCH = 50;

const Category = () => {
  const { categoryId } = useParams();
  const category = BROWSABLE_CATEGORIES.find((source) => source.id === categoryId);
  const { byCategory, setCurrent, setPlaylist } = useChannels();
  const [visibleCount, setVisibleCount] = useState(CHANNELS_PER_BATCH);

  useEffect(() => {
    setVisibleCount(CHANNELS_PER_BATCH);
  }, [categoryId]);

  if (!category) {
    return (
      <Layout>
        <div className="px-4 py-12 text-center md:px-8">
          <h1 className="text-2xl font-bold">Category not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">Back to Home</Link>
        </div>
      </Layout>
    );
  }

  const state = byCategory[category.id];
  const open = (channel: (typeof state.channels)[number]) => {
    setPlaylist(state.channels);
    setCurrent(channel);
  };

  return (
    <Layout>
      <div className="space-y-8 px-4 py-8 md:px-8">
        <header>
          <h1 className="text-3xl font-extrabold md:text-4xl">{category.label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {state.loading ? "Loading channels…" : `${state.channels.length} channels`}
          </p>
        </header>

        {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
        {state.loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="aspect-[4/3] w-full animate-pulse rounded-[18px] bg-secondary" />
            ))}
          </div>
        ) : state.channels.length ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
              {state.channels.slice(0, visibleCount).map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  layout="grid"
                  onSelect={() => open(channel)}
                />
              ))}
            </div>
            {visibleCount < state.channels.length && (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + CHANNELS_PER_BATCH)}
                className="tv-focus mx-auto block rounded-lg border border-border bg-secondary px-5 py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                aria-label={`Load ${Math.min(CHANNELS_PER_BATCH, state.channels.length - visibleCount)} more ${category.label} channels`}
              >
                Load {Math.min(CHANNELS_PER_BATCH, state.channels.length - visibleCount)} more
              </button>
            )}
          </>
        ) : !state.error ? (
          <p className="text-sm text-muted-foreground">No channels are available in this category.</p>
        ) : null}
      </div>
    </Layout>
  );
};

export default Category;
