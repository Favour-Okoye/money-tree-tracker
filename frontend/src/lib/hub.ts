import { useQuery } from "@tanstack/react-query";

export interface HubResource {
  id: string; // slug on hubs.nestuge.com
  title: string;
  url: string;
  price: string; // "Free" | "$100" ...
  level: string | null;
  rating: number | null;
  rating_count: number | null;
}

interface HubFile {
  hub: { name: string; url: string };
  generated_at: string;
  resources: HubResource[];
}

const OWNER = (import.meta.env.VITE_GH_OWNER as string | undefined) ?? "Favour-Okoye";
const REPO = (import.meta.env.VITE_GH_REPO as string | undefined) ?? "money-tree-tracker";
const SOURCES = [
  `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/data/`,
  `${import.meta.env.BASE_URL}data/`,
];

async function fetchHub(): Promise<HubFile> {
  for (const base of SOURCES) {
    try {
      const resp = await fetch(`${base}hub.json`);
      if (resp.ok) return (await resp.json()) as HubFile;
    } catch {
      // next source
    }
  }
  throw new Error("Could not load hub.json");
}

export function useHub() {
  return useQuery({ queryKey: ["hub"], queryFn: fetchHub, staleTime: 60 * 60_000 });
}
