-- Statistiques privées des annonces Gab X-Port.
-- Une vue = un compte visiteur unique par annonce.
-- Un favori = un compte ayant enregistré l'annonce.

create table if not exists public.listing_views (
  listing_id text not null,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (listing_id, viewer_id)
);

create table if not exists public.listing_favorites (
  listing_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);

create index if not exists listing_views_listing_id_idx on public.listing_views(listing_id);
create index if not exists listing_favorites_listing_id_idx on public.listing_favorites(listing_id);

alter table public.listing_views enable row level security;
alter table public.listing_favorites enable row level security;

revoke all on public.listing_views from anon, authenticated;
revoke all on public.listing_favorites from anon, authenticated;

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

  insert into public.listing_views(listing_id, viewer_id)
  select l.id::text, v_user_id
  from public.listings l
  where l.id::text = p_listing_id
    and l.owner_id <> v_user_id
  on conflict (listing_id, viewer_id) do nothing;
end;
$$;

create or replace function public.set_listing_favorite(p_listing_id text, p_is_favorite boolean)
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

  if p_is_favorite then
    insert into public.listing_favorites(listing_id, user_id)
    select l.id::text, v_user_id
    from public.listings l
    where l.id::text = p_listing_id
      and l.owner_id <> v_user_id
    on conflict (listing_id, user_id) do nothing;
  else
    delete from public.listing_favorites
    where listing_id = p_listing_id and user_id = v_user_id;
  end if;
end;
$$;

create or replace function public.get_my_listing_metrics()
returns table(listing_id text, views_count bigint, favorites_count bigint)
language sql
security definer
set search_path = public
as $$
  select l.id::text,
         count(distinct v.viewer_id)::bigint,
         count(distinct f.user_id)::bigint
  from public.listings l
  left join public.listing_views v on v.listing_id = l.id::text
  left join public.listing_favorites f on f.listing_id = l.id::text
  where l.owner_id = auth.uid()
  group by l.id;
$$;

create or replace function public.get_my_listing_favorites()
returns setof text
language sql
security definer
set search_path = public
as $$
  select f.listing_id
  from public.listing_favorites f
  where f.user_id = auth.uid();
$$;

revoke all on function public.record_listing_view(text) from public;
revoke all on function public.set_listing_favorite(text, boolean) from public;
revoke all on function public.get_my_listing_metrics() from public;
revoke all on function public.get_my_listing_favorites() from public;

grant execute on function public.record_listing_view(text) to authenticated;
grant execute on function public.set_listing_favorite(text, boolean) to authenticated;
grant execute on function public.get_my_listing_metrics() to authenticated;
grant execute on function public.get_my_listing_favorites() to authenticated;
