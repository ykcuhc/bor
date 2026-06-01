-- ============================================================
-- JareApp Seed Data
-- Run AFTER schema.sql. Inserts Kuwait governorates and
-- neighborhoods. Users/posts are handled by the app.
-- ============================================================

-- ── Governorates ─────────────────────────────────────────────
INSERT INTO governorates (id, name_en, name_ar, code) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Capital Governorate',          'محافظة العاصمة',      'capital'),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Hawalli Governorate',           'محافظة حولي',         'hawalli'),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Farwaniya Governorate',         'محافظة الفروانية',    'farwaniya'),
  ('a1b2c3d4-0001-0001-0001-000000000004', 'Mubarak Al-Kabeer Governorate', 'محافظة مبارك الكبير', 'mubarak_kabeer'),
  ('a1b2c3d4-0001-0001-0001-000000000005', 'Ahmadi Governorate',            'محافظة الأحمدي',      'ahmadi'),
  ('a1b2c3d4-0001-0001-0001-000000000006', 'Jahra Governorate',             'محافظة الجهراء',      'jahra')
ON CONFLICT (id) DO NOTHING;

-- ── Capital Governorate Neighborhoods ────────────────────────
INSERT INTO neighborhoods (governorate_id, name_en, name_ar, latitude, longitude) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Kuwait City',       'مدينة الكويت',  29.3697, 47.9783),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Sharq',             'شرق',           29.3733, 48.0003),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Mirqab',            'المرقاب',       29.3750, 47.9850),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Dasman',            'دسمان',         29.3800, 47.9700),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Bneid Al Qar',      'بنيد القار',    29.3600, 47.9950),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Abdullah Al Salem', 'عبدالله السالم',29.3530, 47.9780),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Nuzha',             'النزهة',        29.3480, 47.9830),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Shamiya',           'الشامية',       29.3600, 47.9700),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Sulaibikhat',       'الصليبيخات',    29.4000, 47.9300);

-- ── Hawalli Governorate Neighborhoods ────────────────────────
INSERT INTO neighborhoods (governorate_id, name_en, name_ar, latitude, longitude) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Salmiya',    'السالمية', 29.3330, 48.0680),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Rumaithiya', 'الرميثية', 29.3200, 48.0780),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Bayan',      'بيان',     29.3100, 48.0900),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Salwa',      'سلوى',     29.3050, 48.0500),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Hawalli',    'حولي',     29.3350, 48.0300),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Jabriya',    'الجابرية', 29.3250, 48.0550),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Mishref',    'مشرف',     29.2900, 48.0700),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Shaab',      'الشعب',    29.3450, 48.0450);

-- ── Farwaniya Governorate Neighborhoods ──────────────────────
INSERT INTO neighborhoods (governorate_id, name_en, name_ar, latitude, longitude) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Abdullah Al Mubarak Al Sabah', 'عبدالله المبارك الصباح', 29.3150, 47.9300),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Khaitan',    'خيطان',     29.2950, 47.9350),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Farwaniya',  'الفروانية', 29.2780, 47.9580),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Omariya',    'العمرية',   29.2700, 47.9700),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Ardiya',     'العارضية',  29.3000, 47.9550),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Andalous',   'الأندلس',   29.2650, 47.9300);

-- ── Mubarak Al-Kabeer Neighborhoods ──────────────────────────
INSERT INTO neighborhoods (governorate_id, name_en, name_ar, latitude, longitude) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000004', 'Mubarak Al-Kabeer', 'مبارك الكبير', 29.2200, 48.0500),
  ('a1b2c3d4-0001-0001-0001-000000000004', 'Sabah Al Salem',    'صباح السالم',  29.2050, 48.0650),
  ('a1b2c3d4-0001-0001-0001-000000000004', 'Abu Fatira',        'أبو فطيرة',    29.2300, 48.0700),
  ('a1b2c3d4-0001-0001-0001-000000000004', 'Fnaitees',          'الفنيطيس',     29.2100, 48.0800),
  ('a1b2c3d4-0001-0001-0001-000000000004', 'Wista',             'الوسطى',       29.2150, 48.0450);

-- ── Ahmadi Governorate Neighborhoods ─────────────────────────
INSERT INTO neighborhoods (governorate_id, name_en, name_ar, latitude, longitude) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000005', 'Ahmadi',    'الأحمدي',   29.0780, 48.0840),
  ('a1b2c3d4-0001-0001-0001-000000000005', 'Fahaheel',  'الفحيحيل',  29.0850, 48.1350),
  ('a1b2c3d4-0001-0001-0001-000000000005', 'Mangaf',    'المنقف',    29.1650, 48.1350),
  ('a1b2c3d4-0001-0001-0001-000000000005', 'Mahboula',  'المهبولة',  29.1700, 48.1430),
  ('a1b2c3d4-0001-0001-0001-000000000005', 'Fintas',    'الفنطاس',   29.1900, 48.1300),
  ('a1b2c3d4-0001-0001-0001-000000000005', 'Sabahiya',  'الصباحية',  29.1050, 48.1550);

-- ── Jahra Governorate Neighborhoods ──────────────────────────
INSERT INTO neighborhoods (governorate_id, name_en, name_ar, latitude, longitude) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000006', 'Jahra',      'الجهراء',  29.3400, 47.6580),
  ('a1b2c3d4-0001-0001-0001-000000000006', 'Sulaibiya',  'الصليبية', 29.3150, 47.6800),
  ('a1b2c3d4-0001-0001-0001-000000000006', 'Waha',       'الواحة',   29.3550, 47.7000),
  ('a1b2c3d4-0001-0001-0001-000000000006', 'Naseem',     'النسيم',   29.3450, 47.7200);
