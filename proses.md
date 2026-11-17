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

### 5.4 Tahap 4 — Fase 3: Sistem Riset Permanen (Workshop HQ & Meta-Progression)

Untuk menghadirkan putaran permainan roguelite yang adiktif (*meta-progression loop*) antar-sesi run, diimplementasikan sistem markas riset permanen:

#### A. Mata Uang Permanen (`Nanite Cores`)
* **Perolehan Cores:**
  * Mengeliminasi Boss: $+10$ Nanite Cores.
  * Menyelesaikan setiap Wave: $+1$ Nanite Core.
  * Memecahkan rekor wave tertinggi baru: $+3$ Nanite Cores.
* **Penyimpanan Aman:** Tersimpan persisten di `localStorage` melalui modul `Store` (`nb_cores` dan `nb_workshop`) sehingga progres tidak hilang saat browser dimuat ulang.
* **Tampilan HUD:** Indikator saldo Cores dengan ikon percikan cyan interaktif ditampilkan di barisan chip status atas (`vCores`).

#### B. Pohon Riset Workshop HQ (`WORKSHOP_UPGRADES`)
Pemain dapat mengakses antarmuka **Workshop HQ** kapan saja melalui tombol `HQ` di top bar, tombol di layar menu/kalah/menang, atau tombol pintas keyboard `[B]`:
1. **Starting Treasury (Maks Lv 3):** Memberikan cadangan modal emas tambahan $+50$ (Lv 1), $+100$ (Lv 2), dan $+150$ (Lv 3) saat memulai babak baru.
2. **Reinforced Citadel (Maks Lv 2):** Markas pertahanan (*Base*) dilengkapi meriam otomatis cadangan yang menembak musuh yang mendekati radius $2.5\times\text{TILE}$ markas (visual barel meriam berputar dan lingkar jangkauan perimeter di atas citadel).
3. **Logistics Network (Maks Lv 2):** Memberikan diskon biaya material $-10\%$ (Lv 1) dan $-18\%$ (Lv 2) untuk seluruh upgrade menara di medan tempur.
4. **Command Protocol [R] (Maks Lv 1):** Membuka slot kemampuan aktif keempat pemain:
   * **`[R]` Tactical EMP Nuke:** Memicu ledakan pulsa elektromagnetik global yang merontokkan semua perisai musuh di peta seketika, melumpuhkan (*stun*) seluruh musuh di layar selama 3 detik, dan menghapus ancaman proyektil lawan.

### 5.5 Tahap 4 — Fase 4: Peta Dinamis & Leyline Conduit Nodes

Untuk mengeliminasi formasi penempatan menara statis ("solved meta") dan memberikan dinamika taktis di medan pertempuran, diimplementasikan mekanisme peta dinamis:

#### A. Node Konduit Leyline (`LEYLINE_NODES`)
Peta medan tempur memiliki tiga titik simpul energi purba dengan koordinat unik yang memberikan buff pasif masif pada menara yang didirikan di atasnya:
1. **Accelerator Node (Tile `[6, 2]` - Oranye Emas `#fbbf24`):**
   * Memberikan peningkatan kecepatan tembak $+45\%$ attack rate (`effRate *= 1.45`).
   * Cocok untuk menara bertipe dps cepat seperti Gatling atau Railgun.
2. **Sensor Node (Tile `[10, 5]` - Cyan `#38bdf8`):**
   * Memberikan jangkauan tembak ekstra $+2.5\times\text{TILE}$ radius serta **kemampuan deteksi permanen unit siluman (`revealsStealth = true`)**.
   * Menara yang ditempatkan di node ini dapat mengunci target *Stealth Infiltrator* tanpa perlu membuka kamuflasenya terlebih dahulu.
3. **Catalyst Node (Tile `[7, 5]` - Ungu `#c084fc`):**
   * Menggandakan dan mengamplifikasi efektivitas status debuff elemen:
     * Efek slow Cryo bertambah $+35\%$ dan durasinya diperpanjang dari $1.8\text{s}$ menjadi $3.0\text{s}$.
     * Efek Brittle diperpanjang dari $2.5\text{s}$ menjadi $4.5\text{s}$.
     * Efek stun beku es diperpanjang $1.5\times$.
     * Korosi armor Plasma ditingkatkan $1.5\times$ dan durasi radiasi diperpanjang $1.5\times$.

#### B. Dynamic North Breach Route (Jalur Flanking Utara - Wave 8+)
* Mulai wave 8, pertahanan perimeter utara mengalami keruntuhan struktural (*Structural Breach*).
* Muncul rute baru `PATH_BREACH` dari arah utara `[7, 0]` menembus ke persimpangan timur `[13, 2]` sebelum bergabung ke jalur utama menuju base.
* Sekitar $35\%$ musuh non-boss di wave $\ge 8$ dialihkan menyerbu melalui jalur flanking ini (`pathId: 1`), memaksa pemain memperluas jangkauan pertahanan dan tidak hanya menumpuk menara di jalur barat.
* Banner darurat merah `STRUCTURAL BREACH!` dan panah aliran arah merah diaktifkan di kanvas.

#### C. Interactive Explosive Fuel Cells
* Tersebar di dua titik taktis: `[6, 3]` dan `[12, 7]`.
* Barel bahan bakar bertekanan tinggi yang dapat diledakkan pemain dengan mengklik langsung (*manual click*) drum hazard tersebut.
* **Efek Ledakan:** Menghasilkan $450$ plasma AoE damage dalam radius $110\text{ px}$, melucuti **100% Armor** musuh yang terkena dampak (`shred = armor`), serta meninggalkan genangan radiasi selama $4.5$ detik.

### 5.6 Tahap 4 — Fase 5: Ascension Protocols & Special Event Mutators

Untuk memberikan tantangan endgame (*high-stakes challenge*) bagi pemain veteran dan meningkatkan replay value secara eksponensial, diimplementasikan sistem tingkat kesulitan bertingkat (*Pact of Punishment*) dan mutator krisis tak terduga:

#### A. Sistem Protokol Ascension (Tingkat Kesulitan 0 s.d. 5)
Pemain dapat memilih tingkat Ascension di layar Menu Utama sebelum memulai babak permainan. Menyelesaikan Wave 20 pada tingkat Ascension tertentu akan membuka tingkatan berikutnya secara otomatis:
1. **Ascension 0 (Standard Perimeter):** Mode standar tanpa penalti. Pengganda hadiah Cores $1.0\times$.
2. **Ascension 1 (Hyper-Inflation):** Seluruh menara pertahanan membutuhkan biaya pembangunan $+15\%$ lebih mahal (`getTowerCost()`). Bonus Cores $+25\%$, Score $+20\%$.
3. **Ascension 2 (Fragile Perimeter):** Nyawa pangkalan (*Base Lives*) dipangkas dari 25 menjadi **12 nyawa**. Kesalahan penataan pertahanan berakibat fatal. Bonus Cores $+50\%$, Score $+40\%$.
4. **Ascension 3 (Swarm Influx):** Jumlah musuh kawanan (*Swarm units*) meningkat $+50\%$ dan kecepatan gerak seluruh swarm dipercepat $+15\%$. Bonus Cores $+75\%$, Score $+60\%$.
5. **Ascension 4 (Shield Protocol):** Seluruh unit musuh terlahir dengan perisai energi aktif sebesar **20% dari Max HP** mereka. Memaksa pemanfaatan menara Tesla Coil dan EMP. Bonus Cores $+100\%$, Score $+80\%$.
6. **Ascension 5 (Nemesis Awakening):** Seluruh Boss kebal terhadap kemampuan *insta-kill* (Executioner Railgun), dan saat memasuki status *Berserk* ($\le 50\%$ HP), Boss memanggil **2 pengawal Elite Champion** dengan affix acak. Bonus Cores $+125\%$, Score $+100\%$.

* **Mekanisme Akumulasi Pacts:** Setiap penalti Ascension bersifat kumulatif (contoh: pada Ascension 3, penalti Ascension 1, 2, dan 3 aktif bersamaan).
* **Multi-Reward Scaling:** Setiap level Ascension memberikan pengganda perolehan Nanite Cores $+25\%$ per level (`1 + ascension * 0.25`) serta bonus kemenangan $+15 + 5 \times \text{Ascension}$ Cores saat menaklukkan wave 20.

#### B. Special Event Mutators (Mutator Cuaca & Krisis Lingkungan)
Menambahkan 4 mutator cuaca/kondisi krisis baru dengan visual badge tematik di Wave Card:
1. **Solar Flare (`solar_flare`):**
   * Radiasi badai matahari menyelimuti medan tempur.
   * Seluruh kerusakan bertipe energi dan plasma meningkat $+35\%$ (`energyDamage *= 1.35`), namun petir dan badai ion memicu distorsi visual partikel.
2. **Nanite Plague (`nanite_plague`):**
   * Wabah nanit mereplikasi diri di dalam tubuh musuh.
   * Setiap musuh non-swarm yang mati melepaskan $2$ unit mikro-swarm baru di posisi kematiannya.
3. **Cryo Lockdown (`cryo_lockdown`):**
   * Gelombang hawa dingin sub-zero membekukan sirkuit medan pertempuran.
   * Seluruh unit musuh bergerak $20\%$ lebih lambat (`curSpeed *= 0.8`), namun laju tembak (*rate*) menara kawan juga berkurang $-15\%$.
4. **Overcharge Anomaly (`overcharge_anomaly`):**
   * Medan magnetik hiper-energi meliputi grid.
   * Musuh bergerak $+25\%$ lebih cepat, namun seluruh menara kawan memperoleh lonjakan laju tembak $+30\%$ dan jangkauan tembak $+15\%$.

---

## 6. Rincian Modifikasi Berkas Kode

| Berkas | Jenis Perubahan | Detail Modifikasi |
|---|---|---|
| [`index.html`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/index.html) | Markup | Menambahkan chip status `CORES` (`#vCores`) dan tombol pintas `HQ` (`#btnWorkshop`) pada bilah atas. |
| [`css/style.css`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/css/style.css) | Styling | Desain tombol ability commander, cooldown fill animation, branch selection grid di inspector, kartu modal tech draft, tag badge mutator, serta styling pemilih Ascension selector (`.asc-box`, `.asc-bar`, `.asc-nav`, `.asc-title`, `.asc-desc`, `.asc-pacts`, `.asc-badge`). |
| [`js/core.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/core.js) | Core Persistence | Integrasi state `cores`, `workshop`, `ascension`, dan `maxAscension` ke `SAVE`, pengganda Cores `1 + ascension * 0.25` di `addCores()`, helper `setAscension()`, dan `unlockNextAscension()`. |
| [`js/audio.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/audio.js) | Sound Synth | Menambahkan 8 instrumen sintetik audio baru: `orbital`, `overcharge`, `caltrops`, `shatter`, `perk`, `emp`, `reaction`, dan `shockwave`. |
| [`js/data.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/data.js) | Konfigurasi Data | Struktur `WP_BREACH`, `PATH_BREACH`, `SEG_BREACH`, `PLEN_BREACH`, koordinat `LEYLINE_NODES`, helper `getLeylineAt()`, `posAt()` multi-rute, struktur `branches` menara, `PERKS`, `COMMANDER_SKILLS`, `WAVE_MUTATORS` (ditambah 4 event krisis: *Solar Flare*, *Nanite Plague*, *Cryo Lockdown*, *Overcharge Anomaly*), kamus `ELEMENTAL_REACTIONS`, `CHAMPION_AFFIXES`, `THREAT_VARIANTS`, `WORKSHOP_UPGRADES`, kamus `ASCENSION_MODIFIERS` (Lv 0-5), `getAscensionData()`, serta eskalasi $+50\%$ swarm count pada Ascension $\ge 3$. |
| [`js/state.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/state.js) | State & Logic | Penanganan kalkulasi 4 Reaksi Elemen di `dealDamage`, mitigasi Deflector & Dome, teleportasi Phase-Shifter multi-path, inisialisasi `fuelCells` di `newGame()`, detonate fuel cells, inisialisasi `G.ascension`, pemotongan base lives menjadi 12 pada Ascension $\ge 2$, amplifikasi damage energi $+35\%$ pada *Solar Flare*, dan pemanggilan micro-swarm saat musuh mati di bawah *Nanite Plague*. |
| [`js/enemies.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/enemies.js) | AI Musuh | Akselerasi $+15\%$ kecepatan gerak Swarm pada Ascension $\ge 3$, pemberian $+20\%$ HP shield pada semua musuh saat lahir pada Ascension $\ge 4$, pemanggilan 2 pengawal Elite Champion saat Boss memasuki fase Berserk pada Ascension $\ge 5$, serta modifikasi laju gerak akibat mutator krisis *Cryo Lockdown* ($0.8\times$) dan *Overcharge Anomaly* ($1.25\times$). |
| [`js/towers.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/towers.js) | Senjata & Targeting | Penambahan fungsi `getTowerCost(type)` dengan penyesuaian biaya $+15\%$ pada Ascension $\ge 1$, kekebalan eksekusi instan Boss dari Railgun Executioner pada Ascension $\ge 5$, serta penyesuaian laju tembak dan jangkauan saat mutator krisis aktif. |
| [`js/waves.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/waves.js) | Wave Controller | Peringatan darurat wave 8 `STRUCTURAL BREACH!`, pengaliran `pathId`, pengganda skor Ascension pada `onWaveClear()`, auto-unlock tingkatan Ascension berikutnya dan bonus hadiah Cores $+15 + 5\times\text{Ascension}$ saat menang di `endGame(true)`. |
| [`js/render.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/render.js) | Rendering Pipeline | Visualisasi glowing runes `drawLeylineNodes()`, drum interaktif `drawFuelCells()` berserta crater ledakan, aliran panah merah jalur flanking, dan penanda darurat `! BREACH !` di perimeter utara. |
| [`js/input.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/input.js) | Kontrol & Input | Deteksi klik interaktif langsung untuk meledakkan Fuel Cells di medan pertempuran. |
| [`js/ui.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/ui.js) | Antarmuka HUD | Kartu informasi node Leyline di Tactical Inspector, penyelarasan biaya menara dinamis di dock toko dan inspector, badge tingkat Ascension di Wave Card, antarmuka interaktif pemilih Ascension (Pact of Punishment) di menu utama, dan banner kemenangan Ascension. |
| [`tests/test_browser_init.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/tests/test_browser_init.js) | DOM Regression Testing | Verifikasi inisialisasi lingkungan browser DOM nyata, parsing `data-ico`, inisialisasi canvas, dan eksekusi frame pertama. |
| [`js/main.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/main.js) | Inisialisasi & Harness | Handler navigasi tombol `asc_prev` dan `asc_next` pada overlay menu, ekspor helper Ascension (`getTowerCost`, `ASCENSION_MODIFIERS`, `getAscensionData`, `setAscension`, `unlockNextAscension`) ke `window.__nb`. |
| [`tests/test_reactions.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/tests/test_reactions.js) | Unit Testing | Script otomasi verifikasi 100% fungsionalitas dan formula 4 reaksi elemen (Fase 1). |
| [`tests/test_champions.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/tests/test_champions.js) | Unit Testing | Script otomasi verifikasi 100% fungsionalitas Adaptive Threat Director & 4 Champion Affixes (Fase 2). |
| [`tests/test_workshop.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/tests/test_workshop.js) | Unit Testing | Script otomasi verifikasi 100% fungsionalitas perolehan Cores, sistem riset workshop, diskon logistik, citadel turret, dan EMP Nuke (Fase 3). |
| [`tests/test_map_dynamics.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/tests/test_map_dynamics.js) | Unit Testing | Script otomasi verifikasi 100% fungsionalitas node Leyline (Accelerator, Sensor, Catalyst), rute flanking breach, dan ledakan interaktif Fuel Cells (Fase 4). |
| [`tests/test_ascension.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/tests/test_ascension.js) | Unit Testing | Script otomasi verifikasi 100% fungsionalitas 5 tingkatan Ascension, akumulasi penalti pact, pelipatgandaan Cores, dan 4 mutator krisis baru (Fase 5). |
| [`tests/smoke.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/tests/smoke.js) | Otomasi Pengujian | Simulasi 20 wave standar dan 40 wave mode endless dengan bot otomatis (diperbarui dengan integrasi `getTowerCost`). |
| [`dev.bat`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/dev.bat) | Launcher Windows | Penambahan eksekusi otomatis `test_ascension.js` ke dalam opsi pengetesan dev. |

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

3. **Uji Workshop HQ & Meta-Progression (Unit Test Fase 3):**
   * **Perintah:** `node tests/test_workshop.js`
   * **Hasil:**
     * ✔ Nanite Cores: perolehan & persistensi penyimpanan terverifikasi
     * ✔ Workshop Research: deduksi biaya cores & validasi limit level terverifikasi
     * ✔ Starting Treasury: bonus emas awal terverifikasi
     * ✔ Logistics Network: diskon upgrade menara -10% (Lv 1) dan -18% (Lv 2) terverifikasi
     * ✔ Citadel Auto-Turret: penembakan otomatis hostiles di perimeter base terverifikasi
     * ✔ Command Protocol [R]: pelucutan perisai & stun global 3 detik Tactical EMP Nuke terverifikasi
   * **Status:** **LULUS (100% PASS)**

4. **Uji Dynamic Map & Leyline Nodes (Unit Test Fase 4):**
   * **Perintah:** `node tests/test_map_dynamics.js`
   * **Hasil:**
     * ✔ Leyline Accelerator: peningkatan kecepatan tembak $+45\%$ terverifikasi
     * ✔ Leyline Sensor: bonus jangkauan $+2.5\times\text{TILE}$ & deteksi musuh stealth terverifikasi
     * ✔ Leyline Catalyst: pelipatan durasi/potensi debuff Slow, Brittle, Freeze, dan Acid terverifikasi
     * ✔ Dynamic North Breach Route: kemunculan musuh flanking jalur utara wave $\ge 8$ terverifikasi
     * ✔ Interactive Fuel Cells: klik manual peledakan barel, $450$ AoE damage, $100\%$ shred, dan kolam radiasi terverifikasi
   * **Status:** **LULUS (100% PASS)**

5. **Uji Ascension Protocols & Special Event Mutators (Unit Test Fase 5):**
   * **Perintah:** `node tests/test_ascension.js`
   * **Hasil:**
     * ✔ Ascension Protocol levels 0 to 5 terverifikasi
     * ✔ Ascension 1 (Hyper-Inflation): kenaikan biaya menara $+15\%$ terverifikasi
     * ✔ Ascension 2 (Fragile Perimeter): batas modal awal 12 nyawa terverifikasi
     * ✔ Ascension 3 (Swarm Influx): pertambahan jumlah $+50\%$ dan akselerasi $+15\%$ kecepatan gerak kawanan terverifikasi
     * ✔ Ascension 4 (Shield Protocol): perlindungan perisai energi awal $20\%$ HP pada musuh terverifikasi
     * ✔ Ascension 5 (Nemesis Awakening): proteksi anti-eksekusi Boss & pemanggilan 2 pengawal Champion saat Berserk terverifikasi
     * ✔ Pengganda Nanite Cores per level Ascension ($+25\%/\text{level}$) terverifikasi
     * ✔ Special Mutator Solar Flare: lonjakan damage energi/plasma $+35\%$ terverifikasi
     * ✔ Special Mutator Nanite Plague: kelahiran micro-swarm saat musuh mati terverifikasi
     * ✔ Special Mutator Cryo Lockdown: reduksi kecepatan musuh $-20\%$ terverifikasi
     * ✔ Special Mutator Overcharge Surge: lonjakan kecepatan musuh $+25\%$ terverifikasi
   * **Status:** **LULUS (100% PASS)**

6. **Uji Inisialisasi DOM & Browser (Regression Test):**
   * **Perintah:** `node tests/test_browser_init.js`
   * **Hasil:**
     * ✔ SVG Icon Dictionary: icon `spark` terdaftar dan fallback safe `svg()` aktif
     * ✔ Inisialisasi DOM & Icon parsing `data-ico`: 100% tanpa exception
     * ✔ Inisialisasi Game Loop & Canvas context: Frame 1 render sukses
   * **Status:** **LULUS (100% PASS)**

7. **Uji Standar (20 Wave Menang):**
   * **Perintah:** `node tests/smoke.js`
   * **Hasil:** `OK state=victory wave=20 lives=5 towers=24 score=102819 steps=23625`
   * **Status:** **LULUS (100% stabil, 0 error)**

8. **Uji Endless Mode (40 Wave Ekstrem):**
   * **Perintah:** `node tests/smoke.js 40`
   * **Hasil:** `OK state=prep wave=40 lives=13 towers=24 score=535767 steps=58072`
   * **Status:** **LULUS (100% stabil, 0 error)**

---

## 8. Audit Mutu Menyeluruh & Perbaikan Bug Nyata (Realization Verification)

Audit menyeluruh dari Fase 1 hingga Fase 5 dilakukan untuk membuktikan bahwa **seluruh mekanik dan efek telah terwujud 100% ke dalam engine permainan (gameplay loop, canvas rendering, partikel/VFX, serta Web Audio API procedural synth)** dan bukan sekadar teks antarmuka:

### 8.1 Bukti Realisasi Sistem ke Dalam Game Loop & Kanvas
1. **Fase 1 (Sinergi & Reaksi Elemen):**
   * *Formula Kerusakan:* Dihitung langsung di `dealDamage()` ([`js/state.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/state.js)).
   * *Efek Visual:* Cincin ekspansi `addRing()`, percikan partikel `burst()`, proyektil petir rantai asam `addBolt()`, dan floating combat text (`addText()`).
   * *Audio:* Suara Web Audio API prosedural `shockwave` dan `reaction` dipicu secara real-time.
   * *Status Debuff Kanvas:* Aura korosi asam lime `#a3e635` dan cincin thermite oranye `#f97316` digambar di sekitar sprite musuh pada [`js/sprites.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/sprites.js).
2. **Fase 2 (Adaptive Threat & Elite Champions):**
   * *Adaptive AI:* Menghitung rasio komposisi menara pemain di `getThreatDirectorAnalysis()` ([`js/data.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/data.js)) dan memodifikasi antrean musuh di `buildSpawns()`.
   * *Mekanik & Sprite:* Visual cincin putar rune bergaris putus-putus di bawah musuh Champion, mahkota permata di atas bar HP, kubah peredam proyektil 40px aktif (*Anti-Projectile Dome*), dan ledakan mortir EMP Artillery Walker yang melumpuhkan menara kawan.
3. **Fase 3 (Workshop HQ & Meta-Progression):**
   * *Persistensi:* Saldo Nanite Cores dan level riset tersimpan permanen di `localStorage` melalui modul `Store` ([`js/core.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/core.js)).
   * *In-Game Reality:* Modal emas awal bertambah otomatis, harga upgrade berkurang sesuai diskon logistik, meriam otomatis Citadel menembakkan laser merah dengan animasi barel berputar di kanvas, dan `[R]` Tactical EMP Nuke menghasilkan guncangan layar masif, cincin EMP global, serta melumpuhkan seluruh musuh di layar.
4. **Fase 4 (Peta Dinamis & Leyline Conduit Nodes):**
   * *Rendering Peta:* Rune bercahaya pulsing di atas tile Leyline ([`js/render.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/render.js)), rute flanking Utara (Wave 8+) dengan panah chevrons merah di aspal, dan barel bahan bakar drum Fuel Cell bergaris hazard kuning-hitam.
   * *Interaktivitas:* Klik langsung barel memicu ledakan instan 450 AoE damage, pelucutan 100% armor, pembentukan kolam radiasi beracun, dan kawah hitam hangus (*crater*).
5. **Fase 5 (Ascension Protocols & Special Event Mutators):**
   * *Multi-Modifier:* Biaya menara naik $+15\%$ nyata di toko dan kanvas, modal nyawa awal terpotong menjadi 12 nyawa di Ascension 2, musuh terlahir dengan perisai biru 20% HP berputar, dan Boss Berserk memanggil 2 pengawal Champion di jalurnya.

---

### 8.2 Daftar Temuan Bug & Perbaikan yang Diterapkan

1. **Bug Variable Shadowing pada Barel Fuel Cell (`fc.r` Collision):**
   * *Temuan:* Pada objek `fuelCells` di `js/state.js`, properti baris grid didefinisikan sebagai `r: 3` dan `r: 7`, namun kemudian tertimpa oleh properti radius piksel `r: 16`. Akibatnya, `fc.r` selalu bernilai 16 (di luar batas baris grid `ROWS = 10`), menyebabkan deteksi koordinat tile keliru.
   * *Perbaikan:* Properti baris grid diganti menjadi `row` (`{ c: 6, row: 3, r: 16 }` dan `{ c: 12, row: 7, r: 16 }`).
2. **Bug Pembangunan Menara Menimpa Barel Aktif:**
   * *Temuan:* Pemain dapat mendirikan menara tepat di atas drum Fuel Cell yang belum diledakkan sehingga sprite menara dan barel tumpang tindih.
   * *Perbaikan:* Ditambahkan validasi pada `placeTower()` dan hover kanvas di `js/render.js` agar tile barel yang belum meledak berstatus terblokir (merah), dan baru dapat didirikan menara setelah barel meledak.
3. **Bug Desinkronisasi Biaya Menara pada Ascension 1 (Hyper-Inflation):**
   * *Temuan:* Pada kanvas hover placement preview (`afford = G.gold >= def.cost`) dan dock toko (`.classList.toggle('poor', G.gold < TD[k].cost)`), kode masih merujuk ke `def.cost` (50) bukan biaya inflasi `getTowerCost()` (58). Akibatnya, pemain dengan 52 gold melihat outline hijau seolah mampu membeli, namun klik peletakan menara gagal (*error sound*).
   * *Perbaikan:* Disinkronkan ke `getTowerCost(type)` di seluruh modul rendering kanvas dan antarmuka dock toko.
4. **Optimalisasi Posisi Spawn Nemesis Escorts (Ascension 5):**
   * *Temuan:* Saat Boss memasuki fase Berserk, pengawal Champion terlahir di titik awal lintasan (`d = 0`) alih-alih mengawal langsung Boss di medan tempur.
   * *Perbaikan:* Pengawal Champion kini ditempatkan tepat di belakang Boss (`d - 35` dan `d - 60`) di sepanjang lintasan aktif Boss sehingga langsung bertindak sebagai perisai pelindung.
5. **Peringatan Dini Mutator pada Kartu Wave:**
   * *Temuan:* Tag mutator hanya muncul saat wave telah berjalan aktif, sehingga pemain tidak memiliki kesempatan mempersiapkan formasi menara yang sesuai pada fase persiapan (*prep phase*).
   * *Perbaikan:* Algoritma prediktif mutator diintegrasikan ke dalam `renderWaveCard()` agar jenis mutator wave berikutnya langsung terbaca di kartu persiapan.
6. **Perbaikan Formula Pembukaan Ascension Bertingkat:**
   * *Temuan:* Terdapat potensi lompatan level akibat inkonsistensi ganda `+1` pada `setAscension()` dan `unlockNextAscension()`.
   * *Perbaikan:* Diselaraskan sehingga setiap tingkatan Ascension terbuka berurutan satu per satu setelah pemain memenangkan tingkat sebelumnya.

---

## 9. Bastion TD 3.0: Mastery & Adaptive Evolution

Pembaruan besar versi 3.0 mengintegrasikan 4 pilar mekanik tingkat lanjut yang dirancang untuk membawa kedalaman strategi, adaptabilitas AI, dan replayability tak terbatas ke Bastion TD:

### 9.1 Tahap 1: Power Grid & Sub-Reactors (Jaringan Energi & Beban Menara)
* **Kapasitas Dasar Daya:** Jaringan pangkalan memiliki kapasitas dasar $60\text{ MW}$.
* **Konsumsi Daya Menara Berdasarkan Tier:**
  * Gatling Turret: $[2, 3, 5]\text{ MW}$
  * Plasma Cannon: $[5, 7, 9]\text{ MW}$
  * Cryo Emitter: $[4, 6, 8]\text{ MW}$
  * Tesla Coil: $[6, 8, 11]\text{ MW}$
  * Railgun Sniper: $[8, 11, 15]\text{ MW}$
* **Kondisi Brownout (Krisis Daya Listrik):**
  * Ketika total konsumsi daya melampaui kapasitas $(\text{Used} > \text{Capacity})$, seluruh pertahanan memasuki status **Brownout**.
  * Chip penunjuk daya di bar atas (`#chipPower`) berubah menjadi merah berkedip.
  * Seluruh menara tempur menerima penalti laju tembak $-35\%$ ($0.65\times$ Attack Rate).
* **Menara Baru: Fission Relay (Sub-Reaktor Terfusi):**
  * **Fungsi:** Menyuplai energi bersih $+25\text{ MW}$ (Tier I) / $+45\text{ MW}$ (Tier II / Spesialisasi).
  * **Kemampuan Interaktif: Sector Overdrive:**
    * Tombol pemicu aktif di panel inspektur.
    * Memberikan lonjakan daya instan selama 8 detik: seluruh menara dalam radius 2.4 tile memperoleh buff laju tembak $+75\%$ (Tier I) / $+100\%$ (Tier II) dan radius jangkauan $+25\%$.
    * **Thermal Shutdown:** Setelah Overdrive usai, reaktor mengalami pendinginan paksa (*shutdown*) selama 6 detik (output suplai daya menjadi $0\text{ MW}$, menara mengeluarkan asap abu-abu sebelum kembali beroperasi normal).

---

### 9.2 Tahap 2: Commander Tactical Doctrines & 8 Skill Aktif Baru
Pemain kini dapat memilih doktrin taktis komandan sebelum memulai ekspedisi di menu utama. Setiap doktrin memiliki efek pasif eksklusif dan 4 slot skill aktif yang terikat pada tombol $[Q, W, E, R]$:

1. **Siege Vanguard (Balistik, Kinetik & Peledak Berat):**
   * **Pasif (Shrapnel Cascade):** Serangan kritis fisik (Gatling/Railgun) memicu ledakan serpihan kinetik ke musuh dalam radius 35px ($45\%$ dari damage kritis).
   * **Skill Aktif:**
     * $[Q]$ **Orbital Strike:** Dentuman proyektil meteor satelit kinetik (420 base damage + skala HP).
     * $[W]$ **Proximity Minefield:** Menebar 6 ranjau darat peledak di sepanjang jalur lintasan (180 damage fisik + efek slow 35%).
     * $[E]$ **AP Sabot Rounds:** Amunisi penembus baja; menara fisik mengabaikan $75\%$ armor musuh dan memperoleh $+25\%$ crit chance selama 6 detik.
     * $[R]$ **Carpet Bombing:** 5 pengeboman udara beruntun di sepanjang sektor lintasan tempur utama (300 plasma damage tiap ledakan).

2. **Quantum Architect (Manipulasi Energi & Reaktor Jaringan):**
   * **Pasif (Superconductive Conduit):** Seluruh menara energi saling terhubung; seluruh Reaksi Elemen menghasilkan $+40\%$ kerusakan tambahan.
   * **Skill Aktif:**
     * $[Q]$ **Spatial Shift (`swap_towers`):** Menukar posisi 2 menara kawan secara instan di kanvas tanpa biaya pembongkaran, mempertahankan tingkatan tier, spesialisasi cabang, dan chip yang terpasang.
     * $[W]$ **Overcharge Surge:** Melipatgandakan kecepatan tembak menara terpilih selama 8 detik (+120% attack rate, +20% jangkauan).
     * $[E]$ **Cryo Singularity:** Pusaran lubang es anomali yang menyedot seluruh musuh dalam radius 120px ke titik pusat dan membekukan selama 3 detik.
     * $[R]$ **Tactical EMP Nuke:** Gelombang EMP global yang seketika menghapus perisai musuh dan melumpuhkan musuh non-boss selama 3.5 detik (1.2 detik pada boss).

3. **Spec-Ops Infiltrator (Taktik Sabotase, Umpan & Ekonomi Pasar Gelap):**
   * **Pasif (Counter-Measures):** Musuh siluman menerima $2.5\times$ kerusakan ketika status kamuflasenya terungkap. Kebocoran musuh pertama di setiap wave dinetralkan secara gratis oleh drone pertahanan markas.
   * **Skill Aktif:**
     * $[Q]$ **Decoy Holo-Beacon:** Memproyeksikan umpan holografis berkapasitas 400 HP di jalur musuh selama 6 detik. Musuh berhenti maju dan mengalihkan seluruh serangannya ke umpan.
     * $[W]$ **Cyber-Hijack:** Meretas sistem kontrol 1 musuh non-boss terdekat selama 6 detik, mengubahnya menjadi kawan untuk menembaki gerombolan musuh lain.
     * $[E]$ **Nanite Caltrops:** Menebar kawat duri nanit di jalur tempur yang memperlambat musuh $60\%$ dan mengikis armor.
     * $[R]$ **Market Liquidation:** Mencairkan $25\%$ dari seluruh nilai investasi menara yang ada di medan pertempuran menjadi emas instan, serta memberikan $100\%$ jaminan Critical Hit ke semua menara selama 8 detik.

---

### 9.3 Tahap 3: Modular Chip Socketing & Living Hive Mutation AI

#### A. Modular Chip Socketing
Menara tempur yang telah ditingkatkan ke **Tier II** membuka slot soket komponen modular (1 slot pada Tier II, 2 slot pada Tier III). Pemain dapat memasang (*socket*) dan mencabut (*unsocket*) chip secara bebas di panel inspektur:
1. `prism_refractor` (Khusus Railgun): Tembakan laser terbias menjadi 3 cabang berkas saat mengenai target berstatus beku atau memiliki perisai energi.
2. `cryo_igniter` (Khusus Plasma): Ledakan proyektil plasma menciptakan genangan api-es (*frostfire puddle*), menerapkan Slow 40% sekaligus Thermite Burn (3.5% Max HP/s).
3. `vampiric_siphon` (Khusus Gatling): Setiap 8 musuh yang ditumbangkan oleh menara ini menyetor langsung $+1\text{ Gold}$ ke kas markas.
4. `arc_resonance` (Khusus Tesla): Sambaran petir antar menara kawan memantul ke musuh dengan $+50\%$ bonus kerusakan.
5. `executioner_nanites` (Universal / Any Tower): Peluang $8\%$ untuk langsung mengeksekusi instan musuh non-boss yang memiliki sisa HP di bawah $30\%$.
6. `feedback_chrono` (Universal / Any Tower): Setiap kali menara memicu Reaksi Elemen, cooldown seluruh skill Komandan berkurang $0.5$ detik.

#### B. Living Hive Mutation AI (Evolusi Adaptif Musuh)
Mulai Wave 6 ke atas, sistem AI melacak distribusi tipe damage yang diterima swarm (`G.damageTrack`). Jika salah satu jenis damage mendominasi lebih dari $45\%$, koloni Hive bermutasi di awal wave berikutnya untuk menangkal strategi dominan pemain:
* **Chitin Armor Plating (Counter Fisik):** Jika damage fisik mendominasi, musuh melahirkan lapisan kitin pelindung yang kebal terhadap 4 tembakan balistik pertama.
* **Cryo-Thermal Insulation (Counter Cryo):** Jika damage Cryo mendominasi, musuh yang terkena efek dingin memperoleh lonjakan adrenalin $(+25\%\text{ Speed})$ selama 1.5 detik jika tidak dibekukan total.
* **Grounding Rubber Hulls (Counter Listrik):** Jika damage Tesla mendominasi, tubuh musuh dilapisi karet penangkal listrik yang membatasi pantulan petir maksimal 1 kali lompatan.
* **Scrambler Drones (Counter Komandan):** Jika penggunaan skill aktif sangat tinggi, drone pengganggu sinyal di udara memperlambat pemulihan cooldown kemampuan komandan sebesar $-30\%$.

---

### 9.4 Tahap 4: Named Titan Boss Raids & High-Risk Defense Contracts

#### A. Named Titan Boss Raids
Menggantikan Boss generik pada milestone tertentu dengan Titan berkarakteristik dan fase tempur unik:
1. **Wave 10 — Goliath Excavator:**
   * Titan bor tektonik lapis baja berat ($4.5\times\text{ HP}$, $55\%\text{ Armor}$).
   * **Tectonic Drill:** Pada $50\%\text{ HP}$, menghujamkan bor ke tanah pangkalan, memicu gempa bumi yang melumpuhkan 2 menara kawan terdekat selama 6 detik.
   * **Rear Weak Point:** Titik lemah radiator di bagian belakang; tembakan yang mengenai dari arah belakang menghasilkan $2.0\times$ kerusakan.
2. **Wave 15 — Chrono-Weaver:**
   * Pengendali waktu biomekanik ($4.0\times\text{ HP}$, $35\%\text{ Shield}$).
   * **Temporal Rewind:** Setiap kali kehilangan $25\%\text{ HP}$, Chrono-Weaver melompat mundur $90\text{px}$ di sepanjang lintasan.
   * **Dilation Bubble & Echoes:** Memancarkan gelembung distorsi waktu yang memperlambat laju proyektil menara sebesar $-40\%$ dan membangkitkan musuh yang gugur sebagai *Chrono Echoes*.
3. **Wave 20 — Apex Swarm-Mother:**
   * Ratu koloni raksasa ($5.0\times\text{ HP}$, $30\%\text{ Armor}$).
   * **Brood Spawn:** Memuntahkan telur-telur mikro-swarm yang langsung menetas di tengah jalur.
   * **Kamikaze Flyers:** Melepaskan drone terbang berkecepatan tinggi yang menabrak menara terdekat untuk menyegelnya sementara.
   * **Berserk Enrage:** Memasuki mode amuk pada $30\%\text{ HP}$, bergerak $+35\%$ lebih cepat dengan aura resistensi kerusakan.

#### B. High-Risk Defense Contracts (Kontrak Pertahanan Opsional)
Pada fase persiapan wave, pemain dapat menandatangani kontrak militer berisiko tinggi untuk meraih imbalan masif:
* **Operation Blind Fire:** Seluruh lingkaran jangkauan menara disembunyikan dan kecepatan permainan dikunci pada $1\times$. *Imbalan:* $+250\text{ Gold}$ dan $+15\text{ Nanite Cores}$.
* **Hyper-Velocity Influx:** Musuh bergerak $+60\%$ lebih cepat, namun memiliki $-30\%\text{ Max HP}$. *Imbalan:* $+1\text{ Modular Chip}$ dan $+120\text{ Gold}$.
* **Pacifist Perimeter:** Bersihkan wave tanpa menggunakan satupun kemampuan komandan aktif $[Q, W, E, R]$. Jika kemampuan digunakan, kontrak langsung gagal. *Imbalan:* $+20\%$ bonus bunga tabungan emas akhir wave.

---

## 10. Verifikasi Kualitas & Hasil Pengujian Lengkap

Seluruh komponen diuji secara mendalam melalui 8 suite pengujian otomatis mandiri:
1. `tests/test_browser_init.js`: Inisialisasi siklus frame canvas, pemuatan aset sprite vektor, dan penanganan event browser (100% PASS).
2. `tests/test_reactions.js`: 4 Reaksi Elemen Kimia/Fisika (Thermal Shockwave, Electrolytic Detonation, Thermite Incineration, Superconductor Surge) (100% PASS).
3. `tests/test_champions.js`: Threat Director cerdas dan 4 afiks Elite Champions (Regenerator, Phase-Shifter, Avenger, Protective Dome) (100% PASS).
4. `tests/test_workshop.js`: Sistem meta-progresi Nanite Cores, 4 upgrade Workshop HQ, dan Tactical EMP Nuke (100% PASS).
5. `tests/test_map_dynamics.js`: Node Leyline interaktif, jalur flanking dinamis gelombang 8, dan barel Fuel Cell (100% PASS).
6. `tests/test_ascension.js`: Seluruh 5 tingkat Ascension Protocol, multiplier Cores, dan mutator cuaca (100% PASS).
7. `tests/test_mastery.js`: Pengujian komprehensif sistem 3.0: Power Grid, Brownout, Sector Overdrive, 3 Doktrin Komandan, 8 Skill Baru, Modular Chip Socketing, AI Living Hive Mutations, Titan Boss Raids, dan Kontrak Pertahanan (100% PASS).
8. `tests/test_sectors.js`: Pengujian komprehensif 7 Sektor Ekspedisi: integritas katalog, topologi jalur (Dual-Front Convergence), detonasi 7 hazard lingkungan, sifat iklim/biome passives, dan 3-Star Mastery + Bounties (100% PASS).
9. `tests/smoke.js`: Simulasi loop kontinu puluhan ribu frame tempur hingga wave akhir tanpa degradasi memori (100% PASS).

---

## 11. Ekspansi Multi-Sektor & Ekspedisi Peta Dinamis (Bastion TD 3.5)

### Ringkasan Fitur 7 Sektor Ekspedisi:
1. **Sektor 01: The Iron Foundry (Default / Terbuka Awal)**
   - **Topologi:** Serpentine Gauntlet (Narrow Funnel) dengan jalur flanking dinamis Gelombang 8+.
   - **Biome & Visual:** Basalt Magma & Smelting Vents (`#f97316`), partikel bara api melayang.
   - **Bahaya Lingkungan:** 2x *Fuel Cells* (Detonasi manual 450 AoE Damage + 100% Armor Shred + Kubangan Radiasi).
   - **Karakter Iklim:** *Heat Vents* (Semburan lava periodik membakar musuh).

2. **Sektor 02: Sub-Zero Abyss**
   - **Topologi:** *Dual-Front Convergence* (Dua gerbang spawn aktif serentak: Gerbang Barat & Gerbang Utara).
   - **Biome & Visual:** Glacial Permafrost & Cryo-Ice Chasm (`#38bdf8`), partikel serpihan salju/kristal es.
   - **Bahaya Lingkungan:** 2x *Cryo Nitrogen Tanks* (Detonasi manual 4.0s Flash-Freeze + Brittle + 180 Cryo Damage).
   - **Karakter Iklim:** *Frozen Slipstream* (Kecepatan musuh +15%, namun semua damage Brittle/Cryo diamplifikasi +50%).

3. **Sektor 03: Toxic Bio-Quarantine**
   - **Topologi:** *Split Switchback with Bio-Tunnel Flank* (Jalur berliku sempit melintasi rawa asam).
   - **Biome & Visual:** Acid Sludge & Bio-Hazard Waste (`#a3e635`), partikel spora bio-luminescent.
   - **Bahaya Lingkungan:** 2x *Unstable Spore Pods* (Detonasi manual 2.5s Reverse Confusion / musuh berbalik arah + 150 Acid Damage).
   - **Karakter Iklim:** *Corrosive Acid Runoffs* (Asam mengikis 15% armor musuh secara berkelanjutan tiap detik).

4. **Sektor 04: Orbital Sky-Spire**
   - **Topologi:** *Concentric Inward Spiral to Central Core* (Pusaran melingkar rapat menuju reaktor tengah).
   - **Biome & Visual:** Deep Space Void & Anti-Grav Platform (`#818cf8`), lantai hexagonal grid dan partikel debu kosmik.
   - **Bahaya Lingkungan:** 2x *Overcharged Tesla Pylons* (Detonasi manual 350 Chain Lightning ke 8 target + Total Shield Wipeout).
   - **Karakter Iklim:** *Void Gravity* (20% kemungkinan proyektil balistik melempar musuh non-boss jatuh ke hampa udara).

5. **Sektor 05: Sunken Dunes**
   - **Topologi:** *Canyon Double-Fork around Ancient Sunken Relic* (Jalur bercabang canyon mengitari monolit kuno).
   - **Biome & Visual:** Sandstone Canyon & Ancient Sunken Relic (`#eab308`), partikel badai pasir gurun.
   - **Bahaya Lingkungan:** 2x *Relic Sun Monoliths* (Detonasi manual 400 True Damage Solar Beam + Thermite Burn).
   - **Karakter Iklim:** *Quicksand Drift* (Musuh melambat 15% di pasir; debu badai memotong jarak tembak tower 10% kecuali berada di Leyline Sensor).

6. **Sektor 06: Neon Cyber-Metropolis**
   - **Topologi:** *Multi-Lane Skyway & Express Overpass* (Jalan layang tol ganda berkecepatan tinggi).
   - **Biome & Visual:** Cyberpunk Skyway & Neon Highway Grid (`#06b6d4`), partikel paket data digital berpendar.
   - **Bahaya Lingkungan:** 2x *EMP Security Terminals* (Detonasi manual 3.5s Global Area Stun + Total Shield Strip).
   - **Karakter Iklim:** *Overclocked Grid* (Kapasitas Power Grid +15 MW menjadi 75 MW dasar; cooldown skill komandan 15% lebih cepat).

7. **Sektor 07: Abyssal Trench**
   - **Topologi:** *Deep Oceanic Chasm with Stepped Trenches* (Palung laut dalam bercabang dengan tekanan tinggi).
   - **Biome & Visual:** Deep Oceanic Navy & Hydro-Thermal Vents (`#2dd4bf`), partikel gelembung hidrotermal naik ke permukaan.
   - **Bahaya Lingkungan:** 2x *Hydrothermal Geysers* (Detonasi manual 300 Cryo Damage + 2.0s Knockup Stun + Kubangan Air Lambat 6 detik).
   - **Karakter Iklim:** *Depth Hydro-Pressure & Conductivity* (Armor dasar musuh +10%; air laut membuat petir Tesla Coil memantul ke +2 target tambahan).

---

## 12. Sistem 3-Star Sector Mastery & Ekspedisi Dossier

### Skema Bintang Tantangan Tiap Sektor:
- **Bintang 1 (Sector Clearance):** Selesaikan Wave 20 di sektor tersebut (+25 Nanite Cores).
- **Bintang 2 (Flawless Perimeter):** Selesaikan Wave 20 tanpa kehilangan satu pun nyawa / Perfect Lives (+35 Nanite Cores).
- **Bintang 3 (Ascended Mastery):** Selesaikan Wave 20 pada tingkat kesulitan Ascension 2 atau lebih tinggi (+50 Nanite Cores).
- **Total Hadiah:** Hingga **+770 Nanite Cores** yang dapat digunakan untuk upgrade permanen di Workshop HQ.

### Tampilan Sector Dossier (Menu Utama):
- **Bar Tab Interaktif:** 7 tombol tab sektor dengan status terkunci/terbuka, bintang tantangan, dan warna aksen bioma.
- **Holographic Radar Mini-Map:** Menggambar sketsa visual radar miniatur jalur konvergensi, titik spawn, reaktor inti, dan posisi Leyline secara real-time.
- **Intelijen Bioma & Iklim:** Rangkuman detail topologi, bahaya lingkungan, dan efek iklim aktif.
- **Daftar Target Bintang:** Status pencapaian bintang 1-3 dengan indikator hadiah Cores secara visual.

---

## 13. Audit Kualitas & Perbaikan Bug Sistemik

Telah dilakukan audit komprehensif terhadap seluruh file JavaScript, styling CSS, dan struktur HTML. Ditemukan dan diperbaiki 6 masalah kritis:

1. **Perbaikan Hitungan Musuh Wave Card (`s.count` NaN Bug - [`js/ui.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/ui.js#L233)):**
   - Sebelumnya `ev.forEach(s => cnt[s.type] = (cnt[s.type] || 0) + s.count);` menghasilkan `NaN` karena spawn list individu tidak memiliki properti `s.count`. Akibatnya semua badge musuh di preview wave menampilkan `×NaN` dan tag musuh (`STEALTH`, `CARRIER`, `BREACHER`, dll.) tidak pernah muncul.
   - Diperbaiki menjadi `(cnt[s.type] || 0) + (s.count || 1);` sehingga jumlah musuh dan tag peringatan ancaman tampil akurat.

2. **Penambahan Suara Synthesizer `'freeze'` ([`js/audio.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/audio.js#L9-L60)):**
   - Detonasi Cryo Nitrogen Tank memanggil `Sfx.play('freeze')`, namun sebelumnya `Sfx.play()` belum memiliki kasus `'freeze'` sehingga hening.
   - Ditambahkan sintesis audio Flash-Freeze (kristalisasi nada tinggi + white noise burst) dan gap rate-limit 200ms.

3. **Tombol Navigasi Kembali ke Sector Dossier Menu ([`js/ui.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/ui.js#L656), [`js/main.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/main.js#L129)):**
   - Layar Game Over dan Victory sebelumnya hanya memiliki opsi "Play Again" (memulai ulang peta yang sama) dan "Workshop HQ", sehingga pemain terjebak tidak bisa kembali memilih sektor lain tanpa me-refresh browser.
   - Ditambahkan tombol `Sector Dossier` (`data-ov="to_menu"`) untuk kembali ke menu ekspedisi kapan saja.

4. **Navigasi Cepat Topbar Chip Sektor ([`index.html`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/index.html#L21), [`js/main.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/main.js#L87), [`css/style.css`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/css/style.css#L216)):**
   - Mengklik chip `#chipSector` pada header permainan kini langsung membuka menu Sector Dossier untuk melihat status peta dan tantangan bintang.

5. **Pengembalian Chip Modular Saat Menara Dijual ([`js/towers.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/towers.js#L187)):**
   - Menara yang telah dipasangi Modular Chip kini secara otomatis mengembalikan seluruh chip yang terpasang ke inventaris pemain saat dijual (`addChip`), mencegah hilangnya chip langka.

6. **Proteksi Nilai Aman NaN & Bound Spawning Koordinat ([`js/state.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/state.js#L254), [`js/enemies.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/enemies.js#L20), [`js/ui.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/ui.js#L437)):**
   - Guard default `(e.armor || 0)`, `(e.shred || 0)`, dan `(e.brittle || 0.35)` di `dealDamage` untuk mencegah kontaminasi `NaN` ke HP musuh.
   - Clamping koordinat radar mini-map dan proteksi spawn breach jika `PATH_BREACH` kosong.

---

## 14. Tahap 13: Eksekusi Penuh Addictive Loop & Super-Weapon Fusions (Bastion TD 4.0)

Berdasarkan blueprint yang telah disetujui pengguna ([`bastion_td_addictive_loop_blueprint.md`](file:///C:/Users/User/.gemini/antigravity/brain/3483d84c-61da-4d36-985d-fb72d3571a51/bastion_td_addictive_loop_blueprint.md)), seluruh 5 pilar adiktif dieksekusi secara terintegrasi:

### 14.1 Pilar 1: Sistem Risk-and-Reward Ekstrem
1. **Adrenaline Multi-Wave Calling Streak:**
   - Memanggil gelombang lebih awal saat gelombang sebelumnya masih aktif meningkatkan *Streak Multiplier* hingga 4x (`G.callStreak`).
   - Memberikan bonus hingga +120% Gold per kill dan +150% Score per kill selama 15 detik, disertai efek visual perbatasan layar emas menyala (*Adrenaline rush screen border*).
2. **Reactor Core Overload Gamble ($[V]$ / `#btnOverload`):**
   - Menekan tombol Overload melipatgandakan kecepatan tembak seluruh menara sebesar **+250% (3.5x fire rate)** selama 8 detik.
   - Selesai durasi Overload, reaktor masuk ke masa *Brownout Meltdown Hangover* selama 12 detik di mana kecepatan tembak terpotong -50% (0.5x fire rate), menuntut timing presisi dari pemain.
3. **Cursed Black Market Protocols:**
   - Protokol terlarang ditawarkan di Terminal Pasar Gelap pada akhir Wave 5, 10, dan 15:
     * `blood_pact`: +200% Gold dari setiap eliminasi musuh, tetapi 1 kebocoran musuh langsung memicu kekalahan instan.
     * `glass_singularity`: Semua serangan menara 100% Critical Hit, namun musuh meledak mengeluarkan gelombang EMP yang melumpuhkan menara ramah sejauh 85px selama 2 detik.
     * `tachyon_overclock`: Railgun menembak 3.5x lebih cepat dengan daya tembus tak terbatas, namun kehilangan 5 Gold jika sebuah tembakan gagal mengeliminasi target.
     * `entropy_conduit`: Kapasitas grid daya menjadi tak terbatas (9999 MW), namun tidak ada hadiah Gold pasif saat membersihkan wave.

### 14.2 Pilar 2: Anomali Medan Tempur Interaktif (Live Field Anomalies)
Objek dinamis yang jatuh ke medan perang dan dapat diinteraksikan secara langsung di atas canvas:
1. `supply_drop`: Kargo jatuh dengan 120 HP. Pemain harus mengkliknya beberapa kali untuk membuka hadiah +160 Gold & +10 Nanite Cores sebelum waktu 20 detik habis.
2. `ion_thunderstrike`: Retikel peringatan orbital yang berdetik selama 3.5 detik. Saat meledak, menembus perisai dan melancarkan 1500 AoE Energy Damage ke seluruh musuh di dalamnya.
3. `smuggler_drone`: Drone penyelundup yang melayang melintasi medan tempur. Mengkliknya langsung membuka terminal Cursed Black Market.
4. `chrono_rift`: Vorteks gravitasi yang memperlambat laju musuh sebesar 70% di area pusaran selama 7.5 detik.

### 14.3 Pilar 3: Super-Weapon Synergy Fusions
Penggabungan dua menara Tier 3 yang berdampingan menjadi Senjata Super Apex:
1. **Hellfire Rotary Cannon (`fusion_hellfire`):**
   - Resep: Gatling T3 + Plasma T3 (Biaya: 180G).
   - Efek: Tembakan autocannon berkecepatan tinggi yang meremukkan armor musuh dan membakar tanah menjadi kubangan magma panas bertahan lama.
2. **Death-Ray Discharger (`fusion_deathray`):**
   - Resep: Railgun T3 + Tesla T3 (Biaya: 220G).
   - Efek: Sinar laser ionik piercing selebar medan tempur yang menyambar seluruh musuh sebaris dengan petir berantai simultan.
3. **Absolute Zero Core (`fusion_zero`):**
   - Resep: Cryo T3 + Relay T3 (Biaya: 160G).
   - Efek: Generator permafrost dingin abadi yang menyuplai **+50 MW Clean Power** ke grid dan secara periodik menghentikan waktu musuh (*Global Absolute Freeze*).
4. **Antimatter Obliterator (`fusion_antimatter`):**
   - Resep: Plasma T3 + Railgun T3 (Biaya: 240G).
   - Efek: Peluru singularitas gravitasi yang menyedot musuh di sekitarnya dan langsung mengeksekusi musuh dengan HP di bawah 25%.

### 14.4 Pilar 4: Hivemind Adaptif & Counter-Traits
Living Hive kini secara dinamis mengembangkan counter-trait spesifik sesuai pola kerusakan pemain:
- `reflective`: 25% pantulan proyektil kembali ke area sekitar jika pemain bias serangan fisik.
- `insulated`: Kebal terhadap efek freeze dan slow cryo.
- `carbon_weave`: 50% ketahanan terhadap serangan berenergi/laser.
- `spore_mortar`: Menembakkan spora perusak ke menara ramah saat musuh tereliminasi.

### 14.5 Pilar 5: Classified Tech Codex & Archive ($[C]$ / `#btnCodex`)
- Modal arsip holografik berdesain *cyberpunk* yang melacak 19 entri rahasia (4 Super-Weapons, 4 Cursed Protocols, 4 Field Anomalies, Titan Bosses, dan Reaksi Elemen).
- Setiap entri yang baru pertama kali ditemukan di dalam pertempuran memberikan hadiah **+15 Nanite Cores** dan mencatat status penemuan secara persisten di `localStorage`.

---

## 15. Bastion TD 5.0: Deep Interconnected Synergy Matrix & Adaptive Systems

Mengintegrasikan lima pilar mekanik baru yang saling terhubung erat (*interconnected systems*), di mana setiap keputusan penempatan menara, manajemen energi, pembersihan lingkungan, dan pemilihan protokol taktis saling mempengaruhi kalkulasi medan tempur secara dinamis:

### 15.1 Pilar 1: Topologi Grid & Konduit Sinar Resonansi (Resonance Beam Conduits)
* **Koneksi Garis Pandang Relai:** Fission Relay yang ditempatkan segaris (*collinear/unobstructed line-of-sight*) dengan menara lain dalam radius $\le 4.5$ petak secara otomatis membentuk konduit laser aktif permanen.
* **Tipe Konduit Laser:**
  1. `ion_plasma` (Relay $\leftrightarrow$ Tesla): Sinar busur petir berkecepatan tinggi yang menyambar target di jalurnya (contact DPS) dan menyebarkan lonjakan listrik ke musuh terdekat.
  2. `stasis_line` (Relay $\leftrightarrow$ Cryo): Sinar laser kriogenik yang membekukan musuh yang memotong garis, menerapkan 55% slow dan 25% Brittle amplification.
  3. `sensor_wire` (Relay $\leftrightarrow$ Gatling): Kawat sensor kinetik yang mengekspos unit stealth dan merobek (*shred*) armor musuh secara berkelanjutan.
  4. `incinerator_beam` (Relay $\leftrightarrow$ Plasma): Berkas plasma panas tinggi yang membakar musuh dan membersihkan creep biomassa.
  5. `hyper_bridge` (Relay $\leftrightarrow$ Super-Weapon): Mempercepat laju tembak senjata super sebesar +20% dan mengurangi produksi panas sebesar 25%.
  6. `singularity_cord` (Relay $\leftrightarrow$ Relay): Menghubungkan dua relai untuk memperluas jangkauan transmisi energi grid.
* **Pembersihan Biomassa:** Sinar laser konduit yang melintasi petak tanah yang terinfeksi biomassa akan membakar dan membersihkannya secara otomatis (*cleansing*), sekaligus memberikan bonus salvage +3 Gold.

### 15.2 Pilar 2: Termodinamika & Jaringan Pertukaran Panas (Thermodynamics Network)
* **Akumulasi Panas (Heat Gauge):** Setiap menara menghasilkan panas saat menembak (0–100%). Menara yang mencapai $\ge 100\%$ mengalami *Overheat Throttle* yang memangkas laju tembak sebesar -40% hingga suhu turun di bawah 50%.
* **Pendinginan Pasif Kriogenik:** Menara Cryo yang ditempatkan berdampingan (*adjacent orthogonally*) memberikan transfer pendinginan konduktif, melipatgandakan laju disipasi panas menara di sekitarnya.
* **Thermal Steam Purge ($[H]$ / Tombol Purge):** Kemampuan aktif komandan darurat untuk mengosongkan seluruh akumulasi panas menara seketika, melepaskan ledakan uap mendidih (*boiling steam blast*) ke seluruh canvas yang melukai seluruh musuh di layar.

### 15.3 Pilar 3: Biomassa Hidup & Pilon Spora Musuh (Living Biomass Creep & Spore Spires)
* **Penyebaran Creep:** Musuh bertipe Brute, Healer, dan Carrier yang tewas akan meninggalkan tumpahan lendir organik (*Biomass Creep*) selama 25 detik.
* **Pengaruh Lingkungan:**
  - Musuh yang melintas di atas creep mendapatkan akselerasi kecepatan gerak sebesar **+30%**.
  - Menara pertahanan yang terjerat creep mengalami penalti laju tembak sebesar **-25%**.
* **Spore Spires (Wave 7+):** Pilon biomassa parasitik yang tumbuh di petak tepi medan tempur. Spora ini menembakkan mortir lendir ke menara pemain dan memancarkan gelombang penyembuh ke musuh di sekitarnya.
* **Interaksi Pemain:** Pemain dapat mengklik langsung Spore Spire untuk merusaknya. Menghancurkan Spore Spire memberikan hadiah taktis **+45 Gold & +5 Nanite Cores**.

### 15.4 Pilar 4: Matriks Protokol Taktis In-Run (Tactical Protocol Matrix - $[T]$)
* **Ekonomi TPP (Tactical Protocol Points):** Pemain mendapatkan poin TPP selama pertempuran melalui:
  - Flawless Wave Clear: +1 TPP
  - Mengeliminasi Elite Champion: +1 TPP
  - Mengeliminasi Titan Boss: +2 TPP
* **Cabang Spesialisasi:**
  1. *Warfare Overclock:*
     - Tier 1: `sabot_pierce` (+20% Armor Shred, +15% Physical Damage).
     - Tier 2: `critical_cascade` (Serangan kritikal memicu ledakan sekunder berantai).
     - Tier 3: `execution_protocol` (Menara langsung mengeksekusi musuh non-boss di bawah 15% HP).
  2. *Grid Architecture:*
     - Tier 1: `prism_beam_width` (Memperlebar diameter konduit laser resonansi sebesar 80% dan meningkatkan DPS +50%).
     - Tier 2: `zero_point_relay` (+20 MW kapasitas tambahan per Fission Relay dan imunitas brownout).
     - Tier 3: `superconductor_conduit` (Menara yang terhubung konduit memperoleh imunitas penuh terhadap efek EMP musuh).
  3. *Logistics & Recon:*
     - Tier 1: `contraband_scavenger` (Menggandakan drop Nanite Cores dari Elite dan Spore Spire).
     - Tier 2: `thermal_purge_turbo` (Mengurangi waktu cooldown Thermal Steam Purge sebesar 35%).
     - Tier 3: `emergency_blackout` (Saat nyawa pangkalan $\le 6$, seketika melepaskan EMP grid global yang melumpuhkan seluruh musuh selama 3.5 detik).

### 15.5 Pilar 5: AI Bos Nemesis Dinamis & Adaptif
* **Wave 10 Goliath Excavator:** Menancapkan pilar seismik (*Seismic Pillars* berkekuatan 450 HP) di medan tempur yang menghalangi garis pandang (*line-of-sight*) tembakan menara ramah, memaksa pemain mengklik atau menembak pilar tersebut untuk membuka kembali koridor tembak.
* **Wave 15 Chrono-Weaver:** Menghadapi menara kriogenik dengan membalikkan efek dingin (*Time Inversion*); saat dibekukan atau diperlambat, Chrono-Weaver mengubah efek tersebut menjadi lonjakan akselerasi kecepatan temporal.
* **Wave 20 Apex Swarm-Mother (Phase 2):** Ketika HP berada di bawah 50%, Apex Mother secara aktif memangsa petak-petak creep biomassa di sekitarnya untuk meregenerasi HP-nya (+80 HP per petak creep yang dikonsumsi).

---

## 16. Hasil Verifikasi, Audit Menyeluruh & Realisasi Efek (*Reality Check*)

Dilakukan audit mendalam terhadap seluruh data statis dan logika game untuk memastikan **100% efek tidak hanya berupa deskripsi teks (*text-only placebo*)**, melainkan memiliki implementasi nyata di canvas, kalkulasi damage, dan runtime game loop:

### 16.1 Temuan & Perbaikan Audit Realisasi Efek:
1. **`command_protocol` (Workshop HQ Upgrade):**
   - *Sebelum:* Peningkatan dibeli dengan 30 Cores namun variabelnya tidak dipanggil di game loop.
   - *Sesudah:* Diimplementasikan nyata di [`js/waves.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/waves.js) (memberikan akselerasi pemulihan cooldown semua skill sebesar **+25%**) dan di [`js/input.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/input.js) (ketika skill slot ke-4 $[R]$ diaktifkan, memancarkan gelombang pulsa EMP sekunder dari markas yang mengikis 50% perisai musuh dan melumpuhkan musuh selama 1.2 detik).
2. **`entropy_conduit` (Cursed Black Market Protocol):**
   - *Sebelum:* Memberikan kapasitas grid tak terbatas (9999 MW) dan overdrive permanen, namun penalti ubin radiasi periodik belum diaktifkan.
   - *Sesudah:* Diintegrasikan ke loop pertempuran di [`js/waves.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/waves.js) di mana setiap 14 detik ubin radiasi meledak menyambar menara acak kawan dengan efek panas +35 Heat dan disrupsi EMP 3.0 detik.
3. **`spore_mortar` (Reactive Hive Counter-Trait):**
   - *Sebelum:* Musuh bermutasi dengan sifat `spore_mortar` namun saat mati tidak melancarkan tembakan balasan.
   - *Sesudah:* Diimplementasikan di [`js/state.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/js/state.js) di mana musuh dengan trait ini yang tereliminasi akan memuntahkan mortir spora korosif ke menara terdekat dalam radius 140px, melumpuhkan menara selama 2.5s dan mencemari petak tersebut dengan lendir biomassa.

### 16.2 Hasil Pengujian Otomatis (13 Rangkaian Test Suites Lulus 100%):
1. `tests/audit_bugs.js`: **0 inkonsistensi statis** (39 efek suara terhubung, 25 aksi UI, 30 elemen DOM HTML tervalidasi).
2. `tests/test_effects_realization.js`: **Lulus 100%** menguji realisasi nyata Command Protocol [R], Entropy Conduit periodic radiation, dan Spore Mortar retaliation.
3. `tests/smoke.js`: Lulus simulasi penuh 20 wave.
4. `tests/test_deep_synergy.js`: **Lulus 100%** menguji seluruh 5 pilar Bastion TD 5.0 (Resonance Beams, Thermodynamics, Creep, TPP Matrix, Nemesis Boss AI).
5. `tests/test_overdrive_fusions.js`: Lulus 100% sistem fusi 4 senjata super dan anomali medan tempur.
6. `tests/test_sectors.js`: Lulus 100% validasi 7 sektor ekspedisi peta.
7. `tests/test_mastery.js`: Lulus 100% doktrin komandan, power grid, dan modular chip sockets.
8. `tests/test_champions.js`: Lulus 100% adaptive threat director dan afiks champion.
9. `tests/test_map_dynamics.js`: Lulus 100% rute pergerakan dinamis dan leyline nodes.
10. `tests/test_ascension.js`: Lulus 100% ascension protokol 0–5.
11. `tests/test_reactions.js`: Lulus 100% empat kombo reaksi elemen.
12. `tests/test_workshop.js`: Lulus 100% pohon meta-upgrade Markas & Nanite Cores.
13. `tests/test_browser_init.js`: Lulus 100% render canvas 60 FPS dan inisialisasi browser.

---

## 17. Panduan Unggah ke GitHub

### Perintah Unggah (Terminal Pengguna):
```powershell
# 1. Masukkan semua perubahan ke staging
git add .

# 2. Periksa status
git status

# 3. Lakukan commit perubahan Bastion TD 6.0: The Living Paradox & Reality Manipulation
git commit -m "feat(v6.0): implement living paradox, 4D chrono rewind, neural synapses, nanite necromancy, tectonic shifting, and infiltrator syndicate"

# 4. Hubungkan ke repository GitHub Anda (jika belum)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# 5. Unggah ke branch main
git push -u origin main
```

---

## 18. Tahap 7: Bastion TD 6.0 — The Living Paradox & Reality Manipulation

### 18.1 Filosofi Anti-Klise (*Out-of-the-Box Systems*)
Menolak formula Tower Defense klise (seperti angka statik "+10% damage" atau gelombang endless monoton), Bastion TD 6.0 merevolusi alur permainan dengan sistem manipulasi realitas dinamis, rekayasa biologi bangkai alien, perkawinan silang sistem syaraf menara, manipulasi tektonik medan tempur, dan intervensi faksi ketiga independen.

### 18.2 Rincian Lima Pilar Mekanik Radikal:
1. **Chrono-Echo Splicer & Quantum Paradox Loop (`[Z]` / `#btnChrono`):**
   * Perangkat Tachyon Splicer merekam riwayat pertempuran setiap 0.1 detik (`recordTimeSnapshot()`).
   * Menekan tombol `[Z]` atau tombol topbar `#btnChrono` memutar mundur waktu 5 detik ke masa lalu: nyawa markas dipulihkan, gold dikembalikan, dan musuh mundur ke koordinat lampau.
   * **Ghost Echoes:** Menara dari masa lalu memproyeksikan siluet holografik cyan di garis waktu baru yang menembakkan laser masa lalu secara simultan bersama menara aktif.
   * **Paradox Entropy & Reality Fracture:** Setiap pemutaran waktu menambah entropi paradoks (+35%). Jika mencapai 100%, terjadi retakan realitas yang memunculkan **Chrono-Horror** yang kebal proyektil fisik (*Void Physical Immunity*) dan hanya bisa dirusak laser resonansi/energi.
2. **Tectonic Mag-Lev Shifting (Terraforming Rute Real-Time):**
   * Diaktifkan melalui `[Shift + Scroll]` pada ubin medan tempur (`triggerTectonicShift(col, row)`).
   * Memicu denyut kinetik mag-lev dalam radius 2.5 ubin: musuh terpelanting mundur sepanjang rute (*Centrifuge Loop Trap*).
   * Musuh ber-HP rendah (< 25%) langsung terhisap jatuh ke jurang kehampaan (*Kinetic Void Chasm Drop*).
   * Musuh Titan/Breacher beradaptasi dengan menancapkan pasak seismik pembatas lempeng (*Tectonic Spikes*).
3. **Reclaimed Nanite Necromancy (Bangkai Musuh Jadi Barikade Hidup):**
   * Setiap alien yang gugur meninggalkan bangkai biologis yang persisten (`G.corpses`) dengan indikator dekomposisi hijau.
   * Pemain dapat mengklik bangkai tersebut untuk mereklamasi nanit (`reclaimCorpse(idx)`):
     - **Bangkai Brute $\rightarrow$ Colossus Bastion:** Menjadi barikade fisik berlapis baja (850 HP) yang secara fisik menghentikan laju alien dan memaksa mereka menyerang patung pelindung terlebih dahulu.
     - **Bangkai Carrier $\rightarrow$ Nanite Drone Hive:** Memunculkan sarang drone pemburu bunuh diri sekutu.
     - **Bangkai Healer $\rightarrow$ Bio-Shield Emitter:** Memancarkan kubah penangkal EMP untuk membersihkan menara kawan.
4. **Neural-Link Synapse Network (Sistem Syaraf Simbiotik Menara):**
   * Menghubungkan dua menara kawan menggunakan serat sinapsis neon magenta-cyan (`[N]` atau klik tombol di Tactical Inspector).
   * Menghasilkan perkawinan silang karakteristik senjata (*Weapon Hybridization*):
     - **Gatling + Rail:** Gatling memperoleh proyektil penembus (*Kinetic Piercing* +2 target di belakang sasaran), sedangkan Railgun memperoleh akselerasi kinetik (+45% kecepatan tembak/spinup).
     - **Cryo + Plasma:** Semburan Cryo meninggalkan genangan *Thermonuclear Frost* yang langsung memicu ledakan gelombang kejut termal (*Thermal Shockwave*).
     - **Tesla + Relay:** Sambaran petir merambat melalui seluruh konduit laser resonansi di peta (*Conduit Perimeter Lightning*).
5. **The Infiltrator Syndicate (Faksi Ketiga Netral / Pemburu Bayaran):**
   * Pada Wave 6, 12, dan 18, Gunship Tentara Bayaran netral mendarat di langit sektor pertempuran.
   * **Bribe (Suap 120 Gold):** Gunship menjadi sekutu bersenjata yang menghujani alien dengan salvo roket pandu setiap 1.2 detik.
   * **Raid (Serang & Jarah):** Menandai gunship sebagai musuh. Menghancurkan gunship menghadiahkan **+220 Gold**, **+30 Nanite Cores**, dan Modular Chip Terlarang **Quantum Singularity Core**.
   * **Ignore (Abaikan):** Tentara bayaran mengekstraksi 20% drop gold dari alien di dekatnya.

### 18.3 Validasi Kualitas & Keandalan (14 Test Suites Lulus 100%):
* `tests/test_paradox_reality.js`: **100% PASS** menguji seluruh fitur 6.0: 4D Time Rewind, Ghost Echoes, Chrono-Horror Void Immunity, Nanite Necromancy Colossus Path Blocking, Synapse Cross-Breeding, Syndicate Bribe/Raid, dan Tectonic Mag-Lev Shifting.
* Seluruh 14 test suites (`audit_bugs.js`, `smoke.js`, `test_ascension.js`, `test_browser_init.js`, `test_champions.js`, `test_deep_synergy.js`, `test_effects_realization.js`, `test_map_dynamics.js`, `test_mastery.js`, `test_overdrive_fusions.js`, `test_paradox_reality.js`, `test_reactions.js`, `test_sectors.js`, `test_workshop.js`) **lulus serentak dengan 0 error & 0 regresi**.

---

## 19. Bastion TD 7.0: The Grand Expedition & Titan Mech Warfare

### 19.1 Transformasi 4 Dimensi Gameplay
Sesuai cetak biru grand ekspansi yang disetujui pada [`bastion_td_grand_expansion_blueprint.md`](file:///c:/Users/User/.gemini/antigravity/brain/3483d84c-61da-4d36-985d-fb72d3571a51/bastion_td_grand_expansion_blueprint.md), Bastion TD 7.0 mengimplementasikan ekspansi menyeluruh pada 4 pilar utama:

```
+-------------------------------------------------------------------------------------------------------+
|                                    BASTION TD 7.0 ARSITEKTUR 4 DIMENSI                                |
+-----------------------------------+-----------------------------------+-------------------------------+
| 1. KOMPLEKSITAS (Deep Matrix)     | 2. ADIKTIF (Roguelite Loops)      | 3. ADAPTIF (AI & Market)      |
| • Cyber-Logic IF-THEN Matrix      | • Anomaly Vault Expeditions       | • Wartime Supply-Demand Market|
| • Shield Annihilator priority     | • Exotic Alien Relic Boons        | • AI Blindspot Drop-Pods      |
| • Auto-Heat Regulator throttling  | • Tungsten Ricochet / Berserker   | • Phalanx Shield Formations   |
+-----------------------------------+-----------------------------------+-------------------------------+
|                                    4. FAKTOR 'KEREN' (Spectacle Fantasy)                              |
| • Titan Combat Mech Pilot Mode [Tab]: WASD thrusters, Vulcan autocannon, Thermal Blade cleave [Space] |
| • Orbital Dreadnought "Aegis Prime": Tungsten Rods from God kinetic strike & Molten Cratering        |
+-------------------------------------------------------------------------------------------------------+
```

### 19.2 Rincian Fitur Utama Versi 7.0:
1. **Titan Combat Mech Pilot Mode (`[Tab]` / `#btnMechPilot`):**
   * Pemain dapat langsung menerjunkan dan mengendalikan Mech Tempur Titan bipedal raksasa di atas grid medan tempur.
   * **Kontrol Manual:**
     - `[W, A, S, D]`: Pendorong manuver berkecepatan 155 px/detik dengan animasi langkah kaki bipedal dan hentakan audio (`mech_step`).
     - `[Mouse Aim & Left Click]`: Mengarahkan kubah torsi secara independen dan menembakkan Vulcan Autocannon 30mm kaliber berat ke titik kursor (`mechFireVulcan()`, suara `mech_vulcan`).
     - `[Spacebar]`: Mengayunkan Pedang Termal raksasa (*Thermal Blade Cleave*, suara `mech_blade`) dengan busur api oranye-putih yang membelah seluruh gerombolan musuh dalam radius 82 px (360 damage area).
     - `[Tab]`: Masuk / keluar kokpit mech ke mode siaga (*Standby Autonomous Mode*).
   * **Baterai & Pengisian Ulang Pangkalan (Dock Recharge):** Baterai mech berkurang perlahan saat aktif. Memarkir mech di dekat Markas Utama (`BASE_PT`) memicu pengisian daya cepat (+18%/s) dan perbaikan lambung baja (+60 HP/s).
   * **Cockpit HUD Visor:** Menampilkan panel kaca futuristik di layar bawah lengkap dengan gauge Hull Integrity, Power Cell Battery, dan cooldown Thermal Blade.

2. **Orbital Dreadnought "Aegis Prime" Super-Strike (`#btnDreadnought`):**
   * Meteran energi orbital terisi otomatis dari setiap eliminasi musuh (+0.8%) dan pembersihan wave (+15%).
   * Saat terisi 100%, pemain dapat mengaktifkan serangan apokaliptik dari kapal induk antariksa di stratosfer:
     - Langit menggelap tertutup siluet lambung kapal raksasa sepanjang layar.
     - Raungan sirene udara raksasa menggema melalui Web Audio API (`dreadnought_horn`).
     - **Kinetic Tungsten Rods ("Rods from God"):** Tiga pilar tungsten hipersonik meluncur dari orbit menuju titik konsentrasi musuh, meledak dengan guncangan layar masif (`orbital_impact`, shake 22), menghasilkan 720 AoE plasma damage + 2.5s stun.
     - Meninggalkan kawah berapi (*Molten Kinetic Craters*) yang menyala di tanah selama 12 detik, memberikan burn DoT konstan kepada musuh yang melintas.

3. **Anomaly Vault Expeditions & Exotic Relic Boons:**
   * Setiap 4 wave (Wave 4, 8, 12, 16...), sebuah celah dimensi terbuka dan pemain dihadapkan pada 3 pilihan gerbang Vault:
     - **Precursor Relic Vault:** Menghadiahkan artefak alien eksotik permanen:
       - `tungsten_ricochet`: Seluruh tembakan balistik memantulkan jejak peluru ke 2 musuh di sekitarnya (70% damage).
       - `berserker_core`: Menjamin seluruh tembakan menghasilkan critical hit dengan pengali kerusakan 1.5x.
       - `nanite_catalyst`: Menghadiahkan ekstra +4 Gold dari setiap kill dan meningkatkan kecepatan tembak menara sekitar.
       - `quantum_capacitance`: Menambah pasokan daya jaringan pangkalan secara gratis (+35 MW).
     - **Nanite Infestation Chamber (Hazard Vault):** Membasmi sarang monster volatile untuk memanen instan **+350 Gold** dan **+75 Nanite Cores**.
     - **Syndicate Black Market Sanctum:** Mengorbankan 4 nyawa markas demi mendapatkan 2 Modular Chip Terlarang.

4. **Cyber-Logic Automation Matrix (Pemrograman Perilaku Menara):**
   * Tersedia di Tactical Inspector untuk seluruh menara Tier II+ dan Super-Weapon Fusions.
   * Preset Logika Otomasi:
     - `Logic: Shield Annihilator` (`shield_buster`): Secara cerdas mendeteksi dan mengunci musuh yang memiliki perisai energi $> 100$, mengabaikan urutan jalur standar.
     - `Logic: Auto-Heat Regulator` (`thermal_vent`): Otomatis membatasi laju tembakan saat suhu panas mencapai $> 75\%$ dan menyemburkan uap pendingin aktif (-25 heat/detik) guna mencegah overheat blackout.
     - `Logic: Apex Predator Lock` (`titan_lock`): Mengunci 100% fokus tembakan hanya pada musuh Champion atau Titan Boss di dalam jangkauan.

5. **Wartime Supply-Demand Market & AI Blindspot Drop-Pods:**
   * **Ekonomi Pasar Dinamis:** Jika pemain membangun $\ge 3$ menara dengan tipe yang sama, pasar mengalami kelangkaan suku cadang (+15% kenaikan harga untuk setiap menara tambahan). Sebaliknya, tipe senjata yang tidak digunakan diberikan subsidi diskon anti-monotoni sebesar -15%.
   * **Inkursi Drop-Pod:** Mulai Wave 7, AI Director mendeteksi titik buta pertahanan pemain dan meluncurkan drop-pod taktis bergaris merah dari langit yang mendarat di belakang garis depan untuk mengerahkan pasukan penyerbu elit.

### 19.3 Hasil Uji Mutu & Verifikasi Komprehensif (15 Test Suites 100% Lulus):
* Telah dibuat rangkaian pengujian unit baru [`tests/test_grand_expansion.js`](file:///d:/PROJEK%20COBA%20COBA/bastion-td/tests/test_grand_expansion.js) yang memvalidasi seluruh fungsionalitas 7.0 secara end-to-end.
* **Hasil Eksekusi 15 Test Suites Keseluruhan:**
  1. `tests/smoke.js` -> **PASS** (Simulasi 20 wave penuh 0 crash)
  2. `tests/test_workshop.js` -> **PASS** (Meta-progression & Nanite Cores)
  3. `tests/test_ascension.js` -> **PASS** (Pact of Punishment Ascension 0-5)
  4. `tests/test_sectors.js` -> **PASS** (7 Sektor & Iklim Medan Tempur)
  5. `tests/test_mastery.js` -> **PASS** (Power Grid, Doktrin, Titan Bosses)
  6. `tests/test_map_dynamics.js` -> **PASS** (Leylines, Interactive Fuel Cells)
  7. `tests/test_overdrive_fusions.js` -> **PASS** (Super-Weapons & Overdrive)
  8. `tests/test_champions.js` -> **PASS** (Threat Director & Affixes)
  9. `tests/test_reactions.js` -> **PASS** (4 Reaksi Elemental)
  10. `tests/test_deep_synergy.js` -> **PASS** (5 Pilar Sinergi Mendalam)
  11. `tests/test_effects_realization.js` -> **PASS** (Verifikasi Visual/Audio Efek Nyata)
  12. `tests/test_browser_init.js` -> **PASS** (Inisialisasi Canvas & Siklus Render)
  13. `tests/audit_bugs.js` -> **PASS** (Audit Statis: 0 Error, 0 Missing SFX, 0 Unhandled Action)
  14. `tests/test_paradox_reality.js` -> **PASS** (Chrono 4D Rewind & Paradox Reality)
  15. `tests/test_grand_expansion.js` -> **PASS** (Titan Mech Warfare, Dreadnought, Vaults, Cyber-Logic, Market)




