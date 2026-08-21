import { useMemo, useState, type FormEvent } from "react";
import {
  useAddMove,
  useDeleteMove,
  useMoves,
  useSeedMoves,
  useUpdateMove,
  type MoveCategory,
  type MoveRow,
  type MyStatus,
} from "../lib/movesQueries";
import { useAuth } from "../lib/auth";
import { supabaseConfigured } from "../lib/supabase";
import { daysUntil, fmtDate } from "../lib/format";
import { EmptyState } from "../components/EmptyState";
import { SetupBanner } from "../components/SetupBanner";

const CATEGORY_META: Record<MoveCategory, { emoji: string; label: string }> = {
  event: { emoji: "🎤", label: "Event" },
  program: { emoji: "🎓", label: "Program" },
  community: { emoji: "👥", label: "Community" },
  podcast: { emoji: "🎧", label: "Podcast" },
  book: { emoji: "📕", label: "Book" },
  appearance: { emoji: "🎙", label: "Guest" },
  other: { emoji: "🔗", label: "Other" },
};

const MY_STATUSES: { value: MyStatus; label: string }[] = [
  { value: "tracking", label: "👀 Tracking" },
  { value: "interested", label: "💭 Interested" },
  { value: "registered", label: "🎟️ Registered" },
  { value: "attended", label: "🏆 Attended" },
  { value: "passed", label: "🙅 Passed" },
];

function Countdown({ startsOn }: { startsOn: string }) {
  const days = daysUntil(startsOn);
  if (days > 1)
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700">
        ⏳ in {days} days
      </span>
    );
  if (days === 1)
    return (
      <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-black text-green-900">
        🔥 TOMORROW
      </span>
    );
  if (days === 0)
    return (
      <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-black text-white">
        🔥 TODAY
      </span>
    );
  return (
    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-400">
      {-days} days ago
    </span>
  );
}

function MoveCard({ move }: { move: MoveRow }) {
  const update = useUpdateMove();
  const del = useDeleteMove();
  const meta = CATEGORY_META[move.category];

  return (
    <article
      className={`rounded-3xl bg-white p-4 shadow-sm ring-1 transition ${
        move.pinned ? "ring-2 ring-amber-300" : "ring-green-100"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{meta.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-stone-800">{move.title}</h3>
            {move.starts_on && <Countdown startsOn={move.starts_on} />}
          </div>
          <p className="mt-0.5 text-xs text-stone-400">
            {meta.label}
            {move.starts_on && ` · ${fmtDate(move.starts_on)}`}
            {move.location && ` · 📍 ${move.location}`}
          </p>
          {move.price && <p className="mt-0.5 text-xs font-bold text-green-800">💰 {move.price}</p>}
          {move.url && (
            <a
              href={move.url}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-block text-xs font-bold text-green-700"
            >
              Open ↗
            </a>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => update.mutate({ id: move.id, patch: { pinned: !move.pinned } })}
            aria-label="Pin to dashboard"
            className={`text-lg transition ${move.pinned ? "" : "opacity-30 grayscale"}`}
          >
            📌
          </button>
          <button
            onClick={() => del.mutate(move.id)}
            className="text-sm text-stone-300 transition hover:text-rose-500"
            aria-label="Delete move"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {MY_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => update.mutate({ id: move.id, patch: { my_status: s.value } })}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              move.my_status === s.value
                ? "bg-green-700 text-white shadow"
                : "bg-stone-50 text-stone-400"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </article>
  );
}

export function Moves() {
  const { session } = useAuth();
  const movesQ = useMoves();
  const seed = useSeedMoves();
  const addMove = useAddMove();

  const [filter, setFilter] = useState<MoveCategory | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MoveCategory>("event");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [startsOn, setStartsOn] = useState("");

  const moves = useMemo(() => {
    const list = (movesQ.data ?? []).filter((m) => filter === "all" || m.category === filter);
    // pinned first, then dated soonest-first, then undated
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (a.starts_on && b.starts_on) return a.starts_on.localeCompare(b.starts_on);
      if (a.starts_on) return -1;
      if (b.starts_on) return 1;
      return a.title.localeCompare(b.title);
    });
  }, [movesQ.data, filter]);

  if (!supabaseConfigured || !session) {
    return (
      <div>
        {!supabaseConfigured && <SetupBanner />}
        <EmptyState
          emoji="🚀"
          title="Sign in to track her moves"
          hint="Events, programs, communities — with countdowns so you never miss a launch."
        />
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addMove.mutate(
      { title: title.trim(), category, url: url.trim(), location: location.trim(), price: price.trim(), startsOn },
      {
        onSuccess: () => {
          setTitle("");
          setUrl("");
          setLocation("");
          setPrice("");
          setStartsOn("");
          setShowForm(false);
        },
      }
    );
  };

  const categories: (MoveCategory | "all")[] = ["all", "event", "program", "community", "podcast", "other"];

  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-black text-green-900">Her Moves 🚀</h1>
          <p className="text-xs text-stone-500">What Grace is launching — and where you stand.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-green-700 px-3 py-1.5 text-xs font-black text-white"
        >
          {showForm ? "Close" : "＋ Add"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-4 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-green-100">
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is she launching?"
              className="min-w-0 flex-1 rounded-xl bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MoveCategory)}
              className="rounded-xl bg-stone-50 px-2 py-2 text-xs font-bold text-stone-600"
            >
              {(Object.keys(CATEGORY_META) as MoveCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="date"
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
              className="rounded-xl bg-stone-50 px-2 py-2 text-xs"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="min-w-0 flex-1 rounded-xl bg-stone-50 px-3 py-2 text-sm"
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price"
              className="w-24 rounded-xl bg-stone-50 px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Link (optional)"
              className="min-w-0 flex-1 rounded-xl bg-stone-50 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={addMove.isPending || !title.trim()}
              className="rounded-full bg-green-700 px-4 py-2 text-xs font-black text-white disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
              filter === c ? "bg-green-700 text-white" : "bg-white text-stone-500 ring-1 ring-green-100"
            }`}
          >
            {c === "all" ? "All" : `${CATEGORY_META[c].emoji} ${CATEGORY_META[c].label}`}
          </button>
        ))}
      </div>

      {movesQ.isLoading ? (
        <EmptyState emoji="🌱" title="Loading…" />
      ) : (movesQ.data ?? []).length === 0 ? (
        <div className="py-10 text-center">
          <div className="text-5xl">🚀</div>
          <p className="mt-3 font-bold text-stone-600">Nothing tracked yet</p>
          <button
            onClick={() => seed.mutate()}
            disabled={seed.isPending}
            className="mt-4 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-black text-green-900 shadow transition hover:bg-amber-300 disabled:opacity-40"
          >
            {seed.isPending ? "Planting…" : "🌱 Load Grace's known moves"}
          </button>
          <p className="mt-2 text-xs text-stone-400">
            Summit, coaching, communities, podcast — all 9, one tap.
          </p>
        </div>
      ) : moves.length === 0 ? (
        <EmptyState emoji="🔍" title="Nothing in this category" />
      ) : (
        <div className="flex flex-col gap-3">
          {moves.map((move) => (
            <MoveCard key={move.id} move={move} />
          ))}
        </div>
      )}
    </div>
  );
}
