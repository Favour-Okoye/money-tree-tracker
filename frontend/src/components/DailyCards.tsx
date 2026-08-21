import { Link } from "react-router-dom";
import { todaysTerm, useLearnedTerms } from "../lib/termQueries";
import { useFarmState } from "../lib/farmQueries";
import { livingCost, marketIsDue, passiveIncome } from "../lib/farm";

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-GB")}`;

/** Dashboard strip: today's Wealth Word + the farm at a glance. */
export function DailyCards() {
  const learnedQ = useLearnedTerms();
  const farmQ = useFarmState();
  const today = learnedQ.data ? todaysTerm(learnedQ.data) : null;
  const farm = farmQ.data;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <Link to="/words" className={`rounded-2xl p-3 shadow-sm ring-1 ${today?.doneToday ? "bg-white ring-green-100" : "bg-amber-50 ring-amber-200"}`}>
        <p className="text-[10px] font-black uppercase tracking-wide text-amber-600">📖 Wealth Word</p>
        <p className="mt-1 truncate text-sm font-black text-stone-800">{today ? today.term.term : "…"}</p>
        <p className="text-[11px] font-bold text-stone-400">{today?.doneToday ? "learned ✓" : "tap to learn today's →"}</p>
      </Link>
      <Link to="/farm" className={`rounded-2xl p-3 shadow-sm ring-1 ${farm && marketIsDue(farm) ? "bg-green-800 text-white ring-green-800" : "bg-white ring-green-100"}`}>
        <p className={`text-[10px] font-black uppercase tracking-wide ${farm && marketIsDue(farm) ? "text-green-200" : "text-green-700"}`}>🌳 Money Farm</p>
        {farm ? (
          <>
            <p className="mt-1 text-sm font-black">{eur(farm.cash)} cash</p>
            <p className={`text-[11px] font-bold ${marketIsDue(farm) ? "text-amber-300" : "text-stone-400"}`}>
              {marketIsDue(farm) ? "Market Day waiting! →" : `${eur(passiveIncome(farm))}/${eur(livingCost(farm))} passive`}
            </p>
          </>
        ) : (
          <p className="mt-1 text-[11px] font-bold text-stone-400">tap to open →</p>
        )}
      </Link>
    </div>
  );
}
