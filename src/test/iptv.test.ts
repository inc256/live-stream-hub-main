import { describe, expect, it } from "vitest";
import {
  getChannelCountries,
  getCountryName,
  isClosedChannel,
  parseM3U,
  removeDuplicateChannels,
} from "@/lib/iptv";

describe("playlist country metadata", () => {
  it("uses explicit tvg-country values", () => {
    const [channel] = parseM3U(
      '#EXTM3U\n#EXTINF:-1 tvg-id="Example.us@HD" tvg-country="us,gb" group-title="Sports",Example TV\nhttps://example.com/live.m3u8',
      "sports",
    );

    expect(channel.countries).toEqual(["US", "GB"]);
  });

  it("falls back to the country suffix in tvg-id", () => {
    const [channel] = parseM3U(
      '#EXTM3U\n#EXTINF:-1 tvg-id="Example.za@SD" group-title="Sports",Example TV\nhttps://example.com/live.m3u8',
      "sports",
    );

    expect(getChannelCountries(channel)).toEqual(["ZA"]);
  });

  it("displays country codes as real country names", () => {
    expect(getCountryName("US")).toBe("United States");
    expect(getCountryName("GB")).toBe("United Kingdom");
  });

  it("classifies kids channels from the supplemental playlist", () => {
    const [channel] = parseM3U(
      '#EXTM3U\n#EXTINF:-1 tvg-id="ExampleKids.us" tvg-country="US" group-title="United States",Example Kids TV\nhttps://example.com/kids.m3u8',
      "international",
    );

    expect(channel.category).toBe("kids");
  });

  it("removes supplemental duplicates by station ID and URL", () => {
    const existing = parseM3U(
      '#EXTM3U\n#EXTINF:-1 tvg-id="Example.us@SD" group-title="Sports",Example TV\nhttps://example.com/live.m3u8?source=first',
      "sports",
    );
    const supplemental = parseM3U(
      [
        "#EXTM3U",
        '#EXTINF:-1 tvg-id="Example.us@HD" group-title="United States",Example TV HD',
        "https://different.example/live.m3u8",
        '#EXTINF:-1 group-title="United States",Same URL alternate',
        "https://example.com/live.m3u8?source=second",
        '#EXTINF:-1 tvg-id="Unique.ca" group-title="Canada",Unique Channel',
        "https://unique.example/live.m3u8",
      ].join("\n"),
      "international",
    );

    expect(removeDuplicateChannels(supplemental, existing).map((channel) => channel.name))
      .toEqual(["Unique Channel"]);
  });

  it("recognizes channels marked closed in the channel database", () => {
    const [channel] = parseM3U(
      '#EXTM3U\n#EXTINF:-1 tvg-id="AnhuiTV.cn@SD",Anhui TV\nhttps://example.com/anhui.m3u8',
      "news",
    );

    expect(isClosedChannel(channel, new Set(["anhuitv.cn"]))).toBe(true);
    expect(isClosedChannel(channel, new Set(["other-channel.cn"]))).toBe(false);
  });
});
