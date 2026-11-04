-- Gab X-Port — Renforcement de la confidentialité et de l'intégrité des données
-- À exécuter une seule fois dans Supabase > SQL Editor, après 202611040001.
-- Aucune table, colonne ou fonction n'est renommée : les fonctions existantes
-- sont redéfinies avec la même signature.

-- ---------------------------------------------------------------------------
-- 1. Profil public : uniquement pour les comptes qui proposent des services.
--    Avant : tout membre connecté pouvait lire le numéro de téléphone d'un
--    compte Client à partir de son identifiant. Désormais, seuls les profils
--    Entreprise et Indépendant (selon profiles ou les métadonnées du compte)
--    et les membres ayant une annonce publiée sont exposés.
-- ---------------------------------------------------------------------------
create or replace function public.get_public_offerer_profile(p_user_id uuid)
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
      when p.account_type in ('exportateur','independent') then nullif(u.raw_user_meta_data->>'phone','')
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
  where p.id = p_user_id
    and (
      p.account_type in ('compagnie', 'company', 'exportateur', 'independent')
      or coalesce(u.raw_user_meta_data->>'account_type', '') in ('compagnie', 'company', 'exportateur', 'independent')
      or exists (select 1 from public.listings l where l.owner_id = p.id and l.status = 'published')
    );
end;
$$;

revoke all on function public.get_public_offerer_profile(uuid) from public, anon;
grant execute on function public.get_public_offerer_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Publication : limites de taille et photos limitées au dossier du membre.
--    Avant : n'importe quelle URL pouvait être enregistrée comme photo (pixel
--    de suivi, image d'un autre membre). Désormais, chaque photo doit provenir
--    du bucket listing-photos, dans le dossier de l'auteur de l'annonce.
-- ---------------------------------------------------------------------------
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
  v_prefix text;
  v_photo text;
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

  if char_length(trim(p_title)) > 140
     or char_length(trim(coalesce(p_company, ''))) > 120
     or char_length(trim(coalesce(p_city, ''))) > 120
     or char_length(trim(p_description)) > 5000 then
    raise exception 'Un des champs dépasse la longueur autorisée';
  end if;

  if cardinality(v_photos) > 10 then
    raise exception 'Une annonce peut contenir 10 photos maximum';
  end if;

  v_prefix := '/storage/v1/object/public/listing-photos/' || v_user_id::text || '/';
  foreach v_photo in array v_photos || coalesce(nullif(trim(p_photo_url), ''), v_photos[1])
  loop
    if v_photo is not null and (
         split_part(v_photo, '/storage/v1/', 1) !~ '^https://[a-z0-9]+\.supabase\.co$'
         or position(v_prefix in v_photo) <> position('/storage/v1/' in v_photo)
       ) then
      raise exception 'Photo refusée : elle doit être envoyée depuis le formulaire de publication';
    end if;
  end loop;

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

-- ---------------------------------------------------------------------------
-- 3. Messagerie : seule la confirmation de lecture peut être modifiée.
--    Le site met à jour read_at quand le destinataire ouvre une conversation.
--    Selon la policy UPDATE en place, un participant pouvait aussi réécrire le
--    texte ou l'expéditeur d'un message. Ce déclencheur l'interdit, quelle que
--    soit la policy. Les opérations d'administration (SQL Editor, service_role)
--    ne sont pas concernées.
-- ---------------------------------------------------------------------------
create or replace function public.guard_message_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or auth.role() = 'service_role' then
    return new;
  end if;

  if new.body is distinct from old.body
     or new.sender_id is distinct from old.sender_id
     or new.conversation_id is distinct from old.conversation_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Un message envoyé ne peut pas être modifié';
  end if;

  if new.read_at is distinct from old.read_at and old.sender_id = auth.uid() then
    raise exception 'Seul le destinataire peut marquer un message comme lu';
  end if;

  return new;
end;
$$;

drop trigger if exists messages_guard_update on public.messages;
create trigger messages_guard_update
before update on public.messages
for each row execute function public.guard_message_update();
