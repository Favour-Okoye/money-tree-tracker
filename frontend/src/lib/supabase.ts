import { createClient } from "@supabase/supabase-js";

// The anon key is public by design; row-level security is what protects the data.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && anon ? createClient(url, anon) : null;

/** False until frontend/.env.local (or the repo build variables) are filled in.
 *  The app still works read-only: catalog browsing needs no backend. */
export const supabaseConfigured = supabase !== null;
