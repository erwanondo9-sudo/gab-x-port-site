-- Gab X-Port : lecture publique minimale des profils des annonceurs
-- À exécuter une seule fois dans Supabase > SQL Editor.
-- Cette fonction ne révèle ni téléphone, ni adresse personnelle, ni e-mail.
-- Elle évite d'ouvrir en lecture directe les tables profiles et companies.

create or replace function public.get_public_offerer_profile(p_user_id uuid)
returns table (
  id uuid,
  display_name text,
  country text,
  account_type text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  select
    p.id,
    coalesce(nullif(c.legal_name, ''), nullif(p.full_name, ''), 'Membre Gab X-Port') as display_name,
    coalesce(nullif(c.country, ''), nullif(p.country, '')) as country,
    p.account_type
  from public.profiles as p
  left join lateral (
    select co.legal_name, co.country
    from public.companies as co
    where co.owner_id = p.id
    order by co.id
    limit 1
  ) as c on true
  where p.id = p_user_id;
end;
$$;

revoke all on function public.get_public_offerer_profile(uuid) from public, anon;
grant execute on function public.get_public_offerer_profile(uuid) to authenticated;
