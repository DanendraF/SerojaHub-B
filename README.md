# Seroja Knowledge Hub — Backend

RESTful API backend untuk Kebun Komunitas Seroja. Dibangun menggunakan Express.js, TypeScript, Prisma ORM, dan database Supabase (PostgreSQL).

## Fitur Utama

- **API CRUD Tanaman**: Manajemen data tanaman kebun Seroja.
- **Upload File**: Mengunggah foto tanaman secara langsung ke Supabase Storage (Bucket: `plant-photos`).
- **Autentikasi Pengelola**: Pengamanan endpoint modifikasi (POST/PUT/DELETE) menggunakan Basic Auth dengan password yang dienkripsi menggunakan `bcrypt` di database.
- **Profil Kebun**: Endpoint untuk mengambil ringkasan informasi dan profil Kebun Seroja.
- **Keep-Alive System**: Fitur otomatis pemeliharaan server agar tidak tidur di hosting gratis (Render/Railway) dan database Supabase tidak masuk masa pause.

## Struktur Database (Prisma)

- `User`: Akun pengelola kebun (admin).
- `Plant`: Informasi lengkap tanaman (nama, jenis, lokasi bedeng, jadwal tanam, perkiraan panen, foto, deskripsi, manfaat, status).
- `GardenProfile`: Visi, misi, dan detail Kebun Seroja.
- `ActivityLog`: Pencatatan log aktivitas modifikasi database.

## Persiapan & Jalankan

1. **Salin Environment Variable**:
   ```bash
   cp .env.example .env
   ```
   Isi konfigurasi database Supabase dan kredensial server.

2. **Instal Dependensi**:
   ```bash
   npm install
   ```

3. **Database Setup & Migrasi**:
   ```bash
   # Generate Prisma Client
   npm run db:generate

   # Push skema database ke Supabase
   npm run db:push

   # Seed data awal (termasuk admin default)
   npm run db:seed
   ```

4. **Jalankan API**:
   ```bash
   # Mode Development
   npm run dev

   # Mode Production
   npm run build
   npm run start
   ```

   API secara default akan berjalan di `http://localhost:5000/api`.
