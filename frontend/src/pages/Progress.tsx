import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useGrowth } from "../lib/stats";
import { useQuizResults } from "../lib/quiz";
import { BADGES } from "../lib/badges";
import { brusselsDay, fmtDate } from "../lib/format";
import { EmptyState } from "../components/EmptyState";

function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function Progress() {
  const { session } = useAuth();
  const growth = useGrowth();
  const quizzesQ = useQuizResults();

  if (!session) {
    return <EmptyState emoji="🏆" title="Sign in to see your progress" />;
  }

  const today = brusselsDay();
  const last14 = Array.from({ length: 14 }, (_, i) => shiftDay(today, i - 13));
  const byDay = new Map(growth.xpDays.map((d) => [d.happened_on, d.points]));
  const maxPoints = Math.max(10, ...last14.map((d) => byDay.get(d) ?? 0));

  return (
    <div>
      <Link to="/" className="mb-3 inline-block text-sm font-bold text-green-700">
        ← Home
      </Link>
      <h1 className="text-xl font-black text-green-900">Progress 🏆</h1>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100">
          <p className="text-lg font-black text-green-800">⭐ {growth.totalXp}</p>
          <p className="text-[10px] font-bold text-stone-400">total XP</p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100">
          <p className="text-lg font-black text-green-800">🔥 {growth.streak.current}</p>
          <p className="text-[10px] font-bold text-stone-400">streak (best {growth.streak.longest})</p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100">
          <p className="text-lg font-black text-green-800">🎬 {growth.watchedCount}</p>
          <p className="text-[10px] font-bold text-stone-400">videos watched</p>
        </div>
      </div>

      <section className="mt-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-green-100">
        <h2 className="text-sm font-black text-green-900">XP — last 14 days</h2>
        <div className="mt-3 flex h-28 items-end gap-1">
          {last14.map((day) => {
            const points = byDay.get(day) ?? 0;
            return (
              <div key={day} className="flex flex-1 flex-col items-center gap-1" title={`${day}: ${points} XP`}>
                <div
                  className={`w-full rounded-t-md ${points > 0 ? "bg-gradient-to-t from-green-600 to-green-400" : "bg-stone-100"}`}
                  style={{ height: `${Math.max(4, (points / maxPoints) * 100)}%` }}
                />
                <span className="text-[8px] font-bold text-stone-400">
                  {new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "narrow", timeZone: "UTC" })}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-black text-green-900">
          Badges — {growth.earnedBadges.size}/{BADGES.length}
        </h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {BADGES.map((badge) => {
            const earned = growth.earnedBadges.has(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-2xl p-3 text-center ring-1 ${
                  earned ? "bg-amber-50 ring-amber-200" : "bg-white opacity-60 grayscale ring-stone-100"
                }`}
              >
                <div className="text-2xl">{badge.emoji}</div>
                <p className="mt-1 text-[11px] font-black text-stone-700">{badge.name}</p>
                <p className="text-[9px] leading-tight text-stone-400">{badge.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-black text-green-900">Saturday quizzes 🧠</h2>
        {(quizzesQ.data ?? []).length === 0 ? (
          <p className="mt-1 text-xs text-stone-400">
            Your first quiz unlocks on Saturday. It cannot be dodged. 😌
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {(quizzesQ.data ?? []).map((r) => (
              <div
                key={r.week_key}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100"
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black ${
                    r.status === "missed"
                      ? "bg-stone-100 text-stone-400"
                      : r.grade === "A"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {r.status === "missed" ? "–" : r.grade}
                </span>
                <div>
                  <p className="text-sm font-bold text-stone-700">Week of {fmtDate(r.week_key)}</p>
                  <p className="text-[11px] text-stone-400">
                    {r.status === "missed" ? "missed 🍂" : `${r.score}/${r.total} correct`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
