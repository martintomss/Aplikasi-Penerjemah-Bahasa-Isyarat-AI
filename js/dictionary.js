// dictionary.js - Kamus Bahasa Isyarat Komprehensif (SIBI & BISINDO)
// Mencakup: Salam, Kesopanan, Afirmasi, Emosi, Aktivitas, Abjad A-Z, Angka 0-10, Gestur Dinamis & 2 Tangan

window.SIGN_DICTIONARY = [
  // ==========================================
  // 1. SALAM & SAPAAN (GREETINGS)
  // ==========================================
  {
    id: 'halo',
    type: 'word',
    label: 'Halo / Hai',
    text: 'Halo!',
    icon: '👋',
    category: 'Salam',
    isDynamic: true,
    desc: 'Lambaikan tangan terbuka ke kiri dan ke kanan dengan ramah menghadap kamera.',
    tips: 'Buka kelima jari dan gerakkan tangan bergoyang ke samping.'
  },
  {
    id: 'selamat_pagi',
    type: 'word',
    label: 'Selamat Pagi',
    text: 'Selamat Pagi',
    icon: '🌅',
    category: 'Salam',
    isDynamic: true,
    desc: 'Bentuk posisi matahari terbit dari bawah dada naik ke atas dengan tangan terbuka.',
    tips: 'Gerakkan telapak tangan mendatar perlahan naik ke atas.'
  },
  {
    id: 'selamat_siang',
    type: 'word',
    label: 'Selamat Siang',
    text: 'Selamat Siang',
    icon: '☀️',
    category: 'Salam',
    isDynamic: false,
    desc: 'Tangan tegak lurus menunjuk ke atas melambangkan matahari tepat di atas kepala.',
    tips: 'Satu tangan tegak vertikal di depan wajah.'
  },
  {
    id: 'selamat_malam',
    type: 'word',
    label: 'Selamat Malam',
    text: 'Selamat Malam',
    icon: '🌙',
    category: 'Salam',
    isDynamic: true,
    desc: 'Gerakkan satu tangan melengkung turun melambangkan matahari tenggelam.',
    tips: 'Telapak tangan mengusap perlahan menurun ke bawah.'
  },
  {
    id: 'sampai_jumpa',
    type: 'word',
    label: 'Sampai Jumpa',
    text: 'Sampai Jumpa!',
    icon: '🙋',
    category: 'Salam',
    isDynamic: true,
    desc: 'Lambaikan tangan terbuka melipat jari secara berirama sebagai tanda perpisahan.',
    tips: 'Lambaian tangan di samping kepala.'
  },

  // ==========================================
  // 2. KESOPANAN & ETIKA (COURTESY)
  // ==========================================
  {
    id: 'terima_kasih',
    type: 'word',
    label: 'Terima Kasih',
    text: 'Terima Kasih',
    icon: '🙏',
    category: 'Kesopanan',
    isDynamic: true,
    desc: 'Sentuh ujung jari tangan datar di depan dagu/dada, lalu gerakkan maju mengarah ke lawan bicara.',
    tips: 'Gerakan mendatar dari dekat wajah/dada maju ke arah kamera.'
  },
  {
    id: 'sama_sama',
    type: 'word',
    label: 'Sama-Sama',
    text: 'Sama-sama',
    icon: '🤲',
    category: 'Kesopanan',
    twoHands: true,
    desc: 'Buka kedua telapak tangan menengadah ke atas secara bersahabat di depan dada.',
    tips: 'Dua telapak tangan terbuka berdampingan menghadap ke atas.'
  },
  {
    id: 'maaf',
    type: 'word',
    label: 'Maaf',
    text: 'Maaf',
    icon: '🙇',
    category: 'Kesopanan',
    isDynamic: true,
    desc: 'Kepalkan tangan dengan ibu jari di depan, lakukan gerakan memutar melingkar di atas dada.',
    tips: 'Posisikan kepalan tangan di dada dan putar melingkar secara lembut.'
  },
  {
    id: 'tolong',
    type: 'word',
    label: 'Tolong / Mohon',
    text: 'Tolong',
    icon: '🙏',
    category: 'Kesopanan',
    twoHands: true,
    desc: 'Tangkupkan kedua telapak tangan rapat di depan dada seperti memohon dengan tulus.',
    tips: 'Rapatkan kedua telapak tangan secara vertikal di tengah dada.'
  },
  {
    id: 'permisi',
    type: 'word',
    label: 'Permisi',
    text: 'Permisi',
    icon: '👉',
    category: 'Kesopanan',
    isDynamic: true,
    desc: 'Gunakan satu tangan memotong lembut telapak tangan lain atau menunjuk sopan ke arah depan bawah.',
    tips: 'Gerakan lembut merunduk sedikit.'
  },

  // ==========================================
  // 3. AFIRMASI & RESPON (AFFIRMATION)
  // ==========================================
  {
    id: 'ya_setuju',
    type: 'word',
    label: 'Ya / Setuju',
    text: 'Ya, Setuju!',
    icon: '👍',
    category: 'Afirmasi',
    isDynamic: true,
    desc: 'Kepalkan tangan dengan jempol tegak, atau gerakkan kepalan tangan mengangguk naik-turun.',
    tips: 'Jempol mengacung ke atas atau kepalan mengangguk vertikal.'
  },
  {
    id: 'tidak_bukan',
    type: 'word',
    label: 'Tidak / Bukan',
    text: 'Tidak',
    icon: '👎',
    category: 'Afirmasi',
    isDynamic: true,
    desc: 'Jempol mengarah ke bawah, atau lambaikan jari telunjuk ke kiri-kanan seperti menggeleng.',
    tips: 'Jempol mengarah ke bawah atau telunjuk bergoyang ke samping.'
  },
  {
    id: 'bagus_mantap',
    type: 'word',
    label: 'Bagus / Mantap',
    text: 'Bagus Sekali!',
    icon: '✨',
    category: 'Afirmasi',
    desc: 'Acungkan jempol ke atas dengan mantap menghadap kamera.',
    tips: 'Empat jari mengepal rapat, jempol berdiri kokoh.'
  },
  {
    id: 'luar_biasa',
    type: 'word',
    label: 'Luar Biasa (Double Thumbs)',
    text: 'Luar Biasa! 🌟',
    icon: '🙌',
    category: 'Afirmasi',
    twoHands: true,
    desc: 'Acungkan kedua jempol tangan secara bersamaan menghadap ke kamera.',
    tips: 'Tunjukkan kedua tangan dengan jempol mengacung ke atas.'
  },
  {
    id: 'oke',
    type: 'word',
    label: 'Oke / Sempurna',
    text: 'Oke 👌',
    icon: '👌',
    category: 'Afirmasi',
    desc: 'Sentuhkan ujung ibu jari dengan telunjuk membentuk lingkaran, 3 jari lainnya terangkat tegak.',
    tips: 'Tanda OK universal dengan lingkaran yang jelas terlihat.'
  },
  {
    id: 'stop',
    type: 'word',
    label: 'Stop / Berhenti',
    text: 'Stop! 🛑',
    icon: '🛑',
    category: 'Afirmasi',
    desc: 'Tegakkan seluruh telapak tangan menghadap ke kamera secara kaku dan tegas.',
    tips: 'Lima jari rapat tegak lurus mendorong ke depan.'
  },
  {
    id: 'bisa',
    type: 'word',
    label: 'Bisa',
    text: 'Bisa!',
    icon: '💪',
    category: 'Afirmasi',
    isDynamic: true,
    desc: 'Kedua atau satu kepalan tangan menghentak tegas ke bawah melambangkan keyakinan.',
    tips: 'Gerakkan kepalan tangan sedikit ke bawah secara tegas.'
  },
  {
    id: 'tidak_bisa',
    type: 'word',
    label: 'Tidak Bisa',
    text: 'Tidak Bisa',
    icon: '🙅',
    category: 'Afirmasi',
    desc: 'Kedua tangan menyilang di depan dada membentuk tanda silang X.',
    tips: 'Silangkan dua pergelangan tangan membentuk X.'
  },

  // ==========================================
  // 4. KATA GANTI & EMOSI (PRONOUNS & EMOTION)
  // ==========================================
  {
    id: 'saya',
    type: 'word',
    label: 'Saya / Aku',
    text: 'Saya',
    icon: '🙋‍♂️',
    category: 'Kata Ganti',
    isDynamic: true,
    desc: 'Arahkan jari telunjuk menunjuk ke arah dada sendiri dengan lembut.',
    tips: 'Telunjuk menunjuk ke dada/tubuh sendiri.'
  },
  {
    id: 'kamu',
    type: 'word',
    label: 'Kamu / Anda',
    text: 'Kamu',
    icon: '👉',
    category: 'Kata Ganti',
    isDynamic: true,
    desc: 'Arahkan jari telunjuk lurus menunjuk ke arah depan (lawan bicara / kamera).',
    tips: 'Telunjuk menunjuk lurus ke arah lensa kamera.'
  },
  {
    id: 'i_love_you',
    type: 'word',
    label: 'Aku Cinta Kamu (ILY)',
    text: 'Aku Cinta Kamu 🤟',
    icon: '🤟',
    category: 'Emosi',
    desc: 'Angkat ibu jari, jari telunjuk, dan jari kelingking secara bersamaan.',
    tips: 'Kombinasi huruf I, L, dan Y yang mendunia.'
  },
  {
    id: 'cinta',
    type: 'word',
    label: 'Cinta / Sayang',
    text: 'Cinta ❤️',
    icon: '❤️',
    category: 'Emosi',
    twoHands: true,
    desc: 'Silangkan kedua tangan di depan dada mendekap hati.',
    tips: 'Dua tangan menyilang memeluk di depan dada.'
  },
  {
    id: 'damai',
    type: 'word',
    label: 'Damai / Peace',
    text: 'Damai ✌️',
    icon: '✌️',
    category: 'Emosi',
    desc: 'Angkat jari telunjuk dan tengah membentuk huruf V terbuka lebar.',
    tips: 'Dua jari tegak membentuk huruf V dengan sudut jelas.'
  },
  {
    id: 'senang',
    type: 'word',
    label: 'Senang / Bahagia',
    text: 'Senang 😊',
    icon: '😊',
    category: 'Emosi',
    isDynamic: true,
    desc: 'Telapak tangan terbuka mengusap dada ke arah atas dengan ceria.',
    tips: 'Usapkan tangan naik di depan dada.'
  },
  {
    id: 'semangat',
    type: 'word',
    label: 'Semangat!',
    text: 'Semangat! 🔥',
    icon: '🔥',
    category: 'Emosi',
    desc: 'Kepalkan tangan kuat di depan dada seperti menumbuhkan tekad kuat.',
    tips: 'Kepalan tangan kokoh terangkat di samping dada.'
  },
  {
    id: 'keren',
    type: 'word',
    label: 'Keren / Rock On',
    text: 'Keren! 🤘',
    icon: '🤘',
    category: 'Emosi',
    desc: 'Angkat jari telunjuk dan kelingking, kunci jari tengah & manis dengan ibu jari.',
    tips: 'Gestur rock & roll yang energik.'
  },
  {
    id: 'telepon',
    type: 'word',
    label: 'Telepon / Hubungi',
    text: 'Hubungi Saya 🤙',
    icon: '🤙',
    category: 'Emosi',
    desc: 'Rentangkan ibu jari dan kelingking menyerupai gagang telepon dekat telinga.',
    tips: 'Jari shaka diarahkan ke samping kepala.'
  },

  // ==========================================
  // 5. AKTIVITAS & KEBUTUHAN (ACTIVITIES)
  // ==========================================
  {
    id: 'makan',
    type: 'word',
    label: 'Makan',
    text: 'Makan 🍽️',
    icon: '🍚',
    category: 'Aktivitas',
    isDynamic: true,
    desc: 'Kuncupkan kelima ujung jari bersamaan lalu ketukkan lembut ke arah mulut beberapa kali.',
    tips: 'Ujung jari menguncup mendekat ke arah bibir/mulut.'
  },
  {
    id: 'minum',
    type: 'word',
    label: 'Minum',
    text: 'Minum 🥤',
    icon: '🥤',
    category: 'Aktivitas',
    isDynamic: true,
    desc: 'Bentuk tangan seperti memegang gelas kaca kecil (bentuk C) lalu miringkan ke arah mulut.',
    tips: 'Tangan membentuk huruf C dimiringkan ke bibir.'
  },
  {
    id: 'rumah',
    type: 'word',
    label: 'Rumah',
    text: 'Rumah 🏠',
    icon: '🏠',
    category: 'Aktivitas',
    twoHands: true,
    desc: 'Kedua tangan dengan jari-jari lurus saling menyentuh di ujung membentuk atap segitiga rumah.',
    tips: 'Sentuhkan ujung jari kedua tangan membentuk sudut atap rumah.'
  },
  {
    id: 'belajar',
    type: 'word',
    label: 'Belajar',
    text: 'Belajar 📚',
    icon: '📖',
    category: 'Aktivitas',
    twoHands: true,
    isDynamic: true,
    desc: 'Satu tangan terbuka seperti buku, tangan lainnya mengambil ilmu dari buku ke arah dahi.',
    tips: 'Satu tangan mendatar, satu tangan mengambil ke dahi.'
  },
  {
    id: 'selesai',
    type: 'word',
    label: 'Selesai / Sudah',
    text: 'Selesai ✅',
    icon: '✅',
    category: 'Aktivitas',
    isDynamic: true,
    desc: 'Kedua telapak tangan terbuka digerakkan membuka ke luar menyamping secara santai.',
    tips: 'Tangan membuka menyamping mengisyaratkan tugas tuntas.'
  },
  {
    id: 'paham',
    type: 'word',
    label: 'Paham / Mengerti',
    text: 'Paham 💡',
    icon: '💡',
    category: 'Aktivitas',
    isDynamic: true,
    desc: 'Jari telunjuk menjentik naik di samping dahi menandakan munculnya pemahaman.',
    tips: 'Jentikkan telunjuk di dekat pelipis.'
  },

  // ==========================================
  // 6. ABJAD LENGKAP SIBI & ASL (A - Z)
  // ==========================================
  { id: 'A', type: 'letter', label: 'Huruf A', text: 'A', icon: '🅰️', category: 'Abjad', desc: 'Kepalan 4 jari ke telapak, ibu jari menempel tegak di sisi telunjuk.', tips: 'Ibu jari lurus di luar jari telunjuk.' },
  { id: 'B', type: 'letter', label: 'Huruf B', text: 'B', icon: '🅱️', category: 'Abjad', desc: '4 jari lurus rapat ke atas, ibu jari melipat menempel telapak tangan.', tips: 'Rapatkan 4 jari vertikal ke atas.' },
  { id: 'C', type: 'letter', label: 'Huruf C', text: 'C', icon: '🅲', category: 'Abjad', desc: 'Lengkungkan semua jari membentuk busur setengah lingkaran C.', tips: 'Lengkungan huruf C mengarah ke samping.' },
  { id: 'D', type: 'letter', label: 'Huruf D', text: 'D', icon: '🅳', category: 'Abjad', desc: 'Hanya jari telunjuk tegak, jempol dan jari lainnya bersentuhan melingkar.', tips: 'Telunjuk lurus, jari lain membulat menyentuh jempol.' },
  { id: 'E', type: 'letter', label: 'Huruf E', text: 'E', icon: '🅴', category: 'Abjad', desc: 'Tekuk semua jari ke dalam sehingga kuku menyentuh jempol di bawahnya.', tips: 'Semua ujung jari menekuk di atas jempol.' },
  { id: 'F', type: 'letter', label: 'Huruf F', text: 'F', icon: '🅵', category: 'Abjad', desc: 'Ujung telunjuk & jempol bersentuhan membulat, 3 jari lain tegak.', tips: 'Mirip tanda OK dalam percakapan.' },
  { id: 'G', type: 'letter', label: 'Huruf G', text: 'G', icon: '🅶', category: 'Abjad', desc: 'Telunjuk dan jempol mengarah horizontal sejajar ke samping.', tips: 'Telunjuk & jempol mengarah ke samping.' },
  { id: 'H', type: 'letter', label: 'Huruf H', text: 'H', icon: '🅷', category: 'Abjad', desc: 'Telunjuk dan jari tengah rapat horizontal ke samping.', tips: 'Dua jari horizontal sejajar.' },
  { id: 'I', type: 'letter', label: 'Huruf I', text: 'I', icon: '🅸', category: 'Abjad', desc: 'Hanya kelingking yang berdiri tegak, jari lainnya mengepal rapat.', tips: 'Kelingking tegak lurus ke atas.' },
  { id: 'J', type: 'letter', label: 'Huruf J', text: 'J', icon: '🅹', category: 'Abjad', isDynamic: true, desc: 'Kelingking tegak digerakkan melengkung di udara membentuk huruf J.', tips: 'Kelingking menggambar kait huruf J.' },
  { id: 'K', type: 'letter', label: 'Huruf K', text: 'K', icon: '🅺', category: 'Abjad', desc: 'Telunjuk tegak, jari tengah miring maju, jempol berada di antaranya.', tips: 'Membentuk pola huruf K tiga jari.' },
  { id: 'L', type: 'letter', label: 'Huruf L', text: 'L', icon: '🅻', category: 'Abjad', desc: 'Telunjuk tegak ke atas & jempol terbuka 90 derajat siku-siku L.', tips: 'Sudut 90 derajat antara telunjuk & jempol.' },
  { id: 'M', type: 'letter', label: 'Huruf M', text: 'M', icon: '🅼', category: 'Abjad', desc: 'Ibu jari diselipkan di bawah 3 jari (telunjuk, tengah, manis) mengepal.', tips: 'Tiga jari menutupi ibu jari.' },
  { id: 'N', type: 'letter', label: 'Huruf N', text: 'N', icon: '🅽', category: 'Abjad', desc: 'Ibu jari diselipkan di bawah 2 jari (telunjuk & tengah) mengepal.', tips: 'Dua jari menutupi ibu jari.' },
  { id: 'O', type: 'letter', label: 'Huruf O', text: 'O', icon: '🅾️', category: 'Abjad', desc: 'Semua ujung jari bertemu ujung ibu jari membentuk lingkaran bulat O.', tips: 'Lingkaran penuh tanpa celah terbuka.' },
  { id: 'P', type: 'letter', label: 'Huruf P', text: 'P', icon: '🅿️', category: 'Abjad', desc: 'Bentuk posisi K namun dihadapkan menunduk ke arah bawah.', tips: 'Posisi K mengarah ke bawah.' },
  { id: 'Q', type: 'letter', label: 'Huruf Q', text: 'Q', icon: '🆀', category: 'Abjad', desc: 'Bentuk posisi G namun dihadapkan menunduk ke bawah.', tips: 'Jempol & telunjuk mengarah ke bawah.' },
  { id: 'R', type: 'letter', label: 'Huruf R', text: 'R', icon: '🆁', category: 'Abjad', desc: 'Jari telunjuk dan tengah disilangkan satu sama lain erat.', tips: 'Silangkan jari tengah di atas telunjuk.' },
  { id: 'S', type: 'letter', label: 'Huruf S', text: 'S', icon: '🆂', category: 'Abjad', desc: 'Mengepal erat dengan ibu jari melintang mengunci di depan 4 jari.', tips: 'Jempol menutupi jari yang mengepal.' },
  { id: 'T', type: 'letter', label: 'Huruf T', text: 'T', icon: '🆃', category: 'Abjad', desc: 'Ibu jari terselip di antara telunjuk dan jari tengah.', tips: 'Hanya jari telunjuk yang menutupi jempol.' },
  { id: 'U', type: 'letter', label: 'Huruf U', text: 'U', icon: '🆄', category: 'Abjad', desc: 'Telunjuk dan jari tengah tegak rapat lurus ke atas tanpa celah.', tips: 'Dua jari tegak menempel rapat.' },
  { id: 'V', type: 'letter', label: 'Huruf V', text: 'V', icon: '🆅', category: 'Abjad', desc: 'Telunjuk dan tengah terbuka membentuk sudut tajam V.', tips: 'Buka jarak antara telunjuk dan jari tengah.' },
  { id: 'W', type: 'letter', label: 'Huruf W', text: 'W', icon: '🆆', category: 'Abjad', desc: 'Tiga jari (telunjuk, tengah, manis) tegak terbuka membentuk pola W.', tips: 'Tiga jari tegak seperti garpu.' },
  { id: 'X', type: 'letter', label: 'Huruf X', text: 'X', icon: '🆇', category: 'Abjad', desc: 'Jari telunjuk ditekuk seperti kait/cakar, jari lain mengepal.', tips: 'Telunjuk membentuk kait melengkung.' },
  { id: 'Y', type: 'letter', label: 'Huruf Y', text: 'Y', icon: '🆈', category: 'Abjad', desc: 'Ibu jari dan kelingking terbuka lebar, tiga jari di tengah melipat.', tips: 'Mirip tanda telepon / shaka.' },
  { id: 'Z', type: 'letter', label: 'Huruf Z', text: 'Z', icon: '🆉', category: 'Abjad', isDynamic: true, desc: 'Gunakan telunjuk tegak untuk menggambar pola zig-zag Z di udara.', tips: 'Gerakan zig-zag telunjuk di udara.' },

  // ==========================================
  // 7. ANGKA LENGKAP (0 - 10)
  // ==========================================
  { id: 'num_0', type: 'number', label: 'Angka 0', text: '0', icon: '0️⃣', category: 'Angka', desc: 'Semua jari melingkar membentuk angka 0.', tips: 'Mirip huruf O.' },
  { id: 'num_1', type: 'number', label: 'Angka 1', text: '1', icon: '1️⃣', category: 'Angka', desc: 'Hanya jari telunjuk yang tegak lurus ke atas.', tips: 'Telunjuk berdiri tegak.' },
  { id: 'num_2', type: 'number', label: 'Angka 2', text: '2', icon: '2️⃣', category: 'Angka', desc: 'Dua jari (telunjuk dan tengah) tegak terbuka.', tips: 'Dua jari tegak terbuka V.' },
  { id: 'num_3', type: 'number', label: 'Angka 3', text: '3', icon: '3️⃣', category: 'Angka', desc: 'Tiga jari (jempol, telunjuk, tengah) berdiri tegak.', tips: 'Jempol, telunjuk, dan tengah tegak.' },
  { id: 'num_4', type: 'number', label: 'Angka 4', text: '4', icon: '4️⃣', category: 'Angka', desc: 'Empat jari tegak lurus, ibu jari melipat menempel telapak.', tips: 'Empat jari tegak sejajar.' },
  { id: 'num_5', type: 'number', label: 'Angka 5', text: '5', icon: '5️⃣', category: 'Angka', desc: 'Semua lima jari tangan terbuka lebar menghadap kamera.', tips: 'Rentangkan kelima jari.' },
  { id: 'num_6', type: 'number', label: 'Angka 6', text: '6', icon: '6️⃣', category: 'Angka', desc: 'Sentuhkan kelingking ke jempol, 3 jari lain (telunjuk, tengah, manis) tegak.', tips: 'Kelingking menyentuh jempol.' },
  { id: 'num_7', type: 'number', label: 'Angka 7', text: '7', icon: '7️⃣', category: 'Angka', desc: 'Sentuhkan jari manis ke jempol, jari telunjuk, tengah, kelingking tegak.', tips: 'Jari manis menyentuh jempol.' },
  { id: 'num_8', type: 'number', label: 'Angka 8', text: '8', icon: '8️⃣', category: 'Angka', desc: 'Sentuhkan jari tengah ke jempol, jari telunjuk, manis, kelingking tegak.', tips: 'Jari tengah menyentuh jempol.' },
  { id: 'num_9', type: 'number', label: 'Angka 9', text: '9', icon: '9️⃣', category: 'Angka', desc: 'Sentuhkan jari telunjuk ke jempol membentuk lingkaran, 3 jari lain tegak.', tips: 'Telunjuk menyentuh jempol.' },
  { id: 'num_10', type: 'number', label: 'Angka 10', text: '10', icon: '🔟', category: 'Angka', isDynamic: true, desc: 'Acungkan jempol ke atas lalu goyangkan pergelangan tangan ke samping secara santai.', tips: 'Jempol tegak digoyang menyamping.' }
];

// Kata-kata populer Bahasa Indonesia untuk sistem Auto-Complete Cerdas
window.INDONESIAN_WORDS = [
  "SAYA", "SAYANG", "SATU", "SAHABAT", "SAMPAI", "SELESAI", "SEMANGAT", "SENANG", "SETUJU", "SEKOLAH", "SEMUA", "SUDAH", "SIANG", "SUKA",
  "KAMU", "KITA", "KAMI", "KASIH", "KEREN", "KELUARGA", "KABAR", "KENAL", "KEMBALI",
  "BELAJAR", "BISA", "BAGUS", "BAIK", "BANTU", "BUKAN", "BENAR", "BERKAH",
  "TERIMA", "TOLONG", "TIDAK", "TEMAN", "TENTANG", "TANYA", "TIDUR",
  "MAAF", "MAKAN", "MINUM", "MALAM", "MANTAP", "MOHON", "MENDENGAR", "MELIHAT",
  "HALO", "HARI", "HEBAT", "HUBUNGI", "HATI", "HARAPAN",
  "PAGI", "PERMISI", "PAHAM", "PINTAR", "PEACE", "PENTING",
  "RUMAH", "RAMAH", "RASA", "RINDU",
  "DAMAI", "DENGAN", "DUDUK", "DATANG",
  "OKE", "ORANG", "OPINI",
  "YA", "YANG", "YAKIN"
];
