import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabaseConfigured } from "../lib/supabase";
import { useCatalog } from "../lib/catalog";
import { useProfile, useStatuses, statusKey } from "../lib/queries";
import { useGrowth } from "../lib/stats";
import { useMoves } from "../lib/movesQueries";
import { useActionItems } from "../lib/bookQueries";
import { useAssignments } from "../lib/socialQueries";
import { useQuizResults, lastSaturday } from "../lib/quiz";
import { MoneyTree, TREE_STAGES, stageForXp } from "../components/MoneyTree";
import { SetupBanner } from "../components/SetupBanner";
import { DailyCards } from "../components/DailyCards";
import { brusselsDay, daysUntil, fmtDate } from "../lib/format";

function StatChip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-green-900 shadow-sm ring-1 ring-green-100">
      <span>{emoji}</span> {label}
    </span>
  );
}

export function Dashboard() {
  const { session } = useAuth();
  const profileQ = useProfile();
  const catalogQ = useCatalog();
  const statusesQ = useStatuses();
  const growth = useGrowth();
  const movesQ = useMoves();
  const actionsQ = useActionItems();
  const assignmentsQ = useAssignments();
  const quizzesQ = useQuizResults();

  const catalog = catalogQ.data;
  const latest = (catalog?.videos ?? []).slice(0, 6);
  const statuses = statusesQ.data ?? {};

  if (!session) {
    return (
      <div className="text-center">
        {!supabaseConfigured && <SetupBanner />}
        <MoneyTree xp={0} />
        <h1 className="text-xl font-black text-green-900">Plant your money tree 🌱</h1>
        <p className="mx-auto mt-1 max-w-xs text-sm text-stone-500">
          Every video watched, note written and promise kept makes it grow.
        </p>
        {supabaseConfigured && (
          <Link
            to="/login"
            className="mt-4 inline-block rounded-full bg-green-700 px-6 py-2.5 text-sm font-black text-white shadow"
          >
            Sign in to start
          </Link>
        )}
        <div className="mt-6 text-left">
          <h2 className="text-sm font-black text-green-900">Latest from Grace</h2>
          <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
            {latest.map((v) => (
              <Link key={v.id} to={`/library/video/${v.id}`} className="w-40 shrink-0">
                <img src={v.thumbnail} alt="" className="aspect-video w-full rounded-xl object-cover" />
                <p className="mt-1 line-clamp-2 text-xs font-bold text-stone-700">{v.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const xp = growth.totalXp;
  const stage = stageForXp(xp);
  const stageDef = TREE_STAGES[stage];
  const nextStage = TREE_STAGES[stage + 1];
  const progressPct = nextStage
    ? Math.min(100, Math.round(((xp - stageDef.min) / (nextStage.min - stageDef.min)) * 100))
    : 100;

  const today = brusselsDay();
  const openActions = (actionsQ.data ?? []).filter((a) => a.status === "open");
  const dueActions = openActions.filter((a) => a.due_on && a.due_on <= today);
  const dueAssignments = (assignmentsQ.data ?? []).filter(
    (a) => (a.status === "todo" || a.status === "doing") && a.due_on && daysUntil(a.due_on) <= 3
  );
  const pinnedMoves = (movesQ.data ?? [])
    .filter((m) => m.pinned)
    .sort((a, b) => (a.starts_on ?? "9999").localeCompare(b.starts_on ?? "9999"))
    .slice(0, 2);
  const lastQuiz = (quizzesQ.data ?? []).find((r) => r.status === "done");
  const quizDoneThisWeek = (quizzesQ.data ?? []).some(
    (r) => r.week_key === lastSaturday() && r.status === "done"
  );

  const watchedTotal = growth.watchedCount;
  const catalogTotal = catalog?.count ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-green-900">
          Hi {profileQ.data?.display_name ?? "Farmer"} 🌱
        </h1>
        <div className="flex gap-2">
          <StatChip emoji="🔥" label={`${growth.streak.current}d`} />
          <StatChip emoji="⭐" label={`${xp} XP`} />
        </div>
      </div>

      <DailyCards />

      <div className="mt-3 rounded-3xl bg-white p-4 text-center shadow-sm ring-1 ring-green-100">
        <MoneyTree xp={xp} />
        <p className="text-sm font-black text-green-900">
          {stageDef.emoji} {stageDef.name}
        </p>
        {nextStage ? (
          <>
            <div className="mx-auto mt-2 h-2 max-w-xs overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-amber-400" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="mt-1 text-[11px] font-bold text-stone-400">
              {xp} / {nextStage.min} XP · {nextStage.min - xp} more to {nextStage.name} {nextStage.emoji}
            </p>
          </>
        ) : (
          <p className="mt-1 text-[11px] font-bold text-amber-500">Fully grown. Legendary. 🏆</p>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link to="/progress" className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100">
          <p className="text-lg font-black text-green-800">🏆 {growth.earnedBadges.size}</p>
          <p className="text-[11px] font-bold text-stone-400">badges — see progress →</p>
        </Link>
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100">
          <p className="text-lg font-black text-green-800">
            🧠 {quizDoneThisWeek ? lastQuiz?.grade : "Sat"}
          </p>
          <p className="text-[11px] font-bold text-stone-400">
            {quizDoneThisWeek
              ? `quiz done — ${lastQuiz?.score}/${lastQuiz?.total}`
              : "next quiz: Saturday (no escape 😌)"}
          </p>
        </div>
      </div>

      {(dueActions.length > 0 || dueAssignments.length > 0) && (
        <Link
          to="/tasks"
          className="mt-3 block rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-900 ring-1 ring-amber-200"
        >
          ⏰ {dueActions.length > 0 && `${dueActions.length} action${dueActions.length > 1 ? "s" : ""} due`}
          {dueActions.length > 0 && dueAssignments.length > 0 && " · "}
          {dueAssignments.length > 0 && `${dueAssignments.length} assignment${dueAssignments.length > 1 ? "s" : ""} closing in`}
          {" →"}
        </Link>
      )}

      {pinnedMoves.map((move) => (
        <Link
          key={move.id}
          to="/moves"
          className="mt-3 flex items-center gap-3 rounded-2xl bg-green-800 p-3 text-white shadow-md"
        >
          <span className="text-2xl">📌</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">{move.title}</p>
            <p className="text-[11px] text-green-200">
              {move.starts_on ? `${fmtDate(move.starts_on)} · ` : ""}
              {move.location ?? move.price ?? ""}
            </p>
          </div>
          {move.starts_on && daysUntil(move.starts_on) >= 0 && (
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-black text-green-900">
              {daysUntil(move.starts_on) === 0 ? "TODAY" : `${daysUntil(move.starts_on)}d`}
            </span>
          )}
        </Link>
      ))}

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-sm font-black text-green-900">Latest from Grace</h2>
        <Link to="/library" className="text-xs font-bold text-green-700">
          {watchedTotal}/{catalogTotal} watched →
        </Link>
      </div>
      <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
        {latest.map((v) => {
          const watched = statuses[statusKey("video", v.id)]?.status === "watched";
          return (
            <Link key={v.id} to={`/library/video/${v.id}`} className="relative w-40 shrink-0">
              <img
                src={v.thumbnail}
                alt=""
                className={`aspect-video w-full rounded-xl object-cover ${watched ? "opacity-50" : ""}`}
              />
              {watched && (
                <span className="absolute left-1 top-1 rounded-full bg-green-600 px-1.5 text-xs text-white">✓</span>
              )}
              <p className="mt-1 line-clamp-2 text-xs font-bold text-stone-700">{v.title}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
