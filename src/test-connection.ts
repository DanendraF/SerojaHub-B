import 'dotenv/config';
import { prisma } from './lib/prisma';
import { supabase, PHOTO_BUCKET } from './lib/supabase';

async function testConnection() {
  console.log('🔮 Memulai pengujian koneksi Seroja Hub...\n');
  let dbSuccess = false;
  let storageSuccess = false;

  // 1. Uji Koneksi Database (Prisma -> Supabase PostgreSQL)
  console.log('⏳ 1. Menghubungkan ke database Supabase via Prisma...');
  try {
    const gardenCount = await prisma.gardenProfile.count();
    console.log(`   ✅ SUKSES: Berhasil terhubung ke Database PostgreSQL.`);
    console.log(`   ℹ️  Jumlah data profil kebun: ${gardenCount}`);
    
    if (gardenCount > 0) {
      const profile = await prisma.gardenProfile.findFirst();
      console.log(`   ℹ️  Nama Kebun di Database: "${profile?.nama}"`);
    } else {
      console.log('   ⚠️  Peringatan: Tabel profil kebun kosong. Pastikan sudah menjalankan seeding.');
    }
    dbSuccess = true;
  } catch (error: any) {
    console.error('   ❌ GAGAL: Tidak dapat terhubung ke database.');
    console.error(`   Error Detail: ${error?.message || error}`);
  }
  console.log('');

  // 2. Uji Koneksi Supabase Storage
  console.log('⏳ 2. Menghubungkan ke Supabase Storage (Object Storage)...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }

    console.log('   ✅ SUKSES: Berhasil terhubung ke Supabase Storage API.');
    
    // Cek apakah bucket 'plant-photos' ada
    const targetBucket = buckets?.find((b) => b.name === PHOTO_BUCKET);
    if (targetBucket) {
      console.log(`   ✅ SUKSES: Bucket "${PHOTO_BUCKET}" ditemukan dan dapat diakses.`);
      console.log(`   ℹ️  Status Bucket: ${targetBucket.public ? 'Publik' : 'Privat'}`);
    } else {
      console.log(`   ⚠️  Peringatan: Bucket "${PHOTO_BUCKET}" TIDAK ditemukan di akun Supabase Anda.`);
      console.log(`      Silakan buat bucket bernama "${PHOTO_BUCKET}" di panel Storage Supabase.`);
    }
    storageSuccess = true;
  } catch (error: any) {
    console.error('   ❌ GAGAL: Tidak dapat terhubung ke Supabase Storage.');
    console.error(`   Error Detail: ${error?.message || error}`);
  }
  console.log('');

  // 3. Ringkasan Evaluasi
  console.log('📊 RINGKASAN EVALUASI:');
  console.log('──────────────────────────────────────────────────');
  console.log(`Database (PostgreSQL)  : ${dbSuccess ? '🟢 AKTIF' : '🔴 ERROR'}`);
  console.log(`Supabase Storage (API) : ${storageSuccess ? '🟢 AKTIF' : '🔴 ERROR'}`);
  console.log('──────────────────────────────────────────────────');

  if (dbSuccess && storageSuccess) {
    console.log('\n🎉 SEMUA KONEKSI AKTIF & BERJALAN DENGAN BAIK!');
    console.log('   Backend Anda siap dihubungkan ke frontend.');
  } else {
    console.log('\n❌ ADA KONEKSI YANG BERMASALAH.');
    console.log('   Silakan periksa konfigurasi berkas .env Anda.');
  }
}

testConnection()
  .catch((err) => {
    console.error('❌ Error Kritis saat menjalankan pengujian:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
