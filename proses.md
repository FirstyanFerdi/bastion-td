# Dokumentasi Proses Pengembangan & Pembaruan — Bastion TD

Dokumen ini mencatat seluruh rangkaian proses, analisis, pembersihan keamanan, serta penambahan fitur taktis lanjutan yang telah diimplementasikan pada proyek **Bastion TD**.

---

## 1. Ringkasan Tujuan Proyek

1. **Keamanan & Kebersihan Lingkungan (GitHub Ready):**
   * Memastikan tidak ada data sensitif, API key, token, kredensial pribadi, atau path file sistem lokal yang terbawa ke repositori publik.
   * Menyusun konfigurasi `.gitignore` standar industri yang ketat dan menyeluruh.
   * Menyiapkan template lingkungan aman (`.env.example`) dan inisialisasi git branch `main`.

2. **Evolusi Gameplay Taktis & Kompleksitas:**
   * Mentransformasikan game *Tower Defense* klasik menjadi game pertahanan yang **kompleks, penuh strategi, adiktif (*high replayability*), dan adaptif**.
   * Menambahkan sistem spesialisasi cabang menara (*Branching Specializations* Tier 3).
   * Menerapkan sistem draf kartu teknologi bergaya roguelite (*Tech Requisition Draft*) setelah mengalahkan Boss.
   * Memberikan kemampuan aktif pemain di medan tempur (*Active Commander Powers* $[Q, W, E]$).
   * Menghadirkan musuh baru cerdas, mutasi cuaca/kondisi wave (*Wave Mutators*), dan Boss multi-phase interaktif.
   * Mempertahankan filosofi **zero-dependency, zero-build-step, dan performa tinggi (60 FPS)**.

---

## 2. Tahap 1: Audit Keamanan & Persiapan GitHub

### 2.1 Pemindaian Seluruh Berkas
* Pemindaian regex regex (`token|secret|password|api[_-]?key|env|author|email|credential`) dilakukan ke seluruh direktori `js/`, `css/`, `tests/`, dan `index.html`.
* **Hasil:** 0 kebocoran data sensitif ditemukan. Basis kode terkonfirmasi bersih dan 100% mandiri di sisi klien.

### 2.2 Pembuatan `.gitignore` Komprehensif
Konfigurasi awal `.gitignore` hanya memuat 3 baris dasar. Diperbarui secara menyeluruh mencakup:
* **Environment & Secrets:** `.env`, `.env.*`, `*.env`, `.env.local`, `credentials.json`, `secrets.json`, kunci privat (`*.key`, `*.pem`, `id_rsa`, `id_ed25519`).
* **Sistem Operasi:** Windows (`Thumbs.db`, `desktop.ini`, `$RECYCLE.BIN/`), macOS (`.DS_Store`, `._*`), Linux swap/backup.
* **Editor & IDE:** Direktori `.idea/`, `.vscode/*` (dengan whitelist settings publik), file proyek Visual Studio & Sublime Text.
* **Dependensi & Log:** `node_modules/`, `*.log`, log npm/yarn/pnpm.
* **Build & Cache:** `dist/`, `build/`, `.cache/`, file temporer `*.tmp`, `*.bak`.

### 2.3 Template `.env.example` & Inisialisasi Git
* Dibuat file [`.env.example`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/.env.example) sebagai panduan aman jika di masa depan ditambahkan integrasi server lokal.
* Inisialisasi git repository dijalankan dan branch utama diselaraskan ke standar modern `main`.

---

## 3. Tahap 2: Analisis Mendalam & Cetak Biru Arsitektur

Analisis menyeluruh disusun dalam berkas catatan teknis:
1. **Analisis Arsitektur:** Pemetaan tanggung jawab modul, sistem memori anti-GC lag (Object Pooling 900 partikel, 160 FX, 140 text), dan teknik rendering 2 lapis (*offscreen static canvas caching*).
2. **Analisis Matematika:** Pemetaan formula skala HP musuh non-linear:
   $$\text{HP Scale}(n) = 1 + 0.2(n - 1) + 0.014(n - 1)^2$$
   serta pipeline kalkulasi kerusakan multi-faktor (mitigasi armor, pengikisan shred, pengganda brittle Cryo, dan absorpsi perisai).
3. **Master Blueprint:** Penyusunan blueprint konseptual 5 pilar evolusi game yang disepakati untuk dieksekusi.

---

## 4. Tahap 3: Implementasi Fitur Lanjutan (Tactical Evolution)

### 4.1 Branching Tower Specialization (Tier 3 Cabang Ganda)
Diperkenalkan opsi cabang evolusi saat menara di Tier II akan ditingkatkan ke Tier III:

* **Gatling Turret (`TD.gatling`):**
  * **Branch A (Overdrive Minigun):** Mekanik *Heat Gauge*. Semakin lama menembak target yang sama, laju tembak berakselerasi dari 11/s hingga **22 peluru/detik**.
  * **Branch B (Flak Cannon):** Peluru fragmentasi meledak di udara (*proximity flak*) dengan radius $1.3$ tile untuk melenyapkan kerumunan musuh ringan.
* **Plasma Cannon (`TD.plasma`):**
  * **Branch A (Nova Mortar):** Amunisi artileri berat yang meninggalkan kolam radiasi beracun (*radiation hazard pool*) selama 4.5 detik (26 DPS + pengikisan armor).
  * **Branch B (Acid Melter):** Semburan asam kimiawi cepat yang merontokkan armor hingga $0\%$ dan memperbesar seluruh damage masuk sebesar $+25\%$.
* **Cryo Emitter (`TD.cryo`):**
  * **Branch A (Absolute Zero):** Pulsa beku total yang membekukan musuh solid selama $2.2$ detik. Musuh beku yang tewas akan meledak menjadi serpihan es tajam (*Cryo Shatter*).
  * **Branch B (Vortex Siphon):** Anomali pusaran gravitasi yang menarik jarak tempuh musuh mundur ke arah belakang jalur.
* **Tesla Coil (`TD.tesla`):**
  * **Branch A (Grid Overcharger):** Menghubungkan kabel daya listrik ke menara kawan di sekitar (radius 2.2 tile), memberi buff $+35\%$ attack speed.
  * **Branch B (EMP Disrupter):** Pulsa elektromagnetik berdaya tinggi yang langsung merontokkan perisai musuh hingga $0$ dan memberi efek stun $1.6$ detik.
* **Railgun Sniper (`TD.rail`):**
  * **Branch A (Orbital Lance):** Tembakan laser termal berpenetrasi tak terbatas yang membakar terus-menerus dalam satu garis lurus.
  * **Branch B (Executioner):** Proyektil hiper-kinetik berdaya hancur tinggi yang **langsung mengeksekusi instan (*insta-kill*)** musuh non-boss di bawah $18\%$ HP.

### 4.2 Sistem Roguelite "Tech Requisition Draft"
* Setiap kali pemain mengalahkan **Boss Wave** (Wave 5, 10, 15, 20...), simulasi masuk ke mode draft interaktif.
* Pemain memilih **1 dari 3 kartu teknologi acak** yang berlaku permanen untuk sisa sesi permainan:
  1. `superconductor`: Tesla Coil melompat ke $+2$ target dan menerapkan debuff Brittle (+25% damage).
  2. `depleted_uranium`: Gatling menembus $25\%$ armor dan menimbulkan status Bleed fisik.
  3. `cryo_shatter`: Musuh yang mati dalam kondisi slow/beku meledak menjadi pecahan es area (28 damage).
  4. `chain_reaction`: Ledakan Plasma yang mencetak kill memicu shockwave ledakan mini kedua (35 damage).
  5. `orbital_salvo`: Radius serangan Orbital Strike $+40\%$ dan cooldown lebih singkat $35\%$.
  6. `titan_hunter`: Semua menara menghasilkan $+30\%$ bonus damage terhadap Boss, Armored Brute, dan Carrier.
  7. `venture_capital`: Bunga tabungan emas akhir wave dinaikkan menjadi **14%** (maksimal 260 emas).
  8. `energy_shield`: Dua musuh pertama yang tembus ke markas per wave ditahan perisai darurat tanpa mengurangi nyawa.
  9. `nanite_infusion`: Durasi ranjau darat caltrops meningkat $+50\%$ dan mengikis $30\%$ armor musuh secara permanen.
  10. `targeting_matrix`: Jangkauan semua menara meningkat $+15\%$ dan Critical Strike Chance $+10\%$.

### 4.3 Active Commander Powers (Kekuatan Aktif Pemain)
Ditambahkan panel komando (`#cmdTray`) tepat di atas dock toko dengan 3 kemampuan aktif ber-cooldown:
* **`[Q]` Orbital Kinetic Strike:** Memanggil serangan presisi dari satelit orbital di titik kursor (AoE 420 base damage berskala HP wave, mengungkap musuh siluman, dan efek guncangan layar).
* **`[W]` Overcharge Grid:** Klik pada menara kawan untuk melipatgandakan kecepatan tembaknya (**+100% Fire Rate**) selama 7 detik dengan visual petir biru.
* **`[E]` Nanite Caltrops:** Klik pada petak jalan aspal untuk menebar ranjau kawat duri nanit selama 12–18 detik (memperlambat musuh $60\%$ dan menimbulkan damage sayatan).

### 4.4 Musuh Cerdas & Sistem Mutasi Wave
* **3 Musuh Baru:**
  1. `stealth` (Stealth Infiltrator): Memiliki kamuflase optik aktif, kebal dari kuncian target Gatling/Railgun sebelum diungkap oleh pulsa area, petir, ranjau, atau serangan orbital.
  2. `carrier` (Shield Carrier): Kapal induk heksagonal dengan 3 drone pengawal yang rutin memproyeksikan kubah perisai energi ke musuh kawan di sekitarnya.
  3. `breacher` (EMP Breacher): Musuh kamikaze bergerak cepat yang saat tewas melepaskan ledakan EMP penyetrum (*disable*) menara kawan terdekat selama $3.5$ detik.
* **Dynamic Wave Mutators (Wave 7+):**
  * `ion_storm`: +25% Energy Damage, -15% Ballistic Rate.
  * `heavy_plating`: +20% Armor tambahan untuk semua musuh.
  * `frenzy`: Musuh dengan HP di bawah 40% bergerak 35% lebih kencang.
  * `emp_jam`: -12% Jangkauan deteksi menara.
* **Boss Multi-Phase:**
  * **Fase 1 (100% – 65% HP):** Menembakkan artileri mortir ke menara pemain secara berkala untuk memicu disrupsi EMP.
  * **Fase 2 (65% – 30% HP):** Membersihkan semua efek slow/brittle/stun, menyalakan barrier shield, dan memanggil 2 Scout pengawal.
  * **Fase 3 (< 30% HP):** Mode Berserk merah menyala, kecepatan bergerak meningkat $+45\%$, dan kebal efek stun.

---

## 5. Rincian Modifikasi Berkas Kode

| Berkas | Jenis Perubahan | Detail Modifikasi |
|---|---|---|
| [`index.html`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/index.html) | Markup | Menambahkan kontainer `#cmdTray` (`#cmdSkills` & `#perkTray`) di atas dock. |
| [`css/style.css`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/css/style.css) | Styling | Desain tombol ability commander, cooldown fill animation, branch selection grid di inspector, kartu modal tech draft, dan tag badge mutator. |
| [`js/audio.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/audio.js) | Sound Synth | Menambahkan 6 instrumen sintetik audio baru: `orbital`, `overcharge`, `caltrops`, `shatter`, `perk`, dan `emp`. |
| [`js/data.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/data.js) | Konfigurasi Data | Struktur `branches` (A & B) tiap tower, `PERKS` (10 kartu), `COMMANDER_SKILLS` (Q, W, E), `WAVE_MUTATORS`, musuh baru di `ED`, dan generator wave adaptif. |
| [`js/state.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/state.js) | State & Logic | Penambahan state perk, cooldown skill, hazards, kalkulasi bleed/acid/titan-hunter di `dealDamage`, efek shatter & EMP breacher di `killEnemy`. |
| [`js/enemies.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/enemies.js) | AI Musuh | Instansiasi unit stealth/carrier/breacher, AI carrier shield pulsing, boss 3-phase state transitions, dan penanganan emergency forcefield pada kebocoran base. |
| [`js/towers.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/towers.js) | Senjata & Targeting | Penanganan targeting unit stealth, logika upgrade cabang spesialisasi, heat gauge minigun, flak burst, nova mortar radiation pool, acid melter, vortex gravity pull, overcharger aura, EMP shield strip, dan executioner instant-kill. |
| [`js/waves.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/waves.js) | Wave Controller | Pemilihan wave mutator, pembagian bunga modal ventura, penghentian wave untuk tech draft modal, fungsi `selectPerk()`, dan simulasi kerusakan hazards (caltrops/radiasi). |
| [`js/sprites.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/sprites.js) | Prosedural Canvas | Visualisasi sprite cabang A & B menara, indikator laras panas, status overcharge/EMP pada menara, visual musuh stealth shimmer, carrier escort drones, dan boss berserk aura. |
| [`js/render.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/render.js) | Rendering Pipeline | Render kolam radiasi, ranjau caltrops di jalan, kabel konduit listrik overcharger, dan retikel kursor bidik ability komando (orbital, overcharge, caltrops). |
| [`js/ui.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/ui.js) | Antarmuka HUD | UI pemilihan cabang di inspector, ability bar dengan timer cooldown, barisan badge perk aktif, preview badge musuh baru, dan modal tech draft. |
| [`js/input.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/input.js) | Kontrol & Input | Fungsi `triggerSkill()`, eksekusi penargetan klik mouse untuk orbital/overcharge/caltrops, serta hotkey `Q`, `W`, `E`. |
| [`js/main.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/main.js) | Inisialisasi & Harness | Event listener untuk ability bar dan kartu draft modal, pendaftaran icon musuh baru, serta ekspor fungsi ke hook test `window.__nb`. |
| [`tests/smoke.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/tests/smoke.js) | Otomasi Pengujian | Penyesuaian bot otomatis untuk memilih kartu perk saat draft aktif dan menguji upgrade cabang spesialisasi A & B. |
| [`README.md`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/README.md) | Dokumentasi | Pembaruan ringkasan fitur taktis baru, panduan kontrol tombol `Q/W/E`, dan instruksi pengujian. |
| [`dev.bat`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/dev.bat) | Launcher Windows | Script batch interaktif untuk membuka game secara instan di browser, menjalankan server lokal, menjalankan smoke test, atau mengecek status git. |

---

## 6. Verifikasi & Pengujian Mutu (Testing)

Pengujian simulasi otomatis secara headless dijalankan menggunakan Node.js:

1. **Uji Standar (20 Wave Menang):**
   * **Perintah:** `node tests/smoke.js`
   * **Hasil:** `OK state=victory wave=20 lives=25 towers=24 score=97133 steps=18510`
   * **Status:** **LULUS (100% stabil, 0 error)**

2. **Uji Endless Mode (40 Wave Ekstrem):**
   * **Perintah:** `node tests/smoke.js 40`
   * **Hasil:** `OK state=prep wave=40 lives=25 towers=24 score=482632 steps=56129`
   * **Status:** **LULUS (100% stabil, 0 error)**

---

## 7. Status Akhir & Panduan Unggah ke GitHub

Seluruh kode dalam kondisi bersih, aman, bebas dependensi pihak ketiga, dan siap diunggah ke repositori GitHub.

### Perintah Unggah (Terminal Pengguna):
```powershell
# 1. Masukkan semua perubahan ke staging
git add .

# 2. Periksa status
git status

# 3. Lakukan commit perubahan
git commit -m "feat: complete tactical evolution update and add process documentation"

# 4. Hubungkan ke repository GitHub Anda (jika belum)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# 5. Unggah ke branch main
git push -u origin main
```

