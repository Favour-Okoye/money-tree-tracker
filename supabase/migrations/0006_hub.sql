-- MoneyTree migration 0006: allow Wealth Embassy hub trainings in statuses + notes

alter table public.media_status drop constraint media_status_media_type_check;
alter table public.media_status add constraint media_status_media_type_check
  check (media_type in ('video','podcast_episode','appearance','hub_resource'));

alter table public.notes drop constraint notes_source_type_check;
alter table public.notes add constraint notes_source_type_check
  check (source_type in ('video','podcast_episode','appearance','book','book_chapter',
                         'social_post','assignment','move','hub_resource','free'));
