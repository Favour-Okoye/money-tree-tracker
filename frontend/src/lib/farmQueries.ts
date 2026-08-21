import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { useXpDays } from "./stats";
import { useLearnedTerms, learnedIdSet } from "./termQueries";
import { useQuizResults, lastSaturday } from "./quiz";
import { autoCloseMissed, mintSalary, newFarm, type FarmState } from "./farm";

export function useFarmState() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["farm", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<FarmState | null> => {
      const { data, error } = await supabase!.from("game_state").select("state").maybeSingle();
      if (error) throw error;
      const raw = data?.state as Partial<FarmState> | undefined;
      return raw && raw.version === 1 ? (raw as FarmState) : null;
    },
  });
}

export function useSaveFarm() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (state: FarmState) => {
      if (!supabase || !session) throw new Error("not signed in");
      const { error } = await supabase
        .from("game_state")
        .upsert({ user_id: session.user.id, state, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw error;
      // farm milestones become real badges
      if (state.badges.length) {
        await supabase
          .from("badges")
          .upsert(state.badges.map((badge_id) => ({ badge_id })), { onConflict: "user_id,badge_id", ignoreDuplicates: true });
      }
      return state;
    },
    onMutate: async (state) => {
      await qc.cancelQueries({ queryKey: ["farm", session?.user.id] });
      qc.setQueryData(["farm", session?.user.id], state);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["farm", session?.user.id] }),
  });
}

/** Loads the farm, mints salary from completed XP days, auto-closes skipped
 *  weeks, and saves if anything changed. Returns the live state + helpers. */
export function useFarm() {
  const { session } = useAuth();
  const farmQ = useFarmState();
  const xpDaysQ = useXpDays();
  const learnedQ = useLearnedTerms();
  const quizzesQ = useQuizResults();
  const save = useSaveFarm();
  const maintained = useRef<string | null>(null);

  const learned = learnedIdSet(learnedQ.data);
  const latestQuiz = (quizzesQ.data ?? []).find((r) => r.week_key === lastSaturday() && r.status === "done");
  const quizGrade = latestQuiz?.grade ?? null;

  const ready = !!session && farmQ.isSuccess && xpDaysQ.isSuccess && learnedQ.isSuccess && quizzesQ.isSuccess;

  useEffect(() => {
    if (!ready) return;
    const key = `${farmQ.data?.mintedThrough ?? "new"}:${farmQ.data?.lastClosedSunday ?? ""}:${xpDaysQ.data?.length ?? 0}`;
    if (maintained.current === key) return;
    maintained.current = key;
    let state = farmQ.data ?? newFarm();
    const before = JSON.stringify(state);
    const minted = mintSalary(state, xpDaysQ.data ?? []);
    state = minted.state;
    state = autoCloseMissed(state, learned);
    if (!farmQ.data || JSON.stringify(state) !== before) save.mutate(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, farmQ.data, xpDaysQ.data]);

  return {
    loading: !!session && !ready,
    state: farmQ.data ?? null,
    learned,
    quizGrade,
    save: (s: FarmState) => save.mutate(s),
    saving: save.isPending,
  };
}
