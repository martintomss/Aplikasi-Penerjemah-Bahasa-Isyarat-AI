# 🤟 SignAI - Penerjemah Bahasa Isyarat Kamera ke Teks Real-Time

Aplikasi web cerdas berbasis AI Vision untuk mendeteksi gerakan tangan dan bahasa isyarat (**SIBI & ASL**) melalui kamera webcam secara real-time, menerjemahkannya ke teks langsung tepat di bawah layar kamera, serta dilengkapi sintesis suara (**Text-to-Speech**) Bahasa Indonesia.

---

## 🌟 Fitur Utama

1. **Vision Tracking Real-Time (MediaPipe Hands)**:
   - Melacak 21 titik sendi tangan dengan latensi ultra rendah di browser tanpa perlu server GPU eksternal.
   - **AR Neon Skeleton HUD**: Visualisasi sendi dan tulang tangan dengan efek cahaya neon futuristik (*cyber-glow*).
   - Tombol **Mode Cermin (Mirror Toggle)** untuk kemudahan melihat orientasi tangan seperti di cermin.

2. **Pengenalan Bahasa Isyarat Lengkap**:
   - **Abjad Lengkap (A - Z)**: Ejaan jari alfabet SIBI & ASL.
   - **Angka (1 - 5)**: Pengenalan hitungan angka dengan tangan.
   - **Kata & Frasa Sehari-hari**:
     - *Halo / Hai* (👋 Telapak tangan terbuka melambai)
     - *I Love You* (🤟 Tanda universal ILY: jempol, telunjuk, kelingking terbuka)
     - *Ya / Bagus / Mantap* (👍 Jempol ke atas)
     - *Tidak / Kurang Baik* (👎 Jempol ke bawah)
     - *Damai / Peace* (✌️ Huruf V dua jari terbuka)
     - *Oke / Sempurna* (👌 Ujung jempol dan telunjuk menyatu, 3 jari terbuka)
     - *Keren / Rock On* (🤘 Telunjuk dan kelingking tegak)
     - *Telepon / Hubungi Saya* (🤙 Tanda shaka / telepon)
     - *Stop / Berhenti* (✋ Telapak tangan tegak kaku mendorong ke depan)
     - *Terima Kasih* & *Tolong*

3. **Papan Terjemahan Teks (Tepat di Bawah Kamera)**:
   - Menampilkan teks yang diterjemahkan secara dinamis dengan kursor berkedip.
   - **Hold-to-Confirm Timer (~0.6 detik)**: Tahan pose sebentar untuk mengunci huruf/kata agar tidak salah ketik (*flicker-free*).
   - **Indikator Progres Melingkar (Ring Progress)** pada gestur yang sedang dikenali.
   - **Bicara (Suara / TTS)**: Membacakan seluruh kalimat yang terbentuk dalam Bahasa Indonesia menggunakan Web Speech API.
   - **Tombol Kontrol**: Spasi (`␣`), Hapus Satu Karakter (`⌫`), Bersihkan (`🗑️`), dan Salin ke Clipboard (`📋`).

4. **Kamus Isyarat & Mode Latihan Interaktif**:
   - **Kamus Isyarat Lengkap**: Panduan visual untuk setiap huruf, angka, dan kata lengkap dengan tips posisi jari.
   - **Mode Latihan (Practice Mode)**: Menampilkan target isyarat yang harus diperagakan. AI akan memvalidasi pose tangan Anda dan memberikan status "Cocok ✅" saat berhasil!

5. **Efek Audio Synthesizer (Web Audio API)**:
   - Suara klik halus saat menahan pose dan melodi *lock-on* saat huruf berhasil dimasukkan ke papan teks.
   - Tombol *Mute / Unmute* di pojok kanan atas.

---

## 🚀 Cara Menjalankan

### Cara 1: Menggunakan File Batch (Paling Mudah di Windows)
Cukup klik ganda (double click) file:
```text
jalankan_aplikasi.bat
```
Browser akan otomatis terbuka ke `http://localhost:3000`.

### Cara 2: Menggunakan Terminal / Node.js
1. Buka folder `bahasa_isyarat`:
   ```bash
   cd "d:\Game antigravity\game\bahasa_isyarat"
   ```
2. Jalankan server:
   ```bash
   node server.js
   ```
3. Buka browser favorit Anda (Google Chrome, Edge, Firefox) dan akses:
   ```
   http://localhost:3000
   ```

---

## 💡 Tips untuk Akurasi Maksimal
- Pastikan pencahayaan ruangan cukup terang dan tangan terlihat jelas di dalam bingkai kamera.
- Letakkan satu tangan di depan kamera dengan jarak sekitar 40 - 80 cm.
- Untuk huruf-huruf tertentu (seperti L, V, W, Y, A), pastikan jari tegak sesuai dengan panduan di menu **Kamus Isyarat**.
