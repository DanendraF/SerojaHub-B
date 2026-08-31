-- ─────────────────────────────────────────────────────────────────────────────
-- SEROJA KNOWLEDGE HUB — DATABASE MIGRATION SCRIPT FOR SUPABASE SQL EDITOR
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Buat ENUM untuk Status Tanaman (pastikan tipe ini belum ada)
CREATE TYPE "PlantStatus" AS ENUM ('TUMBUH', 'SIAP_PANEN', 'PANEN', 'SELESAI');

-- 2. Buat Tabel: plants (Data Tanaman)
CREATE TABLE "plants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lokasi_bedeng" TEXT,
    "planting_date" TIMESTAMP(3) NOT NULL,
    "estimated_harvest_date" TIMESTAMP(3) NOT NULL,
    "photo_url" TEXT,
    "description" TEXT,
    "cara_tanam" TEXT,
    "manfaat" TEXT,
    "catatan_pengelola" TEXT,
    "status" "PlantStatus" NOT NULL DEFAULT 'TUMBUH',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- 3. Buat Tabel: garden_profiles (Profil Kebun Seroja)
CREATE TABLE "garden_profiles" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "lokasi" TEXT,
    "luas_area" TEXT,
    "visi" TEXT,
    "misi" TEXT,
    "founded_at" TIMESTAMP(3),
    "foto_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garden_profiles_pkey" PRIMARY KEY ("id")
);

-- 4. Buat Tabel: activity_logs (Log Riwayat Aktivitas)
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "target_id" TEXT,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- 5. Buat Tabel: users (Data Pengelola Kebun)
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Buat indeks unik untuk username
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

-- 6. Seed Profil Kebun Utama (Default)
INSERT INTO "garden_profiles" ("id", "nama", "deskripsi", "lokasi", "luas_area", "visi", "misi", "founded_at", "updated_at")
VALUES (
    'kebun-seroja-utama',
    'Kebun Komunitas Seroja',
    'Kebun komunitas yang dikelola bersama warga untuk meningkatkan ketahanan pangan dan edukasi pertanian organik di lingkungan Seroja.',
    'Jl. Seroja, RT 05/RW 03, Kelurahan Baciro, Yogyakarta',
    '200 m²',
    'Menjadi kebun percontohan komunitas yang mandiri dan produktif.',
    'Mengelola kebun secara organik, mendidik warga tentang bertani, dan mempererat kebersamaan melalui kegiatan berkebun.',
    '2024-01-15 00:00:00',
    now()
) ON CONFLICT ("id") DO NOTHING;

-- 7. Seed Akun Admin Pengelola Default
INSERT INTO "users" ("id", "username", "password", "name", "role", "created_at", "updated_at")
VALUES (
    'admin-seroja-default',
    'admin',
    'seroja123',
    'Pengelola Seroja',
    'ADMIN',
    now(),
    now()
) ON CONFLICT ("username") DO NOTHING;
