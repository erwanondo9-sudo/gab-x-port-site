-- Gab X-Port — Synchronisation multi-appareils (favoris + historique)
-- À exécuter une seule fois dans Supabase > SQL Editor.
--
-- Les favoris sont déjà stockés dans public.listing_favorites (migration
-- 202611010004). Ce script ajoute la lecture et l'effacement de l'historique
-- personnel, et fait remonter en tête la dernière consultation d'une annonce.

-- 1. Une nouvelle consultation met à jour la date au lieu de l'ignorer,
--    sans créer de doublon : le compteur de vues uniques reste exact.
create or replace function public.record_listing_view(p_listing_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentification requise';
  end if;

  insert into public.listing_views(listing_id, viewer_id, viewed_at)
  select l.id::text, v_user_id, now()
  from public.listings l
  where l.id::text = p_listing_id
    and l.owner_id <> v_user_id
  on conflict (listing_id, viewer_id)
  do update set viewed_at = excluded.viewed_at;
end;
$$;

-- 2. Historique du membre connecté, le plus récent d'abord (100 entrées max).
create or replace function public.get_my_listing_history()
returns table(listing_id text, viewed_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select v.listing_id, v.viewed_at
  from public.listing_views v
  where v.viewer_id = auth.uid()
  order by v.viewed_at desc
  limit 100;
$$;

-- 3. Effacement de l'historique du membre connecté, sur tous ses appareils.
create or replace function public.clear_my_listing_history()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.listing_views where viewer_id = auth.uid();
end;
$$;

-- 4. Index de lecture par membre (la clé primaire est déjà (listing_id, viewer_id)).
create index if not exists listing_views_viewer_id_idx
  on public.listing_views(viewer_id, viewed_at desc);

revoke all on function public.get_my_listing_history() from public;
revoke all on function public.clear_my_listing_history() from public;

grant execute on function public.get_my_listing_history() to authenticated;
grant execute on function public.clear_my_listing_history() to authenticated;
