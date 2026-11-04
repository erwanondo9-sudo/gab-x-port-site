-- Gab X-Port — Répartition définitive du programme Membres Fondateurs
-- 10 premières entreprises : gratuité à vie sur abonnements et publications.
-- 15 suivantes : réduction permanente de 50 % sur les abonnements Gab X-Port.
-- À exécuter après 202611010001_founding_members.sql dans Supabase SQL Editor.

alter table public.founding_members
  add column if not exists benefit_tier text,
  add column if not exists discount_percent integer not null default 0;

-- Mise à niveau des éventuels membres déjà inscrits :
-- les 10 premiers restent fondateurs gratuits, les 15 suivants reçoivent -50 %.
with ranked as (
  select user_id, row_number() over (order by granted_at asc, user_id asc) as position
  from public.founding_members
)
update public.founding_members fm
set benefit_tier = case when ranked.position <= 10 then 'founder_free' else 'founder_discount' end,
    discount_percent = case when ranked.position <= 10 then 100 else 50 end
from ranked
where fm.user_id = ranked.user_id;

alter table public.founding_members
  alter column benefit_tier set not null,
  alter column benefit_tier set default 'founder_discount';

alter table public.founding_members
  drop constraint if exists founding_members_benefit_tier_check;
alter table public.founding_members
  add constraint founding_members_benefit_tier_check
  check (benefit_tier in ('founder_free', 'founder_discount'));

alter table public.founding_members
  drop constraint if exists founding_members_discount_percent_check;
alter table public.founding_members
  add constraint founding_members_discount_percent_check
  check (discount_percent in (50, 100));

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

  -- Sérialise les inscriptions pour garantir les rangs 1 à 25 sans dépassement.
  perform pg_advisory_xact_lock(hashtext('gabxport_founding_members_25'));
  select count(*) into v_count from public.founding_members;

  if v_count < 25 then
    insert into public.founding_members
      (user_id, company_name, email, benefit_tier, discount_percent)
    values (
      new.id,
      coalesce(v_name, 'Entreprise à renseigner'),
      new.email,
      case when v_count < 10 then 'founder_free' else 'founder_discount' end,
      case when v_count < 10 then 100 else 50 end
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

-- Fonction de consultation du statut : le compte connecté ne voit que ses propres avantages.
drop function if exists public.get_my_founding_member_status();
create function public.get_my_founding_member_status()
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
    greatest(0, 25 - (select count(*)::integer from public.founding_members));
$$;

revoke all on function public.get_my_founding_member_status() from public, anon;
grant execute on function public.get_my_founding_member_status() to authenticated;

-- Vérification administrative :
-- select user_id, company_name, email, granted_at, benefit_tier, discount_percent, benefit_status
-- from public.founding_members order by granted_at asc;
