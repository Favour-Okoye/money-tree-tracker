import { useEffect, useMemo, useRef, useState } from "react";
import { useAppearances, useCatalog } from "../lib/catalog";
import { useProfile, useStatuses, statusKey } from "../lib/queries";
import { useAuth } from "../lib/auth";
import { advanceWatermark, resolveWatermark } from "../lib/newBadge";
import { supabaseConfigured } from "../lib/supabase";
import { VideoCard } from "../components/VideoCard";
import { SetupBanner } from "../components/SetupBanner";
import { EmptyState } from "../components/EmptyState";
import type { LibraryItem } from "../lib/types";

type Filter = "all" | "new" | "unwatched" | "watched" | "shorts" | "guest";

const PAGE_SIZE = 60;

export function Library() {
  const { session, ready } = useAuth();
  const catalogQ = useCatalog();
  const appearQ = useAppearances();
  const statusesQ = useStatuses();
  const profileQ = useProfile();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const snapshotted = useRef(false);

  const items = useMemo<LibraryItem[]>(() => {
    const videos = (catalogQ.data?.videos ?? [])
      .filter((v) => !v.removed)
      .map((v) => ({ ...v, mediaType: "video" as const }));
    const appearances = (appearQ.data?.appearances ?? []).map(
      (a): LibraryItem => ({
        id: a.id,
        title: a.title,
        published_at: a.published_at,
        first_seen_at: a.first_seen_at ?? a.published_at ?? "",
        thumbnail: `https://i.ytimg.com/vi/${a.id}/mqdefault.jpg`,
        description_snippet: "",
        duration_s: a.duration_s ?? null,
        is_short: false,
        removed: false,
        source: a.source ?? "manual",
        mediaType: "appearance",
        hostShow: a.host_show,
      })
    );
    return [...videos, ...appearances];
  }, [catalogQ.data, appearQ.data]);

  // Snapshot which videos are NEW once per page load, then advance the watermark
  // so the next visit only highlights what arrived since now.
  const profileReady = !supabaseConfigured || !session || profileQ.isSuccess;
  useEffect(() => {
    if (snapshotted.current || !catalogQ.data || !ready || !profileReady) return;
    snapshotted.current = true;
    const watermark = resolveWatermark(profileQ.data?.last_seen_catalog_at ?? null);
    if (watermark) {
      setNewIds(
        new Set(
          catalogQ.data.videos
            .filter((v) => v.first_seen_at > watermark)
            .map((v) => v.id)
        )
      );
    }
    void advanceWatermark(session?.user.id);
  }, [catalogQ.data, ready, profileReady, profileQ.data, session]);

  const statuses = statusesQ.data ?? {};

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = items;
    if (query) list = list.filter((i) => i.title.toLowerCase().includes(query));
    list = list.filter((i) => {
      const st = statuses[statusKey(i.mediaType, i.id)];
      switch (filter) {
        case "new":
          return newIds.has(i.id);
        case "unwatched":
          return st?.status !== "watched";
        case "watched":
          return st?.status === "watched";
        case "shorts":
          return i.is_short === true;
        case "guest":
          return i.mediaType === "appearance";
        default:
          return true;
      }
    });
    const key = (i: LibraryItem) => i.published_at ?? "";
    return [...list].sort((a, b) =>
      sort === "newest" ? key(b).localeCompare(key(a)) : key(a).localeCompare(key(b))
    );
  }, [items, search, filter, sort, statuses, newIds]);

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisible((v) => v + PAGE_SIZE);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const watchedCount = useMemo(
    () => Object.values(statuses).filter((s) => s.status === "watched").length,
    [statuses]
  );

  if (catalogQ.isLoading) return <EmptyState emoji="🌱" title="Growing the library…" />;
  if (catalogQ.isError)
    return (
      <EmptyState
        emoji="🥀"
        title="Couldn't load the catalog"
        hint="Check your internet connection, then refresh."
      />
    );

  const filters: [Filter, string][] = [
    ["all", "All"],
    ["new", newIds.size ? `NEW ✨ ${newIds.size}` : "NEW"],
    ["unwatched", "Unwatched"],
    ["watched", "Watched"],
    ["shorts", "Shorts"],
    ["guest", "Guest 🎙"],
  ];

  return (
    <div>
      {!supabaseConfigured && <SetupBanner />}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-black text-green-900">Grace's Library</h1>
          <p className="text-xs text-stone-500">
            {session ? `${watchedCount} of ${items.length} watched 🌱` : `${items.length} videos`}
          </p>
        </div>
        <button
          onClick={() => setSort((s) => (s === "newest" ? "oldest" : "newest"))}
          className="rounded-full bg-white px-3 py-1 text-xs font-bold text-green-800 ring-1 ring-green-200"
        >
          {sort === "newest" ? "Newest ↓" : "Oldest ↑"}
        </button>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search ${items.length} videos…`}
        className="mb-3 w-full rounded-2xl border-none bg-white px-4 py-2.5 text-sm shadow-sm ring-1 ring-green-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-400"
      />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
              filter === value
                ? "bg-green-700 text-white"
                : "bg-white text-stone-500 ring-1 ring-green-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          emoji={filter === "new" ? "🎉" : "🔍"}
          title={filter === "new" ? "You're all caught up!" : "Nothing matches"}
          hint={filter === "new" ? "New uploads appear here as the pipeline finds them." : undefined}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.slice(0, visible).map((item) => (
            <VideoCard
              key={statusKey(item.mediaType, item.id)}
              item={item}
              status={statuses[statusKey(item.mediaType, item.id)]}
              isNew={newIds.has(item.id)}
            />
          ))}
        </div>
      )}
      <div ref={sentinel} className="h-8" />
    </div>
  );
}
