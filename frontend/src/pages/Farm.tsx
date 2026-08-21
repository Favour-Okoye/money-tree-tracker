import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { useAuth } from "../lib/auth";
import { supabaseConfigured } from "../lib/supabase";
import { useFarm } from "../lib/farmQueries";
import {
  CATALOG,
  COURSES,
  INSPECT_COST,
  MOOD_BY_GRADE,
  answerExam,
  assetIncome,
  buyAsset,
  canBuy,
  currentExamQuestion,
  enrolCourse,
  livingCost,
  seededRandom,
  decideDeal,
  dueSunday,
  finalizeMarket,
  inspectDeal,
  loanInstalment,
  marketIsDue,
  maxLoan,
  netWorth,
  passiveIncome,
  prepareMarket,
  resolveEvent,
  sellAsset,
  takeLoan,
  type FarmState,
  type MonthReport,
} from "../lib/farm";
import { fmtDate } from "../lib/format";
import { EmptyState } from "../components/EmptyState";

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-GB")}`;

function Stat({ label, value, tone = "text-green-800" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100">
      <p className={`text-lg font-black ${tone}`}>{value}</p>
      <p className="text-[10px] font-bold text-stone-400">{label}</p>
    </div>
  );
}

function MarketDay({
  state,
  learned,
  quizGrade,
  save,
}: {
  state: FarmState;
  learned: Set<string>;
  quizGrade: string | null;
  save: (s: FarmState) => void;
}) {
  const [report, setReport] = useState<MonthReport | null>(null);
  const p = state.pending;

  if (report) {
    return (
      <div className="rounded-3xl bg-white p-5 shadow-md ring-1 ring-amber-200">
        <p className="text-[10px] font-black uppercase tracking-wide text-amber-500">Month {report.month} closed</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <p className="text-stone-500">Rent &amp; income</p><p className="text-right font-black text-green-700">+{eur(report.rent)}</p>
          <p className="text-stone-500">Upkeep</p><p className="text-right font-bold text-stone-600">−{eur(report.upkeep)}</p>
          <p className="text-stone-500">Loan instalments</p><p className="text-right font-bold text-stone-600">−{eur(report.instalments)}</p>
          <p className="text-stone-500">Living costs</p><p className="text-right font-bold text-stone-600">−{eur(report.living)}</p>
          <p className="text-stone-500">Events</p><p className={`text-right font-bold ${report.eventNet < 0 ? "text-rose-600" : "text-stone-600"}`}>{report.eventNet >= 0 ? "+" : "−"}{eur(Math.abs(report.eventNet))}</p>
          <p className="font-black text-stone-700">Month result</p><p className={`text-right font-black ${report.net >= 0 ? "text-green-700" : "text-rose-600"}`}>{report.net >= 0 ? "+" : "−"}{eur(Math.abs(report.net))}</p>
        </div>
        {report.notes.map((n, i) => (
          <p key={i} className="mt-2 rounded-xl bg-amber-50 p-2 text-xs text-amber-900">{n}</p>
        ))}
        <p className="mt-3 text-center text-xs font-bold text-stone-400">Net worth now {eur(report.netWorth)}</p>
        <button onClick={() => setReport(null)} className="mt-3 w-full rounded-full bg-green-700 py-2.5 text-sm font-black text-white">
          Back to the farm 🌳
        </button>
      </div>
    );
  }

  if (!p) {
    if (!marketIsDue(state)) return null;
    return (
      <div className="rounded-3xl bg-green-800 p-5 text-white shadow-md">
        <p className="text-[10px] font-black uppercase tracking-wide text-green-200">Market Day</p>
        <h2 className="mt-1 text-lg font-black">Month {state.month} is ready to close</h2>
        <p className="mt-1 text-sm text-green-100">
          Two events, up to three deals, then the books. About 10 minutes — the screen shows how much is left.
          {quizGrade ? ` Your quiz grade (${quizGrade}) sets this month's market mood.` : ""}
        </p>
        <button
          onClick={() => save(prepareMarket(state, learned, quizGrade))}
          className="mt-3 w-full rounded-full bg-amber-400 py-2.5 text-sm font-black text-green-900"
        >
          Open the market 🏪
        </button>
      </div>
    );
  }

  const steps = ["Events", "Deals", "Close the books"];
  const allEventsDone = p.eventResult.every(Boolean);
  const allDealsDone = p.dealResult.every(Boolean);
  const setStep = (step: number) => save({ ...state, pending: { ...p, step } });

  return (
    <div className="rounded-3xl bg-white p-4 shadow-md ring-1 ring-amber-200">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wide text-amber-500">Market Day · Month {p.month}</p>
        <p className="text-[10px] font-bold text-stone-400">step {p.step + 1} of {steps.length} · {steps[p.step]}</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${((p.step + 1) / steps.length) * 100}%` }} />
      </div>

      {p.step === 0 && (
        <div className="mt-3 flex flex-col gap-3">
          {p.events.map((ev, i) => (
            <div key={ev.id} className="rounded-2xl bg-stone-50 p-3 ring-1 ring-stone-100">
              <p className="text-sm font-black text-stone-800">{ev.emoji} {ev.title}</p>
              <p className="mt-1 text-sm text-stone-600">{ev.text}</p>
              {p.eventResult[i] ? (
                <p className="mt-2 rounded-xl bg-green-50 p-2 text-xs text-green-900">✓ {p.eventResult[i]}</p>
              ) : (
                <div className="mt-2 flex flex-col gap-1.5">
                  {ev.choices.map((c, ci) => (
                    <button
                      key={ci}
                      onClick={() => save(resolveEvent(state, i, ci))}
                      className="rounded-xl bg-white p-2 text-left text-xs font-bold text-stone-700 ring-1 ring-green-100 hover:ring-green-400"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button
            disabled={!allEventsDone}
            onClick={() => setStep(1)}
            className="rounded-full bg-green-700 py-2.5 text-sm font-black text-white disabled:opacity-40"
          >
            Next: deals →
          </button>
        </div>
      )}

      {p.step === 1 && (
        <div className="mt-3 flex flex-col gap-3">
          {p.deals.length === 0 && <p className="text-sm text-stone-500">No deals crossed your desk this month.</p>}
          {p.deals.map((d, i) => {
            const result = p.dealResult[i];
            const canPapers = learned.has("title-deed");
            const canDD = learned.has("due-diligence");
            return (
              <div key={d.id} className="rounded-2xl bg-stone-50 p-3 ring-1 ring-stone-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-stone-800">{d.emoji} {d.title}</p>
                    <p className="mt-0.5 text-xs italic text-stone-500">{d.pitch}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-green-800">{eur(d.price)}</p>
                    <p className="text-[10px] text-stone-400">{d.income ? `${eur(d.income)}/month` : `~${(d.appreciation * 12 * 100).toFixed(0)}%/yr growth`}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                  {d.revealed.papers && (
                    <span className={`rounded px-1.5 py-0.5 ${d.hidden.papers === "ok" ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}>
                      {d.hidden.papers === "ok" ? "📜 Title clean" : "📜 TITLE PROBLEM"}
                    </span>
                  )}
                  {d.revealed.seller && (
                    <span className={`rounded px-1.5 py-0.5 ${!d.hidden.scam ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}>
                      {!d.hidden.scam ? "🪪 Seller verified" : "🪪 SELLER IS FAKE"}
                    </span>
                  )}
                  {d.revealed.site && (
                    <span className={`rounded px-1.5 py-0.5 ${!d.hidden.flood ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {!d.hidden.flood ? "📍 Good ground" : "📍 Flood-prone"}
                    </span>
                  )}
                </div>
                {result ? (
                  <p className={`mt-2 rounded-xl p-2 text-xs font-bold ${result === "scammed" ? "bg-rose-50 text-rose-700" : result === "bought" ? "bg-green-50 text-green-800" : "bg-stone-100 text-stone-500"}`}>
                    {result === "scammed" ? "💸 Scammed. The seller never owned it. Verify sellers next time." : result === "bought" ? "✓ Bought" : "Passed"}
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button disabled={!canPapers || !!d.revealed.papers || state.cash < INSPECT_COST} onClick={() => save(inspectDeal(state, i, "papers"))} title={canPapers ? "" : "Learn the Wealth Word: Title deed"} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-stone-600 ring-1 ring-stone-200 disabled:opacity-40">📜 Check papers €{INSPECT_COST}</button>
                    <button disabled={!canDD || !!d.revealed.seller || state.cash < INSPECT_COST} onClick={() => save(inspectDeal(state, i, "seller"))} title={canDD ? "" : "Learn the Wealth Word: Due diligence"} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-stone-600 ring-1 ring-stone-200 disabled:opacity-40">🪪 Verify seller €{INSPECT_COST}</button>
                    <button disabled={!canDD || !!d.revealed.site || state.cash < INSPECT_COST} onClick={() => save(inspectDeal(state, i, "site"))} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-stone-600 ring-1 ring-stone-200 disabled:opacity-40">📍 Visit site €{INSPECT_COST}</button>
                    <span className="flex-1" />
                    <button onClick={() => save(decideDeal(state, i, false))} className="rounded-full bg-stone-200 px-3 py-1 text-[11px] font-black text-stone-600">Pass</button>
                    <button disabled={state.cash < d.price} onClick={() => save(decideDeal(state, i, true))} className="rounded-full bg-green-700 px-3 py-1 text-[11px] font-black text-white disabled:opacity-40">Buy</button>
                  </div>
                )}
              </div>
            );
          })}
          {(!learned.has("title-deed") || !learned.has("due-diligence")) && (
            <p className="text-[11px] text-stone-400">🔒 Inspections unlock as you learn the Wealth Words <i>Title deed</i> and <i>Due diligence</i>.</p>
          )}
          <button disabled={!allDealsDone} onClick={() => setStep(2)} className="rounded-full bg-green-700 py-2.5 text-sm font-black text-white disabled:opacity-40">
            Next: close the books →
          </button>
        </div>
      )}

      {p.step === 2 && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p className="text-stone-500">Expected rent &amp; income</p><p className="text-right font-black text-green-700">+{eur(state.assets.reduce((s, a) => s + assetIncome(a, state), 0))}</p>
            <p className="text-stone-500">Upkeep</p><p className="text-right font-bold">−{eur(state.assets.reduce((s, a) => s + (CATALOG.find((c) => c.kind === a.kind)?.upkeep ?? 0), 0))}</p>
            <p className="text-stone-500">Loan instalments</p><p className="text-right font-bold">−{eur(state.loans.reduce((s, l) => s + l.monthly, 0))}</p>
            <p className="text-stone-500">Living costs</p><p className="text-right font-bold">−{eur(livingCost(state))}</p>
            {p.quizGrade && (<><p className="text-stone-500">Market mood (quiz {p.quizGrade})</p><p className="text-right font-bold">×{MOOD_BY_GRADE[p.quizGrade] ?? 1}</p></>)}
          </div>
          <p className="mt-2 text-[11px] text-stone-400">Appreciation, flood checks and title risks are applied when you close.</p>
          <button
            onClick={() => {
              const next = finalizeMarket(state);
              setReport(next.history[0]);
              save(next);
              if (next.freedomOn && !state.freedomOn) void confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
            }}
            className="mt-3 w-full rounded-full bg-amber-400 py-2.5 text-sm font-black text-green-900"
          >
            Close month {p.month} 📒
          </button>
        </div>
      )}
    </div>
  );
}

function Courses({ state, save }: { state: FarmState; save: (s: FarmState) => void }) {
  const exam = state.pendingExam;
  const question = currentExamQuestion(state);
  const [flash, setFlash] = useState<{ kind: "pass" | "fail"; text: string } | null>(null);

  const shuffled = useMemo(() => {
    if (!exam || !question) return null;
    const rnd = seededRandom(`${exam.course}-${exam.level}-${exam.attempts}`);
    const order = [0, 1, 2, 3].map((i) => ({ i, r: rnd() })).sort((a, b) => a.r - b.r).map((x) => x.i);
    return { order, correctIdx: order.indexOf(question.correct) };
  }, [exam, question]);

  const answer = (idx: number) => {
    if (!exam || !question || !shuffled) return;
    if (idx === shuffled.correctIdx) {
      setFlash({ kind: "pass", text: `✅ Correct — level ${exam.level} unlocked. ${question.why}` });
      void confetti({ particleCount: 50, spread: 55, origin: { y: 0.7 }, colors: ["#fbbf24", "#22c55e"] });
      save(answerExam(state, true));
    } else {
      setFlash({ kind: "fail", text: "❌ Not quite. No charge — think it through and try again." });
      save(answerExam(state, false));
    }
    window.setTimeout(() => setFlash(null), 4500);
  };

  return (
    <>
      <h3 className="mt-2 text-xs font-black uppercase tracking-wide text-stone-400">Invest in yourself</h3>
      <p className="-mt-1 text-[11px] text-stone-400">Pay once per level, then pass the exam. Wrong answers are free — but the bar only moves when you get it right.</p>
      {COURSES.map((c) => {
        const level = state.skills[c.id];
        const mine = exam?.course === c.id;
        const maxed = level >= c.max;
        return (
          <div key={c.id} className={`rounded-2xl p-3 shadow-sm ring-1 ${mine ? "bg-amber-50 ring-amber-300" : "bg-white ring-green-100"}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{c.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-stone-800">{c.name}</p>
                <p className="text-[11px] text-stone-500">{c.effect}</p>
                <div className="mt-1.5 flex gap-1">
                  {Array.from({ length: c.max }, (_, i) => (
                    <span
                      key={i}
                      className={`h-2 flex-1 rounded-full ${i < level ? "bg-green-600" : mine && i === level ? "animate-pulse bg-amber-400" : "bg-stone-200"}`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[10px] font-bold text-stone-400">level {level} of {c.max}{maxed ? " · mastered 🎓" : ""}</p>
              </div>
              {maxed ? null : mine ? (
                <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-green-900">exam ↓</span>
              ) : (
                <button
                  disabled={!!exam || state.cash < c.price}
                  onClick={() => save(enrolCourse(state, c))}
                  title={exam ? "Finish your current exam first" : ""}
                  className="rounded-full bg-green-700 px-3 py-1 text-xs font-black text-white disabled:opacity-40"
                >
                  Enrol · {eur(c.price)}
                </button>
              )}
            </div>
            {mine && question && shuffled && (
              <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-amber-200">
                <p className="text-[10px] font-black uppercase tracking-wide text-amber-600">
                  Exam · level {exam.level}{exam.attempts ? ` · attempt ${exam.attempts + 1}` : ""}
                </p>
                <p className="mt-1 text-sm font-black text-stone-800">{question.q}</p>
                <div className="mt-2 flex flex-col gap-1.5">
                  {shuffled.order.map((optIdx, i) => (
                    <button
                      key={`${exam.attempts}-${i}`}
                      onClick={() => answer(i)}
                      className="rounded-xl bg-stone-50 p-2 text-left text-xs font-bold text-stone-700 ring-1 ring-stone-200 transition hover:ring-green-400"
                    >
                      {question.options[optIdx]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {flash && (mine || (!exam && flash.kind === "pass")) && (
              <p className={`mt-2 rounded-xl p-2 text-xs font-bold ${flash.kind === "pass" ? "bg-green-50 text-green-800" : "bg-rose-50 text-rose-700"}`}>{flash.text}</p>
            )}
          </div>
        );
      })}
    </>
  );
}

export function Farm() {
  const { session } = useAuth();
  const farm = useFarm();
  const [loanAmount, setLoanAmount] = useState(2000);
  const [tab, setTab] = useState<"assets" | "shop" | "bank" | "log">("assets");

  if (!supabaseConfigured || !session) return <EmptyState emoji="🌳" title="Sign in to open your Money Farm" />;
  if (farm.loading || !farm.state) return <EmptyState emoji="🌱" title="Preparing the soil…" />;

  const s = farm.state;
  const passive = passiveIncome(s);
  const freedomPct = Math.min(100, Math.max(0, Math.round((passive / livingCost(s)) * 100)));
  const loanCap = maxLoan(s);
  const canLoan = farm.learned.has("leverage");
  const latestMint = s.log.find((l) => l.text.startsWith("Salary minted"));

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-black text-green-900">Money Farm 🌳</h1>
          <p className="text-xs text-stone-500">Month {s.month} · next Market Day {fmtDate(dueSunday(s))}</p>
        </div>
        <Link to="/words" className="rounded-full bg-white px-3 py-1 text-xs font-bold text-green-800 ring-1 ring-green-200">📖 Wealth Word</Link>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="cash" value={eur(s.cash)} tone={s.cash < 0 ? "text-rose-600" : "text-green-800"} />
        <Stat label="passive / month" value={eur(passive)} />
        <Stat label="net worth" value={eur(netWorth(s))} />
      </div>

      <div className="mt-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-green-100">
        <div className="flex items-center justify-between text-xs font-black">
          <span className="text-green-900">{s.freedomOn ? "🗽 Financially free" : "Road to freedom"}</span>
          <span className="text-stone-400">{eur(passive)} / {eur(livingCost(s))} living costs</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-amber-400 transition-all" style={{ width: `${freedomPct}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-stone-400">
          {latestMint ? `Last harvest: ${eur(latestMint.amount ?? 0)} minted from your learning. ` : "Your XP mints €10 each, the morning after you earn it. "}
          Credit score {s.creditScore} · market mood ×{s.marketMood.toFixed(2)}
        </p>
      </div>

      <div className="mt-3">
        <MarketDay state={s} learned={farm.learned} quizGrade={farm.quizGrade} save={farm.save} />
      </div>

      <div className="mt-4 flex gap-2">
        {(["assets", "shop", "bank", "log"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1 text-xs font-bold ${tab === t ? "bg-green-700 text-white" : "bg-white text-stone-500 ring-1 ring-green-100"}`}>
            {t === "assets" ? `🏠 Assets (${s.assets.length})` : t === "shop" ? "🛒 Shop" : t === "bank" ? "🏦 Bank" : "📒 Log"}
          </button>
        ))}
      </div>

      {tab === "assets" && (
        <div className="mt-3 flex flex-col gap-2">
          {s.assets.length === 0 && <p className="text-sm text-stone-400">Nothing yet. Visit the shop — a rental room is the classic first move.</p>}
          {s.assets.map((a) => {
            const def = CATALOG.find((c) => c.kind === a.kind)!;
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100">
                <span className="text-2xl">{def.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-stone-800">{a.name}</p>
                  <p className="text-[11px] text-stone-400">
                    worth {eur(a.value)} · {assetIncome(a, s) > 0 ? `+${eur(assetIncome(a, s))}/mo` : def.liability ? `−${eur(def.upkeep)}/mo upkeep` : "no income"}
                    {a.papers === "bad" && " · 📜 bad papers!"}
                    {a.papers === "unverified" && " · 📜 unverified"}
                    {a.flood && " · 🌧️ flood-prone"}
                  </p>
                </div>
                <button onClick={() => farm.save(sellAsset(s, a.id))} className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-500">Sell</button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "shop" && (
        <div className="mt-3 flex flex-col gap-2">
          {CATALOG.map((def) => {
            const check = canBuy(def, s, farm.learned);
            return (
              <div key={def.kind} className={`rounded-2xl p-3 shadow-sm ring-1 ${def.liability ? "bg-rose-50/50 ring-rose-100" : "bg-white ring-green-100"}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{def.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-stone-800">{def.name} <span className="text-green-800">{eur(def.price)}</span></p>
                    <p className="text-[11px] text-stone-500">{def.desc}</p>
                    <p className="text-[11px] italic text-stone-400">🌳 {def.lesson}</p>
                    {!check.ok && <p className="mt-1 text-[11px] font-bold text-amber-700">🔒 {check.reason}</p>}
                  </div>
                  <button disabled={!check.ok} onClick={() => farm.save(buyAsset(s, def, farm.learned))} className={`rounded-full px-3 py-1 text-xs font-black disabled:opacity-40 ${def.liability ? "bg-rose-200 text-rose-800" : "bg-green-700 text-white"}`}>
                    {def.liability ? "Treat myself" : "Buy"}
                  </button>
                </div>
              </div>
            );
          })}
          <Courses state={s} save={farm.save} />
        </div>
      )}

      {tab === "bank" && (
        <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-green-100">
          <p className="text-sm font-black text-stone-800">🏦 Loans at 10% a year, 24 monthly instalments</p>
          {!canLoan ? (
            <p className="mt-2 text-sm text-amber-700">🔒 Learn the Wealth Word <b>Leverage</b> to unlock borrowing.</p>
          ) : (
            <>
              <p className="mt-1 text-[11px] text-stone-400">Your limit right now: {eur(loanCap)} (grows with income and credit score {s.creditScore})</p>
              <input type="range" min={500} max={Math.max(500, loanCap)} step={500} value={Math.min(loanAmount, Math.max(500, loanCap))} onChange={(e) => setLoanAmount(Number(e.target.value))} className="mt-3 w-full accent-green-700" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-black text-green-800">{eur(loanAmount)}</span>
                <span className="text-stone-500">≈ {eur(loanInstalment(loanAmount))}/month</span>
              </div>
              <button disabled={loanCap < 500 || loanAmount > loanCap} onClick={() => farm.save(takeLoan(s, loanAmount))} className="mt-3 w-full rounded-full bg-green-700 py-2 text-sm font-black text-white disabled:opacity-40">Borrow</button>
              <p className="mt-2 text-[11px] italic text-stone-400">🌳 Good debt buys something that pays the instalment. Bad debt buys the car.</p>
            </>
          )}
          {s.loans.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {s.loans.map((l) => (
                <p key={l.id} className="rounded-xl bg-stone-50 p-2 text-xs text-stone-600">
                  Loan of {eur(l.principal)} · balance {eur(l.balance)} · {eur(l.monthly)}/month
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "log" && (
        <div className="mt-3 flex flex-col gap-1.5">
          {s.log.map((l, i) => (
            <p key={i} className="flex justify-between rounded-xl bg-white p-2 text-xs text-stone-600 ring-1 ring-green-50">
              <span>M{l.month} · {l.text}</span>
              {l.amount !== undefined && <span className={`ml-2 shrink-0 font-bold ${l.amount >= 0 ? "text-green-700" : "text-rose-600"}`}>{l.amount >= 0 ? "+" : "−"}{eur(Math.abs(l.amount))}</span>}
            </p>
          ))}
          {s.history.length > 0 && (
            <>
              <h3 className="mt-3 text-xs font-black uppercase tracking-wide text-stone-400">Months</h3>
              {s.history.map((h) => (
                <p key={h.month} className="flex justify-between rounded-xl bg-white p-2 text-xs text-stone-600 ring-1 ring-green-50">
                  <span>Month {h.month}: rent {eur(h.rent)}, net worth {eur(h.netWorth)}</span>
                  <span className={`font-bold ${h.net >= 0 ? "text-green-700" : "text-rose-600"}`}>{h.net >= 0 ? "+" : "−"}{eur(Math.abs(h.net))}</span>
                </p>
              ))}
            </>
          )}
        </div>
      )}
      <p className="mt-6 text-center text-[11px] text-stone-400">The farm never pays XP. Learning pays the farm.</p>
    </div>
  );
}
