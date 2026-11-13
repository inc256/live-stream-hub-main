import { useChannels } from "@/hooks/useChannelStore";
import { BROWSABLE_CATEGORIES, Channel } from "@/lib/iptv";
import { ChannelRail } from "@/components/iptv/ChannelRail";
import { Layout } from "@/components/iptv/Layout";
import { HeroCarousel } from "@/components/iptv/HeroCarousel";

const HOME_CATEGORY_ORDER = [
  "entertainment",
  "sports",
  "movies",
  "kids",
] as const;

const Home = () => {
  const { byCategory, myChannels, setCurrent, setPlaylist } = useChannels();
  const sportsChannels = byCategory.sports.channels.slice(0, 10);
  const homeCategories = [
    ...HOME_CATEGORY_ORDER.map((id) => BROWSABLE_CATEGORIES.find((category) => category.id === id)!),
    ...BROWSABLE_CATEGORIES.filter((category) => !HOME_CATEGORY_ORDER.includes(category.id as typeof HOME_CATEGORY_ORDER[number])),
  ];

  const open = (list: Channel[]) => (c: Channel) => {
    setPlaylist(list);
    setCurrent(c);
  };

  return (
    <Layout>
      <HeroCarousel channels={sportsChannels} onPlay={open(sportsChannels)} />

      <div className="space-y-10 py-10">
        {homeCategories.map((cat) => {
          const state = byCategory[cat.id];
          if (state.loading)
            return (
              <section key={cat.id} className="space-y-3">
                <h2 className="px-4 text-xl font-semibold md:px-8">{cat.label}</h2>
                <div className="no-scrollbar flex gap-3 overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain px-4 md:px-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 w-48 shrink-0 animate-pulse rounded-xl bg-secondary" />
                  ))}
                </div>
              </section>
            );

          return (
            <ChannelRail
              key={cat.id}
              title={cat.label}
              channels={state.channels}
              onSelect={open(state.channels)}
            />
          );
        })}

        {myChannels.length > 0 && (
          <ChannelRail
            title="My Channels"
            channels={myChannels}
            onSelect={open(myChannels)}
          />
        )}
      </div>
    </Layout>
  );
};

export default Home;
