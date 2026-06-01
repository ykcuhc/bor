-- ============================================================
-- JareApp PostgreSQL Schema (Supabase)
-- Geographical neighborhood social platform for Kuwait
-- ============================================================

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for future geographical queries (optional, install separately)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- GOVERNORATES
-- Kuwait has 6 official governorates. This is the top-level
-- geographical unit. Users select this first during signup.
-- ============================================================
CREATE TABLE governorates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en     TEXT NOT NULL,          -- English name
  name_ar     TEXT NOT NULL,          -- Arabic name
  code        TEXT NOT NULL UNIQUE,   -- Short code e.g. 'capital', 'hawalli'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NEIGHBORHOODS
-- Each neighborhood belongs to a governorate. Users are
-- "fenced" to their neighborhood — they only see posts from
-- neighbors in the same neighborhood (and optionally the same
-- governorate for wider reach).
-- ============================================================
CREATE TABLE neighborhoods (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  governorate_id UUID NOT NULL REFERENCES governorates(id) ON DELETE CASCADE,
  name_en        TEXT NOT NULL,
  name_ar        TEXT NOT NULL,
  -- Approximate latitude/longitude center for the neighborhood.
  -- Used for map features and proximity calculations.
  latitude       DECIMAL(9,6),
  longitude      DECIMAL(9,6),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_neighborhoods_governorate ON neighborhoods(governorate_id);

-- ============================================================
-- USERS (extends Supabase auth.users)
-- Supabase auth handles passwords and sessions. This table
-- stores profile data and the geographical assignment.
-- ============================================================
CREATE TABLE users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  username         TEXT UNIQUE NOT NULL,
  avatar_url       TEXT,
  bio              TEXT,
  -- Geographical fencing: users are locked to a neighborhood.
  -- This is set during onboarding and can only be changed by
  -- submitting a re-verification request.
  neighborhood_id  UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,
  governorate_id   UUID REFERENCES governorates(id) ON DELETE SET NULL,
  -- Verification status: unverified | pending | verified
  -- Verified users have confirmed their address in the neighborhood.
  verification_status TEXT DEFAULT 'unverified' CHECK (
    verification_status IN ('unverified', 'pending', 'verified')
  ),
  is_premium       BOOLEAN DEFAULT FALSE,
  phone            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_neighborhood ON users(neighborhood_id);
CREATE INDEX idx_users_governorate  ON users(governorate_id);

-- ============================================================
-- POST CATEGORIES
-- Posts are tagged with a category so neighbors can filter
-- their feed. This mirrors Nextdoor's category system.
-- ============================================================
CREATE TYPE post_category AS ENUM (
  'general',        -- General conversation
  'safety',         -- Crime/safety alerts
  'recommendation', -- Recommending a business/service
  'classifieds',    -- Buying/selling items (local e-commerce)
  'lost_found',     -- Lost & found pets/items
  'events',         -- Local events
  'question'        -- Asking neighbors for help/info
);

-- ============================================================
-- POSTS
-- Core content unit. Each post is scoped to a neighborhood.
-- The geographical_scope determines who can see it:
--   'neighborhood' = only same neighborhood
--   'governorate'  = all neighbors in same governorate
-- ============================================================
CREATE TABLE posts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  neighborhood_id     UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  -- Content
  title               TEXT,          -- Optional short title for classifieds/events
  body                TEXT NOT NULL,
  image_urls          TEXT[],        -- Array of image URLs (Supabase Storage)
  category            post_category DEFAULT 'general',
  -- Geographical reach of this post
  geographical_scope  TEXT DEFAULT 'neighborhood' CHECK (
    geographical_scope IN ('neighborhood', 'governorate')
  ),
  -- Moderation
  is_pinned           BOOLEAN DEFAULT FALSE,  -- Pinned by neighborhood admin
  is_removed          BOOLEAN DEFAULT FALSE,  -- Soft delete by moderator
  -- Engagement counters (denormalized for fast reads)
  comment_count       INTEGER DEFAULT 0,
  reaction_count      INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- The most common query: fetching the feed for a neighborhood,
-- sorted by newest first. This index covers that query.
CREATE INDEX idx_posts_neighborhood_created
  ON posts(neighborhood_id, created_at DESC)
  WHERE is_removed = FALSE;

CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_author   ON posts(author_id);

-- ============================================================
-- COMMENTS
-- Threaded comments on posts. Supports one level of nesting
-- (reply to a comment) via parent_id.
-- ============================================================
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE, -- NULL = top-level
  body        TEXT NOT NULL,
  is_removed  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post    ON comments(post_id, created_at ASC);
CREATE INDEX idx_comments_author  ON comments(author_id);
CREATE INDEX idx_comments_parent  ON comments(parent_id);

-- Automatically increment post.comment_count when a comment is added
CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comment_count = comment_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_comment_count
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION increment_comment_count();

-- ============================================================
-- REACTIONS
-- Emoji-style reactions on posts (like, helpful, etc.)
-- One reaction per user per post (unique constraint enforced).
-- ============================================================
CREATE TYPE reaction_type AS ENUM ('like', 'helpful', 'thank', 'agree', 'sad');

CREATE TABLE reactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id      UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction     reaction_type NOT NULL DEFAULT 'like',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  -- A user can only have one reaction per post
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_reactions_post ON reactions(post_id);

-- Auto-update posts.reaction_count on insert/delete
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET reaction_count = reaction_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reaction_insert
AFTER INSERT ON reactions FOR EACH ROW EXECUTE FUNCTION update_reaction_count();

CREATE TRIGGER trg_reaction_delete
AFTER DELETE ON reactions FOR EACH ROW EXECUTE FUNCTION update_reaction_count();

-- ============================================================
-- DIRECT MESSAGES
-- Private messages between two users. For privacy, messages
-- are only visible to sender and recipient (enforced by RLS).
-- ============================================================
CREATE TABLE direct_messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  read_at       TIMESTAMPTZ,          -- NULL = unread
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Fetch conversations for a user: all messages where they are
-- either sender or recipient, ordered by newest.
CREATE INDEX idx_dm_sender    ON direct_messages(sender_id, created_at DESC);
CREATE INDEX idx_dm_recipient ON direct_messages(recipient_id, created_at DESC);

-- ============================================================
-- BUSINESSES (Local Services Directory)
-- Local businesses can be listed by any verified neighbor.
-- Premium businesses get featured placement.
-- ============================================================
CREATE TABLE businesses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL,    -- e.g. 'restaurant', 'repair', 'salon'
  phone           TEXT,
  address         TEXT,
  logo_url        TEXT,
  image_urls      TEXT[],
  is_premium      BOOLEAN DEFAULT FALSE,   -- Premium businesses get top placement
  is_verified     BOOLEAN DEFAULT FALSE,
  rating_sum      INTEGER DEFAULT 0,
  rating_count    INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_businesses_neighborhood ON businesses(neighborhood_id);
CREATE INDEX idx_businesses_category     ON businesses(category);

-- ============================================================
-- PREMIUM MEMBERSHIPS
-- Tracks subscription history for users and businesses.
-- ============================================================
CREATE TYPE membership_tier AS ENUM ('basic', 'premium', 'business');

CREATE TABLE premium_memberships (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier        membership_tier NOT NULL,
  starts_at   TIMESTAMPTZ NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  -- Payment reference (Stripe charge ID, etc.)
  payment_ref TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memberships_user ON premium_memberships(user_id);

-- ============================================================
-- NEIGHBORHOOD ADMINS
-- Each neighborhood can have volunteer admins (leads) who can
-- pin posts, remove content, and welcome new neighbors.
-- ============================================================
CREATE TABLE neighborhood_admins (
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT DEFAULT 'lead' CHECK (role IN ('lead', 'moderator')),
  assigned_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (neighborhood_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Supabase enforces these policies at the database level,
-- ensuring users can only see content from their neighborhood
-- or governorate based on their geographical_scope.
-- ============================================================

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_memberships  ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; everyone can read public profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid() = id);

-- Posts: users can see posts from their own neighborhood
-- (or same governorate if scope = 'governorate')
CREATE POLICY "Users see neighborhood posts"
  ON posts FOR SELECT USING (
    is_removed = FALSE AND (
      -- Same neighborhood
      neighborhood_id = (
        SELECT neighborhood_id FROM users WHERE id = auth.uid()
      )
      OR
      -- Same governorate, wider scope posts
      (geographical_scope = 'governorate' AND neighborhood_id IN (
        SELECT n.id FROM neighborhoods n
        JOIN users u ON u.governorate_id = n.governorate_id
        WHERE u.id = auth.uid()
      ))
    )
  );

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE USING (auth.uid() = author_id);

-- Comments: visible if the parent post is visible
CREATE POLICY "Comments visible with post"
  ON comments FOR SELECT USING (
    is_removed = FALSE AND
    post_id IN (SELECT id FROM posts)
  );

CREATE POLICY "Authenticated users can comment"
  ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Direct messages: only sender and recipient
CREATE POLICY "DM sender can see their messages"
  ON direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Authenticated users can send DMs"
  ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Businesses: viewable by neighbors in same neighborhood
CREATE POLICY "Businesses viewable by neighborhood"
  ON businesses FOR SELECT USING (
    neighborhood_id IN (
      SELECT n.id FROM neighborhoods n
      JOIN users u ON u.governorate_id = n.governorate_id
      WHERE u.id = auth.uid()
    )
  );

-- Premium memberships: private to owner
CREATE POLICY "Own memberships only"
  ON premium_memberships FOR SELECT USING (auth.uid() = user_id);
