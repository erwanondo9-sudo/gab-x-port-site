-- Ajoute la prise en charge de plusieurs photos par annonce.
-- photo_url reste renseignée avec la première image pour compatibilité.
alter table public.listings
  add column if not exists photo_urls text[] not null default '{}'::text[];

create or replace function public.create_listing(
  p_title text,
  p_company text,
  p_category text,
  p_direction text,
  p_description text,
  p_city text,
  p_listing_type text default 'Service',
  p_price text default 'À discuter',
  p_photo_url text default null,
  p_photo_urls text[] default '{}'::text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_account_type text := coalesce(
    auth.jwt() -> 'user_metadata' ->> 'account_type',
    auth.jwt() -> 'app_metadata' ->> 'account_type',
    ''
  );
  v_photos text[] := coalesce(array_remove(p_photo_urls, null), '{}'::text[]);
begin
  if v_user_id is null then
    raise exception 'Authentification requise';
  end if;

  if v_account_type not in ('compagnie', 'company', 'exportateur', 'independent') then
    raise exception 'La publication est réservée aux comptes Entreprise et Indépendant';
  end if;

  if nullif(trim(p_title), '') is null
     or nullif(trim(p_description), '') is null then
    raise exception 'Le titre et la description sont obligatoires';
  end if;

  if cardinality(v_photos) > 10 then
    raise exception 'Une annonce peut contenir 10 photos maximum';
  end if;

  insert into public.listings (
    owner_id, title, company, category, direction,
    description, city, listing_type, price, photo_url, photo_urls
  ) values (
    v_user_id, trim(p_title), trim(p_company), trim(p_category), trim(p_direction),
    trim(p_description), trim(p_city),
    coalesce(nullif(trim(p_listing_type), ''), 'Service'),
    coalesce(nullif(trim(p_price), ''), 'À discuter'),
    coalesce(nullif(trim(p_photo_url), ''), v_photos[1]),
    v_photos
  );
end;
$$;

revoke all on function public.create_listing(text, text, text, text, text, text, text, text, text, text[]) from public;
revoke all on function public.create_listing(text, text, text, text, text, text, text, text, text, text[]) from anon;
grant execute on function public.create_listing(text, text, text, text, text, text, text, text, text, text[]) to authenticated;
