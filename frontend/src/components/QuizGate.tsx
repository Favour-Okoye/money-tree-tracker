import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { useCatalog } from "../lib/catalog";
import { useProfile, useStatuses } from "../lib/queries";
import { buildQuiz, useQuizDue, useSubmitQuiz, useWeekNotes, gradeFor } from "../lib/quiz";
import { useAuth } from "../lib/auth";
import { fmtDate } from "../lib/format";

const GRADE_LINES: Record<string, string> = {
  A: "The Money Farmer would be proud. 🌟",
  B: "Solid growth — keep watering. 🌿",
  C: "Roots are forming. Review your notes! 📓",
  D: "The tree wobbled this week. 🍂",
  F: "Storms happen. Next week we grow again. 🌧️",
};

export function QuizGate() {
  const { session } = useAuth();
  const profileQ = useProfile();
  const { due, dueWeek } = useQuizDue(profileQ.data ? (profileQ.data as { created_at?: string }).created_at : undefined);
  const catalogQ = useCatalog();
  const statusesQ = useStatuses();
  const weekNotesQ = useWeekNotes(due ? dueWeek : null);
  const submit = useSubmitQuiz();

  const [stage, setStage] = useState<"intro" | "quiz" | "result" | "hidden">("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  const questions = useMemo(() => {
    if (!due || !catalogQ.data || !statusesQ.data || !weekNotesQ.data) return null;
    return buildQuiz(dueWeek, catalogQ.data, statusesQ.data, weekNotesQ.data);
  }, [due, dueWeek, catalogQ.data, statusesQ.data, weekNotesQ.data]);

  if (!session || stage === "hidden") return null;
  const showingResult = stage === "result" && result;
  if (!showingResult && (!due || !questions)) return null;

  const finish = (finalAnswers: number[]) => {
    const score = finalAnswers.filter((a, i) => a === questions![i].correct).length;
    const total = questions!.length;
    setResult({ score, total });
    submit.mutate(
      {
        weekKey: dueWeek,
        score,
        total,
        details: {
          questions: questions!.map((q, i) => ({ id: q.id, given: finalAnswers[i], correct: q.correct })),
        },
      },
      {
        onSuccess: () => {
          setStage("result");
          void confetti({
            particleCount: 120,
            spread: 75,
            origin: { y: 0.6 },
            colors: ["#fbbf24", "#22c55e", "#16a34a", "#fde68a"],
          });
        },
      }
    );
    setStage("result");
  };

  const pick = (index: number) => {
    if (picked !== null) return;
    setPicked(index);
    setAnswers((a) => [...a, index]);
  };

  const next = () => {
    setPicked(null);
    if (qIndex + 1 < questions!.length) setQIndex((i) => i + 1);
    else finish(answers);
  };

  const q = questions ? questions[qIndex] : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cream">
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center p-5">
        {stage === "intro" && questions && (
          <div className="rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-green-100">
            <div className="text-6xl">🧠</div>
            <h1 className="mt-3 text-xl font-black text-green-900">Saturday Quiz</h1>
            <p className="mt-1 text-xs font-bold text-stone-400">week of {fmtDate(dueWeek)}</p>
            <p className="mt-3 text-sm text-stone-600">
              {questions.length} questions: your own week
              {questions.some((x) => x.kind !== "knowledge") ? " (yes, from YOUR notes)" : ""} + wealth
              knowledge. Graded. No skipping — the app unlocks when you're done. 😌
            </p>
            <p className="mt-2 text-xs font-bold text-green-700">
              +30 XP for finishing · +5 XP per correct answer
            </p>
            <button
              onClick={() => setStage("quiz")}
              className="mt-5 w-full rounded-full bg-green-700 py-3 text-sm font-black text-white shadow transition hover:bg-green-600"
            >
              Let's grow 🌱
            </button>
          </div>
        )}

        {stage === "quiz" && q && (
          <div className="rounded-3xl bg-white p-5 shadow-lg ring-1 ring-green-100">
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-green-600 transition-all"
                style={{ width: `${((qIndex + (picked !== null ? 1 : 0)) / questions!.length) * 100}%` }}
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wide text-stone-400">
              {qIndex + 1} / {questions!.length}
              {q.kind !== "knowledge" ? " · from your week" : " · wealth knowledge"}
            </p>
            <h2 className="mt-1 text-base font-black leading-snug text-stone-800">{q.question}</h2>
            {q.context && (
              <blockquote className="mt-2 rounded-xl bg-green-50 p-3 text-sm italic text-green-900">
                {q.context}
              </blockquote>
            )}
            <div className="mt-4 flex flex-col gap-2">
              {q.options.map((opt, i) => {
                const isCorrect = picked !== null && i === q.correct;
                const isWrongPick = picked === i && i !== q.correct;
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={picked !== null}
                    className={`rounded-2xl p-3 text-left text-sm font-bold ring-1 transition ${
                      isCorrect
                        ? "bg-green-600 text-white ring-green-600"
                        : isWrongPick
                          ? "bg-rose-100 text-rose-700 ring-rose-300"
                          : picked !== null
                            ? "bg-stone-50 text-stone-400 ring-stone-100"
                            : "bg-white text-stone-700 ring-green-100 hover:ring-green-400"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <>
                <p className="mt-3 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-900">
                  {picked === q.correct ? "✅ " : "❌ "}
                  {q.explain}
                </p>
                <button
                  onClick={next}
                  className="mt-3 w-full rounded-full bg-green-700 py-2.5 text-sm font-black text-white"
                >
                  {qIndex + 1 < questions!.length ? "Next →" : "See my grade 🎓"}
                </button>
              </>
            )}
          </div>
        )}

        {showingResult && (
          <div className="rounded-3xl bg-white p-6 text-center shadow-lg ring-1 ring-green-100">
            <p className="text-xs font-black uppercase tracking-wide text-stone-400">Your grade</p>
            <div className="mt-1 text-7xl font-black text-green-700">
              {gradeFor(result!.score, result!.total)}
            </div>
            <p className="mt-2 text-sm font-bold text-stone-600">
              {result!.score} / {result!.total} correct
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {GRADE_LINES[gradeFor(result!.score, result!.total)] ?? ""}
            </p>
            <p className="mt-3 text-sm font-black text-amber-600">
              +{30 + result!.score * 5} XP planted 🌱
            </p>
            {submit.isError && (
              <button
                onClick={() =>
                  submit.mutate({
                    weekKey: dueWeek,
                    score: result!.score,
                    total: result!.total,
                    details: null,
                  })
                }
                className="mt-3 w-full rounded-full bg-rose-100 py-2 text-xs font-black text-rose-600"
              >
                Saving failed — tap to retry
              </button>
            )}
            <button
              onClick={() => setStage("hidden")}
              disabled={submit.isPending}
              className="mt-5 w-full rounded-full bg-green-700 py-3 text-sm font-black text-white shadow disabled:opacity-40"
            >
              Enter MoneyTree 🌳
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
