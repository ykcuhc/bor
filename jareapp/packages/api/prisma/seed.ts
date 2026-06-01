import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const governoratesData = [
  {
    nameEn: 'Capital',
    nameAr: 'العاصمة',
    code: 'CAP',
    neighborhoods: [
      { nameEn: 'Sharq', nameAr: 'شرق' },
      { nameEn: 'Mirqab', nameAr: 'المرقاب' },
      { nameEn: 'Dasman', nameAr: 'دسمان' },
      { nameEn: 'Bneid Al-Gar', nameAr: 'بنيد القار' },
      { nameEn: 'Qibla', nameAr: 'القبلة' },
      { nameEn: 'Jibla', nameAr: 'جبلة' },
      { nameEn: 'Abdullah Al-Salem', nameAr: 'عبدالله السالم' },
      { nameEn: 'Rawda', nameAr: 'الروضة' },
      { nameEn: 'Shamiya', nameAr: 'الشامية' },
      { nameEn: 'Dasma', nameAr: 'الدسمة' },
      { nameEn: 'Shuwaikh', nameAr: 'الشويخ' },
      { nameEn: 'Kaifan', nameAr: 'كيفان' },
    ],
  },
  {
    nameEn: 'Hawalli',
    nameAr: 'حولي',
    code: 'HAW',
    neighborhoods: [
      { nameEn: 'Salmiya', nameAr: 'السالمية' },
      { nameEn: 'Rumaithiya', nameAr: 'الرميثية' },
      { nameEn: 'Bayan', nameAr: 'بيان' },
      { nameEn: 'Mishref', nameAr: 'مشرف' },
      { nameEn: 'Salwa', nameAr: 'سلوى' },
      { nameEn: 'Jabriya', nameAr: 'الجابرية' },
      { nameEn: 'Surra', nameAr: 'السرة' },
      { nameEn: 'Hawalli', nameAr: 'حولي' },
      { nameEn: 'Siddiq', nameAr: 'الصديق' },
      { nameEn: 'Shuhada', nameAr: 'الشهداء' },
      { nameEn: 'Hateen', nameAr: 'حطين' },
      { nameEn: 'Zahra', nameAr: 'الزهراء' },
    ],
  },
  {
    nameEn: 'Farwaniya',
    nameAr: 'الفروانية',
    code: 'FAR',
    neighborhoods: [
      { nameEn: 'Farwaniya', nameAr: 'الفروانية' },
      { nameEn: 'Abdullah Al-Mubarak', nameAr: 'عبدالله المبارك' },
      { nameEn: 'Al-Rabiya', nameAr: 'الرابية' },
      { nameEn: 'Khaitan', nameAr: 'خيطان' },
      { nameEn: 'Andalus', nameAr: 'الأندلس' },
      { nameEn: 'Al-Ardhiya', nameAr: 'العارضية' },
      { nameEn: 'Al-Riqqah', nameAr: 'الرقة' },
      { nameEn: 'Sabah Al-Nasser', nameAr: 'صباح الناصر' },
      { nameEn: 'Fahaheel', nameAr: 'الفحيحيل' },
      { nameEn: 'Al-Naseem', nameAr: 'النسيم' },
      { nameEn: 'Omariya', nameAr: 'العمرية' },
      { nameEn: 'Ishbiliya', nameAr: 'إشبيلية' },
    ],
  },
  {
    nameEn: 'Ahmadi',
    nameAr: 'الأحمدي',
    code: 'AHM',
    neighborhoods: [
      { nameEn: 'Fahaheel', nameAr: 'الفحيحيل' },
      { nameEn: 'Mahboula', nameAr: 'المهبولة' },
      { nameEn: 'Abu Halifa', nameAr: 'أبو حليفة' },
      { nameEn: 'Mangaf', nameAr: 'المنقف' },
      { nameEn: 'Riqqa', nameAr: 'الرقة' },
      { nameEn: 'Fintas', nameAr: 'الفنطاس' },
      { nameEn: 'Sabah Al-Ahmad', nameAr: 'صباح الأحمد' },
      { nameEn: 'Wafra', nameAr: 'الوفرة' },
      { nameEn: 'Ahmadi', nameAr: 'الأحمدي' },
      { nameEn: 'Hadiya', nameAr: 'هدية' },
      { nameEn: 'Ali Sabah Al-Salem', nameAr: 'علي صباح السالم' },
      { nameEn: 'Egaila', nameAr: 'العقيلة' },
    ],
  },
  {
    nameEn: 'Jahra',
    nameAr: 'الجهراء',
    code: 'JAH',
    neighborhoods: [
      { nameEn: 'Jahra', nameAr: 'الجهراء' },
      { nameEn: 'Qusur', nameAr: 'القصور' },
      { nameEn: 'Sulaibikhat', nameAr: 'الصليبيخات' },
      { nameEn: 'Naseem', nameAr: 'النسيم' },
      { nameEn: 'Oyoun', nameAr: 'العيون' },
      { nameEn: 'Qasr', nameAr: 'قصر' },
      { nameEn: 'Amghara', nameAr: 'أمغرة' },
      { nameEn: 'Taima', nameAr: 'تيماء' },
      { nameEn: 'Jahra Industrial', nameAr: 'الجهراء الصناعية' },
      { nameEn: 'Rawdatain', nameAr: 'الروضتين' },
      { nameEn: 'Saad Al-Abdullah', nameAr: 'سعد العبدالله' },
      { nameEn: 'Waha', nameAr: 'الواحة' },
    ],
  },
  {
    nameEn: 'Mubarak Al-Kabeer',
    nameAr: 'مبارك الكبير',
    code: 'MAK',
    neighborhoods: [
      { nameEn: 'Mubarak Al-Kabeer', nameAr: 'مبارك الكبير' },
      { nameEn: 'Sabah Al-Salem', nameAr: 'صباح السالم' },
      { nameEn: 'Abu Fatira', nameAr: 'أبو فطيرة' },
      { nameEn: 'Fnaitees', nameAr: 'الفنيطيس' },
      { nameEn: 'Qurain', nameAr: 'القرين' },
      { nameEn: 'Messila', nameAr: 'المسيلة' },
      { nameEn: 'Abu Hasaniya', nameAr: 'أبو الحصانية' },
      { nameEn: 'Adan', nameAr: 'العدان' },
      { nameEn: 'Qusaibet', nameAr: 'قصيبة' },
      { nameEn: 'Sabahiya', nameAr: 'الصباحية' },
      { nameEn: 'Abu Ftaira', nameAr: 'أبو فطيرة' },
      { nameEn: 'Al-Qusour', nameAr: 'القصور' },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding JareApp database...');

  // Seed governorates and neighborhoods
  const neighborhoodMap: Record<string, string> = {};

  for (const gov of governoratesData) {
    const governorate = await prisma.governorate.upsert({
      where: { code: gov.code },
      update: {},
      create: { nameEn: gov.nameEn, nameAr: gov.nameAr, code: gov.code },
    });

    console.log(`  ✓ Governorate: ${gov.nameEn} (${gov.nameAr})`);

    for (const n of gov.neighborhoods) {
      const neighborhood = await prisma.neighborhood.upsert({
        where: { nameEn_governorateId: { nameEn: n.nameEn, governorateId: governorate.id } },
        update: {},
        create: { nameEn: n.nameEn, nameAr: n.nameAr, governorateId: governorate.id },
      });
      neighborhoodMap[`${gov.code}_${n.nameEn}`] = neighborhood.id;
    }
  }

  // Seed admin user
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  const salmiyaId = neighborhoodMap['HAW_Salmiya'];

  const admin = await prisma.user.upsert({
    where: { phone: '+96512345678' },
    update: {},
    create: {
      phone: '+96512345678',
      email: 'admin@jareapp.kw',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'JareApp',
      displayName: 'Admin',
      role: 'ADMIN',
      isVerified: true,
      neighborhoodId: salmiyaId,
      preferredLanguage: 'AR',
    },
  });

  console.log(`  ✓ Admin user: admin@jareapp.kw / Admin@123`);

  // Seed a champion user
  const championPasswordHash = await bcrypt.hash('Champion@123', 12);
  const champion = await prisma.user.upsert({
    where: { phone: '+96598765432' },
    update: {},
    create: {
      phone: '+96598765432',
      email: 'champion@jareapp.kw',
      passwordHash: championPasswordHash,
      firstName: 'محمد',
      lastName: 'الكويتي',
      displayName: 'محمد الكويتي',
      role: 'NEIGHBORHOOD_CHAMPION',
      isVerified: true,
      neighborhoodId: salmiyaId,
      preferredLanguage: 'AR',
    },
  });

  // Seed sample posts
  const posts = [
    {
      contentAr: 'أهلاً بالجيران الجدد في السالمية! نرحب بكم في مجتمعنا.',
      contentEn: 'Welcome to the new neighbors in Salmiya! We welcome you to our community.',
      category: 'GENERAL' as const,
      isPinned: true,
    },
    {
      contentAr: 'تحذير: تم الإبلاغ عن سيارة مشبوهة في شارع 50. يرجى الانتباه.',
      contentEn: 'Warning: Suspicious car reported on Street 50. Please be alert.',
      category: 'SAFETY' as const,
      isAnonymous: true,
    },
    {
      contentAr: 'للبيع: تلفزيون سامسونج 55 بوصة بحالة ممتازة. السعر: 80 دينار.',
      contentEn: 'For sale: Samsung 55" TV in excellent condition. Price: 80 KD.',
      category: 'MARKETPLACE' as const,
    },
  ];

  for (const post of posts) {
    await prisma.post.create({
      data: {
        ...post,
        authorId: champion.id,
        neighborhoodId: salmiyaId,
      },
    });
  }
  console.log(`  ✓ Sample posts created`);

  // Seed sample alert
  await prisma.alert.create({
    data: {
      authorId: champion.id,
      neighborhoodId: salmiyaId,
      type: 'INFRASTRUCTURE',
      severity: 'MEDIUM',
      titleAr: 'انقطاع الكهرباء',
      titleEn: 'Power Outage',
      descriptionAr: 'انقطاع مؤقت للكهرباء في المنطقة. تعمل فرق الصيانة على إصلاح العطل.',
      descriptionEn: 'Temporary power outage in the area. Maintenance teams are working to fix it.',
      isActive: true,
    },
  });
  console.log(`  ✓ Sample alert created`);

  // Seed sample event
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.event.create({
    data: {
      organizerId: champion.id,
      neighborhoodId: salmiyaId,
      category: 'SOCIAL',
      titleAr: 'تجمع أهالي حي السالمية',
      titleEn: 'Salmiya Neighborhood Gathering',
      descriptionAr: 'دعوة لجميع سكان الحي للتعارف والتواصل.',
      descriptionEn: 'Invitation to all neighborhood residents to meet and connect.',
      location: 'حديقة السالمية العامة',
      startAt: nextWeek,
      maxAttendees: 100,
      isPublic: true,
    },
  });
  console.log(`  ✓ Sample event created`);

  // Seed sample business
  await prisma.business.create({
    data: {
      ownerId: champion.id,
      neighborhoodId: salmiyaId,
      category: 'RESTAURANT',
      nameEn: 'Al-Bahar Restaurant',
      nameAr: 'مطعم البحر',
      descriptionEn: 'Fresh seafood and traditional Kuwaiti dishes.',
      descriptionAr: 'مأكولات بحرية طازجة وأطباق كويتية تقليدية.',
      phone: '+96522334455',
      address: 'شارع السالم، السالمية',
      isVerified: true,
      averageRating: 4.5,
      reviewCount: 23,
    },
  });
  console.log(`  ✓ Sample business created`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\n🔑 Default credentials:');
  console.log('   Admin:    admin@jareapp.kw / Admin@123  (phone: +96512345678)');
  console.log('   Champion: champion@jareapp.kw / Champion@123  (phone: +96598765432)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
