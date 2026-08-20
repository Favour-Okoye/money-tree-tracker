import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/library", label: "Library", icon: "🎬" },
  { to: "/books", label: "Books", icon: "📗" },
  { to: "/tasks", label: "Tasks", icon: "✅" },
  { to: "/moves", label: "Her Moves", icon: "🚀" },
  { to: "/more", label: "More", icon: "🌱" },
];

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-green-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl justify-around">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] font-bold transition ${
                isActive ? "text-green-700" : "text-stone-400 hover:text-stone-600"
              }`
            }
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
