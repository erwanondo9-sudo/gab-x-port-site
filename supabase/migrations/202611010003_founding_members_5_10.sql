-- Gab X-Port — Ajustement du programme Membres Fondateurs
-- 5 premières entreprises : gratuité à vie.
-- 10 suivantes : réduction permanente de 50 %.
-- À exécuter après les migrations 001 et 002.

-- Recalcule les avantages selon l'ordre d'attribution et limite le programme à 15 places.
with ranked as (
  select
    user_id,
    row_number() over (order by granted_at asc, user_id asc) as position
  from public.founding_members
)
update public.founding_members fm
set
  benefit_tier = case
    when ranked.position <= 5 then 'founder_free'
    else 'founder_discount'
  end,
  discount_percent = case
    when ranked.position <= 5 then 100
    else 50
  end,
  benefit_status = case
    when ranked.position <= 15 then fm.benefit_status
    else 'revoked'
  end
from ranked
where fm.user_id = ranked.user_id;

create or replace function public.register_founding_company()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_type text;
  v_name text;
  v_count integer;
begin
  v_type := coalesce(new.raw_user_meta_data ->> 'account_type', '');
  if v_type not in ('compagnie', 'company') then
    return new;
  end if;

  v_name := nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'company_name',
    new.raw_user_meta_data ->> 'full_name',
    ''
  )), '');

  -- Verrou transactionnel pour éviter que deux inscriptions prennent la même place.
  perform pg_advisory_xact_lock(hashtext('gabxport_founding_members_15'));
  select count(*) into v_count
  from public.founding_members
  where benefit_status <> 'revoked';

  if v_count < 15 then
    insert into public.founding_members
      (user_id, company_name, email, benefit_tier, discount_percent)
    values (
      new.id,
      coalesce(v_name, 'Entreprise à renseigner'),
      new.email,
      case when v_count < 5 then 'founder_free' else 'founder_discount' end,
      case when v_count < 5 then 100 else 50 end
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.get_my_founding_member_status()
returns table (
  is_founding_member boolean,
  granted_at timestamptz,
  benefit_status text,
  company_name text,
  benefit_tier text,
  discount_percent integer,
  remaining_places integer
)
language sql
security definer
set search_path = public, auth
as $$
  select
    exists (
      select 1 from public.founding_members fm
      where fm.user_id = auth.uid() and fm.benefit_status = 'active'
    ),
    (select fm.granted_at from public.founding_members fm where fm.user_id = auth.uid()),
    (select fm.benefit_status from public.founding_members fm where fm.user_id = auth.uid()),
    (select fm.company_name from public.founding_members fm where fm.user_id = auth.uid()),
    (select fm.benefit_tier from public.founding_members fm where fm.user_id = auth.uid()),
    (select fm.discount_percent from public.founding_members fm where fm.user_id = auth.uid()),
    greatest(0, 15 - (
      select count(*)::integer from public.founding_members
      where benefit_status <> 'revoked'
    ));
$$;

revoke all on function public.get_my_founding_member_status() from public, anon;
grant execute on function public.get_my_founding_member_status() to authenticated;
