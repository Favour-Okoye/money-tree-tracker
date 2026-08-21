import { Link } from "react-router-dom";
import { useBooks } from "../lib/books";
import { useBookProgress, type BookStatus } from "../lib/bookQueries";
import { useAuth } from "../lib/auth";
import { supabaseConfigured } from "../lib/supabase";
import { EmptyState } from "../components/EmptyState";
import { SetupBanner } from "../components/SetupBanner";

const STATUS_LABEL: Record<BookStatus, string> = {
  wishlist: "🌱 Wishlist",
  owned: "📦 Owned",
  reading: "📖 Reading",
  finished: "🏆 Finished",
};

export function Books() {
  const { session } = useAuth();
  const booksQ = useBooks();
  const progressQ = useBookProgress();

  if (booksQ.isLoading) return <EmptyState emoji="📗" title="Fetching the shelf…" />;
  if (booksQ.isError) return <EmptyState emoji="🥀" title="Couldn't load the books" />;

  const progress = progressQ.data ?? {};

  return (
    <div>
      {!supabaseConfigured && <SetupBanner />}
      <h1 className="text-xl font-black text-green-900">Grace's Books</h1>
      <p className="mb-4 text-xs text-stone-500">
        {session ? "Track your reading, chapter by chapter 🌱" : "Sign in to track your reading"}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {(booksQ.data ?? []).map((book) => {
          const p = progress[book.slug];
          return (
            <Link
              key={book.slug}
              to={`/books/${book.slug}`}
              className="flex flex-col items-center rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-green-100 transition hover:shadow-md"
            >
              <span className="text-5xl">{book.emoji}</span>
              <h3 className="mt-3 text-sm font-black leading-snug text-stone-800">{book.title}</h3>
              {book.subtitle && <p className="text-xs text-stone-400">{book.subtitle}</p>}
              <span
                className={`mt-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  p?.status === "finished"
                    ? "bg-amber-100 text-amber-700"
                    : p?.status === "reading"
                      ? "bg-green-100 text-green-700"
                      : "bg-stone-100 text-stone-500"
                }`}
              >
                {STATUS_LABEL[p?.status ?? "wishlist"]}
              </span>
            </Link>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-stone-400">
        Buy them on{" "}
        <a
          href="https://www.graceofure.com/grace-ofure-my-books"
          target="_blank"
          rel="noreferrer"
          className="font-bold text-green-700"
        >
          her site ↗
        </a>
      </p>
    </div>
  );
}
