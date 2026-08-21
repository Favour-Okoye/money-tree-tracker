import { Link } from "react-router-dom";
import {
  useActionItems,
  useToggleActionItem,
  type ActionItemRow,
} from "../lib/bookQueries";
import { useAuth } from "../lib/auth";
import { supabaseConfigured } from "../lib/supabase";
import { brusselsDay, fmtDate } from "../lib/format";
import { EmptyState } from "../components/EmptyState";
import { SetupBanner } from "../components/SetupBanner";

const SOURCE_LABEL: Record<string, string> = {
  book_chapter: "📗 book",
  video: "🎬 video",
  appearance: "🎙 guest",
  assignment: "✅ assignment",
};

function Row({ item }: { item: ActionItemRow }) {
  const toggle = useToggleActionItem();
  const done = item.status === "done";
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100">
      <input
        type="checkbox"
        checked={done}
        onChange={(e) => toggle.mutate({ item, done: e.target.checked })}
        className="h-5 w-5 accent-green-600"
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold ${done ? "text-stone-400 line-through" : "text-stone-700"}`}>
          {item.title}
        </p>
        <p className="text-[10px] text-stone-400">
          {item.source_type ? `${SOURCE_LABEL[item.source_type] ?? item.source_type} · ` : ""}
          {item.due_on ? `due ${fmtDate(item.due_on)}` : "no due date"}
        </p>
      </div>
    </label>
  );
}

function Group({ title, items, tone }: { title: string; items: ActionItemRow[]; tone: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-4">
      <h2 className={`text-xs font-black uppercase tracking-wide ${tone}`}>
        {title} ({items.length})
      </h2>
      <div className="mt-2 flex flex-col gap-2">
        {items.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function Actions() {
  const { session } = useAuth();
  const itemsQ = useActionItems();

  if (!supabaseConfigured)
    return (
      <div>
        <SetupBanner />
        <EmptyState emoji="🎯" title="Action items live here" hint="Connect Supabase first." />
      </div>
    );
  if (!session)
    return (
      <EmptyState
        emoji="🎯"
        title="Sign in to see your action items"
        hint='They come from your book chapters and videos: "I will do X in 2 days".'
      />
    );
  if (itemsQ.isLoading) return <EmptyState emoji="🎯" title="Loading…" />;

  const items = itemsQ.data ?? [];
  const today = brusselsDay();
  const open = items.filter((i) => i.status === "open");
  const overdue = open.filter((i) => i.due_on && i.due_on < today);
  const dueToday = open.filter((i) => i.due_on === today);
  const upcoming = open.filter((i) => !i.due_on || i.due_on > today);
  const done = items.filter((i) => i.status === "done").slice(0, 10);

  return (
    <div>
      <h1 className="text-xl font-black text-green-900">My Actions 🎯</h1>
      <p className="text-xs text-stone-500">
        Promises you made to yourself — each one completed is +15 XP.
      </p>
      {open.length === 0 && done.length === 0 && (
        <EmptyState
          emoji="🌱"
          title="Nothing planted yet"
          hint={
            'Open a video reflection or a book chapter and add "I will…" actions.'
          }
        />
      )}
      <Group title="⏰ Overdue" items={overdue} tone="text-rose-600" />
      <Group title="🔥 Today" items={dueToday} tone="text-amber-600" />
      <Group title="🌤 Upcoming" items={upcoming} tone="text-green-800" />
      <Group title="✅ Done" items={done} tone="text-stone-400" />
      {open.length === 0 && done.length > 0 && (
        <p className="mt-6 text-center text-sm font-bold text-green-700">
          All caught up! Time to watch Grace 🌳
        </p>
      )}
      <p className="mt-6 text-center text-xs text-stone-400">
        Add actions from a <Link to="/library" className="font-bold text-green-700">video</Link> or a{" "}
        <Link to="/books" className="font-bold text-green-700">book chapter</Link>.
      </p>
    </div>
  );
}
