-- Gab X-Port — Audit RLS (lecture seule, ne modifie rien)
-- À coller dans Supabase > SQL Editor. Chaque requête renvoie un tableau.
-- Les tables principales (profiles, companies, listings, conversations,
-- messages) ont été créées hors des migrations de ce dépôt : leurs policies
-- ne peuvent être vérifiées qu'ici.

-- 1. Tables du schéma public sans RLS activée (doit renvoyer 0 ligne).
select c.relname as table_sans_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- 2. Toutes les policies, pour relecture.
--    Points à vérifier :
--    - profiles    : SELECT/UPDATE limités à id = auth.uid() ; account_type non modifiable.
--    - companies   : INSERT/UPDATE avec owner_id = auth.uid().
--    - listings    : SELECT public limité à status = 'published' (ou owner_id = auth.uid()) ;
--                    DELETE/UPDATE avec owner_id = auth.uid() ; aucun INSERT direct.
--    - conversations : SELECT/INSERT seulement si auth.uid() in (participant_1, participant_2).
--    - messages    : SELECT si participant de la conversation ;
--                    INSERT avec sender_id = auth.uid() ET participant de la conversation ;
--                    UPDATE si participant (le déclencheur messages_guard_update limite à read_at).
select tablename, policyname, cmd, roles, qual as using_expr, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, cmd, policyname;

-- 3. Droits directs des rôles anon et authenticated sur les tables.
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as droits
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;

-- 4. Fonctions SECURITY DEFINER exécutables par anon (à limiter au strict nécessaire).
select p.proname as fonction, pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and has_function_privilege('anon', p.oid, 'execute')
order by 1;

-- 5. Fonctions SECURITY DEFINER sans search_path fixé (risque de détournement).
select p.proname as fonction
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and not exists (
    select 1 from unnest(coalesce(p.proconfig, '{}')) as cfg where cfg like 'search_path=%'
  );

-- 6. Buckets de stockage : publics ou non, taille et types autorisés.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
-- Recommandé : listing-photos et profile-photos limités à 5 Mo et à
-- image/jpeg, image/png, image/webp ; policies INSERT/UPDATE/DELETE de
-- storage.objects limitées à (storage.foldername(name))[1] = auth.uid()::text.

-- 7. Définition actuelle des fonctions utilisées par le site, si l'une d'elles
--    n'est pas dans les migrations (search_contact_profiles, get_conversation_contacts…).
select p.proname, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('search_contact_profiles', 'get_conversation_contacts', 'handle_new_user');
