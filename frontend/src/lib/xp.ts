import { supabase } from "./supabase";
import { brusselsDay } from "./format";

export const XP_POINTS = {
  watch_video: 10,
  engage_video: 5,
  write_note: 15,
  finish_chapter: 20,
  finish_book: 100,
  log_post: 5,
  complete_assignment: 25,
  complete_action_item: 15,
  attend_move: 30,
  daily_streak_tick: 5,
  streak_bonus_7: 50,
  streak_bonus_30: 200,
} as const;

export type XpAction = keyof typeof XP_POINTS;

/**
 * Append to the XP ledger. The DB's partial unique index on
 * (user_id, action, ref_type, ref_id) makes this idempotent — a 23505
 * conflict just means "already earned for this item".
 * Silently instrumented from Phase 1; the dashboard reads it in Phase 5.
 */
export async function award(action: XpAction, refType: string, refId: string): Promise<boolean> {
  if (!supabase) return false;
  const day = brusselsDay();
  const { error } = await supabase.from("xp_events").insert({
    action,
    points: XP_POINTS[action],
    ref_type: refType,
    ref_id: refId,
    happened_on: day,
  });
  if (error && error.code !== "23505") {
    console.warn("xp award failed:", error.message);
    return false;
  }
  if (action !== "daily_streak_tick") {
    // one activity tick per Brussels-local day, fuels streaks later
    await supabase.from("xp_events").insert({
      action: "daily_streak_tick",
      points: XP_POINTS.daily_streak_tick,
      ref_type: "day",
      ref_id: day,
      happened_on: day,
    });
  }
  return !error;
}

/** Ledger insert with computed points (quiz scores, streak bonuses).
 *  Same dedupe rule: one row per (action, refType, refId). */
export async function awardCustom(
  action: string,
  refType: string,
  refId: string,
  points: number
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("xp_events").insert({
    action,
    points,
    ref_type: refType,
    ref_id: refId,
    happened_on: brusselsDay(),
  });
  if (error && error.code !== "23505") {
    console.warn("xp awardCustom failed:", error.message);
    return false;
  }
  return !error;
}
