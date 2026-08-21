import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabaseConfigured } from "../lib/supabase";
import { todaysTerm, useLearnTerm, useLearnedTerms } from "../lib/termQueries";
import { TERM_BY_ID, WEALTH_TERMS } from "../lib/wealthTerms";
import { fmtDate } from "../lib/format";
import { EmptyState } from "../components/EmptyState";

export function WealthWord() {
  const { session } = useAuth();
  const learnedQ = useLearnedTerms();
  const learn = useLearnTerm();
  const [note, setNote] = useState("");
  const [open, setOpen] = useState<string | null>(null);

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
            {today.doneToday ? "Today's word — learned ✓" : "Today's word"}
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
            </>
          )}
        </div>
      ) : (
        <EmptyState emoji="🏆" title="You've learned every word in the bank" hint="More are coming." />
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
