import { Link } from "react-router-dom";
import type { LibraryItem, MediaStatusRow } from "../lib/types";
import { fmtDate, fmtDuration } from "../lib/format";

interface Props {
  item: LibraryItem;
  status?: MediaStatusRow;
  isNew: boolean;
}

export function VideoCard({ item, status, isNew }: Props) {
  const watched = status?.status === "watched";
  const duration = fmtDuration(item.duration_s);
  return (
    <Link
      to={`/library/${item.mediaType}/${item.id}`}
      className="flex gap-3 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-green-100 transition hover:shadow-md"
    >
      <div className="relative w-36 shrink-0 sm:w-44">
        <img
          src={item.thumbnail}
          alt=""
          loading="lazy"
          className={`aspect-video w-full rounded-xl object-cover ${watched ? "opacity-60" : ""}`}
        />
        {duration && (
          <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 text-[10px] font-bold text-white">
            {duration}
          </span>
        )}
        {watched && (
          <span className="absolute left-1 top-1 rounded-full bg-green-600 px-1.5 text-xs text-white">
            ✓
          </span>
        )}
        {isNew && (
          <span className="absolute -left-1 -top-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-green-900 shadow">
            NEW
          </span>
        )}
      </div>
      <div className="min-w-0 py-1">
        <div className="mb-0.5 flex flex-wrap gap-1">
          {item.mediaType === "appearance" && (
            <span className="rounded bg-purple-100 px-1.5 text-[10px] font-bold text-purple-700">
              🎙 {item.hostShow}
            </span>
          )}
          {item.is_short && (
            <span className="rounded bg-rose-100 px-1.5 text-[10px] font-bold text-rose-600">
              Short
            </span>
          )}
        </div>
        <h3
          className={`line-clamp-2 text-sm font-bold ${
            watched ? "text-stone-400" : "text-stone-800"
          }`}
        >
          {item.title}
        </h3>
        <p className="mt-1 text-xs text-stone-400">{fmtDate(item.published_at)}</p>
        {status?.rating ? (
          <p className="text-xs text-amber-500">{"★".repeat(status.rating)}</p>
        ) : null}
      </div>
    </Link>
  );
}
