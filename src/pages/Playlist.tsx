import { Layout } from "@/components/iptv/Layout";
import { ChannelCard } from "@/components/iptv/ChannelCard";
import { useChannels } from "@/hooks/useChannelStore";
import { parseM3U } from "@/lib/iptv";
import { Upload, Link as LinkIcon, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const Playlist = () => {
  const { myChannels, addMyChannels, clearMy, setCurrent, setPlaylist } = useChannels();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const importUrl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error("Failed to fetch playlist");
      const text = await res.text();
      const ch = parseM3U(text, "custom");
      if (!ch.length) throw new Error("No channels found");
      addMyChannels(ch);
      toast.success(`Added ${ch.length} channels`);
      setUrl("");
    } catch (e: any) {
      toast.error(e.message || "Failed to import");
    } finally {
      setLoading(false);
    }
  };

  const importFile = async (file: File) => {
    const text = await file.text();
    const ch = parseM3U(text, "custom");
    if (!ch.length) {
      toast.error("No valid channels found");
      return;
    }
    addMyChannels(ch);
    toast.success(`Added ${ch.length} channels`);
  };

  return (
    <Layout>
      <div className="px-4 pt-8 md:px-8">
        <h1 className="text-3xl font-extrabold md:text-4xl">My Playlist</h1>
        <p className="mt-2 text-sm text-muted-foreground">Import any M3U playlist from URL or file.</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <LinkIcon className="h-4 w-4 text-primary" /> Add M3U URL
            </label>
            <div className="mt-3 flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/playlist.m3u"
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <button
                disabled={loading}
                onClick={importUrl}
                className="tv-focus rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {loading ? "Loading…" : "Import"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Upload className="h-4 w-4 text-primary" /> Upload M3U file
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".m3u,.m3u8,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importFile(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="tv-focus mt-3 w-full rounded-xl border border-dashed border-border bg-background px-4 py-6 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary"
            >
              Click to browse a .m3u file
            </button>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            My Channels <span className="ml-2 text-sm font-medium text-muted-foreground">{myChannels.length}</span>
          </h2>
          {myChannels.length > 0 && (
            <button
              onClick={clearMy}
              className="tv-focus flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Clear
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
          {myChannels.map((c) => (
            <ChannelCard
              key={c.id}
              channel={c}
              layout="grid"
              onSelect={() => {
                setPlaylist(myChannels);
                setCurrent(c);
              }}
            />
          ))}
          {myChannels.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
              No channels yet. Import a playlist above.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Playlist;
