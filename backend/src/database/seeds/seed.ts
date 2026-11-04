import 'reflect-metadata';
import crypto from 'crypto';
import { AppDataSource } from '../../config/data-source';
import { SuperAdmin } from '../../modules/superAdmin/superAdmin.entity';
import { Surah } from '../../modules/quranProgress/surah.entity';
import { hashPassword } from '../../shared/utils/hash';
import { logger } from '../../shared/utils/logger';

const surahData = [
  { number: 1, nameArabic: 'الفاتحة', nameEnglish: 'Al-Fatihah', totalAyahs: 7, juz: 1 },
  { number: 2, nameArabic: 'البقرة', nameEnglish: 'Al-Baqarah', totalAyahs: 286, juz: 1 },
  { number: 3, nameArabic: 'آل عمران', nameEnglish: 'Aal-E-Imran', totalAyahs: 200, juz: 3 },
  { number: 4, nameArabic: 'النساء', nameEnglish: 'An-Nisa', totalAyahs: 176, juz: 4 },
  { number: 5, nameArabic: 'المائدة', nameEnglish: 'Al-Maidah', totalAyahs: 120, juz: 6 },
  { number: 6, nameArabic: 'الأنعام', nameEnglish: 'Al-Anam', totalAyahs: 165, juz: 7 },
  { number: 7, nameArabic: 'الأعراف', nameEnglish: 'Al-Araf', totalAyahs: 206, juz: 8 },
  { number: 8, nameArabic: 'الأنفال', nameEnglish: 'Al-Anfal', totalAyahs: 75, juz: 9 },
  { number: 9, nameArabic: 'التوبة', nameEnglish: 'At-Tawbah', totalAyahs: 129, juz: 10 },
  { number: 10, nameArabic: 'يونس', nameEnglish: 'Yunus', totalAyahs: 109, juz: 11 },
  { number: 11, nameArabic: 'هود', nameEnglish: 'Hud', totalAyahs: 123, juz: 11 },
  { number: 12, nameArabic: 'يوسف', nameEnglish: 'Yusuf', totalAyahs: 111, juz: 12 },
  { number: 13, nameArabic: 'الرعد', nameEnglish: 'Ar-Rad', totalAyahs: 43, juz: 13 },
  { number: 14, nameArabic: 'إبراهيم', nameEnglish: 'Ibrahim', totalAyahs: 52, juz: 13 },
  { number: 15, nameArabic: 'الحجر', nameEnglish: 'Al-Hijr', totalAyahs: 99, juz: 14 },
  { number: 16, nameArabic: 'النحل', nameEnglish: 'An-Nahl', totalAyahs: 128, juz: 14 },
  { number: 17, nameArabic: 'الإسراء', nameEnglish: 'Al-Isra', totalAyahs: 111, juz: 15 },
  { number: 18, nameArabic: 'الكهف', nameEnglish: 'Al-Kahf', totalAyahs: 110, juz: 15 },
  { number: 19, nameArabic: 'مريم', nameEnglish: 'Maryam', totalAyahs: 98, juz: 16 },
  { number: 20, nameArabic: 'طه', nameEnglish: 'Taha', totalAyahs: 135, juz: 16 },
  { number: 21, nameArabic: 'الأنبياء', nameEnglish: 'Al-Anbiya', totalAyahs: 112, juz: 17 },
  { number: 22, nameArabic: 'الحج', nameEnglish: 'Al-Hajj', totalAyahs: 78, juz: 17 },
  { number: 23, nameArabic: 'المؤمنون', nameEnglish: 'Al-Muminun', totalAyahs: 118, juz: 18 },
  { number: 24, nameArabic: 'النور', nameEnglish: 'An-Nur', totalAyahs: 64, juz: 18 },
  { number: 25, nameArabic: 'الفرقان', nameEnglish: 'Al-Furqan', totalAyahs: 77, juz: 18 },
  { number: 26, nameArabic: 'الشعراء', nameEnglish: 'Ash-Shuara', totalAyahs: 227, juz: 19 },
  { number: 27, nameArabic: 'النمل', nameEnglish: 'An-Naml', totalAyahs: 93, juz: 19 },
  { number: 28, nameArabic: 'القصص', nameEnglish: 'Al-Qasas', totalAyahs: 88, juz: 20 },
  { number: 29, nameArabic: 'العنكبوت', nameEnglish: 'Al-Ankabut', totalAyahs: 69, juz: 20 },
  { number: 30, nameArabic: 'الروم', nameEnglish: 'Ar-Rum', totalAyahs: 60, juz: 21 },
  { number: 31, nameArabic: 'لقمان', nameEnglish: 'Luqman', totalAyahs: 34, juz: 21 },
  { number: 32, nameArabic: 'السجدة', nameEnglish: 'As-Sajdah', totalAyahs: 30, juz: 21 },
  { number: 33, nameArabic: 'الأحزاب', nameEnglish: 'Al-Ahzab', totalAyahs: 73, juz: 21 },
  { number: 34, nameArabic: 'سبأ', nameEnglish: 'Saba', totalAyahs: 54, juz: 22 },
  { number: 35, nameArabic: 'فاطر', nameEnglish: 'Fatir', totalAyahs: 45, juz: 22 },
  { number: 36, nameArabic: 'يس', nameEnglish: 'Ya-Sin', totalAyahs: 83, juz: 22 },
  { number: 37, nameArabic: 'الصافات', nameEnglish: 'As-Saffat', totalAyahs: 182, juz: 23 },
  { number: 38, nameArabic: 'ص', nameEnglish: 'Sad', totalAyahs: 88, juz: 23 },
  { number: 39, nameArabic: 'الزمر', nameEnglish: 'Az-Zumar', totalAyahs: 75, juz: 23 },
  { number: 40, nameArabic: 'غافر', nameEnglish: 'Ghafir', totalAyahs: 85, juz: 24 },
  { number: 41, nameArabic: 'فصلت', nameEnglish: 'Fussilat', totalAyahs: 54, juz: 24 },
  { number: 42, nameArabic: 'الشورى', nameEnglish: 'Ash-Shura', totalAyahs: 53, juz: 25 },
  { number: 43, nameArabic: 'الزخرف', nameEnglish: 'Az-Zukhruf', totalAyahs: 89, juz: 25 },
  { number: 44, nameArabic: 'الدخان', nameEnglish: 'Ad-Dukhan', totalAyahs: 59, juz: 25 },
  { number: 45, nameArabic: 'الجاثية', nameEnglish: 'Al-Jathiyah', totalAyahs: 37, juz: 25 },
  { number: 46, nameArabic: 'الأحقاف', nameEnglish: 'Al-Ahqaf', totalAyahs: 35, juz: 26 },
  { number: 47, nameArabic: 'محمد', nameEnglish: 'Muhammad', totalAyahs: 38, juz: 26 },
  { number: 48, nameArabic: 'الفتح', nameEnglish: 'Al-Fath', totalAyahs: 29, juz: 26 },
  { number: 49, nameArabic: 'الحجرات', nameEnglish: 'Al-Hujurat', totalAyahs: 18, juz: 26 },
  { number: 50, nameArabic: 'ق', nameEnglish: 'Qaf', totalAyahs: 45, juz: 26 },
  { number: 51, nameArabic: 'الذاريات', nameEnglish: 'Adh-Dhariyat', totalAyahs: 60, juz: 26 },
  { number: 52, nameArabic: 'الطور', nameEnglish: 'At-Tur', totalAyahs: 49, juz: 27 },
  { number: 53, nameArabic: 'النجم', nameEnglish: 'An-Najm', totalAyahs: 62, juz: 27 },
  { number: 54, nameArabic: 'القمر', nameEnglish: 'Al-Qamar', totalAyahs: 55, juz: 27 },
  { number: 55, nameArabic: 'الرحمن', nameEnglish: 'Ar-Rahman', totalAyahs: 78, juz: 27 },
  { number: 56, nameArabic: 'الواقعة', nameEnglish: 'Al-Waqiah', totalAyahs: 96, juz: 27 },
  { number: 57, nameArabic: 'الحديد', nameEnglish: 'Al-Hadid', totalAyahs: 29, juz: 27 },
  { number: 58, nameArabic: 'المجادلة', nameEnglish: 'Al-Mujadila', totalAyahs: 22, juz: 28 },
  { number: 59, nameArabic: 'الحشر', nameEnglish: 'Al-Hashr', totalAyahs: 24, juz: 28 },
  { number: 60, nameArabic: 'الممتحنة', nameEnglish: 'Al-Mumtahanah', totalAyahs: 13, juz: 28 },
  { number: 61, nameArabic: 'الصف', nameEnglish: 'As-Saf', totalAyahs: 14, juz: 28 },
  { number: 62, nameArabic: 'الجمعة', nameEnglish: 'Al-Jumuah', totalAyahs: 11, juz: 28 },
  { number: 63, nameArabic: 'المنافقون', nameEnglish: 'Al-Munafiqun', totalAyahs: 11, juz: 28 },
  { number: 64, nameArabic: 'التغابن', nameEnglish: 'At-Taghabun', totalAyahs: 18, juz: 28 },
  { number: 65, nameArabic: 'الطلاق', nameEnglish: 'At-Talaq', totalAyahs: 12, juz: 28 },
  { number: 66, nameArabic: 'التحريم', nameEnglish: 'At-Tahrim', totalAyahs: 12, juz: 28 },
  { number: 67, nameArabic: 'الملك', nameEnglish: 'Al-Mulk', totalAyahs: 30, juz: 29 },
  { number: 68, nameArabic: 'القلم', nameEnglish: 'Al-Qalam', totalAyahs: 52, juz: 29 },
  { number: 69, nameArabic: 'الحاقة', nameEnglish: 'Al-Haqqah', totalAyahs: 52, juz: 29 },
  { number: 70, nameArabic: 'المعارج', nameEnglish: 'Al-Maarij', totalAyahs: 44, juz: 29 },
  { number: 71, nameArabic: 'نوح', nameEnglish: 'Nuh', totalAyahs: 28, juz: 29 },
  { number: 72, nameArabic: 'الجن', nameEnglish: 'Al-Jinn', totalAyahs: 28, juz: 29 },
  { number: 73, nameArabic: 'المزمل', nameEnglish: 'Al-Muzzammil', totalAyahs: 20, juz: 29 },
  { number: 74, nameArabic: 'المدثر', nameEnglish: 'Al-Muddaththir', totalAyahs: 56, juz: 29 },
  { number: 75, nameArabic: 'القيامة', nameEnglish: 'Al-Qiyamah', totalAyahs: 40, juz: 29 },
  { number: 76, nameArabic: 'الإنسان', nameEnglish: 'Al-Insan', totalAyahs: 31, juz: 29 },
  { number: 77, nameArabic: 'المرسلات', nameEnglish: 'Al-Mursalat', totalAyahs: 50, juz: 29 },
  { number: 78, nameArabic: 'النبأ', nameEnglish: 'An-Naba', totalAyahs: 40, juz: 30 },
  { number: 79, nameArabic: 'النازعات', nameEnglish: 'An-Naziat', totalAyahs: 46, juz: 30 },
  { number: 80, nameArabic: 'عبس', nameEnglish: 'Abasa', totalAyahs: 42, juz: 30 },
  { number: 81, nameArabic: 'التكوير', nameEnglish: 'At-Takwir', totalAyahs: 29, juz: 30 },
  { number: 82, nameArabic: 'الانفطار', nameEnglish: 'Al-Infitar', totalAyahs: 19, juz: 30 },
  { number: 83, nameArabic: 'المطففين', nameEnglish: 'Al-Mutaffifin', totalAyahs: 36, juz: 30 },
  { number: 84, nameArabic: 'الانشقاق', nameEnglish: 'Al-Inshiqaq', totalAyahs: 25, juz: 30 },
  { number: 85, nameArabic: 'البروج', nameEnglish: 'Al-Buruj', totalAyahs: 22, juz: 30 },
  { number: 86, nameArabic: 'الطارق', nameEnglish: 'At-Tariq', totalAyahs: 17, juz: 30 },
  { number: 87, nameArabic: 'الأعلى', nameEnglish: 'Al-Ala', totalAyahs: 19, juz: 30 },
  { number: 88, nameArabic: 'الغاشية', nameEnglish: 'Al-Ghashiyah', totalAyahs: 26, juz: 30 },
  { number: 89, nameArabic: 'الفجر', nameEnglish: 'Al-Fajr', totalAyahs: 30, juz: 30 },
  { number: 90, nameArabic: 'البلد', nameEnglish: 'Al-Balad', totalAyahs: 20, juz: 30 },
  { number: 91, nameArabic: 'الشمس', nameEnglish: 'Ash-Shams', totalAyahs: 15, juz: 30 },
  { number: 92, nameArabic: 'الليل', nameEnglish: 'Al-Layl', totalAyahs: 21, juz: 30 },
  { number: 93, nameArabic: 'الضحى', nameEnglish: 'Ad-Duha', totalAyahs: 11, juz: 30 },
  { number: 94, nameArabic: 'الشرح', nameEnglish: 'Ash-Sharh', totalAyahs: 8, juz: 30 },
  { number: 95, nameArabic: 'التين', nameEnglish: 'At-Tin', totalAyahs: 8, juz: 30 },
  { number: 96, nameArabic: 'العلق', nameEnglish: 'Al-Alaq', totalAyahs: 19, juz: 30 },
  { number: 97, nameArabic: 'القدر', nameEnglish: 'Al-Qadr', totalAyahs: 5, juz: 30 },
  { number: 98, nameArabic: 'البينة', nameEnglish: 'Al-Bayyinah', totalAyahs: 8, juz: 30 },
  { number: 99, nameArabic: 'الزلزلة', nameEnglish: 'Az-Zalzalah', totalAyahs: 8, juz: 30 },
  { number: 100, nameArabic: 'العاديات', nameEnglish: 'Al-Adiyat', totalAyahs: 11, juz: 30 },
  { number: 101, nameArabic: 'القارعة', nameEnglish: 'Al-Qariah', totalAyahs: 11, juz: 30 },
  { number: 102, nameArabic: 'التكاثر', nameEnglish: 'At-Takathur', totalAyahs: 8, juz: 30 },
  { number: 103, nameArabic: 'العصر', nameEnglish: 'Al-Asr', totalAyahs: 3, juz: 30 },
  { number: 104, nameArabic: 'الهمزة', nameEnglish: 'Al-Humazah', totalAyahs: 9, juz: 30 },
  { number: 105, nameArabic: 'الفيل', nameEnglish: 'Al-Fil', totalAyahs: 5, juz: 30 },
  { number: 106, nameArabic: 'قريش', nameEnglish: 'Quraysh', totalAyahs: 4, juz: 30 },
  { number: 107, nameArabic: 'الماعون', nameEnglish: 'Al-Maun', totalAyahs: 7, juz: 30 },
  { number: 108, nameArabic: 'الكوثر', nameEnglish: 'Al-Kawthar', totalAyahs: 3, juz: 30 },
  { number: 109, nameArabic: 'الكافرون', nameEnglish: 'Al-Kafirun', totalAyahs: 6, juz: 30 },
  { number: 110, nameArabic: 'النصر', nameEnglish: 'An-Nasr', totalAyahs: 3, juz: 30 },
  { number: 111, nameArabic: 'المسد', nameEnglish: 'Al-Masad', totalAyahs: 5, juz: 30 },
  { number: 112, nameArabic: 'الإخلاص', nameEnglish: 'Al-Ikhlas', totalAyahs: 4, juz: 30 },
  { number: 113, nameArabic: 'الفلق', nameEnglish: 'Al-Falaq', totalAyahs: 5, juz: 30 },
  { number: 114, nameArabic: 'الناس', nameEnglish: 'An-Nas', totalAyahs: 6, juz: 30 },
];

export const seed = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected for seeding');

    const superAdminRepo = AppDataSource.getRepository(SuperAdmin);
    const existingAdmin = await superAdminRepo.findOne({ where: { phone: '0555000000' } });

    if (!existingAdmin) {
      // No shared/default credential: the initial password comes from
      // SUPER_ADMIN_INITIAL_PASSWORD or is generated randomly and printed
      // exactly once to this console. The account must change it at first
      // login (mustChangePassword blocks every other endpoint until then).
      const initialPassword =
        process.env.SUPER_ADMIN_INITIAL_PASSWORD ||
        `Tmp-${crypto.randomBytes(18).toString('base64url')}-aZ9`;
      const hashedPassword = await hashPassword(initialPassword);
      const admin = superAdminRepo.create({
        firstName: 'Admin',
        lastName: 'Super',
        phone: process.env.SUPER_ADMIN_PHONE || '0555000000',
        password: hashedPassword,
        isActive: true,
        mustChangePassword: true,
      });
      await superAdminRepo.save(admin);
      logger.warn(
        `Super admin seeded. ONE-TIME initial password (change it at first login): ${initialPassword}`,
      );
    } else {
      logger.info('Super admin already exists');
    }

    const surahRepo = AppDataSource.getRepository(Surah);
    const existingSurahs = await surahRepo.count();

    if (existingSurahs === 0) {
      const surahs = surahData.map(s => surahRepo.create(s));
      await surahRepo.save(surahs);
      logger.info('114 surahs seeded successfully');
    } else {
      logger.info('Surahs already exist');
    }

    logger.info('Seeding completed');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();