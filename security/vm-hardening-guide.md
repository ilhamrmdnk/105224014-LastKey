# VM Hardening & Lynis Audit Documentation — LastKey (`sec-0.2`)

## 1. Status Audit Lingkungan (`systemd-detect-virt`)

Sebelum melakukan perubahan konfigurasi SSH atau menjalankan modifikasi sistem operasi untuk bagian **VM Hardening**, dilakukan pemeriksaan lingkungan menggunakan perintah wajib:

```bash
systemd-detect-virt
```

**Hasil Aktual Eksekusi:**
```text
none
```
*(Exit code: `1` / `none` — menunjukkan bahwa sistem saat ini berjalan di atas **mesin host fisik Linux**, bukan di dalam Virtual Machine / hypervisor seperti KVM, VirtualBox, atau VMware).*

### Keputusan Keselamatan (Sesuai Aturan Kerja Wajib Fase 3D)

Berdasarkan instruksi tugas:
> *"Periksa dahulu apakah environment yang tersedia benar-benar VM. Gunakan: `systemd-detect-virt`. JANGAN mengubah SSH configuration pada host fisik Linux Mint atau mesin yang tidak dipastikan sebagai VM... Jika VM tidak tersedia atau tidak aman untuk dimodifikasi: jangan mengarang bukti; jangan menyatakan tugas selesai; catat status BLOCKED/PENDING; dokumentasikan perintah dan langkah aman yang harus dijalankan pada VM sebenarnya."*

Oleh karena itu:
- **Status VM Hardening & Lynis Audit:** **`BLOCKED / PENDING`** *(Menunggu dieksekusi di dalam VM praktikum yang terisolasi).*
- Konfigurasi `/etc/ssh/sshd_config` pada host fisik **tidak diubah** demi menjaga keamanan dan akses mesin fisik.
- File bukti `lynis-before.txt` dan `lynis-after.txt` **tidak dibuat secara palsu** dari mesin host fisik, karena bukti tersebut wajib berasal dari VM praktikum yang sebenarnya.

---

## 2. Langkah Aman & Perintah Eksekusi pada VM Praktikum Sebenarnya

Saat Anda berada di dalam **VM Praktikum Ubuntu/Debian**, jalankan urutan perintah berikut secara berurutan untuk menghasilkan `security/lynis-before.txt`, melakukan hardening SSH & sistem, memverifikasi `sshd -T`, dan menghasilkan `security/lynis-after.txt` dengan **Hardening Index >= 70**:

### Langkah 1 — Pastikan Berada di Dalam VM & Siapkan SSH Key Sebelum Menonaktifkan Password Login

```bash
# 1. Pastikan output bukan "none" (mis. kvm, oracle, vmware)
systemd-detect-virt

# 2. Pastikan public key SSH Anda sudah terdaftar di ~/.ssh/authorized_keys pada VM
mkdir -p ~/.ssh && chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys
# Pastikan isi ~/.ssh/authorized_keys sudah memuat public key SSH dari host Anda!
cat ~/.ssh/authorized_keys
```

### Langkah 2 — Jalankan Audit Lynis Kondisi Awal (`lynis-before.txt`)

```bash
sudo apt-get update && sudo apt-get install -y lynis
sudo lynis audit system --no-colors > lynis-before.txt
grep -E "Hardening index|Tests performed" lynis-before.txt
```

### Langkah 3 — Backup & Hardening Konfigurasi SSH (`sshd_config`)

```bash
# 1. Backup konfigurasi awal
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%F)

# 2. Terapkan konfigurasi SSH Hardening melalui drop-in config
sudo tee /etc/ssh/sshd_config.d/99-lastkey-hardening.conf > /dev/null << 'EOF'
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
ChallengeResponseAuthentication no
KbdInteractiveAuthentication no
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowTcpForwarding no
AllowAgentForwarding no
LogLevel VERBOSE
EOF

# 3. Uji sintaks konfigurasi sshd sebelum reload
sudo sshd -t

# 4. Verifikasi efektif bahwa passwordauthentication dan permitrootlogin bernilai "no"
sudo sshd -T | grep -E 'passwordauthentication|permitrootlogin'
# Output yang wajib muncul:
# permitrootlogin no
# passwordauthentication no

# 5. Reload layanan SSH dengan aman (tanpa memutus sesi aktif)
sudo systemctl reload ssh || sudo systemctl reload sshd
```

### Langkah 4 — Hardening Sistem Tambahan untuk Mencapai Lynis Hardening Index >= 70

```bash
# 1. Aktifkan firewall UFW (izinkan OpenSSH terlebih dahulu)
sudo ufw allow OpenSSH
sudo ufw --force enable

# 2. Pasang paket keamanan yang direkomendasikan Lynis
sudo apt-get install -y fail2ban auditd libpam-tmpdir apt-listchanges needrestart debsums rkhunter
sudo systemctl enable --now fail2ban auditd

# 3. Terapkan Kernel Sysctl Hardening
sudo tee /etc/sysctl.d/99-lastkey-lynishardening.conf > /dev/null << 'EOF'
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1
kernel.yama.ptrace_scope = 2
kernel.unprivileged_bpf_disabled = 1
net.core.bpf_jit_harden = 2
fs.suid_dumpable = 0
fs.protected_fifos = 2
fs.protected_regular = 2
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.tcp_syncookies = 1
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
EOF
sudo sysctl --system

# 4. Perketat permission file sensitif dan banner login
sudo chmod 600 /etc/crontab
sudo chmod 700 /etc/cron.d /etc/cron.daily /etc/cron.hourly /etc/cron.weekly /etc/cron.monthly
echo "Authorized access only. All activity on LastKey VM is monitored and logged." | sudo tee /etc/issue /etc/issue.net > /dev/null
```

### Langkah 5 — Jalankan Audit Lynis Sesudah Hardening (`lynis-after.txt`)

```bash
sudo lynis audit system --no-colors > lynis-after.txt
grep -E "Hardening index|Tests performed" lynis-after.txt
```

Salin file `lynis-before.txt` dan `lynis-after.txt` dari VM ke direktori `security/` pada repositori LastKey.

