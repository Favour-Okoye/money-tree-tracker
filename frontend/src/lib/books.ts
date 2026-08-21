import { useQuery } from "@tanstack/react-query";

export interface Book {
  slug: string;
  title: string;
  subtitle: string | null;
  emoji: string;
  buy_url: string;
}

interface BooksFile {
  books: Book[];
}

const OWNER = (import.meta.env.VITE_GH_OWNER as string | undefined) ?? "Favour-Okoye";
const REPO = (import.meta.env.VITE_GH_REPO as string | undefined) ?? "money-tree-tracker";
const SOURCES = [
  `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/data/`,
  `${import.meta.env.BASE_URL}data/`,
];

async function fetchBooks(): Promise<Book[]> {
  for (const base of SOURCES) {
    try {
      const resp = await fetch(`${base}books.json`);
      if (resp.ok) return ((await resp.json()) as BooksFile).books;
    } catch {
      // try next source
    }
  }
  throw new Error("Could not load books.json");
}

export function useBooks() {
  return useQuery({ queryKey: ["books"], queryFn: fetchBooks, staleTime: 60 * 60_000 });
}
