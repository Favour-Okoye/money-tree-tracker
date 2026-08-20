const LINKS = [
  { emoji: "▶️", label: "YouTube — Grace Ofure Zone", url: "https://www.youtube.com/@graceofure" },
  { emoji: "📸", label: "Instagram — @grace_ofure", url: "https://www.instagram.com/grace_ofure" },
  { emoji: "📘", label: "Facebook", url: "https://www.facebook.com/gracedofure" },
  { emoji: "🏫", label: "Skool — All Access community (free)", url: "https://www.skool.com/grace-ofure-all-access-1598" },
  { emoji: "📚", label: "Her books", url: "https://www.graceofure.com/grace-ofure-my-books" },
  { emoji: "🔗", label: "Linktree — all her offers", url: "https://linktr.ee/graceofure" },
  { emoji: "🎧", label: "Podcast — The Elite Table", url: "https://open.spotify.com/search/The%20Elite%20Table%20Grace%20Ofure" },
];

export function More() {
  return (
    <div>
      <h1 className="text-xl font-black text-green-900">More 🌱</h1>

      <section className="mt-3">
        <h2 className="text-xs font-black uppercase tracking-wide text-stone-400">
          Grace, everywhere
        </h2>
        <div className="mt-2 flex flex-col gap-2">
          {LINKS.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm font-bold text-stone-700 shadow-sm ring-1 ring-green-100 transition hover:shadow-md"
            >
              <span className="text-xl">{link.emoji}</span>
              {link.label}
              <span className="ml-auto text-stone-300">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-green-50 p-4 text-sm text-green-900">
        <h2 className="font-black">📲 Install this app</h2>
        <p className="mt-1">
          <b>Android:</b> Chrome menu → <i>Install app</i>. <b>iPhone:</b> Safari Share →{" "}
          <i>Add to Home Screen</i>.
        </p>
      </section>

      <section className="mt-4 rounded-2xl bg-white p-4 text-xs text-stone-500 ring-1 ring-green-100">
        <h2 className="font-black text-stone-600">🗺️ Coming next</h2>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          <li>📗 Books &amp; chapter notes with action items (Phase 2)</li>
          <li>✅ WhatsApp assignments &amp; due dates (Phase 3)</li>
          <li>🚀 Her Moves — events &amp; programs with countdowns (Phase 4)</li>
          <li>🌳 Money tree, XP, streaks &amp; badges dashboard (Phase 5)</li>
        </ul>
      </section>
    </div>
  );
}
