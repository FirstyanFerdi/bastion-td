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

## 5. Tahap 4: Implementasi Advanced Mechanics — Fase 1: Sinergi & Reaksi Elemen

Mengacu pada cetak biru lanjutan `bastion_td_advanced_mechanics_blueprint.md`, Fase 1 telah diimplementasikan penuh untuk menghadirkan kedalaman taktis sinergi antar-menara tanpa bergantung pada perk pasif semata:

### 5.1 Empat Reaksi Elemen Dinamis (Elemental Combos)
1. **Thermal Shockwave (`Cryo` + `Plasma`):**
   * **Pemicu:** Proyektil Plasma menghantam musuh yang sedang mengalami efek slow atau beku (`e.slowT > 0 || e.stunT > 0`).
   * **Dampak:** Menghasilkan ledakan uap 250% damage instan, merontokkan 50% sisa armor musuh seketika (`e.shred`), dan memberikan splash damage 75px ke musuh di sekitarnya.
   * **Audio & Visual:** SFX `shockwave`, cincin kejut cyan `#38bdf8`, partikel uap, dan floating text `THERMAL SHOCK`.

2. **Electrolytic Detonation (`Acid` + `Tesla`):**
   * **Pemicu:** Sambaran listrik Tesla menghantam musuh berstatus asam korosif (`e.acidT > 0`) dari tembakan Plasma *Acid Melter*.
   * **Dampak:** Cairan asam menjadi konduktor murni; sambaran listrik melompat dan meledak ke **SEMUA musuh di peta yang terlapisi Acid** tanpa batas target (*unlimited chain*).
   * **Audio & Visual:** SFX `reaction`, kilatan petir hijau `#a3e635`, dan floating text `ELECTROLYTIC` & `CONDUCTED`.

3. **Thermite Incineration (`Bleed` + `Radiation` / `Plasma`):**
   * **Pemicu:** Tembakan Plasma atau kubangan radiasi Nova Mortar mengenai musuh yang sedang mengalami pendarahan fisik (*Bleed* dari Gatling DU atau Caltrops).
   * **Dampak:** Luka terbuka terinflamasi menjadi kobaran Thermite yang membakar $3.5\%$ Max HP/detik selama 3 detik murni, melumat musuh bertubuh tebal (*Brute* dan *Boss*).
   * **Audio & Visual:** SFX `reaction`, semburan api oranye `#f97316`, dan floating text `THERMITE BURN`.

4. **Superconductor Surge (`Cryo` + `Tesla`):**
   * **Pemicu:** Sambaran petir Tesla mengenai musuh yang sedang membeku atau bergerak lambat.
   * **Dampak:** Suhu mendekati nol mutlak memicu konduktivitas absolut; serangan otomatis menjadi **100% Critical Strike** ($2\times$ damage) dan melipatgandakan durasi stun musuh.
   * **Audio & Visual:** SFX `reaction`, cincin listrik kuning emas `#fde047`, dan floating text `SUPERCONDUCTOR` + `CRIT`.

### 5.2 Antarmuka & Umpan Balik Visual Pemain
* **Tactical Inspector Field Guide:** Saat tidak ada menara yang dipilih, panel inspektur menampilkan panduan visual resep reaksi elemen lengkap beserta peran dan warnanya.
* **Sprite Debuff Indicators:** Visual debuff musuh diperkaya dengan cincin aura korosi asam hijau (`#a3e635`) dan cincin kobaran thermite (`#f97316`).
* **Sintesis Audio Baru:** Dua instrumen suara baru `reaction` (nada arpeggio frekuensi tinggi) dan `shockwave` (dentuman rumble kompresi uap) ditambahkan ke Web Audio API tanpa aset eksternal.

### 5.3 Tahap 4 — Fase 2: AI Musuh Adaptif (Adaptive Threat Director) & Elite Champion Affixes

Untuk menghilangkan monotonitas jalur musuh, diimplementasikan sistem AI adaptif dan musuh elit Diablo-style:

#### A. Adaptive Threat Director (Deteksi Bias Pemain)
Threat Director menganalisis komposisi menara dan formasi grid pemain secara real-time:
1. **Kinetic Deflector (`threat: 'deflector'`):**
   * *Pemicu:* Pemain membangun $\ge 55\%$ menara tipe balistik fisik (Gatling / Railgun).
   * *Dampak:* Musuh melengkapi perisai anti-kinetik yang meredam $50\%$ damage fisik. Memaksa pemain mendiversifikasi menara dengan tipe energi (Plasma, Tesla, Cryo).
2. **Thermal Juggernaut (`threat: 'thermal_juggernaut'`):**
   * *Pemicu:* Pemain menumpuk $\ge 2$ menara Cryo atau $\ge 30\%$ Cryo.
   * *Dampak:* Memancarkan gelombang panas dalam radius $2.0\times\text{TILE}$ yang mencairkan efek beku (*stun*) dan lambat (*slow*) pada seluruh kawan di sekitarnya secara periodik.
3. **Artillery Walker (`threat: 'artillery'`):**
   * *Pemicu:* Pemain menumpuk $\ge 4$ menara terlalu rapat dalam satu kluster sempit (*killbox cluster*).
   * *Dampak:* Musuh membombardir pusat kluster tersebut dari jarak jauh dengan proyektil EMP, melumpuhkan (*disrupt*) fungsi tembak menara selama 2.4 detik.

#### B. Elite Champion Affixes (Wave 6+)
Mulai wave 6, unit non-swarm memiliki probabilitas $25\%$ lahir sebagai varian **Champion** ($+40\%$ HP, $+40\%$ bounty reward, visual cincin rune berputar di bawah unit, dan mahkota permata di atas bar HP):
1. **Regenerator (Aura Hijau `#22c55e`):** Memulihkan $6\%$ Max HP/detik secara otomatis jika tidak menerima serangan selama $1.2$ detik.
2. **Phase-Shifter (Aura Ungu `#a855f7`):** Saat terkena serangan ledakan/benturan keras ($\ge 80$ damage), berteleportasi kedip $70\text{ px}$ maju di sepanjang jalur (cooldown $3.5$ detik).
3. **Avenger (Aura Oranye `#f97316`):** Setiap ada sekutu yang gugur dalam radius $120\text{ px}$, amarahnya terpicu: kecepatan gerak bertambah $+15\%$ dan armor bertambah $+10\%$ (dapat ditumpuk hingga $5\times$ stack).
4. **Projector Dome (Aura Cyan `#38bdf8`):** Memancarkan kubah penangkal energi (radius $40\text{ px}$) yang meredam $40\%$ kerusakan peluru dan **menghentikan tembusan balok Railgun seketika**.

---

## 6. Rincian Modifikasi Berkas Kode

| Berkas | Jenis Perubahan | Detail Modifikasi |
|---|---|---|
| [`index.html`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/index.html) | Markup | Menambahkan kontainer `#cmdTray` (`#cmdSkills` & `#perkTray`) di atas dock. |
| [`css/style.css`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/css/style.css) | Styling | Desain tombol ability commander, cooldown fill animation, branch selection grid di inspector, kartu modal tech draft, dan tag badge mutator. |
| [`js/audio.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/audio.js) | Sound Synth | Menambahkan 8 instrumen sintetik audio baru: `orbital`, `overcharge`, `caltrops`, `shatter`, `perk`, `emp`, `reaction`, dan `shockwave`. |
| [`js/data.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/data.js) | Konfigurasi Data | Struktur `branches` (A & B) tiap tower, `PERKS` (10 kartu), `COMMANDER_SKILLS` (Q, W, E), `WAVE_MUTATORS`, musuh baru di `ED`, kamus `ELEMENTAL_REACTIONS`, kamus `CHAMPION_AFFIXES`, kamus `THREAT_VARIANTS`, fungsi analisis `getThreatDirectorAnalysis()`, dan generator wave adaptif di `buildSpawns()`. |
| [`js/state.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/state.js) | State & Logic | Penanganan kalkulasi 4 Reaksi Elemen di `dealDamage`, mitigasi $-50\%$ physical Deflector, peredam Dome, teleportasi Phase-Shifter, dan akumulasi tumpukan stack Avenger di `killEnemy`. |
| [`js/enemies.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/enemies.js) | AI Musuh | Instansiasi unit Champion dan Threat di `spawnEnemy`, logika pemulihan HP Regenerator di `updateEnemy`, aura pencair es Thermal Juggernaut, serta mortar EMP Artillery Walker. |
| [`js/towers.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/towers.js) | Senjata & Targeting | Penambahan infusi status `acidT` pada Acid Melter, serta penghentian penetrasi Railgun saat mengenai musuh berstatus Dome. |
| [`js/sprites.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/sprites.js) | Prosedural Canvas | Visualisasi cincin aura rune berputar Champion (hijau, ungu, oranye, cyan), aura kubah energi Dome, indikator threat, dan mahkota permata di barisan HP unit elit. |
| [`js/render.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/render.js) | Rendering Pipeline | Render kolam radiasi, ranjau caltrops di jalan, kabel konduit listrik overcharger, dan retikel kursor bidik ability komando. |
| [`js/ui.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/ui.js) | Antarmuka HUD | Tampilan Tactical Inspector Field Guide (reaksi elemen) dan tag badge indikator kemunculan ELITE CHAMPIONS serta THREAT DIRECTOR di Wave Card. |
| [`tests/test_reactions.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/tests/test_reactions.js) | Unit Testing | Script otomasi verifikasi 100% fungsionalitas dan formula 4 reaksi elemen (Fase 1). |
| [`tests/test_champions.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/tests/test_champions.js) | Unit Testing | Script otomasi verifikasi 100% fungsionalitas Adaptive Threat Director & 4 Champion Affixes (Fase 2). |
| [`tests/smoke.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/tests/smoke.js) | Otomasi Pengujian | Simulasi 20 wave standar dan 40 wave mode endless dengan bot otomatis. |
| [`dev.bat`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/dev.bat) | Launcher Windows | Penambahan eksekusi otomatis `test_reactions.js` dan `test_champions.js` ke dalam opsi pengetesan dev. |

---

## 7. Verifikasi & Pengujian Mutu (Testing)

Pengujian simulasi otomatis secara headless dijalankan menggunakan Node.js:

1. **Uji Sinergi Elemen (Unit Test Fase 1):**
   * **Perintah:** `node tests/test_reactions.js`
   * **Hasil:**
     * ✔ Thermal Shockwave: 250% dmg burst & 50% armor shred terverifikasi
     * ✔ Electrolytic Detonation: rantai listrik asam tanpa batas target terverifikasi
     * ✔ Thermite Incineration: DoT 3.5% Max HP/detik terverifikasi
     * ✔ Superconductor Surge: garansi critical strike & durasi stun ganda terverifikasi
   * **Status:** **LULUS (100% PASS)**

2. **Uji Adaptive Threat & Champions (Unit Test Fase 2):**
   * **Perintah:** `node tests/test_champions.js`
   * **Hasil:**
     * ✔ Threat Director: Kinetic Deflector terdeteksi dari bias menara fisik
     * ✔ Threat Director: Thermal Juggernaut terdeteksi dari bias menara Cryo
     * ✔ Threat Director: Artillery Walker terdeteksi dari penumpukan kluster menara rapat
     * ✔ Kinetic Deflector: reduksi -50% physical, 100% energy terverifikasi
     * ✔ Champion Regenerator: pemulihan otomatis saat keluar dari pertempuran terverifikasi
     * ✔ Champion Phase-Shifter: teleportasi lompat 70px saat hantaman keras terverifikasi
     * ✔ Champion Avenger: penambahan speed & armor saat sekutu gugur terverifikasi
     * ✔ Champion Dome: peredaman 40% peluru dan pemotongan penetrasi Railgun terverifikasi
   * **Status:** **LULUS (100% PASS)**

3. **Uji Standar (20 Wave Menang):**
   * **Perintah:** `node tests/smoke.js`
   * **Hasil:** `OK state=victory wave=20 lives=25 towers=24 score=102352 steps=18264`
   * **Status:** **LULUS (100% stabil, 0 error)**

4. **Uji Endless Mode (40 Wave Ekstrem):**
   * **Perintah:** `node tests/smoke.js 40`
   * **Hasil:** `OK state=prep wave=40 lives=25 towers=24 score=513114 steps=57440`
   * **Status:** **LULUS (100% stabil, 0 error)**

---

## 8. Status Akhir & Panduan Unggah ke GitHub

Seluruh kode dalam kondisi bersih, aman, bebas dependensi pihak ketiga, dan siap diunggah ke repositori GitHub.

### Perintah Unggah (Terminal Pengguna):
```powershell
# 1. Masukkan semua perubahan ke staging
git add .

# 2. Periksa status
git status

# 3. Lakukan commit perubahan
git commit -m "feat(fase-2): implement adaptive threat director and elite champion affixes"

# 4. Hubungkan ke repository GitHub Anda (jika belum)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# 5. Unggah ke branch main
git push -u origin main
```

