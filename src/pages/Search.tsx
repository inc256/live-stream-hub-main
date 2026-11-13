import { Layout } from "@/components/iptv/Layout";
import { ChannelCard } from "@/components/iptv/ChannelCard";
import { useChannels } from "@/hooks/useChannelStore";
import { BROWSABLE_CATEGORIES, CategoryId, getChannelCountries, getCountryName } from "@/lib/iptv";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const SEARCH_BATCH_SIZE = 50;

const CATEGORY_LABELS: Record<Exclude<CategoryId, "custom">, string> = {
  entertainment: "Entertainment",
  family: "Family",
  lifestyle: "Lifestyle",
  sports: "Sports",
  movies: "Movies",
  news: "News",
  kids: "Kids",
  international: "International",
};

const SearchPage = () => {
  const { allChannels, setCurrent, setPlaylist } = useChannels();
  const [q, setQ] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [visibleCount, setVisibleCount] = useState(SEARCH_BATCH_SIZE);

  useEffect(() => {
    setVisibleCount(SEARCH_BATCH_SIZE);
  }, [q, selectedCountry, selectedCategory]);

  const countries = useMemo(
    () => [...new Set(allChannels.flatMap(getChannelCountries))]
      .map((code) => ({ code, name: getCountryName(code) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [allChannels],
  );
  const categories = useMemo(
    () => [...new Set([...BROWSABLE_CATEGORIES.map((category) => category.id), "lifestyle"] as CategoryId[])],
    [],
  );

  const results = useMemo(() => {
    if (!q.trim() && !selectedCountry && !selectedCategory) return [];
    const term = q.trim().toLowerCase();
    return allChannels
      .filter((channel) => !term || channel.name.toLowerCase().includes(term))
      .filter((channel) => !selectedCountry || getChannelCountries(channel).includes(selectedCountry))
      .filter((channel) => !selectedCategory || channel.category === selectedCategory)
      .slice(0, 200);
  }, [q, selectedCountry, selectedCategory, allChannels]);

  const hasSearch = Boolean(q.trim() || selectedCountry || selectedCategory);

  return (
    <Layout>
      <div className="px-3 py-5 sm:px-4 sm:pt-8 md:px-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl md:text-4xl">Search</h1>
        <div className="mt-4 flex min-w-0 items-center gap-2.5 rounded-2xl border border-border bg-secondary px-3 py-3 sm:mt-6 sm:gap-3 sm:px-4">
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
          <input
            type="search"
            inputMode="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search channels…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground sm:text-base"
          />
        </div>

        <div className="mt-4">
          <span className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground sm:text-sm">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </span>
          <div className="grid grid-cols-2 gap-2 sm:max-w-xl sm:gap-3">
            <label className="min-w-0">
              <span className="sr-only">Country</span>
              <select
                id="search-country"
                value={selectedCountry}
                onChange={(event) => setSelectedCountry(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-border bg-secondary px-2.5 py-2.5 text-xs text-foreground outline-none focus:border-primary sm:px-3 sm:text-sm"
              >
                <option value="">All countries</option>
                {countries.map(({ code, name }) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </label>
            <label className="min-w-0">
              <span className="sr-only">Category</span>
              <select
                id="search-category"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-border bg-secondary px-2.5 py-2.5 text-xs text-foreground outline-none focus:border-primary sm:px-3 sm:text-sm"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {hasSearch && (
          <p className="mt-4 text-sm text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
          {results.slice(0, visibleCount).map((c) => (
            <ChannelCard
              key={c.id}
              channel={c}
              size="md"
              layout="grid"
              onSelect={() => {
                setPlaylist(results);
                setCurrent(c);
              }}
            />
          ))}
          {hasSearch && results.length === 0 && (
            <p className="col-span-full rounded-2xl border border-border bg-secondary/40 px-4 py-10 text-center text-sm text-muted-foreground">
              No channels match these search filters.
            </p>
          )}
        </div>
        {visibleCount < results.length && (
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + SEARCH_BATCH_SIZE)}
            className="tv-focus mx-auto mt-6 block rounded-xl border border-border bg-secondary px-5 py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary"
          >
            Load {Math.min(SEARCH_BATCH_SIZE, results.length - visibleCount)} more
          </button>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
