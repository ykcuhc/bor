// ============================================================
// Kuwait Geographical Data
// Complete list of Kuwait's 6 governorates and their
// major neighborhoods. Used in the NeighborhoodSelector
// component during signup and for the geographical feed filter.
// ============================================================

export interface GovernorateData {
  code: string;
  name_en: string;
  name_ar: string;
  neighborhoods: NeighborhoodData[];
}

export interface NeighborhoodData {
  name_en: string;
  name_ar: string;
  latitude: number;
  longitude: number;
}

export const KUWAIT_REGIONS: GovernorateData[] = [
  {
    code: 'capital',
    name_en: 'Capital Governorate',
    name_ar: 'محافظة العاصمة',
    neighborhoods: [
      { name_en: 'Kuwait City',      name_ar: 'مدينة الكويت',    latitude: 29.3697, longitude: 47.9783 },
      { name_en: 'Sharq',            name_ar: 'شرق',             latitude: 29.3733, longitude: 48.0003 },
      { name_en: 'Mirqab',           name_ar: 'المرقاب',          latitude: 29.3750, longitude: 47.9850 },
      { name_en: 'Dasman',           name_ar: 'دسمان',            latitude: 29.3800, longitude: 47.9700 },
      { name_en: 'Bneid Al Qar',     name_ar: 'بنيد القار',       latitude: 29.3600, longitude: 47.9950 },
      { name_en: 'Abdullah Al Salem',name_ar: 'عبدالله السالم',   latitude: 29.3530, longitude: 47.9780 },
      { name_en: 'Nuzha',            name_ar: 'النزهة',           latitude: 29.3480, longitude: 47.9830 },
      { name_en: 'Shamiya',          name_ar: 'الشامية',          latitude: 29.3600, longitude: 47.9700 },
      { name_en: 'Sulaibikhat',      name_ar: 'الصليبيخات',       latitude: 29.4000, longitude: 47.9300 },
    ],
  },
  {
    code: 'hawalli',
    name_en: 'Hawalli Governorate',
    name_ar: 'محافظة حولي',
    neighborhoods: [
      { name_en: 'Salmiya',          name_ar: 'السالمية',         latitude: 29.3330, longitude: 48.0680 },
      { name_en: 'Rumaithiya',       name_ar: 'الرميثية',         latitude: 29.3200, longitude: 48.0780 },
      { name_en: 'Bayan',            name_ar: 'بيان',             latitude: 29.3100, longitude: 48.0900 },
      { name_en: 'Salwa',            name_ar: 'سلوى',             latitude: 29.3050, longitude: 48.0500 },
      { name_en: 'Hawalli',          name_ar: 'حولي',             latitude: 29.3350, longitude: 48.0300 },
      { name_en: 'Siddiq',           name_ar: 'الصديق',           latitude: 29.3400, longitude: 48.0200 },
      { name_en: 'Jabriya',          name_ar: 'الجابرية',         latitude: 29.3250, longitude: 48.0550 },
      { name_en: 'Mishref',          name_ar: 'مشرف',             latitude: 29.2900, longitude: 48.0700 },
      { name_en: 'Shaab',            name_ar: 'الشعب',            latitude: 29.3450, longitude: 48.0450 },
      { name_en: 'Rumaithiya 2',     name_ar: 'الرميثية 2',       latitude: 29.3180, longitude: 48.0820 },
    ],
  },
  {
    code: 'farwaniya',
    name_en: 'Farwaniya Governorate',
    name_ar: 'محافظة الفروانية',
    neighborhoods: [
      { name_en: 'Abdullah Al Mubarak Al Sabah', name_ar: 'عبدالله المبارك الصباح', latitude: 29.3150, longitude: 47.9300 },
      { name_en: 'Khaitan',          name_ar: 'خيطان',            latitude: 29.2950, longitude: 47.9350 },
      { name_en: 'Farwaniya',        name_ar: 'الفروانية',         latitude: 29.2780, longitude: 47.9580 },
      { name_en: 'Omariya',          name_ar: 'العمرية',          latitude: 29.2700, longitude: 47.9700 },
      { name_en: 'Rai',              name_ar: 'الري',             latitude: 29.3050, longitude: 47.9100 },
      { name_en: 'Ardiya',           name_ar: 'العارضية',         latitude: 29.3000, longitude: 47.9550 },
      { name_en: 'Ishbiliya',        name_ar: 'إشبيلية',          latitude: 29.2600, longitude: 47.9400 },
      { name_en: 'Andalous',         name_ar: 'الأندلس',          latitude: 29.2650, longitude: 47.9300 },
      { name_en: 'Jeleeb Al Shuyoukh',name_ar: 'جليب الشيوخ',    latitude: 29.2900, longitude: 47.9800 },
    ],
  },
  {
    code: 'mubarak_kabeer',
    name_en: 'Mubarak Al-Kabeer Governorate',
    name_ar: 'محافظة مبارك الكبير',
    neighborhoods: [
      { name_en: 'Mubarak Al-Kabeer', name_ar: 'مبارك الكبير',   latitude: 29.2200, longitude: 48.0500 },
      { name_en: 'Sabah Al Salem',   name_ar: 'صباح السالم',      latitude: 29.2050, longitude: 48.0650 },
      { name_en: 'Abu Fatira',       name_ar: 'أبو فطيرة',        latitude: 29.2300, longitude: 48.0700 },
      { name_en: 'Fnaitees',         name_ar: 'الفنيطيس',         latitude: 29.2100, longitude: 48.0800 },
      { name_en: 'Qusour',           name_ar: 'القصور',           latitude: 29.2400, longitude: 48.0600 },
      { name_en: 'Wista',            name_ar: 'الوسطى',           latitude: 29.2150, longitude: 48.0450 },
    ],
  },
  {
    code: 'ahmadi',
    name_en: 'Ahmadi Governorate',
    name_ar: 'محافظة الأحمدي',
    neighborhoods: [
      { name_en: 'Ahmadi',           name_ar: 'الأحمدي',          latitude: 29.0780, longitude: 48.0840 },
      { name_en: 'Fahaheel',         name_ar: 'الفحيحيل',         latitude: 29.0850, longitude: 48.1350 },
      { name_en: 'Mangaf',           name_ar: 'المنقف',           latitude: 29.1650, longitude: 48.1350 },
      { name_en: 'Abu Halifa',       name_ar: 'أبو حليفة',        latitude: 29.1950, longitude: 48.1200 },
      { name_en: 'Mahboula',         name_ar: 'المهبولة',         latitude: 29.1700, longitude: 48.1430 },
      { name_en: 'Fintas',           name_ar: 'الفنطاس',          latitude: 29.1900, longitude: 48.1300 },
      { name_en: 'Riqqa',            name_ar: 'الرقة',            latitude: 29.1500, longitude: 48.1500 },
      { name_en: 'Sabahiya',         name_ar: 'الصباحية',         latitude: 29.1050, longitude: 48.1550 },
    ],
  },
  {
    code: 'jahra',
    name_en: 'Jahra Governorate',
    name_ar: 'محافظة الجهراء',
    neighborhoods: [
      { name_en: 'Jahra',            name_ar: 'الجهراء',          latitude: 29.3400, longitude: 47.6580 },
      { name_en: 'Sulaibiya',        name_ar: 'الصليبية',         latitude: 29.3150, longitude: 47.6800 },
      { name_en: 'Waha',             name_ar: 'الواحة',           latitude: 29.3550, longitude: 47.7000 },
      { name_en: 'Oyoun',            name_ar: 'العيون',           latitude: 29.3700, longitude: 47.6900 },
      { name_en: 'Naseem',           name_ar: 'النسيم',           latitude: 29.3450, longitude: 47.7200 },
      { name_en: 'Qasr',             name_ar: 'القصر',            latitude: 29.3600, longitude: 47.7100 },
    ],
  },
];

// Flat lookup by governorate code — used for quick searches
export const GOVERNORATE_BY_CODE: Record<string, GovernorateData> =
  KUWAIT_REGIONS.reduce((acc, gov) => ({ ...acc, [gov.code]: gov }), {});
