-- Gab X-Port: suppression différée des comptes désactivés
-- À exécuter une seule fois dans Supabase SQL Editor.
create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.account_deletion_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now()
);

alter table public.account_deletion_requests enable row level security;
revoke all on public.account_deletion_requests from anon, authenticated;

create or replace function public.request_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.account_deletion_requests(user_id, requested_at)
  values (current_user_id, now())
  on conflict (user_id) do update set requested_at = excluded.requested_at;
end;
$$;

create or replace function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.account_deletion_requests
  where user_id = current_user_id;
end;
$$;

revoke all on function public.request_account_deletion() from public, anon;
revoke all on function public.cancel_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;
grant execute on function public.cancel_account_deletion() to authenticated;

-- Suppression quotidienne des comptes dont le délai de 30 jours est écoulé.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'gabxport-delete-deactivated-accounts') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'gabxport-delete-deactivated-accounts';
  end if;
end
$$;

select cron.schedule(
  'gabxport-delete-deactivated-accounts',
  '15 3 * * *',
  $job$
    delete from auth.users as u
    using public.account_deletion_requests as r
    where r.user_id = u.id
      and r.requested_at <= now() - interval '30 days';
  $job$
);
