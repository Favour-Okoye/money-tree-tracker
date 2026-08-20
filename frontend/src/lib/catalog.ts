import { useQuery } from "@tanstack/react-query";
import type { AppearancesFile, Catalog } from "./types";

const OWNER = (import.meta.env.VITE_GH_OWNER as string | undefined) ?? "Favour-Okoye";
const REPO = (import.meta.env.VITE_GH_REPO as string | undefined) ?? "money-tree-tracker";

// Live copy first (updates minutes after the poller commits, no redeploy needed),
// bundled snapshot second (offline / pre-publish fallback).
const SOURCES = [
  `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/data/`,
  `${import.meta.env.BASE_URL}data/`,
];

async function fetchJson<T>(name: string): Promise<T> {
  for (const base of SOURCES) {
    try {
      const resp = await fetch(`${base}${name}`);
      if (resp.ok) return (await resp.json()) as T;
    } catch {
      // try the next source
    }
  }
  throw new Error(`Could not load ${name} from any source`);
}

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: () => fetchJson<Catalog>("videos.json"),
    staleTime: 5 * 60_000,
  });
}

export function useAppearances() {
  return useQuery({
    queryKey: ["appearances"],
    queryFn: () => fetchJson<AppearancesFile>("appearances.json"),
    staleTime: 60 * 60_000,
  });
}
