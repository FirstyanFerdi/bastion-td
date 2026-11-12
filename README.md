# BASTION — Perimeter Defense

2D tower defense berbasis HTML5 Canvas + CSS + JavaScript murni.
Tanpa dependensi, tanpa build step, tanpa aset eksternal (sprite, ikon, peta, dan suara semuanya dibuat lewat kode).

## Menjalankan

Buka `index.html` langsung di browser (double-click). Tidak perlu server.

Kalau ingin lewat server lokal (misalnya untuk live-reload), apa saja boleh, contoh:

    npx serve .
    # atau
    python3 -m http.server 8080

## Struktur

    index.html        markup HUD, dock, panel samping + daftar <script>
    css/style.css     seluruh tampilan
    js/
      core.js         konstanta (TILE, COLS, ROWS), helper matematika, localStorage
      audio.js        Sfx: synthesizer Web Audio (osilator + noise), mute
      data.js         jalur (WP_TILES), definisi tower (TD) & musuh (ED), generator wave
      state.js        object pool, state game (G), partikel/fx, rumus damage
      enemies.js      spawn & perilaku musuh (healer, boss shield, status slow/brittle)
      towers.js       penempatan, targeting, senjata tiap tower
      waves.js        alur wave, menang/kalah, update() fixed-step
      sprites.js      gambar prosedural tower dan musuh
      render.js       peta statis (offscreen canvas) + render per frame
      ui.js           ikon SVG, HUD, shop dock, inspector, overlay
      input.js        pointer, keyboard, fit canvas
      main.js         game loop (dt), init(), hook test `window.__nb`
    tests/smoke.js    tes headless (butuh Node), bot memainkan game sampai menang

**Urutan `<script>` di `index.html` penting.** Semua file adalah script klasik yang berbagi
satu scope global (sengaja tidak pakai ES modules supaya tetap jalan dari `file://`).
Kalau menambah file, daftarkan di `index.html` dan tambahkan juga ke test (test membaca
daftar script dari `index.html`, jadi otomatis ikut).

## Mengubah isi game

| Ingin mengubah…                      | Edit di…                                        |
|--------------------------------------|--------------------------------------------------|
| Statistik / harga / tier tower       | `TD` di `js/data.js`                             |
| Statistik / reward / armor musuh     | `ED` di `js/data.js`                             |
| Komposisi tiap wave                  | `buildSpawns(n)` di `js/data.js`                 |
| Kesulitan (skala HP per wave)        | `hpScale(n)` di `js/data.js`                     |
| Bentuk jalur / ukuran grid           | `WP_TILES` di `js/data.js`, `COLS/ROWS` di `core.js` |
| Nyawa / gold awal, bunga, bonus wave | `newGame()` di `state.js`, `onWaveClear()` di `waves.js` |
| Tower baru                           | `TD` + `TKEYS` (data.js), cabang di `updateTower` & fungsi `fireXxx` (towers.js), gambar di `drawTowerSprite` (sprites.js) |
| Musuh baru                           | `ED` + `buildSpawns` (data.js), perilaku di `updateEnemy` (enemies.js), gambar di `drawEnemy` (sprites.js) |
| Suara                                | `Sfx.play()` di `js/audio.js`                    |
| Warna / tata letak UI                | `css/style.css`                                  |

Tips: waktu simulasi dikali `G.speed` (1x/2x/3x) lewat `dt`, jadi semua cooldown/timer baru
sebaiknya dikurangi dengan `dt` di dalam `update()`, bukan memakai `setTimeout`.

## Tes

    node tests/smoke.js        # sampai menang di wave 20
    node tests/smoke.js 40     # lanjut Endless Mode sampai wave 40

Tes ini tidak mengecek tampilan, hanya logika (spawn, damage, upgrade, wave, menang/kalah, render tanpa error).

## Kontrol

`1`-`5` pilih tower · klik untuk bangun/pilih · `Space` panggil wave / pause · `U` upgrade · `X` jual ·
`P` pause · `F` ganti kecepatan · `M` mute · `Esc` batal.

High score dan wave tertinggi disimpan di `localStorage` (`nb_bestScore`, `nb_bestWave`, `nb_muted`).
