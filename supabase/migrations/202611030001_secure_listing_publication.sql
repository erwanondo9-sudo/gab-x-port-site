-- Sécurise la publication des annonces au niveau de la base de données.
-- Seuls les comptes Entreprise et Indépendant peuvent créer une annonce.
-- L'insertion passe par create_listing ; les insertions directes sont interdites.

revoke insert on table public.listings from anon, authenticated;

create or replace function public.create_listing(
  p_title text,
  p_company text,
  p_category text,
  p_direction text,
  p_description text,
  p_city text,
  p_listing_type text default 'Service',
  p_price text default 'À discuter'
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

  insert into public.listings (
    owner_id, title, company, category, direction,
    description, city, listing_type, price
  ) values (
    v_user_id, trim(p_title), trim(p_company), trim(p_category), trim(p_direction),
    trim(p_description), trim(p_city), coalesce(nullif(trim(p_listing_type), ''), 'Service'),
    coalesce(nullif(trim(p_price), ''), 'À discuter')
  );
end;
$$;

revoke all on function public.create_listing(text, text, text, text, text, text, text, text) from public;
revoke all on function public.create_listing(text, text, text, text, text, text, text, text) from anon;
grant execute on function public.create_listing(text, text, text, text, text, text, text, text) to authenticated;
