-- Seed data for local development
-- Note: In local dev, Supabase auto-creates users via the dashboard.
-- This seed creates demo data assuming users are created via the setup script.

-- The setup script will create:
-- Photographer: photographer@demo.com / password123
-- Client: client@demo.com / password123

-- After users are created via auth, the trigger auto-creates profiles.
-- Gallery and photo data are seeded via the setup script (infra/scripts/seed.ts)
-- because we need the actual user IDs from auth.
