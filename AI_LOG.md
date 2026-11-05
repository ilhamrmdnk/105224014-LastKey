# AI Usage Log — LastKey

## Penggunaan AI

Dalam pengerjaan proyek LastKey, AI digunakan sebagai alat bantu untuk memahami materi, menyusun dokumentasi, mengimplementasikan fitur full-stack, mengembangkan modul kriptografi, serta menyusun dan memverifikasi kontrol keamanan aplikasi.

---

## Penggunaan AI pada Cyber Security Latihan 1 & Tugas 1 (`sec-0.1`)

AI digunakan untuk membantu:
1. Mengidentifikasi aset dan data yang perlu dilindungi pada aplikasi LastKey (`security/assets.md`).
2. Menentukan klasifikasi Confidentiality (C), Integrity (I), dan Availability (A) beserta alasan awalnya.
3. Merancang DFD dan *trust boundary* (`security/dfd-awal.png` dan `security/dfd-arsitektur-sec-0.1.png`).
4. Mengidentifikasi ancaman menggunakan metode STRIDE (`security/stride.md`).
5. Menyusun analisis kemungkinan dan dampak risiko untuk lima risiko prioritas `R01`–`R05` (`security/risk-analysis.md`).
6. Menyusun rencana kontrol keamanan untuk risiko prioritas (`security/control-plan.md`).

---

## Penggunaan AI pada Milestone 1 (`v0.1`) — Web & Cryptography

AI digunakan sebagai bantuan dalam:
- Merancang komponen UI bertema *dark cybersecurity* pada Next.js App Router.
- Mengimplementasikan komponen dasar AES-256-GCM menggunakan `@noble/ciphers` (`crypto/aes-gcm.ts`) beserta 4 unit test awal (`crypto/aes-gcm.test.ts`).

---

## Penggunaan AI pada Milestone 2 (`v0.2` & `sec-0.2`)

Pada pengembangan Milestone 2 yang mengintegrasikan tiga mata kuliah (**Pengembangan Aplikasi Web**, **Kriptografi**, dan **Keamanan Komputasi dan Siber**), AI digunakan sebagai *autonomous pair-programming assistant* untuk:

### 1. Ringkasan Prompt & Tujuan Penggunaan
- Melakukan audit menyeluruh terhadap kondisi repository, perubahan praktikum, status PostgreSQL, konfigurasi Prisma ORM 7 (`prisma7.config.ts`), dan lingkungan sistem (`systemd-detect-virt`, Docker).
- Merancang dan membuat migrasi skema Prisma ORM 7 (`prisma/schema.prisma`) yang mencakup relasi `User`, `Recipient`, dan `Vault` dengan *referential integrity* (`onDelete: Restrict`).
- Mengimplementasikan Server Actions dan UI CRUD penuh untuk `Vault` (`/vault`, `/vault/[id]`) dan `Recipient` (`/recipients`), serta fitur *proof-of-life check-in* (`/check-in`) yang terhubung langsung ke PostgreSQL.
- Memperkuat validasi server-side menggunakan **Zod 4** (`lib/validation/vault-schema.ts` dan `lib/validation/recipient-schema.ts`), termasuk aturan semantik domain `isValidSwitchTiming`.
- Mengintegrasikan enkripsi **AES-256-GCM** dengan *Additional Authenticated Data* (AAD) kontekstual (`lastkey:v1:vault:<vaultId>:description`) pada field `Vault.description` di database PostgreSQL serta menyusun dokumen `KEPUTUSAN.md`.
- Mengimplementasikan autentikasi berbasis hash `bcrypt` (`bcryptjs`, cost factor 12), sesi cookie `httpOnly` bertanda tangan HMAC-SHA256, serta otorisasi **RBAC** (`OWNER`, `RECIPIENT`, `UNAUTHENTICATED`) dan proteksi *anti-IDOR* di seluruh Server Actions.
- Merancang konfigurasi hardening container (`Dockerfile` multi-stage berbasis `node:20-alpine` non-root dan `docker-compose.yml` dengan `cap_drop: ALL`, `read_only: true`, jaringan internal), menjalankan pemindaian kerentanan menggunakan **Aqua Trivy** (`image-scan-before.txt` dan `image-scan-after.txt`), serta menghasilkan SBOM berformat **CycloneDX** (`security/sbom.cdx.json`).
- Menyusun rangkaian pengujian otomatis (total 42 test) dan menangkap bukti screenshot aplikasi.

### 2. Daftar File yang Dibuat / Dimodifikasi dengan Bantuan AI pada Milestone 2
- **Database & Seed:** `prisma/schema.prisma`, `prisma/migrations/20261105151430_v0_2_rbac_and_relations/migration.sql`, `prisma/seed.ts`, `prisma7.config.ts`, `lib/prisma.ts`, `.env.example`.
- **Validasi & Kriptografi:** `lib/validation/vault-schema.ts`, `lib/validation/recipient-schema.ts`, `crypto/aes-gcm.ts`, `crypto/aes-gcm.test.ts`, `KEPUTUSAN.md`.
- **Autentikasi, RBAC, & Server Actions:** `lib/auth.ts`, `lib/actions/auth-actions.ts`, `lib/actions/vault-actions.ts`, `lib/actions/recipient-actions.ts`, `app/actions/lastkey-actions.ts`.
- **Komponen & Halaman UI:** `components/SessionBanner.tsx`, `components/LoginClient.tsx`, `components/RecipientsClient.tsx`, `components/VaultClient.tsx`, `components/Sidebar.tsx`, `app/page.tsx`, `app/vault/page.tsx`, `app/vault/[id]/page.tsx`, `app/recipients/page.tsx`, `app/check-in/page.tsx`, `app/login/page.tsx`.
- **Container & Keamanan (`sec-0.2`):** `next.config.ts`, `Dockerfile.before`, `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `security/control-plan.md`, `security/access-tests.md`, `security/vm-hardening-guide.md`, `security/image-scan-before.txt`, `security/image-scan-after.txt`, `security/sbom.cdx.json`.
- **Pengujian & Dokumentasi:** `tests/web-crud.test.ts`, `tests/access-control.test.ts`, `docs/testing-v0.2.md`, `docs/evidence/v0.2/*.png`, `README.md`, `AI_LOG.md`.

### 3. Cara Verifikasi Hasil Pekerjaan (Human & Automated Verification)
Seluruh kode dan konfigurasi yang dihasilkan tidak langsung diklaim selesai, melainkan diverifikasi secara langsung pada lingkungan nyata melalui:
1. **Verifikasi Skema, Migrasi, dan Idempotent Seed PostgreSQL:**
   ```bash
   npx prisma generate
   npx prisma migrate status
   npx prisma db seed
   ```
2. **Verifikasi 42 Automated Tests (Kriptografi, Web CRUD & Zod 4, RBAC & Password Hashing):**
   ```bash
   npm test
   ```
   *(Hasil: 42 tests, 42 pass, 0 fail)*
3. **Verifikasi Kualitas Kode & Build Produksi:**
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run build
   ```
4. **Verifikasi Keamanan Container & Supply Chain:**
   - Pemeriksaan `docker compose config --no-interpolate`.
   - Build image sebelum hardening (`lastkey-app:0.2-before`) dan sesudah hardening (`lastkey-app:0.2-hardened`).
   - Eksekusi pemindaian kerentanan nyata dengan Aqua Trivy dan verifikasi struktur CycloneDX SBOM (`security/sbom.cdx.json`).
5. **Pemeriksaan Lingkungan Host (`systemd-detect-virt`):**
   - Terdeteksi `none` (host fisik), sehingga sesuai prinsip kejujuran akademik dan keamanan sistem host, tidak dilakukan modifikasi SSH pada mesin utama dan tidak dibuat hasil audit Lynis palsu; status dicatat secara transparan sebagai `BLOCKED/PENDING` di `security/vm-hardening-guide.md`.
