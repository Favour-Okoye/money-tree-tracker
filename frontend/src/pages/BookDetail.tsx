import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useBooks } from "../lib/books";
import {
  useAddChapter,
  useBookProgress,
  useChapters,
  useSetBookStatus,
  useSetChapterStatus,
  useAddActionItem,
  type BookStatus,
  type ChapterRow,
} from "../lib/bookQueries";
import { useAddNote, useNotes } from "../lib/queries";
import { useAuth } from "../lib/auth";
import { supabaseConfigured } from "../lib/supabase";
import { fmtDate, brusselsDay } from "../lib/format";
import { EmptyState } from "../components/EmptyState";

const STATUSES: { value: BookStatus; label: string }[] = [
  { value: "wishlist", label: "🌱 Wishlist" },
  { value: "owned", label: "📦 Owned" },
  { value: "reading", label: "📖 Reading" },
  { value: "finished", label: "🏆 Finished" },
];

function ChapterNotes({ chapter }: { chapter: ChapterRow }) {
  const notesQ = useNotes("book_chapter", chapter.id);
  const addNote = useAddNote();
  const addAction = useAddActionItem();
  const [body, setBody] = useState("");
  const [actionTitle, setActionTitle] = useState("");
  const [actionDue, setActionDue] = useState("");

  const saveNote = (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addNote.mutate(
      { sourceType: "book_chapter", sourceId: chapter.id, body: body.trim(), takeaways: [] },
      { onSuccess: () => setBody("") }
    );
  };

  const saveAction = (e: FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim()) return;
    addAction.mutate(
      {
        title: actionTitle.trim(),
        dueOn: actionDue || null,
        sourceType: "book_chapter",
        sourceId: chapter.id,
      },
      {
        onSuccess: () => {
          setActionTitle("");
          setActionDue("");
        },
      }
    );
  };

  return (
    <div className="mt-2 rounded-2xl bg-green-50/60 p-3">
      <form onSubmit={saveNote}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="What did this chapter teach me?"
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
      <form onSubmit={saveAction} className="mt-3 flex flex-wrap items-center gap-1.5">
        <input
          value={actionTitle}
          onChange={(e) => setActionTitle(e.target.value)}
          placeholder="Action: I will…"
          className="min-w-0 flex-1 rounded-xl bg-white px-2.5 py-1.5 text-sm ring-1 ring-green-100 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <input
          type="date"
          value={actionDue}
          onChange={(e) => setActionDue(e.target.value)}
          min={brusselsDay()}
          className="rounded-xl bg-white px-2 py-1.5 text-xs ring-1 ring-green-100"
        />
        <button
          type="submit"
          disabled={addAction.isPending || !actionTitle.trim()}
          className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-black text-green-900 disabled:opacity-40"
        >
          🎯 Add
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

export function BookDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { session } = useAuth();
  const booksQ = useBooks();
  const progressQ = useBookProgress();
  const chaptersQ = useChapters(slug);
  const setStatus = useSetBookStatus();
  const addChapter = useAddChapter(slug);
  const setChapterStatus = useSetChapterStatus(slug);

  const [newTitle, setNewTitle] = useState("");
  const [openChapter, setOpenChapter] = useState<string | null>(null);

  const book = booksQ.data?.find((b) => b.slug === slug);
  if (booksQ.isLoading) return <EmptyState emoji="📗" title="Loading…" />;
  if (!book) return <EmptyState emoji="🤔" title="Book not found" />;

  const progress = progressQ.data?.[slug];
  const chapters = chaptersQ.data ?? [];
  const doneCount = chapters.filter((c) => c.status === "done").length;
  const canTrack = supabaseConfigured && !!session;

  const createChapter = (e: FormEvent) => {
    e.preventDefault();
    const nextNo = chapters.length ? Math.max(...chapters.map((c) => c.chapter_no)) + 1 : 1;
    addChapter.mutate(
      { chapterNo: nextNo, title: newTitle.trim() },
      { onSuccess: () => setNewTitle("") }
    );
  };

  const cycleChapter = (chapter: ChapterRow) => {
    const next = chapter.status === "todo" ? "reading" : chapter.status === "reading" ? "done" : "todo";
    setChapterStatus.mutate({ chapter, status: next });
  };

  return (
    <div>
      <Link to="/books" className="mb-3 inline-block text-sm font-bold text-green-700">
        ← Books
      </Link>
      <div className="rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-green-100">
        <span className="text-6xl">{book.emoji}</span>
        <h1 className="mt-2 text-lg font-black text-stone-800">{book.title}</h1>
        {book.subtitle && <p className="text-sm text-stone-400">{book.subtitle}</p>}
        {chapters.length > 0 && (
          <p className="mt-1 text-xs font-bold text-green-700">
            {doneCount}/{chapters.length} chapters done
          </p>
        )}
        <a
          href={book.buy_url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-xs font-bold text-green-700"
        >
          Get the book ↗
        </a>
        {canTrack && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus.mutate({ bookSlug: slug, status: s.value })}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  (progress?.status ?? "wishlist") === s.value
                    ? "bg-green-700 text-white shadow"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!canTrack ? (
        <div className="mt-4 rounded-2xl bg-green-50 p-3 text-center text-sm text-green-900">
          {supabaseConfigured ? (
            <>
              <Link to="/login" className="font-black underline">
                Sign in
              </Link>{" "}
              to track chapters and write notes 🌱
            </>
          ) : (
            <>Connect Supabase (SETUP.md) to unlock tracking 🌱</>
          )}
        </div>
      ) : (
        <section className="mt-5">
          <h2 className="text-sm font-black text-green-900">📖 Chapters</h2>
          {chapters.length === 0 && (
            <p className="mt-1 text-xs text-stone-400">
              Add chapters as you read — each finished chapter is +20 XP.
            </p>
          )}
          <div className="mt-2 flex flex-col gap-2">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => cycleChapter(chapter)}
                    title="Tap to change status"
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black ${
                      chapter.status === "done"
                        ? "bg-green-600 text-white"
                        : chapter.status === "reading"
                          ? "bg-amber-300 text-green-900"
                          : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {chapter.status === "done" ? "✓" : chapter.chapter_no}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-bold ${
                        chapter.status === "done" ? "text-stone-400 line-through" : "text-stone-700"
                      }`}
                    >
                      {chapter.title || `Chapter ${chapter.chapter_no}`}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {chapter.status === "done"
                        ? `done ${fmtDate(chapter.completed_at)}`
                        : chapter.status}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpenChapter(openChapter === chapter.id ? null : chapter.id)}
                    className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-800"
                  >
                    {openChapter === chapter.id ? "Hide" : "✍️ Notes"}
                  </button>
                </div>
                {openChapter === chapter.id && <ChapterNotes chapter={chapter} />}
              </div>
            ))}
          </div>
          <form onSubmit={createChapter} className="mt-3 flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={`Chapter ${chapters.length ? Math.max(...chapters.map((c) => c.chapter_no)) + 1 : 1} title (optional)`}
              className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2 text-sm ring-1 ring-green-100 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              disabled={addChapter.isPending}
              className="rounded-full bg-green-700 px-4 py-2 text-xs font-black text-white disabled:opacity-40"
            >
              + Add chapter
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
