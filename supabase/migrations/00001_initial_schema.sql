-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
CREATE TYPE user_role AS ENUM ('photographer', 'client');
CREATE TYPE gallery_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE photo_status AS ENUM ('uploaded', 'processing', 'ready', 'failed');
CREATE TYPE export_type AS ENUM ('zip_selected', 'zip_all');
CREATE TYPE export_status AS ENUM ('queued', 'processing', 'ready', 'failed');

-- PROFILES
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'photographer',
  studio_name TEXT,
  watermark_settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- GALLERIES
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status gallery_status NOT NULL DEFAULT 'draft',
  settings JSONB NOT NULL DEFAULT '{"privacy":"invite_only","allowDownloads":true,"watermarked":false,"proofingEnabled":true}'::jsonb,
  cover_photo_id UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photographers can manage own galleries" ON galleries FOR ALL USING (auth.uid() = owner_id);
-- NOTE: the "Clients can read member galleries" policy is created after
-- gallery_memberships below — policies validate referenced relations.

-- GALLERY MEMBERSHIPS
CREATE TABLE gallery_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(gallery_id, client_user_id)
);
ALTER TABLE gallery_memberships ENABLE ROW LEVEL SECURITY;

-- galleries policies reference gallery_memberships and vice versa, which
-- causes infinite RLS recursion if written as plain subqueries. These
-- SECURITY DEFINER helpers evaluate without RLS, breaking the cycle.
CREATE OR REPLACE FUNCTION public.is_gallery_member(g_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM gallery_memberships gm
    WHERE gm.gallery_id = g_id AND gm.client_user_id = auth.uid()
  );
$$;
CREATE OR REPLACE FUNCTION public.owns_gallery(g_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM galleries g
    WHERE g.id = g_id AND g.owner_id = auth.uid()
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_gallery_member(UUID), public.owns_gallery(UUID)
  TO anon, authenticated, service_role;

CREATE POLICY "Owner can manage memberships" ON gallery_memberships FOR ALL USING (
  public.owns_gallery(gallery_id)
);
CREATE POLICY "Client can read own memberships" ON gallery_memberships FOR SELECT USING (client_user_id = auth.uid());
CREATE POLICY "Clients can read member galleries" ON galleries FOR SELECT USING (
  public.is_gallery_member(id)
);

-- INVITATIONS
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage invitations" ON invitations FOR ALL USING (
  EXISTS (SELECT 1 FROM galleries g WHERE g.id = gallery_id AND g.owner_id = auth.uid())
);

-- PHOTOS
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_key TEXT NOT NULL,
  web_key TEXT,
  thumb_key TEXT,
  watermarked_key TEXT,
  metadata JSONB,
  status photo_status NOT NULL DEFAULT 'uploaded',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE galleries ADD CONSTRAINT fk_cover_photo FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photographers can manage own photos" ON photos FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Clients can read member gallery photos" ON photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM gallery_memberships gm WHERE gm.gallery_id = photos.gallery_id AND gm.client_user_id = auth.uid())
);

-- PROOF FAVORITES
CREATE TABLE proof_favorites (
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(gallery_id, photo_id, client_user_id)
);
ALTER TABLE proof_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own favorites" ON proof_favorites FOR ALL USING (
  client_user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM gallery_memberships gm WHERE gm.gallery_id = proof_favorites.gallery_id AND gm.client_user_id = auth.uid()
  )
);
CREATE POLICY "Photographer can read favorites" ON proof_favorites FOR SELECT USING (
  EXISTS (SELECT 1 FROM galleries g WHERE g.id = proof_favorites.gallery_id AND g.owner_id = auth.uid())
);

-- PROOF RATINGS
CREATE TABLE proof_ratings (
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 0 AND rating <= 5),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(gallery_id, photo_id, client_user_id)
);
ALTER TABLE proof_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own ratings" ON proof_ratings FOR ALL USING (
  client_user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM gallery_memberships gm WHERE gm.gallery_id = proof_ratings.gallery_id AND gm.client_user_id = auth.uid()
  )
);
CREATE POLICY "Photographer can read ratings" ON proof_ratings FOR SELECT USING (
  EXISTS (SELECT 1 FROM galleries g WHERE g.id = proof_ratings.gallery_id AND g.owner_id = auth.uid())
);

-- PROOF COMMENTS
CREATE TABLE proof_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE proof_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can manage own comments" ON proof_comments FOR ALL USING (
  client_user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM gallery_memberships gm WHERE gm.gallery_id = proof_comments.gallery_id AND gm.client_user_id = auth.uid()
  )
);
CREATE POLICY "Photographer can read comments" ON proof_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM galleries g WHERE g.id = proof_comments.gallery_id AND g.owner_id = auth.uid())
);

-- SUBMISSIONS
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can create own submissions" ON submissions FOR INSERT WITH CHECK (
  client_user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM gallery_memberships gm WHERE gm.gallery_id = submissions.gallery_id AND gm.client_user_id = auth.uid()
  )
);
CREATE POLICY "Clients can read own submissions" ON submissions FOR SELECT USING (client_user_id = auth.uid());
CREATE POLICY "Photographer can read submissions for own galleries" ON submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM galleries g WHERE g.id = submissions.gallery_id AND g.owner_id = auth.uid())
);

-- EXPORTS
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type export_type NOT NULL,
  zip_key TEXT,
  status export_status NOT NULL DEFAULT 'queued',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own exports" ON exports FOR ALL USING (requested_by = auth.uid());
CREATE POLICY "Photographer can read exports for own galleries" ON exports FOR SELECT USING (
  EXISTS (SELECT 1 FROM galleries g WHERE g.id = exports.gallery_id AND g.owner_id = auth.uid())
);

-- AUDIT EVENTS
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gallery_id UUID REFERENCES galleries(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photographer can read audit for own galleries" ON audit_events FOR SELECT USING (
  actor_user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM galleries g WHERE g.id = audit_events.gallery_id AND g.owner_id = auth.uid()
  )
);
CREATE POLICY "Service role can insert audit" ON audit_events FOR INSERT WITH CHECK (true);

-- DEV EMAILS
CREATE TABLE dev_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE dev_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read dev emails" ON dev_emails FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service can insert dev emails" ON dev_emails FOR INSERT WITH CHECK (true);

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, role)
  VALUES (NEW.id, COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'photographer'
  ));
  RETURN NEW;
END;
-- search_path must be pinned: this fires from GoTrue sessions whose
-- search_path is the auth schema, where "profiles" doesn't resolve.
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER galleries_updated_at
  BEFORE UPDATE ON galleries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- INDEXES
CREATE INDEX idx_galleries_owner ON galleries(owner_id);
CREATE INDEX idx_gallery_memberships_client ON gallery_memberships(client_user_id);
CREATE INDEX idx_gallery_memberships_gallery ON gallery_memberships(gallery_id);
CREATE INDEX idx_photos_gallery ON photos(gallery_id);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_invitations_gallery ON invitations(gallery_id);
CREATE INDEX idx_invitations_token_hash ON invitations(token_hash);
CREATE INDEX idx_proof_favorites_gallery ON proof_favorites(gallery_id);
CREATE INDEX idx_proof_favorites_client ON proof_favorites(client_user_id);
CREATE INDEX idx_audit_events_gallery ON audit_events(gallery_id);
CREATE INDEX idx_exports_gallery ON exports(gallery_id);
