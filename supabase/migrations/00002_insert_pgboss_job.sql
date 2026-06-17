-- Enqueue pg-boss jobs from the app via RPC.
-- The pgboss schema and the per-queue partitions are created by the worker
-- on startup (boss.start() + createQueue), so the worker must have started
-- at least once before jobs can be inserted. plpgsql resolves table
-- references at execution time, so this function can be created first.

create or replace function public.insert_pgboss_job(job_name text, job_data jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Callers may pass a JSON-encoded string instead of a JSON object
  -- (e.g. supabase-js with JSON.stringify). Unwrap it so the worker
  -- always receives an object in job.data.
  if jsonb_typeof(job_data) = 'string' then
    job_data := (job_data #>> '{}')::jsonb;
  end if;

  insert into pgboss.job (name, data)
  values (job_name, job_data);
end;
$$;

revoke all on function public.insert_pgboss_job(text, jsonb) from public;
grant execute on function public.insert_pgboss_job(text, jsonb) to authenticated, service_role;
