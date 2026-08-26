import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabaseConfigured } from "../lib/supabase";
import { learnedIdSet, setPinnedTerm, todaysTerm, useLearnTerm, useLearnedTerms } from "../lib/termQueries";
import { TERM_BY_ID, WEALTH_TERMS } from "../lib/wealthTerms";
import { fmtDate } from "../lib/format";
import { EmptyState } from "../components/EmptyState";

export function WealthWord() {
  const { session } = useAuth();
  const learnedQ = useLearnedTerms();
  const learn = useLearnTerm();
  const [note, setNote] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [filter, setFilter] = useState("");
  const [, bump] = useState(0);
  const [params, setParams] = useSearchParams();

  // A locked farm feature can send you here with ?pin=<term>.
  const learnedIds = learnedIdSet(learnedQ.data);
  useEffect(() => {
    const pin = params.get("pin");
    if (!pin || !learnedQ.data) return;
    if (!learnedIds.has(pin)) setPinnedTerm(pin);
    setParams({}, { replace: true });
    bump((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, learnedQ.data]);

  if (!supabaseConfigured || !session) {
    return <EmptyState emoji="📖" title="Sign in to get your daily Wealth Word" />;
  }
  if (learnedQ.isLoading) return <EmptyState emoji="📖" title="Opening the dictionary…" />;

  const learned = learnedQ.data ?? [];
  const today = todaysTerm(learned);

  return (
    <div>
      <Link to="/" className="mb-3 inline-block text-sm font-bold text-green-700">
        ← Home
      </Link>
      <div className="flex items-end justify-between">
        <h1 className="text-xl font-black text-green-900">Wealth Word 📖</h1>
        <span className="text-xs font-bold text-stone-400">
          {learned.length} / {WEALTH_TERMS.length} learned
        </span>
      </div>

      {today ? (
        <div className="mt-3 rounded-3xl bg-white p-5 shadow-md ring-1 ring-green-100">
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-500">
            {today.doneToday ? "Today's word — learned ✓" : today.pinned ? "Today's word — picked by you 📌" : "Today's word"}
          </p>
          <h2 className="mt-1 text-2xl font-black text-green-900">{today.term.term}</h2>
          <p className="mt-1 text-sm font-bold text-stone-600">{today.term.short}</p>
          <p className="mt-3 text-sm text-stone-700">{today.term.explain}</p>
          <p className="mt-2 rounded-xl bg-green-50 p-2.5 text-sm text-green-900">
            <b>Example:</b> {today.term.example}
          </p>
          <p className="mt-2 text-sm italic text-stone-500">🌳 {today.term.why}</p>

          {today.doneToday ? (
            <p className="mt-4 text-center text-sm font-black text-green-700">
              Planted. Next word tomorrow 🌱 — this one may appear in Saturday's quiz.
            </p>
          ) : (
            <>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="In my own words… (optional, helps it stick)"
                className="mt-4 w-full resize-y rounded-xl bg-stone-50 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button
                onClick={() =>
                  learn.mutate({ termId: today.term.id, note: note.trim() }, { onSuccess: () => setNote("") })
                }
                disabled={learn.isPending}
                className="mt-2 w-full rounded-full bg-green-700 py-2.5 text-sm font-black text-white shadow disabled:opacity-40"
              >
                Got it ✓ (+5 XP)
              </button>
              <button
                onClick={() => setPicking((p) => !p)}
                className="mt-2 w-full text-center text-xs font-bold text-stone-400"
              >
                {picking ? "Hide the word list" : today.pinned ? "Pick another word instead" : "Need a specific word (e.g. for the farm)? Pick it →"}
              </button>
              {today.pinned && (
                <button
                  onClick={() => { setPinnedTerm(null); bump((n) => n + 1); }}
                  className="mt-1 w-full text-center text-[11px] font-bold text-stone-400"
                >
                  ↩ Back to the usual order
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <EmptyState emoji="🏆" title="You've learned every word in the bank" hint="More are coming." />
      )}

      {picking && (
        <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-amber-200">
          <h2 className="text-sm font-black text-green-900">Pick today's word 📌</h2>
          <p className="text-[11px] text-stone-400">Still one word a day — but which one is your call. Farm unlocks are marked.</p>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search words…"
            className="mt-2 w-full rounded-xl bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <div className="mt-2 flex max-h-72 flex-col gap-1.5 overflow-y-auto">
            {WEALTH_TERMS.filter((t) => !learnedIds.has(t.id) && (t.term + " " + t.short).toLowerCase().includes(filter.toLowerCase())).map((t) => {
              const unlock = ["leverage", "co-investment", "off-plan", "title-deed", "due-diligence"].includes(t.id);
              return (
                <div key={t.id} className="flex items-center gap-2 rounded-xl bg-stone-50 p-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-stone-800">{t.term}{unlock ? " 🔓" : ""}</p>
                    <p className="truncate text-[11px] text-stone-500">{t.short}</p>
                  </div>
                  <button
                    onClick={() => { setPinnedTerm(t.id); setPicking(false); bump((n) => n + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="shrink-0 rounded-full bg-green-700 px-2.5 py-1 text-[11px] font-black text-white"
                  >
                    Learn today
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {learned.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-black text-green-900">My glossary</h2>
          <div className="mt-2 flex flex-col gap-1.5">
            {learned.map((row) => {
              const term = TERM_BY_ID.get(row.term_id);
              if (!term) return null;
              const isOpen = open === term.id;
              return (
                <button
                  key={term.id}
                  onClick={() => setOpen(isOpen ? null : term.id)}
                  className="rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-green-100"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-black text-stone-800">{term.term}</span>
                    <span className="text-[10px] text-stone-400">{fmtDate(row.learned_on)}</span>
                  </div>
                  <p className="text-xs text-stone-500">{term.short}</p>
                  {isOpen && (
                    <div className="mt-2 text-xs text-stone-600">
                      <p>{term.explain}</p>
                      {row.note && <p className="mt-1 rounded-lg bg-amber-50 p-2 text-amber-900">✍️ {row.note}</p>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
