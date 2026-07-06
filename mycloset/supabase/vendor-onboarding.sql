-- ─── Vendor Onboarding Schema ─────────────────────────────────────────────────
-- Run this in the Supabase SQL Editor before deploying vendor onboarding.
-- Dashboard → SQL Editor → New query → paste → Run

-- ─── Add vendor fields to existing users table ─────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_vendor     BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vendor_status TEXT;   -- active | suspended | closed

-- ─── Vendor Applications ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_applications (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status                      TEXT        NOT NULL DEFAULT 'draft',
  -- Step 1
  vendor_type                 TEXT,       -- individual | registered_business | official_brand | authorized_distributor
  -- Step 2: Business Information
  store_name                  TEXT,
  store_username              TEXT        UNIQUE,
  store_description           TEXT        CHECK (char_length(store_description) <= 1000),
  business_category           TEXT,
  business_type               TEXT,
  country                     TEXT        DEFAULT 'Kuwait',
  governorate                 TEXT,
  business_address            TEXT,
  website                     TEXT,
  social_links                JSONB       DEFAULT '{}',
  -- Step 3: Identity Verification
  legal_name                  TEXT,
  date_of_birth               DATE,
  identity_doc_type           TEXT,
  identity_doc_path           TEXT,
  identity_verification_status TEXT       DEFAULT 'pending',
  -- Step 4: Business Verification
  commercial_reg_path         TEXT,
  trade_license_path          TEXT,
  tax_reg_path                TEXT,
  distributor_cert_path       TEXT,
  business_verification_status TEXT       DEFAULT 'pending',
  -- Step 5: Store Setup
  store_logo                  TEXT,
  store_banner                TEXT,
  store_tagline               TEXT        CHECK (char_length(store_tagline) <= 150),
  about_store                 TEXT        CHECK (char_length(about_store) <= 2000),
  store_categories            TEXT[]      DEFAULT '{}',
  -- Step 6: Payment & Payout
  payout_holder_name          TEXT,
  payout_bank_name            TEXT,
  payout_iban                 TEXT,
  payout_account_number       TEXT,
  payout_method               TEXT        DEFAULT 'bank_transfer',
  -- Step 7: Shipping
  shipping_methods            JSONB       DEFAULT '[]',
  processing_time             TEXT,
  delivery_regions            TEXT[]      DEFAULT '{}',
  pickup_available            BOOLEAN     DEFAULT FALSE,
  shipping_fees               JSONB       DEFAULT '{}',
  free_shipping_threshold     NUMERIC,
  -- Step 8: Store Policies
  return_policy               TEXT,
  refund_policy               TEXT,
  warranty_policy             TEXT,
  cancellation_policy         TEXT,
  support_contact             TEXT,
  -- Step 9: Submission
  terms_accepted              BOOLEAN     DEFAULT FALSE,
  submitted_at                TIMESTAMPTZ,
  -- Admin Review
  reviewer_notes              TEXT,
  additional_info_requested   TEXT,
  rejection_reason            TEXT,
  reviewed_at                 TIMESTAMPTZ,
  -- Progress Tracking
  current_step                INTEGER     DEFAULT 1,
  completed_steps             INTEGER[]   DEFAULT '{}',
  -- Timestamps
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

-- One active application per user
CREATE UNIQUE INDEX IF NOT EXISTS vendor_applications_user_id_idx
  ON vendor_applications(user_id);

-- ─── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE vendor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own application"
  ON vendor_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own application"
  ON vendor_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft application"
  ON vendor_applications FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('draft', 'additional_info_required'));

-- ─── Auto-update updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_vendor_application_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER vendor_applications_updated_at
  BEFORE UPDATE ON vendor_applications
  FOR EACH ROW EXECUTE FUNCTION update_vendor_application_updated_at();

-- ─── Supabase Storage Buckets ──────────────────────────────────────────────────
-- Create these via Dashboard → Storage → New bucket:
--
-- Bucket 1: "vendor-uploads" (PRIVATE)
--   Max file size: 10MB
--   Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf
--
-- Bucket 2: "vendor-assets" (PUBLIC)
--   Max file size: 5MB
--   Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Storage RLS for vendor-uploads (Dashboard → Storage → vendor-uploads → Policies):
--   INSERT: (storage.foldername(name))[1] = auth.uid()::text
--   SELECT: (storage.foldername(name))[1] = auth.uid()::text
--
-- Storage RLS for vendor-assets (Dashboard → Storage → vendor-assets → Policies):
--   INSERT: (storage.foldername(name))[1] = auth.uid()::text
--   SELECT: true  (public read)
