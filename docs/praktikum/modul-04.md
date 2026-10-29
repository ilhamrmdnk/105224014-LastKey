# Dokumen Teknis Modul 4: Next.js App Router

## Identitas

  Keterangan              Isi
  ----------------------- --------------------------------------
  Nama/NIM                **\[Moh Ilham Ramadhan K 105224014\]**
  Produk                  **LastKey --- Secure Digital Vault**
  Repositori              **\[https://github.com/ilhamrmdnk/Praktikum-Web-Ilham\]**
  Versi Next.js           **16.3.8**

> Mode Cache Components ditentukan dari `next.config.ts`. Pada
> konfigurasi proyek tidak terdapat `cacheComponents: true`, sehingga
> proyek menggunakan model rendering sebelumnya.

------------------------------------------------------------------------

## 1. Peta Rute

LastKey menggunakan beberapa rute berbasis file pada App Router. Rute
yang digunakan adalah sebagai berikut.

  ---------------------------------------------------------------------------------
  URL               Berkas di `app/`            Jenis Rute        Isi Halaman
  ----------------- --------------------------- ----------------- -----------------
  `/`               `app/page.tsx`              Statis            Dashboard utama
                                                                  LastKey

  `/about`          `app/about/page.tsx`        Statis            Informasi
                                                                  mengenai LastKey,
                                                                  Secure Digital
                                                                  Vault, dan konsep
                                                                  Dead Man's Switch

  `/check-in`       `app/check-in/page.tsx`     Statis            Halaman Check-in
                                                                  untuk mekanisme
                                                                  heartbeat dan
                                                                  Dead Man's Switch

  `/vault`          `app/vault/page.tsx`        Statis            Daftar Vault,
                                                                  pencarian, filter
                                                                  status, pembuatan
                                                                  Vault baru, dan
                                                                  pengelolaan Vault

  `/vault/[id]`     `app/vault/[id]/page.tsx`   Dinamis           Detail Vault
                                                                  berdasarkan
                                                                  parameter `id`
  ---------------------------------------------------------------------------------

Rute `/vault/[id]` merupakan rute dinamis. Data `id` berasal dari URL
dan digunakan untuk mencari Vault yang sesuai.

### Parameter yang tersedia

`generateStaticParams()` digunakan untuk menghasilkan parameter dari
data Vault yang tersedia. ID Vault yang digunakan antara lain:

-   `/vault/v-1`
-   `/vault/v-2`
-   `/vault/v-3`
-   `/vault/v-4`
-   `/vault/v-5`
-   `/vault/v-6`

### Bukti hasil `npm run build`

```{=html}
<!-- INSERT SCREENSHOT HASIL `npm RUN BUILD` YANG MENAMPILKAN ROUTE TABLE DI SINI -->
```
**Catatan:** hasil build akhir perlu dilampirkan sebagai screenshot agar
status setiap rute dapat diverifikasi dari output Next.js.

------------------------------------------------------------------------

## 2. Layout, Template, dan Berkas Khusus

### 2.1 Struktur folder `app/`

Struktur akhir folder `app/` adalah:

``` text
app/
├── about/
│   └── page.tsx
├── check-in/
│   └── page.tsx
├── vault/
│   ├── [id]/
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── error.tsx
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── page.tsx
│   └── template.tsx
├── favicon.ico
├── globals.css
├── layout.tsx
├── not-found.tsx
└── page.tsx
```

Struktur tersebut menunjukkan penggunaan nested layout dan berkas khusus
App Router pada segmen `/vault`.

### 2.2 `layout.tsx`

`app/vault/layout.tsx` merupakan nested layout untuk area Vault. Layout
membungkus halaman-halaman di bawah segmen `/vault` dan menyediakan
struktur bersama seperti Sidebar, Navbar, identitas area Vault, serta
Footer.

Layout dipertahankan ketika navigasi terjadi di antara halaman dalam
segmen yang sama. Oleh karena itu, elemen yang diletakkan pada layout
tidak dibuat ulang setiap kali berpindah child route.

```{=html}
<!-- INSERT SCREENSHOT BUKTI LAYOUT DI SINI -->
```
### 2.3 `template.tsx`

`app/vault/template.tsx` digunakan sebagai template pada segmen
`/vault`. Berbeda dengan layout, template akan dipasang ulang ketika
child route berubah.

Pada proyek LastKey, perilaku ini dapat diamati ketika berpindah antara
halaman `/vault` dan `/vault/[id]`.

```{=html}
<!-- INSERT SCREENSHOT SEBELUM NAVIGASI DI SINI -->
```
```{=html}
<!-- INSERT SCREENSHOT SESUDAH NAVIGASI DI SINI -->
```
### 2.4 Berkas khusus

Berkas khusus yang digunakan pada segmen Vault:

  -----------------------------------------------------------------------
  Berkas                              Fungsi
  ----------------------------------- -----------------------------------
  `layout.tsx`                        Struktur bersama untuk area
                                      `/vault`

  `template.tsx`                      Wrapper yang dipasang ulang saat
                                      child route berubah

  `loading.tsx`                       Menampilkan UI loading saat konten
                                      segmen sedang dimuat

  `error.tsx`                         Error Boundary untuk menangani
                                      error pada segmen Vault

  `[id]/not-found.tsx`                Tampilan ketika Vault dengan ID
                                      tertentu tidak ditemukan

  `app/not-found.tsx`                 Tampilan global untuk URL yang
                                      tidak memiliki rute
  -----------------------------------------------------------------------

### 2.5 Pengujian `loading.tsx`

`app/vault/loading.tsx` menyediakan tampilan loading berbentuk skeleton
yang konsisten dengan antarmuka LastKey.

#### Development

```{=html}
<!-- INSERT SCREENSHOT LOADING MODE DEVELOPMENT DI SINI -->
```
#### Production

```{=html}
<!-- INSERT SCREENSHOT LOADING MODE PRODUCTION DI SINI -->
```
### 2.6 Pengujian `error.tsx`

`app/vault/error.tsx` merupakan Client Component karena error boundary
membutuhkan kemampuan untuk menjalankan fungsi retry/reset pada sisi
client.

Berkas tersebut menggunakan `"use client"` dan menyediakan tombol **Try
again**.

#### Development

```{=html}
<!-- INSERT SCREENSHOT ERROR MODE DEVELOPMENT DI SINI -->
```
#### Production

```{=html}
<!-- INSERT SCREENSHOT ERROR MODE PRODUCTION DI SINI -->
```

------------------------------------------------------------------------

## 3. Rute Dinamis dan Validasi `params`

Rute dinamis LastKey berada pada:

``` text
app/vault/[id]/page.tsx
```

Parameter didefinisikan sebagai:

``` tsx
params: Promise<{
  id: string;
}>
```

Kemudian parameter dibaca menggunakan `await`:

``` tsx
const resolvedParams = await params;
const vaultId = resolvedParams.id;
```

Hal ini mengikuti mekanisme `params` pada Next.js 16.

### 3.1 Validasi parameter

Setelah parameter diperoleh, nilai `id` digunakan untuk mencari data
Vault melalui:

``` tsx
const vault = getVaultById(vaultId);
```

Jika Vault tidak ditemukan:

``` tsx
if (!vault) {
  notFound();
}
```

Dengan demikian, URL dengan ID yang tidak tersedia tidak akan
menampilkan halaman detail Vault, tetapi akan menampilkan
`not-found.tsx` pada segmen dinamis.

### 3.2 Tabel pengujian URL

  -----------------------------------------------------------------------
  URL               Hasil yang        Hasil aktual      Status `curl`
                    diharapkan                          
  ----------------- ----------------- ----------------- -----------------
  `/vault/v-1`      Detail Vault      **\[Isi setelah   **\[Isi\]**
                    `v-1` tampil      pengujian\]**     

  `/vault/abc`      Vault tidak       **\[Isi setelah   **\[Isi\]**
                    ditemukan         pengujian\]**     

  `/vault/999`      Vault tidak       **\[Isi setelah   **\[Isi\]**
                    ditemukan         pengujian\]**     

  `/tidak-ada`      Global 404 tampil **\[Isi setelah   **\[Isi\]**
                                      pengujian\]**     
  -----------------------------------------------------------------------

### 3.3 Pengujian dengan `curl`

Perintah yang digunakan:

``` bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/vault/v-1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/vault/abc
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/vault/999
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tidak-ada
```

```{=html}
<!-- INSERT SCREENSHOT HASIL CURL DI SINI -->
```

------------------------------------------------------------------------

## 4. Pembagian Server dan Client Components

Pada App Router, `page.tsx` dan `layout.tsx` secara default merupakan
Server Component. Client Component digunakan hanya pada bagian yang
membutuhkan state, event handler, atau API browser.

### 4.1 Tabel pembagian komponen

  ------------------------------------------------------------------------------------
  Komponen/Berkas                  Jenis                   Alasan teknis
  -------------------------------- ----------------------- ---------------------------
  `app/page.tsx`                   Server Component        Tidak membutuhkan state
                                                           atau event browser

  `app/about/page.tsx`             Server Component        Menampilkan konten
                                                           statis/informasi produk

  `app/check-in/page.tsx`          Server Component        Halaman rute utama tanpa
                                                           kebutuhan hook client pada
                                                           level page

  `app/vault/page.tsx`             Server Component        Menyiapkan data awal Vault
                                                           dan meneruskannya ke
                                                           `VaultClient`

  `app/vault/[id]/page.tsx`        Server Component        Menggunakan `params`,
                                                           `await`,
                                                           `generateStaticParams()`,
                                                           dan `notFound()`

  `app/vault/layout.tsx`           Server Component        Menyediakan struktur layout
                                                           bersama

  `app/vault/template.tsx`         Server Component        Menyediakan template
                                                           segment Vault

  `app/vault/loading.tsx`          Server Component        Fallback loading untuk
                                                           Suspense

  `app/vault/error.tsx`            Client Component        Error boundary membutuhkan
                                                           `"use client"` dan fungsi
                                                           retry/reset

  `components/VaultClient.tsx`     Client Component        Menggunakan `useState`,
                                                           `useEffect`, event handler,
                                                           pencarian, filter, dan
                                                           modal interaktif

  `app/not-found.tsx`              Server Component        Menangani halaman 404
                                                           global

  `app/vault/[id]/not-found.tsx`   Server Component        Menangani Vault yang tidak
                                                           ditemukan
  ------------------------------------------------------------------------------------

### 4.2 Alasan `VaultClient` menjadi Client Component

`components/VaultClient.tsx` menggunakan:

``` tsx
"use client";
```

Komponen tersebut membutuhkan beberapa kemampuan client, yaitu:

-   `useState` untuk menyimpan daftar Vault, pencarian, filter, form,
    dan modal.
-   `useEffect` untuk listener keyboard dan event browser.
-   `onChange`, `onClick`, dan `onSubmit` untuk interaksi pengguna.
-   Pengelolaan modal Create New Vault dan Quick Inspect.

Karena kebutuhan tersebut, penggunaan Client Component ditempatkan pada
komponen interaktif `VaultClient`, bukan pada seluruh halaman `/vault`.

### 4.3 Rute dinamis sebagai Server Component

`app/vault/[id]/page.tsx` tetap menjadi Server Component karena
membutuhkan:

-   `params` dari URL.
-   `await params`.
-   `generateStaticParams()`.
-   `getVaultById()`.
-   `notFound()`.

Hal ini membuat proses pengambilan dan validasi data Vault dilakukan
pada sisi server.

### 4.4 Pengujian batas Server--Client

Modul meminta pengujian dengan mengimpor modul data server-only ke
Client Component. Pengujian dilakukan dengan menambahkan import tersebut
secara sementara, mengamati error build, kemudian menghapus kembali
import tersebut agar kode produksi tetap benar.

```{=html}
<!-- INSERT SCREENSHOT HASIL ERROR SERVER-ONLY DI SINI -->
```
**Hasil pengujian:** **\[Isi berdasarkan error yang muncul saat
pengujian\]**

------------------------------------------------------------------------

## 5. Verifikasi

Verifikasi proyek dilakukan dengan tiga pemeriksaan utama:

### 5.1 TypeScript

Perintah:

``` bash
npx tsc --noEmit
```

Hasil:

``` text
Exit code: 0
Tidak terdapat error TypeScript.
```

```{=html}
<!-- INSERT SCREENSHOT `npx tsc --noEmit` DI SINI -->
```
### 5.2 ESLint

Perintah:

``` bash
npm run lint
```

Hasil:

``` text
Exit code: 0
Tidak terdapat error maupun warning.
```

```{=html}
<!-- INSERT SCREENSHOT `npm run lint` DI SINI -->
```
### 5.3 Production Build

Perintah:

``` bash
npm run build
```

Hasil build menggunakan Next.js 16.3.8 dan berhasil diselesaikan tanpa
error.

```{=html}
<!-- INSERT SCREENSHOT `npm run build` BESERTA ROUTE TABLE DI SINI -->
```

------------------------------------------------------------------------

## 6. Kendala dan Penyelesaian

  -----------------------------------------------------------------------
  Kendala                             Penyelesaian
  ----------------------------------- -----------------------------------
  Rute detail membutuhkan parameter   Menggunakan folder
  dinamis                             `app/vault/[id]/` dan membaca
                                      `params` menggunakan `await`

  ID Vault yang tidak tersedia harus  Menggunakan `getVaultById()` dan
  menghasilkan halaman not found      `notFound()`

  Halaman Vault membutuhkan fitur     Memisahkan bagian interaktif ke
  pencarian, filter, modal, dan       `components/VaultClient.tsx`
  validasi form                       sebagai Client Component

  Error boundary membutuhkan fungsi   `app/vault/error.tsx` menggunakan
  retry/reset                         `"use client"`

  Layout dan template memiliki        Menggunakan `app/vault/layout.tsx`
  perilaku berbeda ketika navigasi    dan `app/vault/template.tsx` sesuai
                                      fungsi masing-masing

  Perlu memastikan kode tetap valid   Menjalankan `npx tsc --noEmit`,
  setelah perubahan                   `npm run lint`, dan `npm run build`
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 7. Catatan Pemanfaatan AI

AI digunakan sebagai alat bantu dalam proses pengerjaan dan dokumentasi
Modul 4.

### Alat yang digunakan

-   ChatGPT

### Pemanfaatan

AI digunakan untuk:

1.  Membantu memahami struktur Next.js App Router.
2.  Membantu menjelaskan perbedaan Server Component dan Client
    Component.
3.  Membantu mengecek struktur rute dan nested layout.
4.  Membantu memahami penggunaan dynamic route `[id]`, `params`,
    `generateStaticParams()`, dan `notFound()`.
5.  Membantu menyusun dokumentasi teknis berdasarkan implementasi
    proyek.

### Verifikasi

Hasil yang diberikan AI tidak langsung dianggap benar. Implementasi
diverifikasi kembali dengan:

-   membaca dan memeriksa source code proyek;
-   menjalankan aplikasi melalui `npm run dev`;
-   menguji rute melalui browser;
-   menjalankan `curl` untuk memeriksa status HTTP;
-   menjalankan `npx tsc --noEmit`;
-   menjalankan `npm run lint`;
-   menjalankan `npm run build`.

Dengan demikian, bagian dokumentasi yang berkaitan dengan hasil
pengujian harus disesuaikan dengan hasil aktual yang diperoleh dari
proyek.

------------------------------------------------------------------------

## Lampiran Bukti

Screenshot yang perlu dilampirkan pada dokumen:

1.  Struktur folder `app/`.
2.  Bukti perilaku `layout.tsx`.
3.  Bukti perilaku `template.tsx`.
4.  `loading.tsx` pada development.
5.  `loading.tsx` pada production.
6.  `error.tsx` pada development.
7.  `error.tsx` pada production.
8.  `/vault/v-1`.
9.  `/vault/abc`.
10. `/vault/999`.
11. `/tidak-ada`.
12. Hasil pengujian `curl`.
13. `VaultClient.tsx` sebagai Client Component.
14. `app/vault/[id]/page.tsx` yang menunjukkan `params: Promise` dan
    `await params`.
15. Hasil pengujian server-only.
16. `npx tsc --noEmit`.
17. `npm run lint`.
18. `npm run build` beserta route table.

> **Catatan:** Placeholder hasil aktual dan screenshot di atas sengaja
> belum diisi apabila bukti pengujian belum diberikan. Jangan mengarang
> hasil pengujian; isi berdasarkan output terminal dan tampilan aplikasi
> yang benar-benar diperoleh.