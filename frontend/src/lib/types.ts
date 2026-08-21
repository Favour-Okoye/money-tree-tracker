export interface ChannelInfo {
  id: string;
  handle: string;
  title: string;
}

export interface CatalogVideo {
  id: string;
  title: string;
  published_at: string | null;
  first_seen_at: string;
  thumbnail: string;
  description_snippet: string;
  duration_s: number | null;
  is_short: boolean | null;
  removed: boolean;
  source: string;
}

export interface Catalog {
  channel: ChannelInfo;
  generated_at: string;
  count: number;
  videos: CatalogVideo[];
}

export interface Appearance {
  id: string;
  title: string;
  host_show: string;
  url: string;
  published_at: string | null;
  duration_s?: number | null;
  source?: string;          // 'manual' | 'radar'
  first_seen_at?: string;
}

export interface AppearancesFile {
  appearances: Appearance[];
}

export type MediaType = "video" | "appearance" | "podcast_episode";
export type WatchStatus = "queued" | "watching" | "watched" | "skipped";

export interface MediaStatusRow {
  media_type: MediaType;
  media_id: string;
  status: WatchStatus;
  watched_at: string | null;
  liked: boolean;
  commented: boolean;
  rating: number | null;
}

export interface NoteRow {
  id: string;
  source_type: string;
  source_id: string | null;
  body: string;
  takeaways: string[] | null;
  created_at: string;
}

/** A catalog video or guest appearance, unified for the library list. */
export interface LibraryItem extends CatalogVideo {
  mediaType: MediaType;
  hostShow?: string;
}
