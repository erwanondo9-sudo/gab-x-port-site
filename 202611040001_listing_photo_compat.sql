-- Gab X-Port — Compatibilité de la colonne photo_url
-- À exécuter une seule fois dans Supabase > SQL Editor, après les migrations du 03/11.
--
-- Constat (04/11/2026) : en production, la lecture des annonces échouait avec
-- « column listings.photo_url does not exist » (code 42703). La fonction
-- create_listing de la migration 202611030002 écrit pourtant dans photo_url.
-- Cette migration rétablit la colonne sans rien renommer ni supprimer :
-- photo_url reste la première photo, photo_urls contient toutes les photos.

alter table public.listings
  add column if not exists photo_url text;

update public.listings
set photo_url = photo_urls[1]
where photo_url is null
  and cardinality(photo_urls) > 0;
