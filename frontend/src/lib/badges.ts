export interface BadgeContext {
  totalXp: number;
  watchedCount: number;
  maxWatchedInADay: number;
  earlyBird: boolean;
  notesCount: number;
  chaptersDone: number;
  bookFinished: boolean;
  assignmentsDone: number;
  postsCount: number;
  movesRegistered: boolean;
  longestStreak: number;
  quizzesDone: number;
}

export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  earned: (ctx: BadgeContext) => boolean;
}

export const BADGES: BadgeDef[] = [
  { id: "first_seed", name: "First Seed", emoji: "🌱", desc: "Earn your first XP", earned: (c) => c.totalXp > 0 },
  { id: "note_farmer", name: "Note Farmer", emoji: "✍️", desc: "Write 10 reflections", earned: (c) => c.notesCount >= 10 },
  { id: "early_bird", name: "Early Bird", emoji: "🐦", desc: "Watch a video within 24h of it dropping", earned: (c) => c.earlyBird },
  { id: "binge_farmer", name: "Binge Farmer", emoji: "🍿", desc: "Watch 5 videos in one day", earned: (c) => c.maxWatchedInADay >= 5 },
  { id: "deep_roots", name: "Deep Roots", emoji: "🌳", desc: "7-day activity streak", earned: (c) => c.longestStreak >= 7 },
  { id: "harvest_season", name: "Harvest Season", emoji: "🌾", desc: "30-day activity streak", earned: (c) => c.longestStreak >= 30 },
  { id: "chapter_one", name: "Chapter One", emoji: "📖", desc: "Finish your first book chapter", earned: (c) => c.chaptersDone >= 1 },
  { id: "cover_to_cover", name: "Cover to Cover", emoji: "📗", desc: "Finish a whole book", earned: (c) => c.bookFinished },
  { id: "assignment_ace", name: "Assignment Ace", emoji: "🏅", desc: "Complete 5 community assignments", earned: (c) => c.assignmentsDone >= 5 },
  { id: "archivist", name: "Archivist", emoji: "🗂️", desc: "Log 10 social posts", earned: (c) => c.postsCount >= 10 },
  { id: "summit_bound", name: "Summit Bound", emoji: "🎟️", desc: "Register for one of her moves", earned: (c) => c.movesRegistered },
  { id: "quiz_rookie", name: "Quiz Rookie", emoji: "🧠", desc: "Complete your first Saturday quiz", earned: (c) => c.quizzesDone >= 1 },
  { id: "century_club", name: "Century Club", emoji: "💯", desc: "Watch 100 videos", earned: (c) => c.watchedCount >= 100 },
];
