# Access Control, RBAC & Password Hashing Tests — LastKey (`sec-0.2`)

Dokumen ini mendokumentasikan matriks hak akses berbasis peran (*Role-Based Access Control / RBAC*), implementasi *password hashing* lambat menggunakan **bcrypt**, pencegahan *Insecure Direct Object Reference* (**Anti-IDOR**), serta hasil eksekusi pengujian akses server-side pada Milestone 2 (`sec-0.2`).

Seluruh kontrol pada dokumen ini merujuk langsung pada risiko prioritas dari Tugas 1 (`sec-0.1`):
- **R01:** Penyalahgunaan Credential / Session (*Spoofing*)
- **R02:** Kebocoran File / Data Vault (*Information Disclosure*)
- **R03:** Manipulasi Check-in Dead Man's Switch (*Tampering*)
- **R04:** Pemalsuan Recipient (*Spoofing*)
- **R05:** Kebocoran Encryption Key (*Information Disclosure*)

---

## 1. Matriks Peran dan Izin (*RBAC Authorization Matrix*)

Pemeriksaan izin dilakukan **secara penuh di sisi server (*server-side*)** di dalam setiap fungsi *Next.js Server Action* (`lib/actions/vault-actions.ts` dan `lib/actions/recipient-actions.ts`) menggunakan `getCurrentSession()` dari `lib/auth.ts` sebelum mengeksekusi query Prisma ke PostgreSQL.

| No. | Operasi / Resource | Server Action / Fungsi | `OWNER` | `RECIPIENT` | `UNAUTHENTICATED` | Risiko Terkait |
|---:|---|---|---|---|---|---|
| 1 | Membaca daftar Vault milik sendiri | `getVaultsFromDb()` | **ALLOW** (`ownerId === session.userId`) | **ALLOW** (Hanya Vault yang ditugaskan ke `session.email`) | **DENY** (`[]`) | R01, R02 |
| 2 | Membaca detail Vault milik sendiri / yang ditugaskan | `getVaultByIdFromDb(id)` | **ALLOW** (`vault.ownerId === session.userId`) | **ALLOW** (`vault.recipient.email === session.email`) | **DENY** (`null`) | R01, R02 |
| 3 | Membaca detail Vault milik pengguna lain (**IDOR**) | `getVaultByIdFromDb(id)` | **DENY** (`null`) | **DENY** (`null`) | **DENY** (`null`) | R01, R02 |
| 4 | Membuat Vault baru | `createVaultAction(input)` | **ALLOW** | **DENY** (`Forbidden`) | **DENY** (`Unauthorized`) | R01, R02, R04 |
| 5 | Mengubah konfigurasi Vault milik sendiri | `updateVaultAction(id, input)` | **ALLOW** (`vault.ownerId === session.userId`) | **DENY** (`Forbidden`) | **DENY** (`Unauthorized`) | R01, R02, R04 |
| 6 | Mengubah / menghapus Vault milik OWNER lain (**IDOR**) | `updateVaultAction` / `deleteVaultAction` | **DENY** (`Forbidden: Anti-IDOR`) | **DENY** (`Forbidden`) | **DENY** (`Unauthorized`) | R01, R02 |
| 7 | Menghapus Vault milik sendiri | `deleteVaultAction(id)` | **ALLOW** (`vault.ownerId === session.userId`) | **DENY** (`Forbidden`) | **DENY** (`Unauthorized`) | R01, R02 |
| 8 | Menambahkan file terenkripsi ke Vault | `addVaultFileAction(vaultId, input)` | **ALLOW** (`vault.ownerId === session.userId`) | **DENY** (`Forbidden`) | **DENY** (`Unauthorized`) | R01, R02 |
| 9 | Membaca daftar & detail Recipient | `getRecipientsFromDb()` / `getRecipientByIdFromDb(id)` | **ALLOW** (`ownerId === session.userId`) | **DENY** (`[]` / `null`) | **DENY** (`[]` / `null`) | R01, R04 |
| 10 | Membuat, mengubah, menghapus Recipient milik sendiri | `create/update/deleteRecipientAction` | **ALLOW** (`ownerId === session.userId`) | **DENY** (`Forbidden`) | **DENY** (`Unauthorized`) | R01, R04 |
| 11 | Mengubah / menghapus Recipient milik OWNER lain (**IDOR**) | `update/deleteRecipientAction` | **DENY** (`Forbidden: Anti-IDOR`) | **DENY** (`Forbidden`) | **DENY** (`Unauthorized`) | R01, R04 |
| 12 | Melakukan Check-in Dead Man's Switch | `performCheckInAction()` | **ALLOW** (Server-side timestamp) | **DENY** (`Forbidden`) | **DENY** (`Unauthorized`) | R01, R03 |
| 13 | Demo Role Switcher (Non-Production vs Production) | `switchDemoAccountAction(targetEmail)` | **ALLOW** di `development`/`test` (whitelist 3 akun demo) • **DENY** (`Forbidden`) saat `NODE_ENV === "production"` | **ALLOW** di `development`/`test` • **DENY** (`Forbidden`) di `production` | **ALLOW** di `development`/`test` • **DENY** (`Forbidden`) di `production` | R01 |

---

## 2. Akun Uji Sintetis (*Synthetic Test Accounts*)

Akun uji dibuat secara *idempotent* melalui `prisma/seed.ts` menggunakan domain sintetis `@example.test`. Tidak ada password *plaintext* yang disimpan di kode sumber maupun Git; password uji dibaca dari variabel lingkungan `LASTKEY_SEED_PASSWORD` dan langsung di-hash dengan **bcrypt (*cost factor* 12)**.

| ID User | Nama | Email Sintetis | Peran (`role`) | Kepemilikan / Penugasan Objek | Tujuan Pengujian |
|---|---|---|---|---|---|
| `user-owner-1` | Ilham Ramadhan | `owner@example.test` | `OWNER` | Memiliki Vault `v-1` s/d `v-6` dan Recipient `rec-1` s/d `rec-4` | Pengujian akses positif OWNER & pengujian penyerang pada skenario IDOR terhadap `user-owner-2` |
| `user-owner-2` | Raka Pratama | `owner2@example.test` | `OWNER` | Memiliki Vault terisolasi `v-owner2` dan Recipient `rec-owner2` | Target pengujian **Anti-IDOR** (memastikan `user-owner-1` ditolak saat mengakses `v-owner2` atau `rec-owner2`) |
| `user-recipient-1` | Sarah Connor | `sarah.connor@example.test` | `RECIPIENT` | Ditugaskan sebagai penerima darurat pada Vault `v-1` (`rec-1`) | Pengujian akses terbatas RECIPIENT (hanya boleh membaca `v-1`, ditolak membaca `v-2` atau mengubah `v-1`) |
| *(Tanpa Sesi)* | Guest / Anonymous | *(Tidak ada token sesi)* | `UNAUTHENTICATED` | Tidak memiliki sesi aktif | Memastikan seluruh endpoint terlindungi menolak akses tanpa sesi |

---

## 3. Bukti Implementasi Password Hashing & Session Security (Mitigasi `R01`)

1. **Algoritma Password Hashing:** Menggunakan **bcrypt** (`bcryptjs` dengan `BCRYPT_SALT_ROUNDS = 12` pada `lib/auth.ts`).
2. **Verifikasi Constant-Time:** Fungsi `verifyPassword(plainPassword, passwordHash)` memanggil `bcrypt.compare(plainPassword, passwordHash)`.
3. **Session Token & Cookie:** Setelah kredensial terverifikasi, `createSessionToken()` menandatangani payload sesi (`userId`, `email`, `role`, `iat`, `exp`) menggunakan **HMAC-SHA256** dengan kunci rahasia server `LASTKEY_SESSION_SECRET` (diverifikasi dengan `crypto.timingSafeEqual`). Cookie disimpan dengan atribut `httpOnly: true`, `sameSite: "lax"`, `secure: process.env.NODE_ENV === "production"`, dan `path: "/"`.

### Hasil Pengujian Password Hashing (`tests/access-control.test.ts`)

| ID Test | Risiko | Tujuan Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|---|
| **PH-01** | `R01` | Memastikan password tidak disimpan *plaintext* di PostgreSQL | Query `prisma.user.findUnique({ where: { email: "owner@example.test" } })` dan periksa format `passwordHash` | Nilai `passwordHash` memiliki awalan `$2b$12$` / `$2a$12$` dan berbeda dari password input | `passwordHash` cocok dengan regex `/^\$2[aby]\$12\$/` dan bukan *plaintext* (`1273.7 ms`) | **PASS** |
| **PH-02** | `R01` | Memastikan verifikasi password yang benar diterima oleh `verifyPassword` dan `loginAction` | Panggil `verifyPassword(seedPassword, user.passwordHash)` dan `loginAction({ email: "owner@example.test", password: seedPassword })` | Mengembalikan `true` dan `loginAction` menghasilkan sesi `OWNER` yang sah | `verifyPassword` mengembalikan `true` dan `loginAction` mengembalikan `{ success: true, user: { role: "OWNER" } }` (`1910.4 ms`) | **PASS** |
| **PH-03** | `R01` | Memastikan password yang salah ditolak oleh server | Panggil `verifyPassword("WrongPassword#999", user.passwordHash)` dan `loginAction` dengan password salah | Mengembalikan `false` dan `loginAction` menolak login tanpa membuat sesi | `verifyPassword` mengembalikan `false` dan `loginAction` mengembalikan `{ success: false, error: "Kredensial tidak valid (email atau password salah)." }` (`1905.8 ms`) | **PASS** |

### Hasil Pengujian Masa Berlaku Session Token (`tests/access-control.test.ts`)

Pengujian dilakukan secara deterministik menggunakan fake timers (`t.mock.timers.enable({ apis: ["Date"], now: FIXED_NOW_MS })`) dengan memastikan signature HMAC-SHA256 valid pada setiap skenario:

| ID Test | Risiko | Tujuan Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|---|
| **ST-01** | `R01` | Memastikan token sesi dengan `exp > now` dinyatakan sah | Buat token bertanda tangan HMAC dengan `exp = now + 3600` dan `now + 1`, panggil `verifySessionToken(token)` | Mengembalikan objek `SessionUser` yang valid | `verifySessionToken` mengembalikan payload `SessionUser` yang sesuai (`2.9 ms`) | **PASS** |
| **ST-02** | `R01` | Memastikan token sesi kedaluwarsa (`exp < now`) ditolak | Buat token bertanda tangan HMAC dengan `exp = now - 3600` dan `now - 1`, panggil `verifySessionToken(token)` | Mengembalikan `null` (ditolak *fail-closed*) | `verifySessionToken` mengembalikan `null` (`1.0 ms`) | **PASS** |
| **ST-03** | `R01` | Memastikan token sesi pada batas waktu persis (`exp === now`) ditolak | Buat token bertanda tangan HMAC dengan `exp === now`, panggil `verifySessionToken(token)` | Mengembalikan `null` (kedaluwarsa pada batas waktu) | `verifySessionToken` mengembalikan `null` (`0.7 ms`) | **PASS** |

---

## 4. Skenario dan Hasil Pengujian Akses (9 Positif & 9 Negatif)

Jumlah pengujian akses positif dan negatif disusun **seimbang (9 pengujian positif vs 9 pengujian negatif)** dan dieksekusi secara otomatis terhadap PostgreSQL melalui perintah:

```bash
npm run test:security
# atau: npx tsx --test tests/access-control.test.ts
```

### A. Pengujian Akses Positif (9 Skenario — `ALLOW`)

| ID Test | Peran | Risiko | Tujuan Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|---|---|
| **AC-POS-01** | `OWNER` (`owner@example.test`) | `R01`, `R02` | `OWNER` dapat membaca daftar Vault miliknya sendiri | Set sesi `owner@example.test`, panggil `getVaultsFromDb()` | Mengembalikan seluruh Vault milik `owner@example.test` (`v-1`..`v-6`) tanpa menyertakan `v-owner2` | Mengembalikan daftar Vault milik `user-owner-1` dan `v-owner2` tidak disertakan (`99.4 ms`) | **PASS** |
| **AC-POS-02** | `OWNER` (`owner@example.test`) | `R02` | `OWNER` dapat membaca detail Vault miliknya beserta deskripsi yang didekripsi AES-256-GCM | Set sesi `owner@example.test`, panggil `getVaultByIdFromDb("v-1")` | Mengembalikan objek `v-1` dengan `name: "Important Documents"` dan `description` terdekripsi | Objek `v-1` berhasil dikembalikan dan didekripsi dengan AAD `v-1` (`54.2 ms`) | **PASS** |
| **AC-POS-03** | `OWNER` (`owner@example.test`) | `R01`, `R02` | `OWNER` dapat membuat dan menghapus Vault miliknya sendiri | Set sesi `owner@example.test`, panggil `createVaultAction(...)` lalu `deleteVaultAction(id)` | Vault baru tersimpan di PostgreSQL dengan `ownerId = user-owner-1`, kemudian berhasil dihapus | `createVaultAction` menghasilkan `{ success: true }` dan `deleteVaultAction` menghasilkan `{ success: true }` (`227.8 ms`) | **PASS** |
| **AC-POS-04** | `OWNER` (`owner@example.test`) | `R02` | `OWNER` dapat memperbarui konfigurasi Vault miliknya sendiri | Set sesi `owner@example.test`, panggil `updateVaultAction("v-1", ...)` | Pembaruan berhasil disimpan dan `description` dienkripsi ulang di PostgreSQL | `updateVaultAction` mengembalikan `{ success: true }` (`351.9 ms`) | **PASS** |
| **AC-POS-05** | `OWNER` (`owner@example.test`) | `R04` | `OWNER` dapat membaca daftar Recipient miliknya sendiri | Set sesi `owner@example.test`, panggil `getRecipientsFromDb()` | Mengembalikan daftar Recipient milik `user-owner-1` (`rec-1`..`rec-4`) tanpa `rec-owner2` | Daftar Recipient milik `user-owner-1` dikembalikan dan `rec-owner2` terisolasi (`28.3 ms`) | **PASS** |
| **AC-POS-06** | `OWNER` (`owner@example.test`) | `R04` | `OWNER` dapat membuat, mengubah, dan menghapus Recipient miliknya sendiri | Set sesi `owner@example.test`, jalankan `createRecipientAction`, `updateRecipientAction`, dan `deleteRecipientAction` | Ketiga operasi CRUD Recipient berhasil dieksekusi di PostgreSQL | `create`, `update`, dan `delete` mengembalikan `{ success: true }` (`214.3 ms`) | **PASS** |
| **AC-POS-07** | `OWNER` (`owner@example.test`) | `R03` | `OWNER` dapat melakukan konfirmasi *Check-in Dead Man's Switch* | Set sesi `owner@example.test`, panggil `performCheckInAction()` | Timer di-reset ke `30 days 00 hours` (`cyclePercent: 100`) dengan *server-side timestamp* | `{ success: true, checkIn: { cyclePercent: 100 } }` tercatat di PostgreSQL (`36.1 ms`) | **PASS** |
| **AC-POS-08** | `RECIPIENT` (`sarah.connor@example.test`) | `R02`, `R04` | `RECIPIENT` dapat membaca Vault yang secara eksplisit ditugaskan kepadanya (`v-1`) | Set sesi `sarah.connor@example.test`, panggil `getVaultsFromDb()` dan `getVaultByIdFromDb("v-1")` | Mengembalikan hanya Vault yang memiliki `recipient.email === "sarah.connor@example.test"` (`v-1`) | `getVaultByIdFromDb("v-1")` berhasil mengembalikan detail `v-1` (`55.3 ms`) | **PASS** |
| **AC-POS-09** | `OWNER` (`owner@example.test`) | `R01` | Demo Role Switcher berfungsi di `development`/`test` dan login normal tetap berfungsi di `production` | Jalankan `switchDemoAccountAction("owner@example.test")` saat `NODE_ENV=development` dan `loginAction(...)` saat `NODE_ENV=production` | Keduanya berhasil melalui verifikasi bcrypt dan menerbitkan sesi `OWNER` | `switchDemoAccountAction` berhasil di non-production dan `loginAction` berhasil di production | **PASS** |

---

### B. Pengujian Akses Negatif & Anti-IDOR (9 Skenario — `DENY`)

| ID Test | Peran | Risiko | Tujuan Pengujian | Langkah Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|---|---|
| **AC-NEG-01** | `UNAUTHENTICATED` | `R01`, `R02` | Menolak pembacaan detail maupun pembuatan Vault tanpa sesi login | Kosongkan sesi (`null`), panggil `getVaultByIdFromDb("v-1")` dan `createVaultAction(...)` | `getVaultByIdFromDb` mengembalikan `null` dan `createVaultAction` mengembalikan `Unauthorized` | Ditolak di server: `detail === null` dan `{ success: false, error: "Unauthorized: Anda harus login terlebih dahulu untuk membuat Vault (R01)." }` (`5.3 ms`) | **PASS** |
| **AC-NEG-02** | `UNAUTHENTICATED` | `R01`, `R04` | Menolak pembuatan dan penghapusan Recipient tanpa sesi login | Kosongkan sesi (`null`), panggil `createRecipientAction(...)` dan `deleteRecipientAction("rec-1")` | Kedua mutasi ditolak oleh server dengan status `Unauthorized` | Ditolak di server dengan pesan `Unauthorized` tanpa mengubah tabel `Recipient` (`1.0 ms`) | **PASS** |
| **AC-NEG-03** | `UNAUTHENTICATED` | `R01`, `R03` | Menolak manipulasi *Check-in* oleh pengguna tanpa sesi login | Kosongkan sesi (`null`), panggil `performCheckInAction()` | Server menolak eksekusi *Check-in* | Ditolak di server: `{ success: false, error: "Unauthorized: Anda harus login sebagai OWNER untuk melakukan Check-in (R01/R03)." }` (`13.8 ms`) | **PASS** |
| **AC-NEG-04** | `RECIPIENT` (`sarah.connor@example.test`) | `R02` | Menolak `RECIPIENT` membaca Vault yang **tidak** ditugaskan kepadanya (`v-2` ditugaskan ke Michael Scott) | Set sesi `sarah.connor@example.test`, panggil `getVaultByIdFromDb("v-2")` | Server menolak dan mengembalikan `null` | `getVaultByIdFromDb("v-2")` mengembalikan `null` (`65.7 ms`) | **PASS** |
| **AC-NEG-05** | `RECIPIENT` (`sarah.connor@example.test`) | `R02` | Menolak `RECIPIENT` mengubah atau menghapus Vault milik `OWNER` (`v-1`) meskipun ditugaskan kepadanya | Set sesi `sarah.connor@example.test`, panggil `updateVaultAction("v-1", ...)` dan `deleteVaultAction("v-1")` | Kedua operasi ditolak dengan pesan `Forbidden` dan data `v-1` tetap utuh | Ditolak di server: `{ success: false, error: "Forbidden: Peran RECIPIENT tidak diizinkan mengubah/menghapus Vault pemilik (R02)." }` (`7.2 ms`) | **PASS** |
| **AC-NEG-06** | `RECIPIENT` (`sarah.connor@example.test`) | `R03`, `R04` | Menolak `RECIPIENT` menambah Recipient baru atau memicu *Check-in* | Set sesi `sarah.connor@example.test`, panggil `createRecipientAction(...)` dan `performCheckInAction()` | Kedua operasi ditolak dengan pesan `Forbidden` | Ditolak di server dengan error `Forbidden` (`6.0 ms`) | **PASS** |
| **AC-NEG-07** | `OWNER 1` (`owner@example.test`) | `R01`, `R02` | **Uji Anti-IDOR Vault:** Menolak `OWNER 1` membaca, mengubah, atau menghapus Vault `v-owner2` milik `OWNER 2` (`owner2@example.test`) | Set sesi `owner@example.test`, panggil `getVaultByIdFromDb("v-owner2")`, `updateVaultAction("v-owner2", ...)`, dan `deleteVaultAction("v-owner2")` | Pembacaan mengembalikan `null`, sedangkan `update` dan `delete` ditolak dengan error `Forbidden / Anti-IDOR` | Seluruh percobaan IDOR lintas pemilik ditolak di server; data `v-owner2` milik `OWNER 2` tetap aman (`74.8 ms`) | **PASS** |
| **AC-NEG-08** | `OWNER 1` (`owner@example.test`) | `R01`, `R04` | **Uji Anti-IDOR Recipient:** Menolak `OWNER 1` mengubah atau menghapus Recipient `rec-owner2` milik `OWNER 2` | Set sesi `owner@example.test`, panggil `updateRecipientAction("rec-owner2", ...)` dan `deleteRecipientAction("rec-owner2")` | Kedua operasi ditolak dengan error `Forbidden: ... (Anti-IDOR / R04)` | Ditolak di server; `rec-owner2` tetap utuh dan hanya dapat diakses oleh `OWNER 2` (`64.0 ms`) | **PASS** |
| **AC-NEG-09** | `UNAUTHENTICATED` | `R01` | **Demo Role Switcher Production Guard & Whitelist:** Menolak pemanggilan `switchDemoAccountAction` saat `NODE_ENV === "production"` maupun manipulasi email di luar whitelist | Set `NODE_ENV=production`, panggil `switchDemoAccountAction("owner@example.test")`, lalu uji email di luar whitelist saat `development` | Ditolak dengan `Forbidden` tanpa membocorkan nama variabel env internal dan tanpa membuat sesi | Ditolak di server: `{ success: false, error: "Forbidden: Fitur akun demo dinonaktifkan pada lingkungan produksi (R01)." }` dan `getVaultByIdFromDb("v-1") === null` | **PASS** |

---

## 5. Bukti Pemeriksaan Server-Side

Pemeriksaan otorisasi tidak bergantung pada penyembunyian tombol di antarmuka pengguna (UI), melainkan dieksekusi secara wajib pada awal setiap *Server Action*:

1. **`lib/actions/auth-actions.ts`:**
   - `switchDemoAccountAction` memiliki **Production Guard** di sisi server (`if (process.env.NODE_ENV === "production")`) yang langsung menolak permintaan sebelum melakukan autentikasi.
   - `switchDemoAccountAction` memvalidasi `targetEmail` terhadap *runtime whitelist* (`ALLOWED_DEMO_EMAILS`) dan tetap melewati alur `loginAction` (verifikasi bcrypt) di lingkungan pengembangan/pengujian.
   - Komponen klien `components/SessionBanner.tsx` dan `components/LoginClient.tsx` menyembunyikan tombol akun demo saat `process.env.NODE_ENV === "production"`, sementara pemeriksaan utama tetap ditegakkan di server.
2. **`lib/actions/vault-actions.ts`:**
   - Memanggil `const session = await getCurrentSession()`.
   - Memeriksa `session.role === "OWNER"` pada seluruh operasi mutasi (`createVaultAction`, `updateVaultAction`, `deleteVaultAction`, `addVaultFileAction`, `performCheckInAction`).
   - Memeriksa kepemilikan baris database (`existingVault.ownerId !== session.userId`) sebelum mengizinkan pembacaan detail, pembaruan, maupun penghapusan untuk mencegah celah **IDOR (`R02`)**.
   - Memeriksa kepemilikan *foreign key* `recipientId` (`recipientRecord.ownerId !== session.userId`) sebelum mengaitkan Recipient ke Vault (`R04`).
3. **`lib/actions/recipient-actions.ts`:**
   - Memeriksa `session` dan `session.role === "OWNER"` pada seluruh fungsi baca dan mutasi Recipient (`R04`).
   - Memeriksa `existing.ownerId !== session.userId` sebelum mengizinkan pembaruan atau penghapusan Recipient untuk mencegah **IDOR (`R04`)**.
4. **Ringkasan Hasil Eksekusi:**
   - **Pengujian Password Hashing:** `3 / 3 PASS`
   - **Pengujian Masa Berlaku Session Token:** `3 / 3 PASS`
   - **Pengujian Akses Positif:** `9 / 9 PASS`
   - **Pengujian Akses Negatif & Anti-IDOR:** `9 / 9 PASS`
   - **Total Keberhasilan:** `24 / 24 PASS (100%)`

