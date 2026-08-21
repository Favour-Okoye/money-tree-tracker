import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useHub, type HubResource } from "../lib/hub";
import { useAddNote, useNotes, useStatuses, useUpdateStatus, statusKey } from "../lib/queries";
import { useAuth } from "../lib/auth";
import { supabaseConfigured } from "../lib/supabase";
import { fmtDate } from "../lib/format";
import { EmptyState } from "../components/EmptyState";

function ResourceNotes({ resource }: { resource: HubResource }) {
  const notesQ = useNotes("hub_resource", resource.id);
  const addNote = useAddNote();
  const [body, setBody] = useState("");

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addNote.mutate(
      { sourceType: "hub_resource", sourceId: resource.id, body: body.trim(), takeaways: [] },
      { onSuccess: () => setBody("") }
    );
  };

  return (
    <div className="mt-2 rounded-2xl bg-green-50/60 p-3">
      <form onSubmit={save}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="What did this training teach me?"
          className="w-full resize-y rounded-xl bg-white p-2.5 text-sm ring-1 ring-green-100 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          type="submit"
          disabled={addNote.isPending || !body.trim()}
          className="mt-1.5 rounded-full bg-green-700 px-3 py-1 text-xs font-black text-white disabled:opacity-40"
        >
          {(notesQ.data?.length ?? 0) === 0 ? "Save note (+15 XP)" : "Save another note"}
        </button>
      </form>
      {(notesQ.data ?? []).map((note) => (
        <div key={note.id} className="mt-2 rounded-xl bg-white p-2.5 text-sm ring-1 ring-green-100">
          <p className="whitespace-pre-wrap text-stone-700">{note.body}</p>
          <p className="mt-1 text-[10px] text-stone-400">{fmtDate(note.created_at)}</p>
        </div>
      ))}
    </div>
  );
}

export function Hub() {
  const { session } = useAuth();
  const hubQ = useHub();
  const statusesQ = useStatuses();
  const update = useUpdateStatus();
  const [open, setOpen] = useState<string | null>(null);

  if (hubQ.isLoading) return <EmptyState emoji="🏛️" title="Opening the Embassy…" />;
  if (hubQ.isError || !hubQ.data) return <EmptyState emoji="🥀" title="Couldn't load the hub list" />;

  const canTrack = supabaseConfigured && !!session;
  const statuses = statusesQ.data ?? {};
  const resources = hubQ.data.resources;
  const doneCount = resources.filter(
    (r) => statuses[statusKey("hub_resource", r.id)]?.status === "watched"
  ).length;

  return (
    <div>
      <Link to="/more" className="mb-3 inline-block text-sm font-bold text-green-700">
        ← More
      </Link>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-green-900">🏛️ {hubQ.data.hub.name}</h1>
          <p className="text-xs text-stone-500">
            {canTrack ? `${doneCount} of ${resources.length} trainings done` : `${resources.length} trainings`}
            {" · "}list refreshed {fmtDate(hubQ.data.generated_at)}
          </p>
        </div>
        <a
          href={hubQ.data.hub.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-full bg-green-700 px-3 py-1.5 text-xs font-black text-white"
        >
          Open hub ↗
        </a>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {resources.map((r) => {
          const done = statuses[statusKey("hub_resource", r.id)]?.status === "watched";
          return (
            <div key={r.id} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100">
              <div className="flex items-start gap-3">
                {canTrack ? (
                  <button
                    onClick={() =>
                      update.mutate({
                        mediaType: "hub_resource",
                        mediaId: r.id,
                        status: done ? "queued" : "watched",
                      })
                    }
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black ${
                      done ? "bg-green-600 text-white" : "bg-stone-100 text-stone-400"
                    }`}
                    aria-label={done ? "Mark not done" : "Mark done"}
                  >
                    {done ? "✓" : "▶"}
                  </button>
                ) : (
                  <span className="mt-0.5 text-xl">🎓</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold ${done ? "text-stone-400 line-through" : "text-stone-800"}`}>
                    {r.title}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span
                      className={`rounded px-1.5 text-[10px] font-bold ${
                        r.price === "Free" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.price}
                    </span>
                    {r.level && (
                      <span className="rounded bg-sky-100 px-1.5 text-[10px] font-bold text-sky-700">{r.level}</span>
                    )}
                    {r.rating != null && (
                      <span className="rounded bg-stone-100 px-1.5 text-[10px] font-bold text-stone-500">
                        ★ {r.rating}
                        {r.rating_count ? ` (${r.rating_count})` : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-800"
                  >
                    Open ↗
                  </a>
                  {canTrack && (
                    <button
                      onClick={() => setOpen(open === r.id ? null : r.id)}
                      className="rounded-full bg-stone-50 px-2.5 py-1 text-xs font-bold text-stone-500"
                    >
                      {open === r.id ? "Hide" : "✍️ Notes"}
                    </button>
                  )}
                </div>
              </div>
              {open === r.id && canTrack && <ResourceNotes resource={r} />}
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-center text-xs text-stone-400">
        Finishing a training is +20 XP. This list is hand-refreshed; ask for a refresh when she posts new replays.
      </p>
    </div>
  );
}
