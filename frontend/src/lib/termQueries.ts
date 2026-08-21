import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { award } from "./xp";
import { brusselsDay } from "./format";
import { TERM_BY_ID, WEALTH_TERMS, type WealthTerm } from "./wealthTerms";

export interface LearnedTermRow {
  term_id: string;
  learned_on: string;
  note: string | null;
}

export function useLearnedTerms() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["learned_terms", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<LearnedTermRow[]> => {
      const { data, error } = await supabase!
        .from("learned_terms")
        .select("term_id, learned_on, note")
        .order("learned_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LearnedTermRow[];
    },
  });
}

export function useLearnTerm() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: { termId: string; note: string }) => {
      if (!supabase || !session) throw new Error("not signed in");
      const { error } = await supabase
        .from("learned_terms")
        .upsert(
          { term_id: input.termId, learned_on: brusselsDay(), note: input.note || null },
          { onConflict: "user_id,term_id", ignoreDuplicates: true }
        );
      if (error) throw error;
      await award("learn_term", "term", input.termId);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["learned_terms", session?.user.id] }),
  });
}

/** One new word per Brussels day, in curated order. */
export function todaysTerm(
  learned: LearnedTermRow[]
): { term: WealthTerm; doneToday: boolean } | null {
  const today = brusselsDay();
  const doneToday = learned.find((r) => r.learned_on === today);
  if (doneToday) {
    const term = TERM_BY_ID.get(doneToday.term_id);
    if (term) return { term, doneToday: true };
  }
  const known = new Set(learned.map((r) => r.term_id));
  const next = WEALTH_TERMS.find((t) => !known.has(t.id));
  return next ? { term: next, doneToday: false } : null;
}

export function learnedIdSet(learned: LearnedTermRow[] | undefined): Set<string> {
  return new Set((learned ?? []).map((r) => r.term_id));
}
