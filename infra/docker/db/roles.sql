-- Set passwords for the internal roles the API services connect as.
-- Runs once on first database initialization.
ALTER USER authenticator WITH PASSWORD 'postgres';
ALTER USER supabase_auth_admin WITH PASSWORD 'postgres';
