# Supabase Migrations

## Setup

1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. Login: supabase login
3. Link project: supabase link --project-ref kfflaerplmnfhicfbmgl

## Run Migrations

supabase db push

## Local Development

supabase start
supabase db reset

## Apply to Remote

supabase db push --linked
