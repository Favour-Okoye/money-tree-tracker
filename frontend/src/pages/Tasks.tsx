import { useRef, useState, type FormEvent } from "react";
import { Actions } from "./Actions";
import {
  openAttachment,
  useAddAssignment,
  useAssignments,
  useDeleteAssignment,
  useSetAssignmentStatus,
  type AssignmentRow,
  type AssignmentSource,
  type AssignmentStatus,
} from "../lib/socialQueries";
import { useAuth } from "../lib/auth";
import { supabaseConfigured } from "../lib/supabase";
import { brusselsDay, fmtDate } from "../lib/format";
import { EmptyState } from "../components/EmptyState";

const SOURCES: { value: AssignmentSource; label: string }[] = [
  { value: "whatsapp", label: "💬 WhatsApp" },
  { value: "hub", label: "🏛️ Wealth Embassy" },
  { value: "skool", label: "🏫 Skool" },
  { value: "other", label: "🔗 Other" },
];

const STATUS_FLOW: { value: AssignmentStatus; label: string; cls: string }[] = [
  { value: "todo", label: "🕒 To do", cls: "bg-stone-100 text-stone-500" },
  { value: "doing", label: "✍️ Doing", cls: "bg-amber-100 text-amber-700" },
  { value: "done", label: "✅ Done", cls: "bg-green-100 text-green-700" },
  { value: "missed", label: "😬 Missed", cls: "bg-rose-100 text-rose-600" },
];

function AssignmentCard({ assignment }: { assignment: AssignmentRow }) {
  const setStatus = useSetAssignmentStatus();
  const del = useDeleteAssignment();
  const source = SOURCES.find((s) => s.value === assignment.source);
  const today = brusselsDay();
  const overdue =
    assignment.due_on &&
    assignment.due_on < today &&
    (assignment.status === "todo" || assignment.status === "doing");

  return (
    <article className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-green-100">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-bold ${
              assignment.status === "done" ? "text-stone-400 line-through" : "text-stone-700"
            }`}
          >
            {assignment.title}
          </p>
          {assignment.details && (
            <p className="mt-0.5 whitespace-pre-wrap text-xs text-stone-500">{assignment.details}</p>
          )}
          <p className="mt-1 text-[10px] text-stone-400">
            {source?.label} · given {fmtDate(assignment.assigned_on)}
            {assignment.due_on && (
              <span className={overdue ? "font-black text-rose-500" : ""}>
                {" "}· due {fmtDate(assignment.due_on)}
              </span>
            )}
            {assignment.attachment_path && (
              <>
                {" · "}
                <button
                  onClick={() => void openAttachment(assignment.attachment_path!)}
                  className="font-bold text-green-700 underline"
                >
                  📎 open file
                </button>
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => del.mutate(assignment)}
          className="text-stone-300 transition hover:text-rose-500"
          aria-label="Delete assignment"
        >
          ✕
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {STATUS_FLOW.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatus.mutate({ assignment, status: s.value })}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              assignment.status === s.value ? `${s.cls} ring-2 ring-green-300` : "bg-stone-50 text-stone-400"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </article>
  );
}

function Assignments() {
  const { session } = useAuth();
  const assignmentsQ = useAssignments();
  const addAssignment = useAddAssignment();

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [source, setSource] = useState<AssignmentSource>("whatsapp");
  const [dueOn, setDueOn] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  if (!supabaseConfigured || !session) {
    return (
      <EmptyState
        emoji="📋"
        title="Sign in to track assignments"
        hint="The homework from her WhatsApp community lives here — with the PDFs attached."
      />
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    addAssignment.mutate(
      { title: title.trim(), details: details.trim(), source, dueOn, file },
      {
        onSuccess: () => {
          setTitle("");
          setDetails("");
          setDueOn("");
          setFile(null);
          if (fileInput.current) fileInput.current.value = "";
        },
        onError: (err) => setError(err instanceof Error ? err.message : "Upload failed"),
      }
    );
  };

  const assignments = assignmentsQ.data ?? [];
  const active = assignments.filter((a) => a.status === "todo" || a.status === "doing");
  const finished = assignments.filter((a) => a.status === "done" || a.status === "missed");

  return (
    <div>
      <form onSubmit={submit} className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-green-100">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Assignment, e.g. Solve the 5 problems from the PDF"
          className="w-full rounded-xl bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={2}
          placeholder="Details (optional)"
          className="mt-2 w-full resize-y rounded-xl bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as AssignmentSource)}
            className="rounded-xl bg-stone-50 px-2 py-2 text-xs font-bold text-stone-600"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueOn}
            min={brusselsDay()}
            onChange={(e) => setDueOn(e.target.value)}
            className="rounded-xl bg-stone-50 px-2 py-2 text-xs"
          />
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="max-w-[180px] text-xs text-stone-500 file:mr-2 file:rounded-full file:border-0 file:bg-green-50 file:px-2.5 file:py-1.5 file:text-xs file:font-bold file:text-green-800"
          />
          <button
            type="submit"
            disabled={addAssignment.isPending || !title.trim()}
            className="ml-auto rounded-full bg-green-700 px-4 py-1.5 text-xs font-black text-white disabled:opacity-40"
          >
            {addAssignment.isPending ? "Saving…" : "+ Add"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs font-bold text-rose-600">{error}</p>}
      </form>

      {assignmentsQ.isLoading ? (
        <EmptyState emoji="🌱" title="Loading…" />
      ) : assignments.length === 0 ? (
        <EmptyState
          emoji="📋"
          title="No assignments yet"
          hint="Next time the community sends homework, add it here — attach the PDF too. Done = +25 XP."
        />
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-2">
            {active.map((a) => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}
          </div>
          {finished.length > 0 && (
            <>
              <h2 className="mt-5 text-xs font-black uppercase tracking-wide text-stone-400">
                History ({finished.length})
              </h2>
              <div className="mt-2 flex flex-col gap-2">
                {finished.map((a) => (
                  <AssignmentCard key={a.id} assignment={a} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export function Tasks() {
  const [tab, setTab] = useState<"actions" | "assignments">("actions");
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-green-100">
        <button
          onClick={() => setTab("actions")}
          className={`rounded-full py-1.5 text-sm font-black transition ${
            tab === "actions" ? "bg-green-700 text-white shadow" : "text-stone-400"
          }`}
        >
          🎯 My Actions
        </button>
        <button
          onClick={() => setTab("assignments")}
          className={`rounded-full py-1.5 text-sm font-black transition ${
            tab === "assignments" ? "bg-green-700 text-white shadow" : "text-stone-400"
          }`}
        >
          📋 Assignments
        </button>
      </div>
      {tab === "actions" ? <Actions /> : <Assignments />}
    </div>
  );
}
