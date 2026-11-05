# Dokumentasi Pengujian Aplikasi Web — LastKey Milestone 2 (`v0.2`)

Dokumen ini memuat skenario dan hasil pengujian fungsionalitas **Pengembangan Aplikasi Web Milestone 2 (`v0.2`)** yang mencakup operasi CRUD penuh pada dua entitas berelasi (**`Vault`** dan **`Recipient`**) di PostgreSQL menggunakan **Prisma ORM 7**, **Next.js Server Actions**, serta validasi sisi server menggunakan **Zod 4**.

Seluruh pengujian menggunakan **data sintetis** (`@example.test`) dan dijalankan secara nyata terhadap database PostgreSQL (`localhost:5432/lastkey`) melalui *automated integration test* (`tests/web-crud.test.ts`) serta verifikasi antarmuka peramban.

---

## 1. Ringkasan Eksekusi Pengujian

- **Perintah Eksekusi Automated Integration Test:**
  ```bash
  npm run test:web
  # atau: npx tsx --test tests/web-crud.test.ts
  ```
- **Total Skenario CRUD & Relasi:** 10 skenario (`TC-01` s/d `TC-10`)
- **Total Skenario Validasi Server (Zod 4):** 4 skenario (`SV-01` s/d `SV-04`)
- **Tingkat Keberhasilan:** **14 / 14 PASS (100%)** *(melampaui batas minimal kelulusan 90%)*

---

## 2. Skenario Pengujian CRUD & Relasi (10 Skenario Wajib)

### A. 8 Skenario Pengujian CRUD (`Vault` & `Recipient`)

| ID Test | Kategori | Tujuan Pengujian | Langkah Pengujian | Data Sintetis | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|---|---|
| **TC-01** | **Create Recipient** | Membuat entitas `Recipient` baru dan menyimpannya ke PostgreSQL | Panggil `createRecipientAction` (atau submit form *New Recipient* di `/recipients`) dengan data sintetis | `name`: `"Nadia Vega"`<br>`role`: `"Security Auditor"`<br>`email`: `"nadia.vega@example.test"` | Server Action mengembalikan `{ success: true }`, baris baru tersimpan di tabel `"Recipient"` PostgreSQL dengan `ownerId = user-owner-1` | Baris `nadia.vega@example.test` berhasil dibuat di PostgreSQL dan terverifikasi melalui query `prisma.recipient.findUnique` (`1014.3 ms`) | **PASS** |
| **TC-02** | **Read Recipient** | Membaca daftar seluruh `Recipient` dan detail satu `Recipient` beserta relasi `vaults` dari PostgreSQL | Panggil `getRecipientsFromDb()` dan `getRecipientByIdFromDb(id)` (atau buka halaman `/recipients`) | `id`: `<createdRecipientId>` (`nadia.vega@example.test`) | Mengembalikan daftar `Recipient` milik `OWNER` yang aktif serta detail lengkap `Nadia Vega` | Daftar `Recipient` (>= 5 item) dan objek detail `Nadia Vega` berhasil diambil dari PostgreSQL (`101.1 ms`) | **PASS** |
| **TC-03** | **Update Recipient** | Memperbarui nama dan peran `Recipient` yang sudah ada di PostgreSQL | Panggil `updateRecipientAction(id, input)` (atau klik *Edit* pada kartu Recipient di `/recipients`) | `name`: `"Nadia Vega, CISA"`<br>`role`: `"Lead Cryptographic Auditor"`<br>`email`: `"nadia.vega@example.test"` | Data di tabel `"Recipient"` PostgreSQL berubah sesuai input baru dan `updatedAt` diperbarui | `updateRecipientAction` mengembalikan `{ success: true }`; query database mengonfirmasi `name === "Nadia Vega, CISA"` (`123.9 ms`) | **PASS** |
| **TC-04** | **Create Vault** | Membuat `Vault` baru di PostgreSQL yang terhubung ke `Recipient` dan mengenkripsi `description` dengan AES-256-GCM + AAD | Panggil `createVaultAction` (atau submit form *Create New Digital Vault* di `/vault`) | `name`: `"[TEST-V02] Audit Keys Compartment"`<br>`description`: `"Synthetic secret recovery instructions for v0.2 integration test"`<br>`recipient`: `<createdRecipientId>`<br>`checkInInterval`: `"14 days"`<br>`gracePeriod`: `"48 hours"`<br>`confirmation`: `true` | Vault baru tersimpan di PostgreSQL, `description` di DB berupa *ciphertext* `enc:v1:<nonce>:<ciphertext>`, dan UI menerima *plaintext* hasil dekripsi | Vault baru berhasil dibuat di PostgreSQL; kolom `description` di DB terbukti berformat `enc:v1:...` dan terdekripsi dengan AAD `vault.id` (`383.5 ms`) | **PASS** |
| **TC-05** | **Read Vault** | Membaca daftar seluruh `Vault` (`/vault`) dan halaman detail satu `Vault` (`/vault/[id]`) dari PostgreSQL | Panggil `getVaultsFromDb()` dan `getVaultByIdFromDb(createdVaultId)` | `id`: `<createdVaultId>` | Mengembalikan daftar Vault dan detail Vault lengkap beserta informasi `recipient` (`nadia.vega@example.test`), `files`, dan `description` yang telah didekripsi | Daftar dan detail Vault berhasil diambil dari PostgreSQL dengan relasi `recipient` dan `files` yang akurat (`172.4 ms`) | **PASS** |
| **TC-06** | **Update Vault** | Memperbarui konfigurasi `Vault` (`name`, `description`, `status`, `checkInInterval`, `gracePeriod`) di PostgreSQL | Panggil `updateVaultAction(createdVaultId, input)` (atau gunakan form *Edit Vault* pada modal *Quick Inspect* di `/vault`) | `name`: `"[TEST-V02] Audit Keys Compartment Updated"`<br>`description`: `"Updated confidential payload with fresh AES-GCM nonce"`<br>`status`: `"PENDING"`<br>`checkInInterval`: `"30 days"`<br>`gracePeriod`: `"72 hours"` | Baris `Vault` di PostgreSQL diperbarui, `status` menjadi `PENDING`, dan `description` dienkripsi ulang dengan *nonce* AES-GCM baru | Data di PostgreSQL berhasil diperbarui dan *ciphertext* baru berbeda dari *ciphertext* sebelumnya karena *nonce* baru (`67.1 ms`) | **PASS** |
| **TC-08** | **Delete Vault** | Menghapus `Vault` dari PostgreSQL | Panggil `deleteVaultAction(createdVaultId)` (atau klik *Delete Vault* pada modal *Quick Inspect* di `/vault`) | `id`: `<createdVaultId>` | Baris `Vault` dan `VaultFile` terkait terhapus dari PostgreSQL (`ON DELETE CASCADE` untuk file) | `deleteVaultAction` mengembalikan `{ success: true }`; `prisma.vault.findUnique` mengembalikan `null` (`43.4 ms`) | **PASS** |
| **TC-09** | **Delete Recipient** | Menghapus `Recipient` yang sudah tidak terhubung dengan `Vault` aktif dari PostgreSQL | Panggil `deleteRecipientAction(createdRecipientId)` (atau klik *Delete* pada `/recipients`) | `id`: `<createdRecipientId>` (`nadia.vega@example.test`) | Baris `Recipient` berhasil dihapus dari tabel `"Recipient"` PostgreSQL | `deleteRecipientAction` mengembalikan `{ success: true }`; `prisma.recipient.findUnique` mengembalikan `null` (`76.9 ms`) | **PASS** |

---

### B. 2 Skenario Pengujian Relasi (`Vault` ↔ `Recipient`)

| ID Test | Kategori | Tujuan Pengujian | Langkah Pengujian | Data Sintetis | Hasil yang Diharapkan | Hasil Aktual | Status |
|---|---|---|---|---|---|---|---|
| **TC-07** | **Relasi Positif & Referential Integrity** | Memastikan `Vault` berhasil dikaitkan ke `Recipient` yang sah (`1-to-Many`), serta mencegah penghapusan `Recipient` yang masih digunakan oleh `Vault` aktif | 1. Query `getRecipientByIdFromDb(createdRecipientId)` saat `createdVaultId` masih aktif.<br>2. Panggil `deleteRecipientAction(createdRecipientId)` saat masih terhubung ke Vault. | `recipientId`: `<createdRecipientId>`<br>`vaultId`: `<createdVaultId>` | 1. `recDetail.vaults` memuat `createdVaultId`.<br>2. Penghapusan `Recipient` ditolak dengan pesan error yang jelas dan data `Vault` tidak hilang. | Relasi `recDetail.vaults` terverifikasi; `deleteRecipientAction` menolak penghapusan dengan pesan `"Tidak dapat menghapus Recipient karena masih digunakan oleh Vault aktif..."` (`29.8 ms`) | **PASS** |
| **TC-10** | **Relasi Negatif (Invalid Foreign Key)** | Memastikan `Vault` tidak dapat dikaitkan dengan `Recipient` yang tidak tersedia di database | Panggil `createVaultAction` dengan ID `recipient` fiktif yang tidak ada di tabel `"Recipient"` | `name`: `"[TEST-V02] Invalid Relation Vault"`<br>`recipient`: `"rec-does-not-exist-999"`<br>`checkInInterval`: `"30 days"`<br>`gracePeriod`: `"48 hours"`<br>`confirmation`: `true` | Server menolak pembuatan Vault, mengembalikan `fieldErrors.recipient`, dan jumlah baris di tabel `"Vault"` tidak bertambah | Ditolak oleh Server Action dengan `fieldErrors.recipient: "Recipient tidak ditemukan di database atau bukan milik akun Anda."` (`38.1 ms`) | **PASS** |

---

## 3. Bukti Penolakan Input Tidak Valid dari Validasi Server (Zod 4)

Selain validasi di sisi peramban, seluruh *Server Actions* (`createVaultAction`, `updateVaultAction`, `createRecipientAction`, `updateRecipientAction`) menjalankan validasi server menggunakan **Zod 4** (`lib/validation/vault-schema.ts` dan `lib/validation/recipient-schema.ts`).

### Evaluasi Aturan Semantik (*Domain Rule Refinement*) pada `vaultSchema`

Pada `lib/validation/vault-schema.ts`, diterapkan aturan domain *Dead Man's Switch* (`isValidSwitchTiming`):
1. Durasi `gracePeriod` (dalam jam) wajib lebih pendek daripada `checkInInterval` (`graceHours < intervalHours`).
2. Durasi `gracePeriod` tidak boleh melampaui **35% dari durasi `checkInInterval`** (`graceHours <= intervalHours * 0.35`).
   - *Asumsi Domain:* Apabila pemilik memilih siklus *check-in* mingguan (`"7 days"` = 168 jam), maka memilih *grace period* `"72 hours"` (3 hari = 42,8% dari siklus *check-in*) terlalu panjang untuk jadwal pemantauan ketat mingguan. Oleh karena itu, untuk `checkInInterval = "7 days"`, nilai maksimal `gracePeriod` yang sah adalah `"48 hours"`, sedangkan kombinasi **`"7 days"` + `"72 hours"` ditolak secara nyata oleh *refinement* Zod 4**.

### Tabel Hasil Pengujian Penolakan Server Validation

| ID Test | Kondisi Input Tidak Valid | Data Sintetis yang Dikirim ke Server Action | Field Error yang Dikembalikan Server | Perubahan Baris di PostgreSQL | Status |
|---|---|---|---|---|---|
| **SV-01** | **Nama Vault kurang dari batas minimal (< 3 karakter)** | `name`: `"AB"`<br>`recipient`: `"rec-1"`<br>`checkInInterval`: `"30 days"`<br>`gracePeriod`: `"48 hours"`<br>`confirmation`: `true` | `fieldErrors.name`: `"Vault Name minimal 3 karakter."` | `0` baris berubah (`countAfter === countBefore`) | **PASS** |
| **SV-02** | **Enum `checkInInterval` tidak sah & `confirmation` bernilai `false`** | `name`: `"Valid Vault Name"`<br>`recipient`: `"rec-1"`<br>`checkInInterval`: `"999 days"`<br>`gracePeriod`: `"48 hours"`<br>`confirmation`: `false` | `fieldErrors.checkInInterval`: `"Check-in Interval harus dipilih (7 days, 14 days, atau 30 days)."`<br>`fieldErrors.confirmation`: `"Anda harus mengonfirmasi bahwa data vault sudah benar."` | `0` baris berubah (`countAfter === countBefore`) | **PASS** |
| **SV-03** | **Pelanggaran Aturan Semantik (`7 days` + `72 hours`)** | `name`: `"Weekly Vault With Excessive Grace"`<br>`recipient`: `"rec-1"`<br>`checkInInterval`: `"7 days"`<br>`gracePeriod`: `"72 hours"`<br>`confirmation`: `true` | `fieldErrors.gracePeriod`: `"Grace Period tidak proporsional: untuk Check-in Interval 7 days, Grace Period maksimal adalah 48 hours (72 hours ditolak)."` | `0` baris berubah (`countAfter === countBefore`) | **PASS** |
| **SV-04** | **Nama, Role, dan Format Email Recipient Tidak Valid** | `name`: `"X"`<br>`role`: `"Y"`<br>`email`: `"invalid-email-format"` | `fieldErrors.name`: `"Nama recipient minimal 3 karakter."`<br>`fieldErrors.role`: `"Peran/role recipient minimal 3 karakter."`<br>`fieldErrors.email`: `"Format alamat email recipient tidak valid."` | `0` baris berubah (`countAfter === countBefore`) | **PASS** |

---

## 4. Bukti Perubahan Data di PostgreSQL & Persistensi

1. **Verifikasi Persistensi Lintas Sesi & Restart:**
   - Seluruh operasi `Create`, `Update`, dan `Delete` dieksekusi langsung melalui `PrismaClient` (`@prisma/adapter-pg`) ke database PostgreSQL `lastkey`.
   - Tidak ada *fallback* ke `INITIAL_VAULTS` atau `MOCK_RECIPIENTS` pada `getVaultsFromDb()` dan `getRecipientsFromDb()`, sehingga data yang tampil di UI murni merepresentasikan baris aktual di PostgreSQL.
2. **Verifikasi Penyimpanan Terenkripsi di Tabel `"Vault"`:**
   - Pada `TC-04` dan `TC-06`, pemeriksaan langsung melalui `prisma.vault.findUnique` membuktikan bahwa kolom `description` disimpan dalam bentuk `enc:v1:<nonce_base64>:<ciphertext_base64>` dan berubah menghasilkan *nonce* baru setiap kali `updateVaultAction` dijalankan.
3. **Daftar Bukti Tangkapan Layar (*Screenshots*) pada `docs/evidence/v0.2/`:**
   - `01-create-vault.png` — Pembuatan Vault baru di `/vault` dan penyimpanan ke PostgreSQL.
   - `02-read-vault.png` — Daftar Vault dari PostgreSQL dan halaman detail `/vault/v-1`.
   - `03-update-vault.png` — Pembaruan konfigurasi Vault pada modal inspeksi `/vault`.
   - `04-delete-vault.png` — Penghapusan Vault dan pembaruan daftar kompartemen.
   - `05-create-recipient.png` — Pembuatan Recipient darurat baru di `/recipients`.
   - `06-read-recipient.png` — Daftar Recipient beserta lencana relasi Vault di `/recipients`.
   - `07-update-recipient.png` — Pembaruan data Recipient di `/recipients`.
   - `08-delete-recipient.png` — Penghapusan Recipient & proteksi *referential integrity*.
   - `09-server-validation-errors.png` — Penolakan input tidak valid dari *Server Action* (nama terlalu pendek, aturan semantik `7 days` + `72 hours`, dan checkbox konfirmasi).
   - `10-database-persistence-proof.png` — Bukti perubahan baris dan *ciphertext* `enc:v1:...` di PostgreSQL.

