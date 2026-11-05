# LastKey

LastKey adalah **Secure Digital Vault** dengan konsep **Dead Man's Switch** untuk membantu pengguna mengamankan data digital penting menggunakan enkripsi terautentikasi (**AES-256-GCM + AAD**), mengelola penerima darurat (*emergency recipients*) secara relasional, serta menyediakan mekanisme *proof-of-life check-in* dan *role-based access control* (RBAC).

---

## 1. Product Concept

- **Nama Produk:** LastKey
- **Masalah yang Ingin Diselesaikan:** Risiko hilangnya akses permanen terhadap data dan aset digital kritis (seperti kunci pemulihan kripto, arsip hukum, dokumen medis darurat, atau kredensial infrastruktur) apabila pemilik aset mengalami musibah mendadak, kehilangan kesadaran, atau meninggal dunia tanpa sempat mewariskan akses secara aman kepada keluarga atau pihak terpercaya.
- **Tujuan Aplikasi:** Menyediakan brankas digital yang menyimpan payload sensitif dalam bentuk terenkripsi di basis data, memantau status keaktifan pemilik melalui konfirmasi berkala (*proof-of-life check-in*), membatasi akses dengan *Role-Based Access Control* (`OWNER` vs `RECIPIENT`), dan menyiapkan mekanisme pelepasan darurat kepada penerima yang ditunjuk jika pemilik gagal melakukan check-in melampaui batas waktu (*interval* + *grace period*).
- **Target Pengguna:** Individu dengan aset digital berharga, pengelola dokumen penting keluarga, profesional hukum/keuangan, serta administrator sistem yang memerlukan protokol keberlangsungan akses (*continuity protocol*).

---

## 2. Milestone 1 Summary (`v0.1` & `sec-0.1`)

Pada Milestone 1 (`v0.1` dan `sec-0.1`), LastKey telah memiliki fondasi berikut:
- Antarmuka *Dark Cybersecurity Interface* responsif pada halaman Dashboard (`/`), My Vault (`/vault`), Detail Vault (`/vault/[id]`), Check-in (`/check-in`), dan About (`/about`).
- Validasi form pembuatan Vault menggunakan **Zod 4** (`lib/validation/vault-schema.ts`).
- Modul dasar kriptografi **AES-256-GCM** (`crypto/aes-gcm.ts`) menggunakan `@noble/ciphers` dengan 4 skenario pengujian unit awal.
- Dokumentasi pemodelan ancaman **Tugas 1 (`sec-0.1`)** mencakup inventaris aset (`security/assets.md`), DFD & *trust boundary* (`security/dfd-arsitektur-sec-0.1.png`), analisis ancaman STRIDE (`security/stride.md`), analisis risiko (`security/risk-analysis.md` untuk risiko `R01`–`R05`), serta rencana kontrol (`security/control-plan.md`).

---

## 3. Milestone 2 / `v0.2` Features (`v0.2` & `sec-0.2`)

Pada Milestone 2 (`v0.2` & `sec-0.2`), seluruh alur produk LastKey telah terintegrasi penuh dengan basis data PostgreSQL, enkripsi aplikatif, dan kontrol keamanan server-side:

1. **Integrasi PostgreSQL & Prisma ORM 7:** Persistensi penuh menggantikan mock data, dilengkapi konfigurasi `prisma7.config.ts`, migration terstruktur, dan idempotent synthetic seed (`@example.test`).
2. **Relasi Entitas & Referential Integrity:** Relasi `User` (1:N) → `Vault` & `Recipient`, serta `Recipient` (1:N) → `Vault` dengan kebijakan `onDelete: Restrict` agar penerima darurat yang masih terhubung dengan Vault aktif tidak dapat dihapus secara tidak sengaja.
3. **Full CRUD Vault (`/vault` & `/vault/[id]`):** Create, Read (daftar & detail), Update (inline edit modal & halaman detail), dan Delete Vault melalui Next.js Server Actions.
4. **Full CRUD Recipient (`/recipients`):** Halaman manajemen Emergency Recipients terintegrasi untuk menambah, melihat daftar & detail Vault terkait, memperbarui, serta menghapus penerima darurat.
5. **Validasi Server-Side dengan Zod 4:** Seluruh Server Actions memvalidasi input di sisi server menggunakan Zod 4, termasuk verifikasi keberadaan `recipientId` di database dan aturan semantik domain `isValidSwitchTiming` (menolak kombinasi interval `7 days` dengan grace period `72 hours`).
6. **Integrasi Enkripsi AES-256-GCM + Context-Bound AAD:** Field sensitif `Vault.description` dienkripsi di server menggunakan AES-256-GCM dan diikat ke konteks `lastkey:v1:vault:<vaultId>:description` (AAD) sebelum disimpan ke PostgreSQL dalam format `enc:v1:<nonce_b64>:<ciphertext_b64>`.
7. **Autentikasi Password Hashing (`bcrypt`) & RBAC (`OWNER`, `RECIPIENT`, `UNAUTHENTICATED`):** Penyimpanan password menggunakan hash `bcrypt` (cost factor 12), sesi `httpOnly` cookie bertanda tangan HMAC-SHA256, serta pemeriksaan kepemilikan (*anti-IDOR*) di seluruh Server Actions.
8. **Container Hardening & Supply Chain Security:** Multi-stage `Dockerfile` berbasis `node:20-alpine` (non-root user `1001:1001`, penghapusan paket `npm` di runtime), `docker-compose.yml` dengan `cap_drop: ALL`, `read_only: true`, `no-new-privileges:true`, jaringan internal terisolasi, pemindaian kerentanan Trivy (`before` vs `after` dengan 0 Critical/High), serta pembuatan SBOM berformat CycloneDX (`security/sbom.cdx.json`).

---

## 4. Technology Stack

- **Framework Web:** Next.js 16.4.1 (App Router, Server Actions, Standalone Output — diperbarui dari 16.3.8 untuk remediasi CVE-2026-94482 & GHSA-2464-fhr4-w9xw)
- **Library UI:** React 19.2.8 & Tailwind CSS 4
- **Bahasa Pemrograman:** TypeScript 5.9.3 (tanpa penggunaan `any`)
- **Basis Data & ORM:** PostgreSQL 16 & Prisma ORM 7.10.1 (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
- **Validasi Skema:** Zod 4.6.5
- **Kriptografi:** `@noble/ciphers` (AES-256-GCM dengan AAD) & Web Crypto API CSPRNG (`crypto.getRandomValues`)
- **Autentikasi & Hashing:** `bcryptjs` (cost factor 12) & Node.js `crypto` HMAC-SHA256
- **Pengujian Otomatis:** Node.js Test Runner (`tsx --test`) — 42 automated tests
- **Container & Keamanan Supply Chain:** Docker, Docker Compose, Aqua Trivy (Vulnerability Scanner & CycloneDX SBOM Generator)

---

## 5. Database Design: `User`, `Recipient`, dan `Vault`

Skema basis data didefinisikan pada [`prisma/schema.prisma`](prisma/schema.prisma) dengan tiga model utama:

### 1. `User`
Menyimpan akun pengguna untuk kebutuhan autentikasi dan otorisasi RBAC (`R01`, `R02`, `R03`, `R04`):
- `id` (`String`, `@id @default(cuid())`)
- `name` (`String`)
- `email` (`String`, `@unique`)
- `passwordHash` (`String` — hash bcrypt `$2b$12$...`)
- `role` (`UserRole` enum: `OWNER` | `RECIPIENT`)
- `createdAt`, `updatedAt` (`DateTime`)

### 2. `Recipient`
Menyimpan entitas penerima darurat (*emergency contact*) yang ditunjuk oleh pemilik Vault:
- `id` (`String`, `@id @default(cuid())`)
- `name` (`String`)
- `email` (`String`, `@unique`)
- `ownerId` (`String?`, Foreign Key ke `User.id`, `onDelete: SetNull`)
- `createdAt`, `updatedAt` (`DateTime`)

### 3. `Vault`
Menyimpan kompartemen brankas digital beserta parameter Dead Man's Switch dan payload terenkripsi:
- `id` (`String`, `@id @default(cuid())`)
- `name` (`String`)
- `description` (`String?` — disimpan terenkripsi `enc:v1:<nonce_b64>:<ciphertext_b64>`)
- `status` (`VaultStatus` enum: `Active` | `Pending` | `Standby`)
- `filesCount` (`Int`)
- `size` (`String`)
- `lastUpdated` (`DateTime`)
- `checkInInterval` (`String`: `"7 days"` | `"14 days"` | `"30 days"`)
- `gracePeriod` (`String`: `"24 hours"` | `"48 hours"` | `"72 hours"`)
- `ownerId` (`String?`, Foreign Key ke `User.id`, `onDelete: SetNull`)
- `recipientId` (`String`, Foreign Key ke `Recipient.id`, `onDelete: Restrict`)
- `createdAt`, `updatedAt` (`DateTime`)

---

## 6. Entity Relationship

```mermaid
erDiagram
    USER ||--o{ VAULT : "owns (ownerId)"
    USER ||--o{ RECIPIENT : "manages (ownerId)"
    RECIPIENT ||--o{ VAULT : "assigned to (recipientId, ON DELETE RESTRICT)"

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        enum role "OWNER | RECIPIENT"
    }
    RECIPIENT {
        string id PK
        string name
        string email UK
        string ownerId FK
    }
    VAULT {
        string id PK
        string name
        string description "AES-256-GCM (enc:v1:...)"
        enum status "Active | Pending | Standby"
        string checkInInterval
        string gracePeriod
        string ownerId FK
        string recipientId FK
    }
```

- **Satu `Recipient` dapat terhubung dengan beberapa `Vault` (1:N)**, dan **setiap `Vault` wajib memiliki satu `Recipient`**.
- Kebijakan `onDelete: Restrict` pada `Vault.recipientId` memastikan penghapusan `Recipient` yang masih digunakan oleh `Vault` ditolak oleh database dan Server Action sehingga tidak ada Vault yang kehilangan penerima darurat secara tidak sengaja.

---

## 7. Getting Started

### Prasyarat
- Node.js `v20.x` atau lebih baru
- PostgreSQL `v14+` / `v16+` yang sedang berjalan
- npm

### Langkah Instalasi

1. **Salin konfigurasi environment:**
   ```bash
   cp .env.example .env
   ```
   Sesuaikan `DATABASE_URL`, `LASTKEY_ENCRYPTION_KEY_BASE64`, dan `LASTKEY_SESSION_SECRET` pada `.env`.

2. **Instal seluruh dependensi:**
   ```bash
   npm install
   ```

3. **Generate Prisma Client, jalankan migrasi, dan isi data awal (seed):**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di peramban.

---

## 8. Environment Variables

Lihat [`.env.example`](.env.example) untuk daftar lengkap variabel environment. Seluruh variabel rahasia hanya dibaca di sisi server (tidak menggunakan prefix `NEXT_PUBLIC_`):

| Variabel | Deskripsi | Contoh / Cara Generate |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://USER:PASSWORD@localhost:5432/lastkey?schema=public` |
| `LASTKEY_ENCRYPTION_KEY_BASE64` | Kunci AES-256 (32 byte) dalam format Base64 untuk enkripsi `Vault.description` (`R02`, `R05`) | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `LASTKEY_SESSION_SECRET` | Secret key HMAC-SHA256 untuk penandatanganan cookie sesi autentikasi (`R01`) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `LASTKEY_SEED_PASSWORD` | Password sintetis opsional untuk akun demo saat menjalankan `npx prisma db seed` | `LastKey#Synthetic2026!` |

---

## 9. Prisma Setup, Migration, dan Seed

Proyek ini menggunakan **Prisma ORM 7** dengan konfigurasi [`prisma7.config.ts`](prisma7.config.ts) dan driver adapter `@prisma/adapter-pg` di [`lib/prisma.ts`](lib/prisma.ts).

- **Generate Prisma Client:**
  ```bash
  npx prisma generate
  ```
- **Menjalankan Migration:**
  ```bash
  npx prisma migrate dev
  ```
  File migrasi tersimpan di `prisma/migrations/20261217165656_init/` dan `prisma/migrations/20261105151430_v0_2_rbac_and_relations/`.
- **Menjalankan Idempotent Seed:**
  ```bash
  npx prisma db seed
  ```
  Script [`prisma/seed.ts`](prisma/seed.ts) bersifat **idempotent** (aman dijalankan berulang kali menggunakan `upsert`) dan hanya menggunakan domain sintetis `@example.test`:
  - **OWNER 1:** `owner@example.test` (mengelola Vault `v-1` s.d. `v-6` dan 4 Recipient)
  - **OWNER 2:** `owner2@example.test` (mengelola Vault `v-owner2` untuk pengujian isolasi anti-IDOR)
  - **RECIPIENT:** `sarah.connor@example.test` (ditunjuk sebagai penerima darurat pada Vault `v-1` dan `v-5`)

---

## 10. Available Routes

| Route | Deskripsi | Hak Akses |
|---|---|---|
| `/` | **Dashboard** — Ringkasan metrik perlindungan vault, status keamanan, countdown Dead Man's Switch, dan aktivitas sistem dari PostgreSQL. | Publik / Menyesuaikan sesi |
| `/vault` | **My Vault** — Daftar kompartemen Vault dari PostgreSQL, pencarian/filter, pembuatan Vault baru, pembaruan (edit), dan penghapusan Vault. | `OWNER` (CRUD penuh), `RECIPIENT` (Read-only Vault yang ditugaskan) |
| `/vault/[id]` | **Vault Detail** — Inspeksi payload terdekripsi, status enkripsi AES-256-GCM + AAD, informasi Recipient, serta form edit dan hapus Vault. | `OWNER` pemilik Vault, atau `RECIPIENT` yang ditugaskan |
| `/recipients` | **Emergency Recipients** — Pengelolaan penerima darurat (Create, Read daftar & keterkaitan Vault, Update, Delete dengan proteksi referensial). | `OWNER` (CRUD penuh), `RECIPIENT` (Read-only profil sendiri) |
| `/check-in` | **Check-in Console** — Konsol *proof-of-life check-in* untuk memperbarui timestamp seluruh Vault aktif milik `OWNER`. | `OWNER` |
| `/login` | **Authentication & Role Switcher** — Halaman login menggunakan email & password (`bcrypt`) serta tombol *Quick Role Switch* untuk demonstrasi RBAC. | Publik |
| `/about` | **About LastKey** — Penjelasan arsitektur dan konsep keamanan LastKey. | Publik |

---

## 11. CRUD Features: Vault dan Recipient

Seluruh operasi mutasi data diimplementasikan menggunakan **Next.js Server Actions** dengan pemisahan tanggung jawab:
- [`lib/actions/vault-actions.ts`](lib/actions/vault-actions.ts): `createVaultAction`, `getVaultsAction`, `getVaultByIdAction`, `updateVaultAction`, `deleteVaultAction`, `checkInAllVaultsAction`.
- [`lib/actions/recipient-actions.ts`](lib/actions/recipient-actions.ts): `createRecipientAction`, `getRecipientsAction`, `getRecipientByIdAction`, `updateRecipientAction`, `deleteRecipientAction`.
- [`lib/actions/auth-actions.ts`](lib/actions/auth-actions.ts): `loginAction`, `logoutAction`, `switchDemoRoleAction`, `getSessionAction`.

Setiap Server Action memvalidasi sesi pengguna, memeriksa izin RBAC & kepemilikan data, memvalidasi input menggunakan Zod 4, mengeksekusi query Prisma, memanggil `revalidatePath`, dan mengembalikan respons terstruktur tanpa membocorkan stack trace internal database.

---

## 12. Server Validation dengan Zod 4

Validasi tidak hanya bergantung pada browser, melainkan ditegakkan di server melalui:
- [`lib/validation/vault-schema.ts`](lib/validation/vault-schema.ts) (`vaultSchema` & `vaultUpdateSchema`):
  - `name`: wajib, minimal 3 karakter, maksimal 80 karakter.
  - `description`: opsional, maksimal 500 karakter.
  - `recipientId`: wajib dan diverifikasi keberadaannya serta kepemilikannya di tabel `Recipient`.
  - `checkInInterval`: wajib termasuk enum `["7 days", "14 days", "30 days"]`.
  - `gracePeriod`: wajib termasuk enum `["24 hours", "48 hours", "72 hours"]`.
  - `confirmation`: wajib bernilai `true` saat pembuatan Vault.
  - **Semantic Refinement (`isValidSwitchTiming`):** Menolak kombinasi jadwal agresif `checkInInterval = "7 days"` dengan `gracePeriod = "72 hours"` karena masa tenggang melebihi 30% dari jendela siklus check-in mingguan.
- [`lib/validation/recipient-schema.ts`](lib/validation/recipient-schema.ts) (`recipientSchema`):
  - `name`: wajib, 3–80 karakter, format alfabet/spasi/tanda baca nama yang sah.
  - `email`: wajib, format email valid, maksimal 120 karakter, dinormalisasi ke huruf kecil (`lowercase`).

---

## 13. Cryptography: AES-256-GCM, AAD, dan Integrasi Aplikasi

Dokumentasi keputusan arsitektur kriptografi secara lengkap tersedia di [`KEPUTUSAN.md`](KEPUTUSAN.md).

- **Implementasi:** [`crypto/aes-gcm.ts`](crypto/aes-gcm.ts) menggunakan `@noble/ciphers/aes.js` (`KEY_LENGTH = 32`, `NONCE_LENGTH = 12`, `TAG_LENGTH = 16`).
- **CSPRNG Nonce:** Setiap operasi enkripsi menghasilkan nonce 12-byte unik melalui `crypto.getRandomValues`.
- **Context-Bound AAD:** Fungsi `buildVaultAAD(vaultId, "description")` menghasilkan AAD `lastkey:v1:vault:<vaultId>:description`. Ciphertext dari satu Vault tidak dapat dipindahkan (*cut-and-paste attack*) ke Vault lain karena verifikasi GCM tag akan gagal.
- **Format Penyimpanan DB:** `enc:v1:<nonce_base64>:<ciphertext_with_tag_base64>`.
- **Fail-Closed Decryption:** Jika kunci hilang/salah, format rusak, ciphertext/tag termodifikasi, atau `vaultId` (AAD) tidak cocok, `decryptVaultField` melempar error dan aplikasi menampilkan pesan aman tanpa membocorkan data.

---

## 14. Access Control dan Password Hashing

Implementasi keamanan aplikasi pada [`lib/auth.ts`](lib/auth.ts) memitigasi risiko prioritas Tugas 1 (`R01`, `R02`, `R03`, `R04`):
- **Password Hashing (`R01`):** Menggunakan `bcryptjs` dengan cost factor `12` (`$2b$12$...`). Password plaintext tidak pernah disimpan di database maupun log.
- **Signed Session Cookie (`R01`):** Token sesi ditandatangani dengan `HMAC-SHA256` menggunakan `LASTKEY_SESSION_SECRET` dan disimpan dalam cookie `httpOnly`, `sameSite: "lax"`, `secure` (di produksi).
- **Matriks RBAC & Anti-IDOR (`R02`, `R03`, `R04`):**
  - `OWNER`: Hanya dapat membaca, membuat, mengubah, dan menghapus `Vault` serta `Recipient` miliknya sendiri (`ownerId === session.userId`), serta memicu Check-in. Percobaan mengakses ID milik `OWNER` lain ditolak (*Anti-IDOR*).
  - `RECIPIENT`: Hanya dapat membaca (`Read`) Vault yang secara eksplisit menunjuk emailnya sebagai penerima darurat. Seluruh aksi Create/Update/Delete Vault, manajemen Recipient, dan Check-in ditolak.
  - `UNAUTHENTICATED`: Ditolak pada seluruh operasi pembacaan data sensitif maupun mutasi Server Actions.

Detail lengkap 19 pengujian kontrol akses dan password hashing tersedia di [`security/access-tests.md`](security/access-tests.md).

---

## 15. Hardening Summary: VM dan Container

- **VM Hardening (`BLOCKED / PENDING` pada Host Fisik):**
  Pemeriksaan `systemd-detect-virt` pada mesin kerja mengembalikan `none` (sistem berjalan langsung di atas host Linux fisik, bukan di dalam mesin virtual khusus pengujian). Sesuai aturan keselamatan kerja, konfigurasi daemon SSH dan firewall host fisik tidak diubah. Panduan teknis langkah demi langkah serta prosedur audit **Lynis** (`lynis-before.txt` & `lynis-after.txt`) apabila VM telah tersedia didokumentasikan secara lengkap di [`security/vm-hardening-guide.md`](security/vm-hardening-guide.md).
- **Container Hardening (Selesai & Terverifikasi):**
  - [`Dockerfile`](Dockerfile) menggunakan multi-stage build berbasis `node:20-alpine`, melakukan `apk upgrade --no-cache`, menghapus `npm`/`npx`/`corepack` dari runtime stage untuk mengeliminasi permukaan serangan, mengatur permission direktori (`chmod 550`), dan menjalankan proses sebagai user non-root `1001:1001` (`nextjs:nodejs`).
  - [`docker-compose.yml`](docker-compose.yml) menerapkan `user: "1001:1001"`, `read_only: true` (dengan `tmpfs` terbatas pada `/tmp`), `cap_drop: ALL`, `security_opt: [no-new-privileges:true]`, tanpa mode `privileged`, tanpa mempublikasikan port database ke host (`expose` saja), serta mengisolasi lalu lintas aplikasi dan database di jaringan bridge `internal: true`.

---

## 16. Supply Chain Security dan SBOM

Pemindaian kerentanan image container dan pembuatan SBOM dilakukan menggunakan **Aqua Trivy**:
- **Hasil Scan Sebelum Hardening ([`security/image-scan-before.txt`](security/image-scan-before.txt)):** Image baseline `node:20` (`lastkey-app:0.2-before`) berukuran ~1.69 GB dan memiliki ratusan kerentanan OS Debian/paket sistem serta dependensi build.
- **Hasil Scan Sesudah Hardening ([`security/image-scan-after.txt`](security/image-scan-after.txt)):** Image produksi `lastkey-app:0.2-hardened` berbasis `node:20-alpine` (non-root, runtime minimal tanpa `npm`) menghasilkan **0 Critical** dan **0 High** vulnerabilities.
- **Software Bill of Materials ([`security/sbom.cdx.json`](security/sbom.cdx.json)):** Dokumen SBOM standar **CycloneDX v1.6** yang memuat inventaris lengkap paket OS Alpine dan pustaka aplikasi produksi pada image `lastkey-app:0.2-hardened`.

---

## 17. Testing Instructions

Jalankan seluruh rangkaian pengujian otomatis (42 skenario mencakup Kriptografi, CRUD & Validasi Zod 4, serta RBAC & Password Hashing) dengan satu perintah:

```bash
npm test
```

Rincian file pengujian:
1. [`crypto/aes-gcm.test.ts`](crypto/aes-gcm.test.ts) — **9 pengujian unit kriptografi** (enkripsi/dekripsi dasar, keunikan nonce CSPRNG, deteksi manipulasi ciphertext, kunci salah, AAD konsisten, AAD berbeda konteks/vault, panjang kunci tidak valid, panjang nonce/ciphertext tidak valid, dan deserialisasi format payload rusak).
2. [`tests/web-crud.test.ts`](tests/web-crud.test.ts) — **14 pengujian integrasi CRUD & validasi server** (`TC-01` s.d. `TC-10` untuk siklus hidup penuh Recipient & Vault di PostgreSQL, relasi positif/negatif, serta `SV-01` s.d. `SV-04` untuk penolakan validasi Zod 4 termasuk aturan semantik `7 days` + `72 hours`).
3. [`tests/access-control.test.ts`](tests/access-control.test.ts) — **19 pengujian keamanan akses & autentikasi** (`PH-01` s.d. `PH-03` untuk bcrypt hashing, `AC-POS-01` s.d. `AC-POS-08` untuk izin positif `OWNER`/`RECIPIENT`, dan `AC-NEG-01` s.d. `AC-NEG-08` untuk penolakan akses ilegal & anti-IDOR).

Pemeriksaan tambahan:
```bash
npx tsc --noEmit   # Pemeriksaan tipe TypeScript
npm run lint       # Pemeriksaan kualitas kode ESLint
npm run build      # Kompilasi produksi Next.js (standalone)
```

---

## 18. Documentation Links

- **Keputusan Desain Kriptografi:** [`KEPUTUSAN.md`](KEPUTUSAN.md)
- **Laporan Pengujian Aplikasi Web v0.2:** [`docs/testing-v0.2.md`](docs/testing-v0.2.md)
- **Bukti Screenshot v0.2:** [`docs/evidence/v0.2/`](docs/evidence/v0.2/)
- **Rencana Kontrol Keamanan (`sec-0.1` & `sec-0.2`):** [`security/control-plan.md`](security/control-plan.md)
- **Pengujian Access Control & Password Hashing:** [`security/access-tests.md`](security/access-tests.md)
- **Panduan & Status VM Hardening:** [`security/vm-hardening-guide.md`](security/vm-hardening-guide.md)
- **Laporan Scan Kerentanan Container (Before):** [`security/image-scan-before.txt`](security/image-scan-before.txt)
- **Laporan Scan Kerentanan Container (After):** [`security/image-scan-after.txt`](security/image-scan-after.txt)
- **Dokumen CycloneDX SBOM:** [`security/sbom.cdx.json`](security/sbom.cdx.json)
- **Log Penggunaan AI:** [`AI_LOG.md`](AI_LOG.md)

---

## 19. Current Limitations / Future Work

1. **Eksekusi VM Hardening & Audit Lynis:** Karena pengembangan saat ini dilakukan langsung pada host Linux fisik (`systemd-detect-virt` = `none`), penerapan langsung hardening SSH/UFW dan pengambilan log `lynis-before.txt` / `lynis-after.txt` ditangguhkan (`BLOCKED/PENDING`) hingga tersedia VM Ubuntu khusus pengujian sesuai panduan di [`security/vm-hardening-guide.md`](security/vm-hardening-guide.md).
2. **Background Scheduler Dead Man's Switch Otomatis:** Saat ini pemicu check-in telah memperbarui timestamp secara nyata di PostgreSQL, namun *daemon* penjadwal latar belakang (*cron/worker*) yang secara otomatis mengirimkan email notifikasi pelepasan darurat saat waktu habis direncanakan untuk milestone berikutnya.
3. **Manajemen Kunci Terdistribusi (KMS / Key Rotation):** Kunci enkripsi server saat ini dikelola melalui variabel environment `LASTKEY_ENCRYPTION_KEY_BASE64`. Integrasi dengan Cloud KMS / HSM dan mekanisme rotasi kunci otomatis dengan amplop kunci (*envelope encryption*) dapat dikembangkan pada versi produksi.
