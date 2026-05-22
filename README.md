# Bilasin 🧺

**Bilasin** adalah aplikasi web full-stack modern berbasis Next.js App Router yang dirancang untuk mengelola bisnis laundry secara cerdas, transparan, dan efisien. 

Sistem ini memiliki dua portal utama:
1. **Public Customer Tracking Portal**: Pelanggan dapat mencari status cucian menggunakan nomor resi unik tanpa perlu login, lengkap dengan estimasi sisa waktu pengerjaan dan status pembayaran.
2. **Admin Dashboard Portal**: Petugas outlet dapat mendaftarkan cucian baru, memperbarui antrean pengerjaan lewat papan antrean visual (Kanban), mengelola katalog harga layanan, meninjau laporan keuangan, dan mencetak nota struk fisik/digital (dilengkapi QR Code pelacakan).

---

## 🔑 Kredensial Default Administrator
- **Email**: `admin@bilasin.local`
- **Password**: `admin12345`

---

## 🛠️ Tech Stack & Arsitektur
- **Frontend/Backend**: Next.js 15 (React 19, App Router, Server Actions)
- **Database ORM**: Prisma ORM dengan PostgreSQL (Cloud SQL / Neon)
- **Styling**: Tailwind CSS v4 (Desain visual premium dengan tema Navy Dark dan Emerald)
- **Keamanan**: Autentikasi Admin terproteksi menggunakan Signed JWT HTTP-Only Cookies (via `jose`) di Edge Middleware
- **Algoritma Estimasi Antrean**: Perhitungan dinamis sisa durasi pengerjaan berdasarkan akumulasi beban kg antrean berjalan dan slot kerja mesin paralel maksimal.

---

## 💻 Panduan Instalasi Lokal

### 1. Prasyarat
- Node.js versi 18 ke atas
- PostgreSQL (aktif lokal atau cloud)

### 2. Langkah Penginstalan
1. Install seluruh dependensi:
   ```bash
   npm install --legacy-peer-deps
   ```
2. Buat berkas `.env` dari salinan `.env.example`:
   ```bash
   copy .env.example .env
   ```
3. Sesuaikan koneksi database `DATABASE_URL` di berkas `.env`. Contoh:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bilasin"
   JWT_SECRET="ganti_dengan_kode_rahasia_jwt_minimal_32_karakter"
   APP_URL="http://localhost:3000"
   ```
4. Jalankan sinkronisasi skema database Prisma:
   ```bash
   npx prisma db push
   ```
5. Isi database dengan data admin awal & contoh data transaksi:
   ```bash
   npm run db:seed
   ```
6. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
7. Buka [http://localhost:3000](http://localhost:3500) di peramban Anda.

---

## 🚀 Panduan Manual Deployment ke Google Cloud Console

Aplikasi ini sudah dilengkapi dengan berkas `Dockerfile` multi-stage dan `cloudbuild.yaml` untuk memudahkan integrasi dengan Google Cloud Platform (GCP).

### Langkah 1: Siapkan Database Google Cloud SQL (PostgreSQL)
1. Buka Google Cloud Console dan masuk ke menu **SQL**.
2. Klik **Create Instance** -> pilih **PostgreSQL**.
3. Konfigurasikan nama instansi, password root, dan pilih lokasi terdekat (misal `asia-southeast2` untuk Jakarta).
4. Buat database baru bernama `bilasin` di dalam instansi tersebut.
5. Konfigurasikan koneksi agar dapat diakses secara publik (Authorized Networks) atau gunakan Cloud SQL Auth Proxy.

### Langkah 2: Buat Repositori di Artifact Registry
1. Masuk ke menu **Artifact Registry**.
2. Klik **Create Repository**.
3. Beri nama repositori: `bilasin-repo`.
4. Pilih format: **Docker**.
5. Pilih lokasi: `asia-southeast2` (Jakarta).

### Langkah 3: Deploy Menggunakan Cloud Build & Cloud Run
Anda dapat mendeploy otomatis lewat Cloud Shell dengan memicu build:
```bash
gcloud builds submit --config=cloudbuild.yaml --substitutions=_AR_REPO="washgo-repo",_RUN_REGION="asia-southeast2",_AR_REGION="asia-southeast2"
```

### Langkah 4: Konfigurasi Environment Variables di Cloud Run
Setelah container berhasil di-deploy ke **Cloud Run**, buka konfigurasi service **bilasin** dan tambahkan variabel lingkungan berikut:
- `DATABASE_URL`: URL koneksi PostgreSQL instansi Cloud SQL Anda.
- `JWT_SECRET`: Kode rahasia JWT yang kuat untuk keamanan token admin.
- `APP_URL`: Domain url publik instansi Cloud Run Anda (contoh `https://bilasin-xxxx-as.a.run.app`).

Pilihlah opsi **Allow unauthenticated invocations** agar pelanggan umum dapat mengakses pelacakan resi tanpa login.
