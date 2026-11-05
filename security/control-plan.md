# Security Control Plan — LastKey

## 1. Tujuan

Control plan dibuat berdasarkan lima risiko prioritas yang telah diidentifikasi pada analisis risiko LastKey.

Setiap kontrol dirancang untuk menurunkan kemungkinan terjadinya ancaman, mengurangi dampaknya, atau keduanya.

---

## 2. Rencana Kontrol

| ID Risiko | Risiko | Kontrol Utama | Tujuan Kontrol | Dampak terhadap Risiko |
|---|---|---|---|---|
| R01 | Penyalahgunaan credential/session | Password hashing, secure session, rate limiting, dan MFA/passkey | Mencegah penyalahgunaan akun dan session | Menurunkan likelihood |
| R02 | Kebocoran File Vault | Enkripsi file, authorization berbasis kepemilikan, dan secure storage | Mencegah pihak tidak berwenang membaca file | Menurunkan likelihood dan impact |
| R03 | Manipulasi Check-in | Validasi server-side, server-side timestamp, dan authorization | Mencegah manipulasi status dan waktu check-in | Menurunkan likelihood |
| R04 | Pemalsuan Recipient | Verifikasi recipient, authorization, dan validasi perubahan recipient | Mencegah data release dikirim ke pihak yang salah | Menurunkan likelihood dan impact |
| R05 | Kebocoran Encryption Key | Key management terpisah, access control, dan tidak menyimpan key secara plaintext | Mengurangi kemungkinan key dicuri atau digunakan pihak lain | Menurunkan likelihood dan impact |

---

## 3. Penjelasan Kontrol

### R01 — Penyalahgunaan Credential / Session

**Risiko:** T01 — Spoofing

#### Kontrol

1. **Password hashing**

   Password pengguna tidak disimpan dalam bentuk plaintext. Password harus diproses menggunakan password hashing yang sesuai.

2. **Secure session management**

   Session harus dikelola menggunakan mekanisme yang aman dan tidak mempercayai data identitas dari client.

3. **Rate limiting**

   Percobaan login yang berlebihan dibatasi untuk mengurangi risiko brute-force terhadap akun.

4. **MFA atau Passkey**

   Autentikasi tambahan dapat digunakan untuk mengurangi risiko apabila password pengguna berhasil diketahui pihak lain.

#### Alasan

Kontrol tersebut mengurangi kemungkinan penyerang memperoleh akses melalui credential atau session pengguna.

---

### R02 — Kebocoran File Vault

**Risiko:** T04 — Information Disclosure

#### Kontrol

1. **Enkripsi file**

   File sensitif dalam vault harus dienkripsi sebelum atau saat disimpan menggunakan library kriptografi yang terpelihara.

2. **Authorization berdasarkan kepemilikan**

   Setiap request untuk mengakses vault harus memeriksa apakah pengguna memang memiliki hak terhadap vault tersebut.

3. **Secure storage**

   File dan metadata sensitif harus disimpan pada storage yang memiliki pembatasan akses.

4. **Validasi file**

   File upload harus divalidasi berdasarkan tipe, ukuran, dan aturan keamanan yang ditentukan aplikasi.

#### Alasan

Enkripsi mengurangi dampak apabila storage terekspos, sedangkan authorization mencegah pengguna yang tidak berhak mengakses vault melalui aplikasi.

---

### R03 — Manipulasi Check-in

**Risiko:** T06 — Tampering

#### Kontrol

1. **Server-side validation**

   Status check-in tidak boleh hanya ditentukan oleh client.

2. **Server-side timestamp**

   Waktu check-in harus ditentukan oleh server agar client tidak dapat memalsukan timestamp.

3. **Authorization**

   Hanya pemilik akun yang sah yang boleh melakukan check-in terhadap vault miliknya.

4. **Audit logging**

   Aktivitas check-in dicatat sehingga perubahan atau aktivitas mencurigakan dapat ditelusuri.

#### Alasan

Kontrol tersebut mengurangi kemungkinan manipulasi check-in melalui perubahan request atau data pada client.

Hal ini penting karena check-in merupakan bagian dari mekanisme Dead Man's Switch.

---

### R04 — Pemalsuan Recipient

**Risiko:** T11 — Spoofing

#### Kontrol

1. **Recipient verification**

   Sistem harus memverifikasi identitas atau alamat recipient sebelum recipient dapat digunakan untuk proses release.

2. **Authorization**

   Perubahan recipient hanya boleh dilakukan oleh pemilik vault yang sah.

3. **Konfirmasi perubahan**

   Perubahan recipient dapat memerlukan konfirmasi tambahan untuk mengurangi risiko perubahan tidak sah.

4. **Audit logging**

   Penambahan, perubahan, dan penghapusan recipient dicatat dalam audit log.

#### Alasan

Kontrol tersebut mengurangi kemungkinan recipient diganti oleh pihak yang tidak berwenang dan mengurangi risiko data dikirim kepada pihak yang salah.

---

### R05 — Kebocoran Encryption Key

**Risiko:** T13 — Information Disclosure

#### Kontrol

1. **Key management terpisah**

   Encryption key tidak disimpan bersama file dalam bentuk yang mudah diakses.

2. **Access control**

   Hanya proses atau komponen yang membutuhkan key yang boleh mengaksesnya.

3. **Tidak menyimpan key dalam plaintext**

   Key tidak boleh disimpan di source code, repository Git, atau konfigurasi yang dapat diakses secara tidak sah.

4. **Key rotation / lifecycle management**

   Pengelolaan lifecycle key harus dirancang agar key dapat dibuat, digunakan, dan dihentikan dengan aman.

#### Alasan

Encryption key merupakan aset kritis. Perlindungan key mengurangi kemungkinan pihak lain memperoleh kemampuan untuk membuka file vault yang telah dienkripsi.

---

## 4. Prioritas Implementasi Kontrol

Kontrol keamanan diprioritaskan berdasarkan risiko yang telah diidentifikasi.

### Prioritas 1 — Authentication & Session

Kontrol:

- Password hashing
- Secure session
- Rate limiting
- MFA/passkey

**Alasan:** R01 memiliki risk score tertinggi yaitu 9 dan authentication merupakan titik akses utama menuju data pengguna.

### Prioritas 2 — Perlindungan File Vault

Kontrol:

- Enkripsi file
- Authorization
- Secure storage
- File validation

**Alasan:** File vault merupakan aset utama LastKey dan memiliki nilai kerahasiaan yang tinggi.

### Prioritas 3 — Perlindungan Check-in

Kontrol:

- Server-side validation
- Server-side timestamp
- Authorization
- Audit logging

**Alasan:** Manipulasi check-in dapat memengaruhi keputusan Dead Man's Switch.

### Prioritas 4 — Perlindungan Recipient

Kontrol:

- Recipient verification
- Authorization
- Confirmation
- Audit logging

**Alasan:** Recipient menentukan pihak yang akan menerima data ketika release dilakukan.

### Prioritas 5 — Key Management

Kontrol:

- Secure key storage
- Access control
- Key lifecycle management
- Tidak menyimpan key dalam source code

**Alasan:** Kebocoran encryption key dapat menyebabkan perlindungan enkripsi terhadap vault kehilangan efektivitasnya.

---

## 5. Kondisi Implementasi

Kontrol pada dokumen ini merupakan rencana keamanan untuk pengembangan LastKey.

Sebagian kontrol belum diterapkan pada versi awal produk karena backend, database, autentikasi server-side, key management, dan mekanisme secure release masih dalam tahap pengembangan.

Kontrol akan diterapkan secara bertahap pada milestone pengembangan berikutnya.

---

## 6. Ringkasan

Lima risiko prioritas LastKey memiliki kontrol utama sebagai berikut:

| Risiko | Kontrol Utama |
|---|---|
| Credential / Session Abuse | Secure authentication, session management, rate limiting, MFA/passkey |
| File Vault Disclosure | Encryption + authorization + secure storage |
| Check-in Tampering | Server-side validation + server timestamp + authorization |
| Recipient Spoofing | Recipient verification + authorization + confirmation |
| Encryption Key Disclosure | Secure key management + access control + key lifecycle |

---

## 7. Realisasi Implementasi Kontrol Keamanan pada Milestone 2 (`sec-0.2`)

Bagian ini mendokumentasikan kontrol keamanan yang telah diimplementasikan dan diverifikasi secara nyata pada rilis **`sec-0.2`** sebagai tindak lanjut langsung terhadap risiko prioritas Tugas 1 (`R01`–`R05`).

### 7.1 Tabel Pemetaan Kontrol Baru (`sec-0.2`) terhadap Risiko Tugas 1

| ID Risiko | Risiko Tugas 1 | Kontrol Baru yang Diimplementasikan (`sec-0.2`) | File Implementasi | Bukti Verifikasi | Status (`sec-0.2`) |
|---|---|---|---|---|---|
| **R01** | Penyalahgunaan Credential / Session (*Spoofing*) | 1. **Password Hashing Bcrypt** (`bcryptjs`, *cost factor* 12) pada `User.passwordHash`.<br>2. **Signed Session Token HMAC-SHA256** menggunakan `LASTKEY_SESSION_SECRET` dengan verifikasi `crypto.timingSafeEqual`.<br>3. **Secure Cookie Attributes** (`httpOnly: true`, `sameSite: "lax"`, `secure` pada produksi).<br>4. **RBAC Server-Side** (`OWNER`, `RECIPIENT`, `UNAUTHENTICATED`). | `lib/auth.ts`<br>`lib/actions/auth-actions.ts`<br>`prisma/schema.prisma` | `security/access-tests.md` (`PH-01` s/d `PH-03`, `AC-NEG-01` s/d `AC-NEG-03`) — **100% PASS** | **IMPLEMENTED** |
| **R02** | Kebocoran File / Data Vault (*Information Disclosure*) | 1. **Enkripsi AES-256-GCM + AAD Kontekstual** (`lastkey:v1:vault:<vaultId>:description`) sebelum data disimpan ke PostgreSQL.<br>2. **Dekripsi Fail-Closed** (menolak mengembalikan data apabila *authentication tag* atau AAD tidak cocok).<br>3. **Otorisasi Kepemilikan Server-Side (Anti-IDOR)** (`vault.ownerId === session.userId` untuk `OWNER`, atau email penugasan untuk `RECIPIENT`). | `crypto/aes-gcm.ts`<br>`lib/actions/vault-actions.ts` | `crypto/aes-gcm.test.ts` (9/9 PASS)<br>`security/access-tests.md` (`AC-POS-01..04`, `AC-POS-08`, `AC-NEG-04..05`, `AC-NEG-07`) — **100% PASS** | **IMPLEMENTED** |
| **R03** | Manipulasi Check-in (*Tampering*) | 1. **Pemeriksaan Peran `OWNER` di Server** pada `performCheckInAction()` dan `resetCheckInDemoAction()`.<br>2. **Server-Side Timestamp** (`new Date()` dibangkitkan di server, tidak menerima timestamp dari client).<br>3. **Pencatatan Audit Log** ke tabel `"Activity"` PostgreSQL. | `lib/actions/vault-actions.ts` | `security/access-tests.md` (`AC-POS-07`, `AC-NEG-03`, `AC-NEG-06`) — **100% PASS** | **IMPLEMENTED** |
| **R04** | Pemalsuan Recipient (*Spoofing*) | 1. **Validasi Server Zod 4** (`recipientSchema` & `vaultSchema`) untuk nama, peran, dan keunikan email.<br>2. **Otorisasi Kepemilikan Recipient (Anti-IDOR)** (`recipient.ownerId === session.userId`).<br>3. **Referential Integrity Protection** (`ON DELETE RESTRICT` & pengecekan server-side agar Recipient yang masih digunakan Vault aktif tidak dapat dihapus). | `lib/validation/recipient-schema.ts`<br>`lib/actions/recipient-actions.ts`<br>`prisma/schema.prisma` | `security/access-tests.md` (`AC-POS-05..06`, `AC-NEG-02`, `AC-NEG-06`, `AC-NEG-08`)<br>`docs/testing-v0.2.md` (`TC-07`, `TC-10`) — **100% PASS** | **IMPLEMENTED** |
| **R05** | Kebocoran Encryption Key (*Information Disclosure*) | 1. **Penyimpanan Kunci Server-Only** pada variabel lingkungan `LASTKEY_ENCRYPTION_KEY_BASE64` (tanpa awalan `NEXT_PUBLIC_`).<br>2. **Fail-Closed Key Loader** (`getServerEncryptionKey()` menolak operasi jika kunci tidak tersedia atau bukan 32 byte Base64, tanpa *fallback key*).<br>3. **Proteksi Git & Docker Context** melalui `.gitignore`, `.dockerignore`, dan `.env.example`. | `crypto/aes-gcm.ts`<br>`.gitignore`<br>`.dockerignore`<br>`.env.example` | `KEPUTUSAN.md`<br>`crypto/aes-gcm.test.ts` (`Test #7`) | **IMPLEMENTED** |

---

### 7.2 Hardening Infrastruktur & Kontainer (`sec-0.2`)

1. **Container Hardening (`Dockerfile` & `docker-compose.yml`) — Status: `IMPLEMENTED`**
   - **Non-Root Execution:** Container aplikasi berjalan sebagai user `1001:1001` (`nextjs:nodejs`), dan container database PostgreSQL berjalan sebagai user `70:70` (`postgres`).
   - **Linux Capabilities & Privilege Restriction:** Menggunakan `cap_drop: [ALL]`, `security_opt: ["no-new-privileges:true"]`, `read_only: true` pada filesystem root aplikasi (dengan `tmpfs` terbatas pada `/tmp`), dan tanpa mode `privileged`.
   - **Network Isolation:** Port aplikasi (`3000`) dan PostgreSQL (`5432`) **tidak dipublikasikan ke host** (tidak menggunakan `ports:`), melainkan hanya menggunakan `expose` di dalam jaringan internal terisolasi `lastkey_internal` (`internal: true`).
   - **Minimal Attack Surface:** Image produksi akhir menggunakan multi-stage build `node:20-alpine`, menerapkan `apk update && apk upgrade --no-cache`, dan menghapus `npm`/`npx`/`corepack`/`yarn` dari stage runtime.
2. **Vulnerability Scanning & SBOM (`sec-0.2`) — Status: `IMPLEMENTED`**
   - Pemindaian kerentanan dilakukan menggunakan scanner pada image sebelum hardening (`security/image-scan-before.txt`) dan sesudah hardening (`security/image-scan-after.txt`).
   - Dokumen *Software Bill of Materials* berformat CycloneDX disimpan pada `security/sbom.cdx.json`.
3. **VM Hardening (`SSH & Lynis`) — Status: `BLOCKED / PENDING (Host Fisik Terdeteksi)`**
   - Pemeriksaan virtualisasi menggunakan `systemd-detect-virt` menghasilkan output **`none`**, yang membuktikan bahwa environment kerja saat ini adalah **mesin host fisik Linux**, bukan Virtual Machine (VM) praktikum.
   - Sesuai aturan keselamatan wajib (*"JANGAN mengubah SSH configuration pada host fisik Linux Mint atau mesin yang tidak dipastikan sebagai VM"*), konfigurasi `/etc/ssh/sshd_config` pada host fisik tidak dimodifikasi dan bukti `lynis-before.txt` / `lynis-after.txt` tidak dipalsukan. Panduan perintah lengkap untuk dieksekusi di dalam VM praktikum telah didokumentasikan pada `security/vm-hardening-guide.md`.

---

### 7.3 Keterbatasan yang Masih Ada pada `sec-0.2`

1. **Rate Limiting & MFA/Passkey:** Pada `sec-0.2`, autentikasi menggunakan kredensial email + password dengan hash bcrypt (cost 12) dan session HMAC-SHA256; pembatasan laju (*rate limiting*) berbasis Redis/IP dan integrasi WebAuthn/Passkey perangkat keras masih direncanakan untuk rilis berikutnya.
2. **Envelope Encryption / KMS:** Kunci AES-256-GCM masih berupa satu *master key* di variabel lingkungan server (`LASTKEY_ENCRYPTION_KEY_BASE64`), belum menggunakan *Key Management Service (KMS)* eksternal atau *per-vault Data Encryption Key (DEK)*.
3. **Eksekusi VM Hardening & Lynis:** Menunggu dijalankan langsung di dalam VM praktikum yang terisolasi karena mesin saat ini merupakan host fisik (`systemd-detect-virt` = `none`).
