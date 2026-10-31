-- Gab X-Port — Programme Membres Fondateurs
-- À exécuter une seule fois dans Supabase > SQL Editor.
-- Les 25 premiers comptes de type "compagnie" créés après activation sont automatiquement inscrits.
-- Les comptes individuels/exportateurs ne consomment pas de place.

create table if not exists public.founding_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  email text,
  granted_at timestamptz not null default now(),
  benefit_status text not null default 'active'
    check (benefit_status in ('active', 'suspended', 'revoked'))
);

alter table public.founding_members enable row level security;
revoke all on public.founding_members from anon, authenticated;

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

  -- Verrou transactionnel : deux inscriptions simultanées ne peuvent pas dépasser 25.
  perform pg_advisory_xact_lock(hashtext('gabxport_founding_members_25'));
  select count(*) into v_count from public.founding_members;

  if v_count < 25 then
    insert into public.founding_members(user_id, company_name, email)
    values (new.id, coalesce(v_name, 'Entreprise à renseigner'), new.email)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_founding_member on auth.users;
create trigger on_auth_user_created_founding_member
after insert on auth.users
for each row execute function public.register_founding_company();

-- Permet à chaque entreprise connectée de consulter uniquement son propre statut.
create or replace function public.get_my_founding_member_status()
returns table (
  is_founding_member boolean,
  granted_at timestamptz,
  benefit_status text,
  company_name text,
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
    greatest(0, 25 - (select count(*)::integer from public.founding_members));
$$;

revoke all on function public.get_my_founding_member_status() from public, anon;
grant execute on function public.get_my_founding_member_status() to authenticated;

-- Contrôle administratif dans Supabase SQL Editor :
-- select user_id, company_name, email, granted_at, benefit_status
-- from public.founding_members order by granted_at asc;
