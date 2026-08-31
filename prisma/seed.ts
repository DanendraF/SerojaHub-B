import { PrismaClient, PlantStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database Kebun Seroja...');

  // ── Profil Kebun ───────────────────────────────────────────
  const profile = await prisma.gardenProfile.upsert({
    where: { id: 'kebun-seroja-utama' },
    update: {},
    create: {
      id: 'kebun-seroja-utama',
      nama: 'Kebun Komunitas Seroja',
      deskripsi:
        'Kebun komunitas yang dikelola bersama warga untuk meningkatkan ketahanan pangan dan edukasi pertanian organik di lingkungan Seroja.',
      lokasi: 'Jl. Seroja, RT 05/RW 03, Kelurahan Baciro, Yogyakarta',
      luas_area: '200 m²',
      visi: 'Menjadi kebun percontohan komunitas yang mandiri dan produktif.',
      misi:
        'Mengelola kebun secara organik, mendidik warga tentang bertani, dan mempererat kebersamaan melalui kegiatan berkebun.',
      founded_at: new Date('2024-01-15'),
      foto_url: null,
    },
  });
  console.log(`✅ Profil kebun: ${profile.nama}`);

  // ── Data Tanaman ───────────────────────────────────────────
  const plants = [
    {
      id: 'tomat-ceri-01',
      name: 'Tomat Ceri',
      type: 'Sayur Buah',
      lokasi_bedeng: 'Bedeng A',
      planting_date: new Date('2026-07-01'),
      estimated_harvest_date: new Date('2026-09-15'),
      photo_url:
        'https://images.pexels.com/photos/36317349/pexels-photo-36317349.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      description:
        'Tomat ceri ditanam di Bedeng A menggunakan sistem penyiraman otomatis. Tumbuh subur dan mulai berbuah lebat.',
      cara_tanam:
        'Siram 2x sehari pagi dan sore. Beri pupuk organik setiap 2 minggu. Pasang ajir untuk menopang batang yang tumbuh tinggi.',
      manfaat:
        'Kaya antioksidan likopen dan vitamin C. Baik untuk daya tahan tubuh, kesehatan kulit, dan menurunkan risiko penyakit jantung.',
      catatan_pengelola: 'Perlu pengecekan hama ulat daun minggu ini.',
      status: PlantStatus.TUMBUH,
    },
    {
      id: 'cabai-rawit-02',
      name: 'Cabai Rawit',
      type: 'Cabai',
      lokasi_bedeng: 'Area Pot Selatan',
      planting_date: new Date('2026-06-15'),
      estimated_harvest_date: new Date('2026-09-01'),
      photo_url:
        'https://images.pexels.com/photos/36133755/pexels-photo-36133755.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      description:
        'Cabai rawit ditanam di pot-pot besar dekat pos pengawasan. Sudah mulai berbuah merah.',
      cara_tanam:
        'Letakkan di tempat yang terkena sinar matahari penuh. Siram setiap hari. Hindari genangan air di pot.',
      manfaat:
        'Mengandung capsaicin yang membantu melancarkan peredaran darah, meningkatkan metabolisme, dan merangsang nafsu makan.',
      catatan_pengelola: 'Beberapa tanaman sudah siap dipanen minggu ini.',
      status: PlantStatus.SIAP_PANEN,
    },
    {
      id: 'bayam-hijau-03',
      name: 'Bayam Hijau',
      type: 'Sayur Daun',
      lokasi_bedeng: 'Bedeng B',
      planting_date: new Date('2026-08-01'),
      estimated_harvest_date: new Date('2026-09-05'),
      photo_url:
        'https://images.pexels.com/photos/35252799/pexels-photo-35252799.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      description:
        'Bayam hijau ditanam di Bedeng B bagian timur. Tumbuh cepat dan daunnya lebat dan segar.',
      cara_tanam:
        'Semai benih langsung di bedeng. Siram setiap pagi. Panen saat tinggi 20-25cm dengan cara mencabut atau memotong batang.',
      manfaat:
        'Sumber zat besi, kalsium, dan vitamin A yang sangat baik. Membantu menjaga kesehatan mata, tulang, dan darah.',
      catatan_pengelola: null,
      status: PlantStatus.TUMBUH,
    },
  ];

  for (const plant of plants) {
    const created = await prisma.plant.upsert({
      where: { id: plant.id },
      update: {},
      create: plant,
    });
    console.log(`✅ Tanaman: ${created.name} (${created.lokasi_bedeng})`);
  }

  // ── User / Pengelola ───────────────────────────────────────
  const bcrypt = require('bcrypt');
  const hashedPassword = bcrypt.hashSync('seroja123', 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Pengelola Seroja',
      role: 'ADMIN',
    },
  });
  console.log(`✅ User admin dibuat: ${adminUser.username}`);

  // ── Log Aktivitas ────────────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      {
        aksi: 'inisialisasi',
        deskripsi: 'Database di-seed pertama kali dengan data awal Kebun Seroja.',
      },
    ],
    skipDuplicates: true,
  });

  console.log('\n🎉 Seeding selesai!');
  console.log(`   ${plants.length} tanaman ditambahkan`);
  console.log('   1 profil kebun dikonfigurasi');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
