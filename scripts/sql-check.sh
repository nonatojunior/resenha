#!/usr/bin/env bash
# Verificação opcional do SQL em um PostgreSQL local.
# Exige um servidor acessível via socket/tcp e as roles anon/authenticated (criadas abaixo).
set -euo pipefail

PSQL_HOST="${PSQL_HOST:-/tmp}"
PSQL_PORT="${PSQL_PORT:-55432}"
PSQL_USER="${PSQL_USER:-postgres}"

psql -h "$PSQL_HOST" -p "$PSQL_PORT" -U "$PSQL_USER" -v ON_ERROR_STOP=1 <<'SQL'
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;
create schema if not exists extensions;
SQL

psql -h "$PSQL_HOST" -p "$PSQL_PORT" -U "$PSQL_USER" -v ON_ERROR_STOP=1 \
  -f "$(dirname "$0")/../supabase/migrations/20261026000000_init.sql"
