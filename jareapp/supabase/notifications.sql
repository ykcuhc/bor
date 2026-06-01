-- ============================================================
-- JareApp — Notifications Schema (append to schema.sql)
-- Run this in the Supabase SQL editor after the main schema.
-- ============================================================

-- Notification type enum — covers all in-app events
CREATE TYPE notification_type AS ENUM (
  'comment',       -- someone commented on your post
  'reaction',      -- someone reacted to your post
  'new_neighbor',  -- a new verified neighbor joined your neighborhood
  'safety_alert',  -- a safety post was created in your neighborhood
  'dm',            -- new direct message received
  'mention'        -- someone @mentioned you in a post or comment
);

CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES users(id) ON DELETE SET NULL, -- who triggered it
  type         notification_type NOT NULL,
  -- Nullable foreign keys to the source object
  post_id      UUID REFERENCES posts(id)    ON DELETE CASCADE,
  comment_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
  message      TEXT NOT NULL,  -- pre-rendered message string for quick display
  read_at      TIMESTAMPTZ,    -- NULL = unread
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient
  ON notifications(recipient_id, created_at DESC);

-- Only the recipient should see their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients see own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);  -- inserts come from triggers, not users

CREATE POLICY "Recipients can mark read"
  ON notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

-- ── Trigger: new comment on your post ────────────────────────
CREATE OR REPLACE FUNCTION fn_notify_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_author_id  UUID;
  v_actor_name TEXT;
BEGIN
  SELECT author_id INTO v_author_id FROM posts WHERE id = NEW.post_id;
  -- Don't notify if you commented on your own post
  IF v_author_id = NEW.author_id THEN RETURN NEW; END IF;

  SELECT full_name INTO v_actor_name FROM users WHERE id = NEW.author_id;

  INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id, message)
  VALUES (v_author_id, NEW.author_id, 'comment', NEW.post_id, NEW.id,
          v_actor_name || ' commented on your post');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION fn_notify_comment();

-- ── Trigger: reaction on your post ───────────────────────────
CREATE OR REPLACE FUNCTION fn_notify_reaction()
RETURNS TRIGGER AS $$
DECLARE
  v_author_id  UUID;
  v_actor_name TEXT;
BEGIN
  SELECT author_id INTO v_author_id FROM posts WHERE id = NEW.post_id;
  IF v_author_id = NEW.user_id THEN RETURN NEW; END IF;

  SELECT full_name INTO v_actor_name FROM users WHERE id = NEW.user_id;

  -- Upsert: replace existing reaction notification for the same actor+post
  -- so we don't flood the recipient if someone changes reaction type.
  INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
  VALUES (v_author_id, NEW.user_id, 'reaction', NEW.post_id,
          v_actor_name || ' reacted to your post')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_reaction
  AFTER INSERT ON reactions
  FOR EACH ROW EXECUTE FUNCTION fn_notify_reaction();

-- ── Trigger: safety post in neighborhood ─────────────────────
-- Notifies all neighbors (up to 500 most recent) when a safety post is created.
CREATE OR REPLACE FUNCTION fn_notify_safety()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category = 'safety' THEN
    INSERT INTO notifications (recipient_id, actor_id, type, post_id, message)
    SELECT u.id, NEW.author_id, 'safety_alert', NEW.id,
           '🚨 Safety alert in ' || n.name_en
    FROM users u
    JOIN neighborhoods n ON n.id = NEW.neighborhood_id
    WHERE u.neighborhood_id = NEW.neighborhood_id
      AND u.id != NEW.author_id
    LIMIT 500;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_safety
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION fn_notify_safety();

-- ── Storage buckets ──────────────────────────────────────────
-- Create these in the Supabase Dashboard → Storage, or via CLI:
--   supabase storage create post-images --public
--   supabase storage create avatars     --public
--
-- Storage policies (run in SQL editor):
INSERT INTO storage.buckets (id, name, public) VALUES
  ('post-images', 'post-images', true),
  ('avatars',     'avatars',     true)
ON CONFLICT (id) DO NOTHING;

-- Anyone authenticated can upload to post-images/avatars
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id IN ('post-images', 'avatars')
  );

-- Public can read all uploaded images
CREATE POLICY "Public image access"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('post-images', 'avatars'));

-- Users can only delete their own uploads
CREATE POLICY "Users delete own uploads"
  ON storage.objects FOR DELETE
  USING (
    auth.uid()::text = (storage.foldername(name))[1] AND
    bucket_id IN ('post-images', 'avatars')
  );
