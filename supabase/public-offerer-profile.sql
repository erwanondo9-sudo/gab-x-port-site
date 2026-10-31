-- Gab X-Port : profil public des offreurs
-- Exécuter ce script dans Supabase > SQL Editor après mise à jour du site.
-- Expose uniquement des informations professionnelles utiles. Aucune adresse privée ni e-mail de connexion.

drop function if exists public.get_public_offerer_profile(uuid);

create function public.get_public_offerer_profile(p_user_id uuid)
returns table (
  id uuid,
  display_name text,
  country text,
  account_type text,
  activity text,
  company_website text,
  professional_phone text,
  contact_method text,
  contact_email text,
  whatsapp_phone text
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
    coalesce(nullif(c.legal_name, ''), nullif(p.full_name, ''), nullif(u.raw_user_meta_data->>'full_name',''), 'Membre Gab X-Port') as display_name,
    coalesce(nullif(c.country, ''), nullif(p.country, ''), nullif(u.raw_user_meta_data->>'country','')) as country,
    p.account_type,
    coalesce(nullif(u.raw_user_meta_data->>'independent_activity',''), nullif(u.raw_user_meta_data->>'company_activity','')) as activity,
    nullif(u.raw_user_meta_data->>'company_website','') as company_website,
    case
      when p.account_type in ('compagnie','company') then coalesce(nullif(u.raw_user_meta_data->>'company_phone',''), nullif(u.raw_user_meta_data->>'phone',''))
      when p.account_type = 'exportateur' then nullif(u.raw_user_meta_data->>'phone','')
      else null
    end as professional_phone,
    coalesce(nullif(u.raw_user_meta_data->>'public_contact_method',''), 'whatsapp') as contact_method,
    nullif(u.raw_user_meta_data->>'public_contact_email','') as contact_email,
    coalesce(nullif(u.raw_user_meta_data->>'public_whatsapp_phone',''), nullif(u.raw_user_meta_data->>'company_phone',''), nullif(u.raw_user_meta_data->>'phone',''), nullif(p.phone,'')) as whatsapp_phone
  from public.profiles as p
  left join auth.users as u on u.id = p.id
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
