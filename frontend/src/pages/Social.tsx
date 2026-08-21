import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  useAddPost,
  useDeletePost,
  usePosts,
  type Platform,
} from "../lib/socialQueries";
import { useAuth } from "../lib/auth";
import { supabaseConfigured } from "../lib/supabase";
import { brusselsDay, fmtDate } from "../lib/format";
import { EmptyState } from "../components/EmptyState";
import { SetupBanner } from "../components/SetupBanner";

const PLATFORMS: { value: Platform; label: string; emoji: string }[] = [
  { value: "instagram", label: "Instagram", emoji: "📸" },
  { value: "facebook", label: "Facebook", emoji: "📘" },
  { value: "youtube_community", label: "YT Community", emoji: "📢" },
  { value: "skool", label: "Skool", emoji: "🏫" },
  { value: "tiktok", label: "TikTok", emoji: "🎵" },
  { value: "other", label: "Other", emoji: "🔗" },
];

const QUICK_LINKS = [
  { emoji: "📸", url: "https://www.instagram.com/grace_ofure" },
  { emoji: "📘", url: "https://www.facebook.com/gracedofure" },
  { emoji: "🏫", url: "https://www.skool.com/grace-ofure-all-access-1598" },
  { emoji: "🏛️", url: "https://hubs.nestuge.com/graceofuregracewealthembassy/resources" },
  { emoji: "🔗", url: "https://linktr.ee/graceofure" },
];

export function Social() {
  const { session } = useAuth();
  const postsQ = usePosts();
  const addPost = useAddPost();
  const deletePost = useDeletePost();

  const [platform, setPlatform] = useState<Platform>("instagram");
  const [url, setUrl] = useState("");
  const [postedOn, setPostedOn] = useState(brusselsDay());
  const [summary, setSummary] = useState("");
  const [takeaway, setTakeaway] = useState("");
  const [liked, setLiked] = useState(false);
  const [commented, setCommented] = useState(false);
  const [saved, setSaved] = useState(false);

  const canTrack = supabaseConfigured && !!session;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!summary.trim() && !url.trim()) return;
    addPost.mutate(
      { platform, url: url.trim(), postedOn, summary: summary.trim(), takeaway: takeaway.trim(), liked, commented, saved },
      {
        onSuccess: () => {
          setUrl("");
          setSummary("");
          setTakeaway("");
          setLiked(false);
          setCommented(false);
          setSaved(false);
        },
      }
    );
  };

  const platformMeta = (p: Platform) => PLATFORMS.find((x) => x.value === p);

  return (
    <div>
      {!supabaseConfigured && <SetupBanner />}
      <h1 className="text-xl font-black text-green-900">Social Log 📸</h1>
      <p className="text-xs text-stone-500">
        Instagram can't be auto-tracked, so this is your journal: saw it, engaged, learned this.
      </p>

      <div className="mt-3 flex gap-2">
        {QUICK_LINKS.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-xl shadow-sm ring-1 ring-green-100 transition hover:shadow-md"
          >
            {l.emoji}
          </a>
        ))}
      </div>

      {!canTrack ? (
        <EmptyState
          emoji="🔒"
          title="Sign in to log posts"
          hint="Each logged post with a takeaway is +5 XP."
        />
      ) : (
        <>
          <form onSubmit={submit} className="mt-4 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-green-100">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlatform(p.value)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                    platform === p.value ? "bg-green-700 text-white" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Post link (optional)"
                className="min-w-0 flex-1 rounded-xl bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <input
                type="date"
                value={postedOn}
                max={brusselsDay()}
                onChange={(e) => setPostedOn(e.target.value)}
                className="rounded-xl bg-stone-50 px-2 py-2 text-xs"
              />
            </div>
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What was the post about?"
              className="mt-2 w-full rounded-xl bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <textarea
              value={takeaway}
              onChange={(e) => setTakeaway(e.target.value)}
              rows={2}
              placeholder="My takeaway 🌱"
              className="mt-2 w-full resize-y rounded-xl bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <div className="mt-2 flex items-center gap-3 text-xs font-bold text-stone-500">
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={liked} onChange={(e) => setLiked(e.target.checked)} className="accent-rose-500" />
                ❤️ liked
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={commented} onChange={(e) => setCommented(e.target.checked)} className="accent-sky-500" />
                💬 commented
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="accent-amber-500" />
                🔖 saved
              </label>
              <button
                type="submit"
                disabled={addPost.isPending || (!summary.trim() && !url.trim())}
                className="ml-auto rounded-full bg-green-700 px-4 py-1.5 text-xs font-black text-white disabled:opacity-40"
              >
                Log it (+5 XP)
              </button>
            </div>
          </form>

          {postsQ.isLoading ? (
            <EmptyState emoji="🌱" title="Loading…" />
          ) : (postsQ.data ?? []).length === 0 ? (
            <EmptyState emoji="👀" title="No posts logged yet" hint="Saw something good of hers? Log it above." />
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {(postsQ.data ?? []).map((post) => (
                <article key={post.id} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{platformMeta(post.platform)?.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-stone-700">
                        {post.summary || platformMeta(post.platform)?.label}
                      </p>
                      {post.takeaway && (
                        <p className="mt-1 rounded-xl bg-green-50 p-2 text-xs text-green-900">🌱 {post.takeaway}</p>
                      )}
                      <p className="mt-1 text-[10px] text-stone-400">
                        {fmtDate(post.posted_on ?? post.created_at)}
                        {post.liked ? " · ❤️" : ""}
                        {post.commented ? " · 💬" : ""}
                        {post.saved ? " · 🔖" : ""}
                        {post.url && (
                          <>
                            {" · "}
                            <a href={post.url} target="_blank" rel="noreferrer" className="font-bold text-green-700">
                              open ↗
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => deletePost.mutate(post.id)}
                      className="text-stone-300 transition hover:text-rose-500"
                      aria-label="Delete log"
                    >
                      ✕
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      <p className="mt-6 text-center text-xs text-stone-400">
        Community homework lives in <Link to="/tasks" className="font-bold text-green-700">Tasks → Assignments</Link>.
      </p>
    </div>
  );
}
