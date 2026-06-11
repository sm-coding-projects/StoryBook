#!/bin/sh
# One-shot migration runner. Waits for GoTrue to finish its own migrations
# (auth.users must exist — the app schema has FKs and a trigger on it),
# then applies supabase/migrations/*.sql exactly once each.
set -e

export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
PSQL="psql -h db -U postgres -d postgres -v ON_ERROR_STOP=1"

echo "[db-init] Waiting for Postgres..."
until psql -h db -U postgres -d postgres -c "select 1" >/dev/null 2>&1; do sleep 2; done

echo "[db-init] Waiting for GoTrue migrations (auth.users)..."
until [ "$($PSQL -tA -c "select to_regclass('auth.users') is not null")" = "t" ]; do sleep 2; done

$PSQL -c "create table if not exists public._app_migrations(name text primary key, applied_at timestamptz not null default now())" >/dev/null

for f in /migrations/*.sql; do
  name=$(basename "$f")
  applied=$($PSQL -tA -c "select count(*) from public._app_migrations where name='$name'")
  if [ "$applied" = "0" ]; then
    echo "[db-init] Applying $name"
    $PSQL --single-transaction -f "$f" >/dev/null
    $PSQL -c "insert into public._app_migrations(name) values ('$name')" >/dev/null
  else
    echo "[db-init] Skipping $name (already applied)"
  fi
done

echo "[db-init] Granting API role access..."
$PSQL >/dev/null <<'SQL'
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
-- PostgREST may have cached an empty schema before tables existed
NOTIFY pgrst, 'reload schema';
SQL

echo "[db-init] Done."
