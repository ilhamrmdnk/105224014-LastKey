# Keputusan Desain Kriptografi — LastKey (Milestone 2 / v0.2)

Dokumen ini menjelaskan keputusan arsitektur dan implementasi komponen kriptografi pada aplikasi **LastKey** (Secure Digital Vault & Dead Man's Switch) untuk memenuhi kebutuhan Milestone 2 (`v0.2`).

---

## 1. Kebutuhan Keamanan Data LastKey

LastKey berfungsi sebagai brankas digital (*digital vault*) yang menyimpan informasi sensitif pemilik untuk diwariskan atau dilepaskan kepada penerima darurat (*emergency recipient*) melalui mekanisme *Dead Man's Switch*. Oleh karena itu, data yang disimpan di dalam basis data PostgreSQL membutuhkan tiga jaminan keamanan kriptografis utama:

1. **Confidentiality (Kerahasiaan):** Data sensitif di dalam kompartemen Vault tidak boleh tersimpan dalam bentuk *plaintext* di tabel PostgreSQL (`R02 — Kebocoran File/Data Vault`). Apabila terjadi kebocoran *database dump* atau akses langsung ke tabel penyimpanan, penyerang tidak dapat membaca isi deskripsi/catatan rahasia tanpa kunci enkripsi.
2. **Integrity & Authenticity (Integritas dan Keaslian):** Setiap modifikasi bit pada *ciphertext*, *nonce*, atau *authentication tag* di basis data harus terdeteksi secara otomatis dan ditolak sebelum data dikembalikan ke aplikasi.
3. **Context Binding (Pengikatan Konteks Antar-Vault):** *Ciphertext* dari satu kompartemen Vault (misalnya `v-1`) tidak boleh dapat disalin atau dipindahkan oleh penyerang ke kompartemen Vault lain (misalnya `v-2` milik pengguna lain) dan didekripsi secara sah.

---

## 2. Data yang Perlu Dilindungi

| Kategori Data | Kolom / Entitas | Strategi Perlindungan pada v0.2 | Status Penyimpanan di PostgreSQL |
|---|---|---|---|
| **Konten / Deskripsi Rahasia Vault** | `Vault.description` | Dienkripsi dengan **AES-256-GCM** + **AAD kontekstual (`vault.id`)** sebelum disimpan ke PostgreSQL | Disimpan sebagai *ciphertext* berformat `enc:v1:<nonce_b64>:<ciphertext_b64>` |
| **Kunci Enkripsi Server** | `LASTKEY_ENCRYPTION_KEY_BASE64` | Disimpan khusus di *environment variable* sisi server (32 byte dari CSPRNG), tidak pernah di-commit ke Git (`R05`) | Tidak disimpan di database maupun kode sumber |
| **Password Akun Pengguna** | `User.passwordHash` | Di-hash satu arah menggunakan **bcrypt** (*cost factor* 12) (`R01`) | Disimpan sebagai *bcrypt hash* (`$2b$12$...`), bukan *plaintext* |
| **Token Sesi Autentikasi** | Cookie `lastkey_session` | Ditandatangani dengan **HMAC-SHA256** menggunakan `LASTKEY_SESSION_SECRET` (`R01`) | Cookie `httpOnly`, `sameSite=lax` |
| **Metadata Relasional & Operasional** | `Vault.id`, `Vault.name`, `Vault.status`, `Vault.recipientId`, `Vault.ownerId`, `CheckIn` | Tetap berupa metadata non-rahasia agar dapat di-index, di-filter, dan menjaga *referential integrity* melalui Prisma ORM | Plaintext tervalidasi (Zod 4 & RBAC) |

---

## 3. Mekanisme AEAD yang Dipilih

Mekanisme yang dipilih adalah **Authenticated Encryption with Associated Data (AEAD)** menggunakan algoritma **AES-256-GCM** (*Advanced Encryption Standard* dengan panjang kunci 256-bit dalam *Galois/Counter Mode*), yang diimplementasikan melalui pustaka teraudit **`@noble/ciphers` (`@noble/ciphers/aes.js`)** versi `^2.4.0`.

Tidak ada algoritma kriptografi buatan sendiri (*custom cryptography*) yang digunakan.

---

## 4. Alasan Pemilihan AES-256-GCM

1. **Perlindungan Ganda (Kerahasiaan + Integritas sekaligus):** AES-GCM menggabungkan penyandian *Counter Mode (CTR)* untuk kerahasiaan dan *Galois Message Authentication Code (GMAC/GHASH)* untuk otentikasi integritas dalam satu operasi terpadu, sehingga terhindar dari kerentanan *padding oracle* yang sering terjadi pada mode `AES-CBC`.
2. **Dukungan Native terhadap AAD (*Additional Authenticated Data*):** Mode GCM memungkinkan pengikatan metadata konteks (seperti ID Vault dan jenis field) ke dalam perhitungan *authentication tag* tanpa perlu mengenkripsi ID Vault tersebut.
3. **Standarisasi Industri:** AES-256-GCM distandarisasi dalam **NIST SP 800-38D** dan digunakan secara luas pada protokol keamanan modern (TLS 1.3, penyimpanan brankas digital).
4. **Kualitas Pustaka `@noble/ciphers`:** Pustaka `@noble/ciphers` merupakan implementasi TypeScript/JavaScript murni yang bebas dari ketergantungan *supply-chain* berlapis, mudah diaudit, dan memiliki perilaku deterministik lintas lingkungan Node.js maupun kontainer Docker.

---

## 5. Panjang Key

- **Panjang Kunci:** **256 bit (32 byte)**.
- **Validasi Ketat:** Fungsi `encrypt()` dan `decrypt()` di `crypto/aes-gcm.ts` serta fungsi `getServerEncryptionKey()` memvalidasi bahwa kunci wajib berupa `Uint8Array` dengan panjang tepat `32 byte` (`KEY_LENGTH = 32`). Jika panjang kunci kurang atau lebih dari 32 byte (misalnya 16 byte atau 64 byte), fungsi langsung melempar `Error` dan membatalkan operasi.

---

## 6. Sumber Random / CSPRNG

- **Sumber Entropi:** Seluruh pembangkitan nilai acak kriptografis (*key generation* melalui `generateKey()` dan pembuatan *nonce* unik setiap enkripsi) menggunakan **CSPRNG (*Cryptographically Secure Pseudo-Random Number Generator*)** bawaan platform melalui Web Crypto API standar:
  ```ts
  crypto.getRandomValues(bytes)
  ```
- Pada saat membangkitkan kunci melalui CLI untuk `.env`, digunakan modul CSPRNG Node.js:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- Fungsi `Math.random()` **tidak pernah digunakan** di bagian mana pun.

---

## 7. Nonce / IV

- **Panjang Nonce:** **96 bit (12 byte)** (`NONCE_LENGTH = 12`), sesuai rekomendasi utama NIST SP 800-38D untuk efisiensi dan keamanan GHASH optimal tanpa derivasi `J0` tambahan.
- **Keunikan Nonce:** Setiap pemanggilan `encrypt()` atau `encryptVaultField()` membangkitkan *nonce* 12 byte baru secara acak menggunakan CSPRNG (`crypto.getRandomValues`). Bahkan ketika *plaintext* yang sama dienkripsi berulang kali menggunakan kunci yang sama (atau saat *Vault* diperbarui melalui `updateVaultAction`), *nonce* baru selalu dibangkitkan sehingga menghasilkan *ciphertext* dan *nonce* yang berbeda.
- **Penyimpanan Nonce:** *Nonce* tidak bersifat rahasia tetapi wajib unik dan utuh; *nonce* dikodekan ke Base64 dan disimpan bersama *ciphertext* di dalam format amplop terstruktur `enc:v1:<nonce_base64>:<ciphertext_base64>`.

---

## 8. AAD (*Additional Authenticated Data*) dan Konteksnya

Pada LastKey `v0.2`, **AAD** digunakan untuk mengikat *ciphertext* dengan konteks kompartemen Vault tempat data tersebut berada. Fungsi `buildVaultAAD(vaultId, field)` pada `crypto/aes-gcm.ts` membentuk byte UTF-8 dengan format kanonik:

```text
lastkey:v1:vault:<vaultId>:<field>
```

Contoh untuk deskripsi kompartemen `v-1`:
```text
lastkey:v1:vault:v-1:description
```

**Manfaat Keamanan AAD pada LastKey:**
- Saat `v-1` dienkripsi, AAD `lastkey:v1:vault:v-1:description` dimasukkan ke `gcm(key, nonce, aad)`.
- Saat `v-1` dibaca kembali dari PostgreSQL, server merekonstruksi AAD dari `vault.id` baris tersebut (`lastkey:v1:vault:v-1:description`) dan memasukkannya ke `gcm(key, nonce, aad).decrypt(ciphertext)`.
- Apabila penyerang menyalin nilai kolom `description` terenkripsi dari `v-1` ke `v-2` di database (*ciphertext transplant attack*), proses dekripsi pada `v-2` akan menggunakan AAD `lastkey:v1:vault:v-2:description`. Karena AAD berbeda dengan saat enkripsi, verifikasi *authentication tag* GCM otomatis gagal dan sistem menolak mendekripsi data.

---

## 9. Authentication Tag

- **Panjang Tag:** **128 bit (16 byte)** (`TAG_LENGTH = 16`).
- **Perilaku Pustaka `@noble/ciphers`:** Berdasarkan implementasi dan definisi tipe `@noble/ciphers/aes.js`, instans `gcm(key, nonce, aad)` menghasilkan *authentication tag* 16 byte tetap (`tagLength = 16`) dan **menggabungkannya secara langsung di bagian akhir (*appended*) dari array `ciphertext`** yang dikembalikan oleh `cipher.encrypt(plaintext)`.
  - Dengan demikian, panjang `ciphertext` yang dihasilkan selalu `plaintext.length + 16` byte.
  - Saat `decrypt()` dipanggil, fungsi memvalidasi bahwa `ciphertext.length >= 16` sebelum menyerahkan `ciphertext` ke `cipher.decrypt()`, yang memisahkan 16 byte terakhir sebagai *tag*, menghitung ulang GHASH atas AAD dan *ciphertext*, serta membandingkan *tag* secara *constant-time*.

---

## 10. Representasi Input dan Output

1. **Level Primitif (`crypto/aes-gcm.ts`):**
   - **Input `encrypt(plaintext, key, aad?)`:**
     - `plaintext`: `Uint8Array`
     - `key`: `Uint8Array` (wajib 32 byte)
     - `aad` (opsional): `Uint8Array`
   - **Output (`EncryptedData`):**
     - `ciphertext`: `Uint8Array` (berisi *raw ciphertext* + 16-byte *authentication tag*)
     - `nonce`: `Uint8Array` (12 byte)
     - `aad` (jika diberikan): `Uint8Array`

2. **Level Penyimpanan Database (`serializeEncryptedPayload` & `encryptVaultField`):**
   - String teks UTF-8 diubah menjadi `Uint8Array` menggunakan `TextEncoder`.
   - Hasil enkripsi diserialisasi menjadi string berformat versi eksplisit:
     ```text
     enc:v1:<nonce_base64>:<ciphertext_and_tag_base64>
     ```
   - Saat deserialisasi (`deserializeEncryptedPayload`), format diverifikasi secara ketat: harus memiliki awalan `enc:v1:`, tepat 4 segmen yang dipisahkan titik dua (`:`), kedua segmen berupa string Base64 yang valid, panjang *nonce* hasil decode tepat 12 byte, dan panjang *ciphertext* minimal 16 byte.

---

## 11. Tempat Penyimpanan Kunci

- Kunci enkripsi utama disimpan pada variabel lingkungan (*environment variable*) **khusus sisi server**:
  ```text
  LASTKEY_ENCRYPTION_KEY_BASE64
  ```
- **Aturan Perlindungan Kunci (`R05`):**
  1. Variabel ini **tidak** menggunakan awalan `NEXT_PUBLIC_`, sehingga Next.js menjamin nilai kunci hanya tersedia di lingkungan Node.js server (Server Components & Server Actions) dan tidak pernah dibundel ke JavaScript peramban.
  2. File `.env` terdaftar di `.gitignore` sehingga kunci tidak pernah masuk ke dalam *commit* atau repositori GitHub.
  3. Repositori hanya menyediakan template `.env.example` yang berisi *placeholder* tanpa nilai kunci asli.

---

## 12. Penanganan Kegagalan (*Fail-Closed*)

Seluruh operasi kriptografi pada LastKey menerapkan prinsip **Fail-Closed**:

1. **Kunci Tidak Tersedia atau Tidak Valid:** Jika `LASTKEY_ENCRYPTION_KEY_BASE64` kosong, bukan Base64 yang sah, atau hasil decode tidak berukuran 32 byte, `getServerEncryptionKey()` langsung melempar `Error` dan menghentikan operasi. Sistem **tidak pernah** menggunakan *fallback key* statis atau kunci *default*.
2. **Kegagalan Verifikasi Tag / Ciphertext Termodifikasi / AAD Tidak Cocok:** Jika `decryptVaultField()` mendeteksi perubahan satu bit pun pada *nonce*, *ciphertext*, *tag*, atau ketidakcocokan AAD (`vault.id`), pustaka `@noble/ciphers` melempar pengecualian (`Error`).
3. **Pencegahan Kebocoran Ciphertext:** Pada `lib/actions/vault-actions.ts` (`getVaultsFromDb` dan `getVaultByIdFromDb`), apabila dekripsi sebuah kompartemen gagal, server menolak mengembalikan kompartemen tersebut (`return null` pada detail vault) dan **tidak pernah** mengembalikan string `enc:v1:...` mentah sebagai *plaintext* kepada pengguna.

---

## 13. Keterbatasan Implementasi v0.2 dan Rencana Pengembangan

1. **Single Master Key Server-Side:** Pada `v0.2`, seluruh kompartemen menggunakan satu kunci enkripsi tingkat aplikasi (`LASTKEY_ENCRYPTION_KEY_BASE64`) yang dikombinasikan dengan *nonce* unik per operasi dan AAD unik per `vault.id`. Pada tahap berikutnya, direncanakan penerapan *Envelope Encryption* (setiap Vault memiliki *Data Encryption Key / DEK* tersendiri yang dibungkus oleh *Key Encryption Key / KEK* atau KMS).
2. **Rotasi Kunci (*Key Rotation*):** Format payload sudah menyertakan penanda versi (`enc:v1:...`) untuk memfasilitasi migrasi ke `enc:v2:...` saat dilakukan rotasi kunci di masa mendatang, namun mekanisme *automated re-encryption job* belum diimplementasikan pada `v0.2`.
3. **Enkripsi File Biner & Shamir Secret Sharing:** Pada `v0.2`, fokus integrasi kriptografi ke PostgreSQL berada pada atribut data sensitif Vault (`Vault.description`), sedangkan penyimpanan objek file biner terenkripsi penuh dan pembagian kunci *Shamir's Secret Sharing* kepada *Recipient* saat *grace period* habis merupakan cakupan pengembangan *secure release* pada tahap selanjutnya.

