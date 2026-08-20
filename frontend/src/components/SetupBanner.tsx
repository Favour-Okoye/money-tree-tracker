export function SetupBanner() {
  return (
    <div className="mb-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <b>Browse-only mode.</b> Watched status, notes and XP switch on once Supabase is
      connected — see <code className="font-bold">SETUP.md</code> in the repo.
    </div>
  );
}
