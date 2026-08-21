import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { award } from "./xp";

export type MoveCategory =
  | "event"
  | "program"
  | "community"
  | "podcast"
  | "book"
  | "appearance"
  | "other";
export type HerStatus = "rumored" | "announced" | "open" | "ongoing" | "past";
export type MyStatus = "tracking" | "interested" | "registered" | "attended" | "passed";

export interface MoveRow {
  id: string;
  title: string;
  category: MoveCategory;
  url: string | null;
  location: string | null;
  price: string | null;
  starts_on: string | null;
  ends_on: string | null;
  her_status: HerStatus;
  my_status: MyStatus;
  pinned: boolean;
  notes: string | null;
}

export interface MoveSeed {
  title: string;
  category: MoveCategory;
  url?: string;
  location?: string;
  price?: string;
  starts_on?: string;
  her_status?: HerStatus;
  my_status?: MyStatus;
  pinned?: boolean;
}

/** Everything Grace runs today, from the research pass (2026-08). */
export const KNOWN_MOVES: MoveSeed[] = [
  {
    title: "New Money Summit UK 2026",
    category: "event",
    url: "https://graceofureecosystem.com/events/nms/",
    location: "InterContinental London – The O2",
    price: "£50 standard / £200 VIP",
    starts_on: "2026-09-05",
    her_status: "open",
    pinned: true,
  },
  {
    title: "Wealth Embassy hub (Nestuge)",
    category: "community",
    url: "https://hubs.nestuge.com/graceofuregracewealthembassy/resources",
    price: "Member",
    her_status: "ongoing",
    my_status: "registered",
  },
  {
    title: "Grace Ofure All Access (Skool)",
    category: "community",
    url: "https://www.skool.com/grace-ofure-all-access-1598",
    price: "Free",
    her_status: "ongoing",
  },
  {
    title: "Lifecard University",
    category: "program",
    url: "https://app.lifecarduniversity.com",
    her_status: "ongoing",
  },
  {
    title: "VCAP Coaching Program (28 weeks)",
    category: "program",
    url: "https://www.graceofure.com/grace-ofure-coaching-program",
    price: "$2,000 / 6 mo · $3,000 / 12 mo",
    her_status: "open",
  },
  {
    title: "6-Month Real Estate Mentorship",
    category: "program",
    url: "https://linktr.ee/graceofure",
    her_status: "open",
  },
  {
    title: "Million Dollar Mastermind (Women Only)",
    category: "program",
    price: "$1,000",
    her_status: "open",
  },
  {
    title: "Room 190° (private circle)",
    category: "community",
    url: "https://www.graceofure.com/grace-ofure-join-room-190deg.html",
    price: "Waitlist via Telegram",
    her_status: "open",
  },
  {
    title: "The Elite Table (podcast)",
    category: "podcast",
    url: "https://open.spotify.com/search/The%20Elite%20Table%20Grace%20Ofure",
    her_status: "ongoing",
  },
];

export function useMoves() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["mentor_moves", session?.user.id],
    enabled: !!supabase && !!session,
    queryFn: async (): Promise<MoveRow[]> => {
      const { data, error } = await supabase!
        .from("mentor_moves")
        .select(
          "id, title, category, url, location, price, starts_on, ends_on, her_status, my_status, pinned, notes"
        );
      if (error) throw error;
      return (data ?? []) as MoveRow[];
    },
  });
}

export function useSeedMoves() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!supabase || !session) throw new Error("not signed in");
      const { error } = await supabase.from("mentor_moves").insert(
        KNOWN_MOVES.map((m) => ({
          title: m.title,
          category: m.category,
          url: m.url ?? null,
          location: m.location ?? null,
          price: m.price ?? null,
          starts_on: m.starts_on ?? null,
          her_status: m.her_status ?? "announced",
          my_status: m.my_status ?? "tracking",
          pinned: m.pinned ?? false,
        }))
      );
      if (error) throw error;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["mentor_moves", session?.user.id] }),
  });
}

export function useAddMove() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      category: MoveCategory;
      url: string;
      location: string;
      price: string;
      startsOn: string;
    }) => {
      if (!supabase || !session) throw new Error("not signed in");
      const { error } = await supabase.from("mentor_moves").insert({
        title: input.title,
        category: input.category,
        url: input.url || null,
        location: input.location || null,
        price: input.price || null,
        starts_on: input.startsOn || null,
      });
      if (error) throw error;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["mentor_moves", session?.user.id] }),
  });
}

export function useUpdateMove() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      patch: Partial<Pick<MoveRow, "my_status" | "pinned" | "her_status">>;
    }) => {
      if (!supabase || !session) throw new Error("not signed in");
      const { error } = await supabase
        .from("mentor_moves")
        .update({ ...input.patch, updated_at: new Date().toISOString() })
        .eq("id", input.id);
      if (error) throw error;
      if (input.patch.my_status === "attended") {
        await award("attend_move", "move", input.id);
      }
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["mentor_moves", session?.user.id] }),
  });
}

export function useDeleteMove() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase || !session) throw new Error("not signed in");
      const { error } = await supabase.from("mentor_moves").delete().eq("id", id);
      if (error) throw error;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["mentor_moves", session?.user.id] }),
  });
}
