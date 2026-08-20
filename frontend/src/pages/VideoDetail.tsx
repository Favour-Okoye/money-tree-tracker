import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppearances, useCatalog } from "../lib/catalog";
import { useAddNote, useNotes, useStatuses, useUpdateStatus, statusKey } from "../lib/queries";
import { useAuth } from "../lib/auth";
import { supabaseConfigured } from "../lib/supabase";
import { fmtDate, fmtDuration } from "../lib/format";
import { EmptyState } from "../components/EmptyState";
import type { MediaType, WatchStatus } from "../lib/types";

const STATUS_OPTIONS: { value: WatchStatus; label: string }[] = [
  { value: "queued", label: "🕒 Queued" },
  { value: "watching", label: "▶️ Watching" },
  { value: "watched", label: "✅ Watched" },
  { value: "skipped", label: "⏭️ Skipped" },
];

export function VideoDetail() {
  const params = useParams<{ mediaType: string; id: string }>();
  const mediaType = (params.mediaType ?? "video") as MediaType;
  const id = params.id ?? "";
  const { session } = useAuth();
  const catalogQ = useCatalog();
  const appearQ = useAppearances();
  const statusesQ = useStatuses();
  const updateStatus = useUpdateStatus();
  const notesQ = useNotes(mediaType, id);
  const addNote = useAddNote();

  const [body, setBody] = useState("");
  const [takeaways, setTakeaways] = useState("");

  const video =
    mediaType === "appearance"
      ? undefined
      : catalogQ.data?.videos.find((v) => v.id === id);
  const appearance =
    mediaType === "appearance"
      ? appearQ.data?.appearances.find((a) => a.id === id)
      : undefined;

  if (catalogQ.isLoading || (mediaType === "appearance" && appearQ.isLoading)) {
    return <EmptyState emoji="🌱" title="Loading…" />;
  }
  if (!video && !appearance) {
    return <EmptyState emoji="🤔" title="Video not found" hint="It may have been removed." />;
  }

  const title = video?.title ?? appearance?.title ?? "";
  const publishedAt = video?.published_at ?? appearance?.published_at ?? null;
  const status = statusesQ.data?.[statusKey(mediaType, id)];
  const canTrack = supabaseConfigured && !!session;

  const patch = (p: Parameters<typeof updateStatus.mutate>[0]) => {
    if (!canTrack) return;
    updateStatus.mutate(p);
  };

  const saveNote = (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addNote.mutate(
      {
        sourceType: mediaType,
        sourceId: id,
        body: body.trim(),
        takeaways: takeaways
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          setBody("");
          setTakeaways("");
        },
      }
    );
  };

  return (
    <div>
      <Link to="/library" className="mb-3 inline-block text-sm font-bold text-green-700">
        ← Library
      </Link>

      <div className="overflow-hidden rounded-2xl bg-black shadow-md">
        <iframe
          className="aspect-video w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="mt-3">
        {appearance && (
          <span className="mb-1 inline-block rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
            🎙 Guest on {appearance.host_show}
          </span>
        )}
        <h1 className="text-lg font-black leading-snug text-stone-800">{title}</h1>
        <p className="mt-1 text-xs text-stone-400">
          {fmtDate(publishedAt)}
          {video?.duration_s ? ` · ${fmtDuration(video.duration_s)}` : ""}
          {" · "}
          <a
            href={`https://www.youtube.com/watch?v=${id}`}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-green-700"
          >
            Watch on YouTube ↗
          </a>
        </p>
      </div>

      {!canTrack && (
        <div className="mt-4 rounded-2xl bg-green-50 p-3 text-sm text-green-900">
          {supabaseConfigured ? (
            <>
              <Link to="/login" className="font-black underline">
                Sign in
              </Link>{" "}
              to mark this watched and write what you learned. 🌱
            </>
          ) : (
            <>Connect Supabase (SETUP.md) to unlock tracking &amp; notes. 🌱</>
          )}
        </div>
      )}

      {canTrack && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => patch({ mediaType, mediaId: id, status: opt.value })}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  status?.status === opt.value
                    ? "bg-green-700 text-white shadow"
                    : "bg-white text-stone-500 ring-1 ring-green-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => patch({ mediaType, mediaId: id, liked: !status?.liked })}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition ${
                status?.liked
                  ? "bg-rose-100 text-rose-600 ring-rose-200"
                  : "bg-white text-stone-500 ring-green-100"
              }`}
            >
              {status?.liked ? "❤️ Liked on YouTube" : "🤍 I liked it"}
            </button>
            <button
              onClick={() => patch({ mediaType, mediaId: id, commented: !status?.commented })}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition ${
                status?.commented
                  ? "bg-sky-100 text-sky-700 ring-sky-200"
                  : "bg-white text-stone-500 ring-green-100"
              }`}
            >
              {status?.commented ? "💬 Commented" : "💬 I commented"}
            </button>
            <span className="ml-auto flex items-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() =>
                    patch({ mediaType, mediaId: id, rating: status?.rating === n ? null : n })
                  }
                  className={`px-0.5 text-lg ${
                    (status?.rating ?? 0) >= n ? "text-amber-400" : "text-stone-300"
                  }`}
                  aria-label={`${n} star`}
                >
                  ★
                </button>
              ))}
            </span>
          </div>

          <section className="mt-6">
            <h2 className="text-sm font-black text-green-900">✍️ What did I learn?</h2>
            <form onSubmit={saveNote} className="mt-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="My reflection on this video…"
                className="w-full resize-y rounded-xl bg-stone-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <textarea
                value={takeaways}
                onChange={(e) => setTakeaways(e.target.value)}
                rows={2}
                placeholder={"Key takeaways — one per line (optional)"}
                className="mt-2 w-full resize-y rounded-xl bg-stone-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button
                type="submit"
                disabled={addNote.isPending || !body.trim()}
                className="mt-2 rounded-full bg-green-700 px-4 py-1.5 text-sm font-black text-white shadow transition enabled:hover:bg-green-600 disabled:opacity-40"
              >
                {addNote.isPending ? "Saving…" : "Save reflection (+15 XP) 🌱"}
              </button>
            </form>

            {(notesQ.data ?? []).map((note) => (
              <article
                key={note.id}
                className="mt-3 rounded-2xl bg-white p-3 text-sm shadow-sm ring-1 ring-green-100"
              >
                <p className="whitespace-pre-wrap text-stone-700">{note.body}</p>
                {note.takeaways && note.takeaways.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {note.takeaways.map((t, i) => (
                      <li key={i} className="text-xs font-bold text-green-800">
                        🌱 {t}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-[10px] text-stone-400">{fmtDate(note.created_at)}</p>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
