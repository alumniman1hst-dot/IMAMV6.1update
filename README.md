
# IMAM - Integrated Madrasah Academic Manager 🏫

**IMAM** adalah sistem manajemen madrasah modern yang dirancang khusus untuk **MAN 1 Hulu Sungai Tengah**. Aplikasi ini mengintegrasikan administrasi sekolah, absensi berbasis QR Code, pengelolaan nilai, hingga asisten cerdas berbasis AI dalam satu platform mobile-first yang responsif.

![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6-purple?style=for-the-badge&logo=vite)
![Firebase](https://img.shields.io/badge/Firebase-Database-orange?style=for-the-badge&logo=firebase)

## 🚀 Fitur Utama
- **Mobile-First Experience**: Desain UI yang bersih dan dioptimalkan untuk perangkat mobile (tanpa bingkai kontainer yang mengganggu).
- **Presensi QR Code**: Sistem absensi harian (Masuk, Duha, Zuhur, Ashar, Pulang) dengan pemindaian QR dan suara feedback otomatis.
- **Pencarian Teroptimasi**: Fitur pencarian siswa berdasarkan Nama, NISN, atau ID Unik yang cepat dan aman dari data kosong.
- **AI Educational Assistant**: Terintegrasi dengan **Google Gemini API** untuk pembuatan RPP, Kuis, dan materi ajar otomatis.
- **Layanan Surat Digital (PTSP)**: Alur kerja permohonan surat dengan verifikasi berjenjang hingga tanda tangan digital (QR Seal).
- **Manajemen Data Induk**: Pengelolaan data siswa, guru, kelas, dan tahun akademik secara realtime via Firestore.
- **PWA Ready**: Dapat diinstal di Android/iOS (Add to Home Screen) layaknya aplikasi asli.

## 🛠️ Panduan Deployment ke Vercel (PENTING)

Aplikasi ini menggunakan **Vite** sebagai build tool. Untuk menghindari kesalahan deteksi framework oleh Vercel:

### 1. Konfigurasi di Dashboard Vercel
Saat mengimpor proyek, masuk ke bagian **Settings > General**:
- **Framework Preset**: Ubah ke **Vite** (Jangan gunakan Next.js).
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2. Environment Variables
Wajib tambahkan variabel berikut di Dashboard Vercel (Settings > Environment Variables):

| Key | Value | Deskripsi |
|---|---|---|
| `GEMINI_API_KEY` | `YOUR_API_KEY_HERE` | Dapatkan di [Google AI Studio](https://aistudio.google.com/) |

### 3. Authorized Domains
Tambahkan URL deployment Anda (misal: `imam-school.vercel.app`) ke dalam daftar **Authorized Domains** di Firebase Console (Authentication > Settings > Authorized Domains).

## 💻 Pengembangan Lokal

1. **Clone & Install**:
   ```bash
   git clone [url-repo-anda]
   cd imam-management-school
   npm install
   ```

2. **Setup Env**:
   Buat file `.env` di root folder:
   ```env
   GEMINI_API_KEY=AIzaSy... (API Key Anda)
   ```

3. **Run Dev**:
   ```bash
   npm run dev
   ```

## 📂 Struktur Proyek
- `components/` : Komponen UI React (Dashboard, Login, Presensi, StudentData, dll).
- `services/` : Logika Firebase, Firestore, dan integrasi Gemini AI.
- `types.ts` : Definisi interface dan role pengguna.
- `index.tsx` : Entry point aplikasi.

## 📝 Kontributor
- **Lead Developer**: Akhmad Arifin (NIP: 19901004 202521 1012)
- **Instansi**: MAN 1 Hulu Sungai Tengah

---
*Build with ❤️ for better Indonesian Education.*


## ☁️ Cloud Run Production (Docker)

Arah scaling yang dipilih untuk fase ini: **Full Cloud Run production Dockerfile**.

### 1) Build image
```bash
docker build -t imam-app .
```

### 2) Run locally (production mode)
```bash
docker run --rm -p 8080:8080 \
  -e NODE_ENV=production \
  -e GEMINI_API_KEY=your_key \
  imam-app
```

### 3) Deploy to Cloud Run (contoh)
```bash
gcloud run deploy imam-app \
  --source . \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,GEMINI_API_KEY=your_key
```

Catatan:
- `server.ts` akan menjalankan mode production jika `NODE_ENV=production`.
- Pada mode production, server melayani aset statis hasil build (`dist/`) tanpa Vite middleware.
