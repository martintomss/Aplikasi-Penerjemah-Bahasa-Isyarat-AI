// sign_recognizer.js - Engine Pengenalan Bahasa Isyarat Video Time-Series (v8.0 AI Motion Tracker)
// Mendeteksi gerakan video dinamis seiring waktu (bukan sekadar gambar diam)
// Melacak trajektori, arah, kecepatan, osilasi lambaian, putaran, dan pemisah anatomi Muka vs Dada

// ============================================================================
// 1. ANALYZER GERAKAN VIDEO DINAMIS (TIME-SERIES VIDEO TRAJECTORY ENGINE)
// ============================================================================
class VideoMotionAnalyzer {
  constructor() {
    this.history = []; // Buffer titik riwayat { t, wrist, indexTip, chest, mouth, shoulderY, shoulderWidth }
    this.maxWindowMs = 850; // Jendela analisis video kontinu rentang 850 milidetik
  }

  addFrame(data) {
    const now = performance.now();
    const { pose, hands } = data || {};

    let wrist = null;
    let indexTip = null;

    if (hands && hands.length > 0 && hands[0].landmarks) {
      wrist = hands[0].landmarks[0];
      indexTip = hands[0].landmarks[8];
    } else if (pose) {
      const activeHand = (pose[16] && (pose[16].visibility || 1) > 0.35) ? pose[16]
                       : ((pose[15] && (pose[15].visibility || 1) > 0.35) ? pose[15] : null);
      if (activeHand) {
        wrist = activeHand;
        indexTip = pose[20] || pose[19] || activeHand;
      }
    }

    let shoulderY = 0.5;
    let shoulderWidth = 0.25;
    let chest = { x: 0.5, y: 0.6 };
    let mouth = { x: 0.5, y: 0.4 };

    if (pose && pose[11] && pose[12]) {
      shoulderY = (pose[11].y + pose[12].y) / 2;
      shoulderWidth = Math.max(0.18, Math.hypot(pose[11].x - pose[12].x, pose[11].y - pose[12].y));
      chest = { x: (pose[11].x + pose[12].x) / 2, y: shoulderY + shoulderWidth * 0.35 };
      const isNoseValid = pose[0] && pose[0].y < shoulderY - 0.03;
      const nose = isNoseValid ? pose[0] : { x: chest.x, y: shoulderY - shoulderWidth * 0.45 };
      mouth = (pose[9] && pose[10] && pose[9].y < shoulderY)
        ? { x: (pose[9].x + pose[10].x) / 2, y: (pose[9].y + pose[10].y) / 2 }
        : { x: nose.x, y: Math.min(shoulderY - 0.04, nose.y + 0.05) };
    }

    if (wrist) {
      this.history.push({
        t: now,
        wrist: { x: wrist.x, y: wrist.y, z: wrist.z || 0 },
        indexTip: indexTip ? { x: indexTip.x, y: indexTip.y } : null,
        chest,
        mouth,
        shoulderY,
        shoulderWidth
      });
    }

    // Prune data yang lebih tua dari maxWindowMs
    this.history = this.history.filter(h => now - h.t <= this.maxWindowMs);
  }

  analyze() {
    if (this.history.length < 4) {
      return {
        motionType: 'stationary',
        speed: 0,
        isWaving: false,
        isCircular: false,
        isMovingUp: false,
        isMovingDown: false,
        isForwardFromChin: false,
        isTapping: false,
        isStationary: true,
        label: 'Posisi Diam'
      };
    }

    const first = this.history[0];
    const latest = this.history[this.history.length - 1];
    const dt = (latest.t - first.t) / 1000;
    if (dt < 0.12) {
      return { motionType: 'stationary', speed: 0, isStationary: true, label: 'Posisi Diam' };
    }

    // 1. Total Path & Speed
    let totalPath = 0;
    for (let i = 1; i < this.history.length; i++) {
      const p1 = this.history[i - 1].wrist;
      const p2 = this.history[i].wrist;
      totalPath += Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }
    const speed = totalPath / dt;
    const netDx = latest.wrist.x - first.wrist.x;
    const netDy = latest.wrist.y - first.wrist.y;
    const isStationary = speed < 0.16 && totalPath < 0.07;

    // 2. Deteksi Lambaian Tangan Video (Waving) -> "Halo" / "Sampai Jumpa"
    let dirChangesX = 0;
    let prevSign = 0;
    for (let i = 1; i < this.history.length; i++) {
      const dx = this.history[i].wrist.x - this.history[i - 1].wrist.x;
      if (Math.abs(dx) > 0.007) {
        const sign = dx > 0 ? 1 : -1;
        if (prevSign !== 0 && sign !== prevSign) {
          dirChangesX++;
        }
        prevSign = sign;
      }
    }
    const isWaving = dirChangesX >= 2 && totalPath > 0.08;

    // 3. Deteksi Gerakan Memutar Melingkar di Dada (Circular) -> "Maaf"
    let isCircular = false;
    if (this.history.length >= 7 && speed > 0.12) {
      let cx = 0, cy = 0;
      this.history.forEach(h => { cx += h.wrist.x; cy += h.wrist.y; });
      cx /= this.history.length;
      cy /= this.history.length;

      let totalAngle = 0;
      let prevAngle = Math.atan2(this.history[0].wrist.y - cy, this.history[0].wrist.x - cx);
      for (let i = 1; i < this.history.length; i++) {
        const currAngle = Math.atan2(this.history[i].wrist.y - cy, this.history[i].wrist.x - cx);
        let dAngle = currAngle - prevAngle;
        while (dAngle > Math.PI) dAngle -= 2 * Math.PI;
        while (dAngle < -Math.PI) dAngle += 2 * Math.PI;
        totalAngle += dAngle;
        prevAngle = currAngle;
      }

      // Minimal putaran 200 derajat (1.1 * PI) di depan dada
      if (Math.abs(totalAngle) > Math.PI * 1.1 && latest.wrist.y > latest.shoulderY - 0.05) {
        const distChest = Math.hypot(latest.wrist.x - latest.chest.x, latest.wrist.y - latest.chest.y);
        if (distChest < latest.shoulderWidth * 0.55) {
          isCircular = true;
        }
      }
    }

    // 4. Deteksi Gerakan Naik Vertikal (Upward) -> "Selamat Pagi"
    const isMovingUp = netDy < -0.09 && Math.abs(netDy) > Math.abs(netDx) * 1.15;

    // 5. Deteksi Gerakan Turun Vertikal (Downward) -> "Selamat Malam"
    const isMovingDown = netDy > 0.09 && Math.abs(netDy) > Math.abs(netDx) * 1.15;

    // 6. Deteksi Gerakan Maju Menjauh dari Dagu -> "Terima Kasih"
    const distToMouthStart = Math.hypot(first.wrist.x - first.mouth.x, first.wrist.y - first.mouth.y);
    const distToMouthEnd = Math.hypot(latest.wrist.x - latest.mouth.x, latest.wrist.y - latest.mouth.y);
    const isForwardFromChin = (distToMouthStart < latest.shoulderWidth * 0.45) &&
                              (distToMouthEnd > distToMouthStart + 0.045) &&
                              (netDy > 0.015 || Math.abs(netDx) > 0.02);

    // 7. Deteksi Ketukan Berulang di Mulut (Tapping) -> "Makan"
    let tapReversals = 0;
    let prevDistSign = 0;
    for (let i = 1; i < this.history.length; i++) {
      const d1 = Math.hypot(this.history[i - 1].wrist.x - this.history[i - 1].mouth.x, this.history[i - 1].wrist.y - this.history[i - 1].mouth.y);
      const d2 = Math.hypot(this.history[i].wrist.x - this.history[i].mouth.x, this.history[i].wrist.y - this.history[i].mouth.y);
      const dd = d2 - d1;
      if (Math.abs(dd) > 0.005) {
        const sign = dd > 0 ? 1 : -1;
        if (prevDistSign !== 0 && sign !== prevDistSign) {
          tapReversals++;
        }
        prevDistSign = sign;
      }
    }
    const isTapping = tapReversals >= 2 && latest.wrist.y < latest.shoulderY;

    let motionType = 'stationary';
    let label = 'Posisi Stabil';

    if (isWaving) {
      motionType = 'waving';
      label = 'Melambai (Wave)';
    } else if (isCircular) {
      motionType = 'circular';
      label = 'Memutar di Dada';
    } else if (isForwardFromChin) {
      motionType = 'forward';
      label = 'Maju dari Dagu';
    } else if (isMovingUp) {
      motionType = 'upward';
      label = 'Gerakan Naik (Pagi)';
    } else if (isMovingDown) {
      motionType = 'downward';
      label = 'Gerakan Turun (Malam)';
    } else if (isTapping) {
      motionType = 'tapping';
      label = 'Mengetuk di Mulut';
    } else if (!isStationary) {
      motionType = 'moving';
      label = 'Bergerak Dinamis';
    }

    return {
      motionType,
      label,
      speed,
      totalPath,
      netDx,
      netDy,
      isWaving,
      isCircular,
      isMovingUp,
      isMovingDown,
      isForwardFromChin,
      isTapping,
      isStationary
    };
  }

  reset() {
    this.history = [];
  }
}

// ============================================================================
// 2. ENGINE PENGENALAN BAHASA ISYARAT UTAMA
// ============================================================================
class SignRecognizer {
  constructor() {
    this.predictionWindow = [];
    this.windowSize = 5;
    this.motionAnalyzer = new VideoMotionAnalyzer();
  }

  dist(p1, p2) {
    if (!p1 || !p2) return 999;
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  // Transformasi Kanonikal Tangan 3D (Bebas Rotasi & Skala)
  toCanonical(landmarks) {
    if (!landmarks || landmarks.length < 21) return null;

    const wrist = landmarks[0];
    const midMcp = landmarks[9];

    const dx = midMcp.x - wrist.x;
    const dy = midMcp.y - wrist.y;
    const palmScale = Math.hypot(dx, dy) || 0.1;

    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    const cosA = Math.cos(-angle);
    const sinA = Math.sin(-angle);

    const rotated = landmarks.map(p => {
      const relX = p.x - wrist.x;
      const relY = p.y - wrist.y;
      const rx = (relX * cosA - relY * sinA) / palmScale;
      const ry = (relX * sinA + relY * cosA) / palmScale;
      return { x: rx, y: ry, z: (p.z || 0) / palmScale };
    });

    const isFlipped = rotated[5].x > 0;
    return rotated.map(p => ({
      x: isFlipped ? -p.x : p.x,
      y: p.y,
      z: p.z
    }));
  }

  // Ekstraksi Status Jari Kanonikal
  extractHandFeatures(landmarks) {
    const c = this.toCanonical(landmarks);
    if (!c) return null;

    const isIndex = c[8].y < -1.42 && (c[8].y < c[6].y - 0.20);
    const isMiddle = c[12].y < -1.45 && (c[12].y < c[10].y - 0.20);
    const isRing = c[16].y < -1.38 && (c[16].y < c[14].y - 0.18);
    const isPinky = c[20].y < -1.25 && (c[20].y < c[18].y - 0.16);

    const isThumbSide = c[4].x < -0.65 || this.dist(c[4], c[17]) > 1.1;

    // Jempol ke atas pada koordinat asli
    const rawWrist = landmarks[0];
    const rawThumbTip = landmarks[4];
    const rawThumbMcp = landmarks[2];
    const rawIndexMcp = landmarks[5];
    const rawThumbUp = (rawThumbTip.y < rawThumbMcp.y) && (rawThumbTip.y < rawIndexMcp.y);
    const rawThumbDown = (rawThumbTip.y > rawWrist.y);

    const extendedCount = (isIndex ? 1 : 0) + (isMiddle ? 1 : 0) + (isRing ? 1 : 0) + (isPinky ? 1 : 0);
    const isFist = extendedCount === 0;
    const isThumb = isThumbSide || (rawThumbUp && isFist);

    const pinchIndex = this.dist(c[4], c[8]);
    const pinchMiddle = this.dist(c[4], c[12]);
    const distIndexMid = this.dist(c[8], c[12]);
    const areIndexMidCrossed = isIndex && isMiddle && (distIndexMid < 0.25) && (c[8].x > c[12].x);

    return {
      canonical: c,
      thumb: isThumb,
      thumbUp: rawThumbUp && isFist,
      thumbDown: rawThumbDown && isFist,
      index: isIndex,
      middle: isMiddle,
      ring: isRing,
      pinky: isPinky,
      pinchIndex,
      pinchMiddle,
      distIndexMid,
      areIndexMidCrossed,
      extendedCount,
      totalExtended: extendedCount + (isThumb ? 1 : 0),
      isFist,
      wrist: landmarks[0],
      indexTip: landmarks[8],
      thumbTip: landmarks[4]
    };
  }

  // 1. ZONA ANATOMI TUBUH & GESTUR VIDEO DINAMIS
  detectBodyAnchored(pose, hands, motion) {
    if (!pose || !pose[11] || !pose[12]) return null;

    // Garis Batas Kunci Bahu
    const shoulderLeft = pose[11];
    const shoulderRight = pose[12];
    const shoulderY = (shoulderLeft.y + shoulderRight.y) / 2;
    const shoulderWidth = Math.max(0.18, this.dist(shoulderLeft, shoulderRight));

    // Titik Dada (Strictly DI BAWAH BAHU)
    const chestX = (shoulderLeft.x + shoulderRight.x) / 2;
    const chestY = shoulderY + shoulderWidth * 0.35;
    const chest = { x: chestX, y: chestY };

    // Validasi Anatomi: Hidung & Muka HARUS berada di ATAS bahu!
    const isNoseValid = pose[0] && pose[0].y < shoulderY - 0.03;
    const nose = isNoseValid ? pose[0] : { x: chestX, y: shoulderY - shoulderWidth * 0.45 };
    const mouth = (pose[9] && pose[10] && pose[9].y < shoulderY)
      ? { x: (pose[9].x + pose[10].x) / 2, y: (pose[9].y + pose[10].y) / 2 }
      : { x: nose.x, y: Math.min(shoulderY - 0.04, nose.y + 0.05) };
    const forehead = { x: nose.x, y: nose.y - 0.08 };

    const leftWrist = pose[15];
    const rightWrist = pose[16];

    // ========================================================
    // A. GESTUR VIDEO DUA TANGAN (TWO HANDS)
    // ========================================================

    // 1. CINTA / SAYANG (Kedua tangan menyilang mendekap dada)
    if (leftWrist && rightWrist && leftWrist.y > shoulderY - 0.05 && rightWrist.y > shoulderY - 0.05) {
      const distCross1 = this.dist(leftWrist, shoulderRight);
      const distCross2 = this.dist(rightWrist, shoulderLeft);
      if (distCross1 < shoulderWidth * 0.65 && distCross2 < shoulderWidth * 0.65) {
        return { id: 'cinta', text: 'Cinta ❤️', label: 'Cinta (Peluk Dada)', type: 'word', confidence: 0.99, motion };
      }
    }

    // 2. TOLONG / MOHON (Kedua tangan rapat di depan dada)
    if (leftWrist && rightWrist && leftWrist.y > shoulderY - 0.05 && rightWrist.y > shoulderY - 0.05) {
      const distBetweenWrists = this.dist(leftWrist, rightWrist);
      const distToChest = this.dist(leftWrist, chest);
      if (distBetweenWrists < shoulderWidth * 0.45 && distToChest < shoulderWidth * 0.75) {
        return { id: 'tolong', text: 'Tolong / Mohon 🙏', label: 'Tolong (Dua Tangan di Dada)', type: 'word', confidence: 0.98, motion };
      }
    }

    // 3. RUMAH (Kedua tangan membentuk atap segitiga di depan dada)
    if (hands && hands.length >= 2) {
      const h1Tip = hands[0].landmarks[8];
      const h2Tip = hands[1].landmarks[8];
      const distTips = this.dist(h1Tip, h2Tip);
      const distWrists = this.dist(hands[0].landmarks[0], hands[1].landmarks[0]);
      if (distTips < shoulderWidth * 0.35 && distWrists > shoulderWidth * 0.6) {
        return { id: 'rumah', text: 'Rumah 🏠', label: 'Rumah (Atap Segitiga)', type: 'word', confidence: 0.98, motion };
      }
    }

    // ========================================================
    // B. GESTUR VIDEO DINAMIS (TIME-SERIES VIDEO MOTIONS)
    // ========================================================

    // 4. HALO / SAMPAI JUMPA: Lambaian Tangan Video (Waving)
    if (motion && motion.isWaving) {
      const activeWristY = (hands && hands[0]) ? hands[0].landmarks[0].y : (leftWrist ? leftWrist.y : 0.5);
      if (activeWristY < shoulderY - 0.05) {
        return { id: 'sampai_jumpa', text: 'Sampai Jumpa!', label: 'Sampai Jumpa (Lambaian)', type: 'word', confidence: 0.99, motion };
      }
      return { id: 'halo', text: 'Halo! 👋', label: 'Halo (Lambaian Tangan)', type: 'word', confidence: 0.99, motion };
    }

    // 5. TERIMA KASIH: Gerakan Maju Menjauh dari Dagu ke Depan
    if (motion && motion.isForwardFromChin) {
      return { id: 'terima_kasih', text: 'Terima Kasih 🙏', label: 'Terima Kasih (Maju dari Dagu)', type: 'word', confidence: 0.99, motion };
    }

    // 6. SELAMAT PAGI: Matahari Terbit (Gerakan Tangan Naik dari Bawah Dada ke Atas)
    if (motion && motion.isMovingUp) {
      return { id: 'selamat_pagi', text: 'Selamat Pagi 🌅', label: 'Selamat Pagi (Matahari Terbit)', type: 'word', confidence: 0.98, motion };
    }

    // 7. SELAMAT MALAM: Matahari Tenggelam (Gerakan Tangan Turun dari Wajah ke Bawah)
    if (motion && motion.isMovingDown) {
      return { id: 'selamat_malam', text: 'Selamat Malam 🌙', label: 'Selamat Malam (Matahari Tenggelam)', type: 'word', confidence: 0.98, motion };
    }

    // ========================================================
    // C. GESTUR SATU TANGAN DENGAN PEMISAH ZONA TEGAS
    // ========================================================
    if (hands && hands.length > 0) {
      const h = hands[0];
      const f = this.extractHandFeatures(h.landmarks);
      if (!f) return null;

      const handY = f.wrist.y;
      const indexTip = f.indexTip;

      // --- ZONA DADA (handY > shoulderY - 0.02 && indexTip.y > shoulderY - 0.05) ---
      if (handY > shoulderY - 0.02 && indexTip.y > shoulderY - 0.05) {
        // MAAF: Gerakan Memutar di Dada (atau kepalan tangan di dada)
        if (this.dist(f.wrist, chest) < shoulderWidth * 0.5 && f.isFist) {
          const isRubbing = motion && motion.isCircular;
          return {
            id: 'maaf',
            text: 'Maaf 🙇',
            label: isRubbing ? 'Maaf (Memutar di Dada)' : 'Maaf (Tangan di Dada)',
            type: 'word',
            confidence: isRubbing ? 0.99 : 0.97,
            motion
          };
        }

        // SAYA / AKU: Telunjuk menunjuk tepat ke DADA sendiri
        if (this.dist(indexTip, chest) < shoulderWidth * 0.45 && f.index && !f.middle) {
          return { id: 'saya', text: 'Saya', label: 'Saya / Aku (Dada)', type: 'word', confidence: 0.98, motion };
        }
      }

      // --- ZONA MUKA (STRICTLY DI ATAS BAHU: handY < shoulderY && indexTip.y < shoulderY - 0.04) ---
      if (handY < shoulderY && indexTip.y < shoulderY - 0.04) {
        // MAKAN: Ketukan ritmis atau ujung jari menguncup di MULUT
        if (this.dist(indexTip, mouth) < shoulderWidth * 0.35 && (f.totalExtended <= 2 || (motion && motion.isTapping))) {
          return { id: 'makan', text: 'Makan 🍽️', label: 'Makan (Di Mulut)', type: 'word', confidence: 0.98, motion };
        }

        // MINUM: Bentuk cangkir C di MULUT
        if (this.dist(f.wrist, mouth) < shoulderWidth * 0.4 && f.pinchIndex > 0.35 && f.pinchIndex < 0.8) {
          return { id: 'minum', text: 'Minum 🥤', label: 'Minum (Di Mulut)', type: 'word', confidence: 0.98, motion };
        }

        // PAHAM / BELAJAR: Di DAHI / PELIPIS
        if (this.dist(indexTip, forehead) < shoulderWidth * 0.38 && f.index) {
          return { id: 'paham', text: 'Paham 💡', label: 'Paham (Di Dahi)', type: 'word', confidence: 0.98, motion };
        }

        // TERIMA KASIH: Posisi tangan di Dagu
        if (this.dist(f.wrist, mouth) < shoulderWidth * 0.42 && f.extendedCount >= 3) {
          return { id: 'terima_kasih', text: 'Terima Kasih 🙏', label: 'Terima Kasih (Dagu)', type: 'word', confidence: 0.96, motion };
        }
      }

      // KAMU / ANDA: Jari telunjuk menunjuk lurus ke arah kamera (bukan ke dada)
      if (f.index && !f.middle && !f.ring && !f.pinky && this.dist(indexTip, chest) > shoulderWidth * 0.5) {
        return { id: 'kamu', text: 'Kamu', label: 'Kamu / Anda (Tunjuk Depan)', type: 'word', confidence: 0.98, motion };
      }
    }

    return null;
  }

  // 3. KLASIFIKASI UTAMA (FUSI VIDEO MOTION + HAND GEOMETRY)
  recognize(inputData) {
    if (!inputData) {
      this.predictionWindow = [];
      this.motionAnalyzer.reset();
      return null;
    }

    const { pose, hands } = inputData;

    // A. Analisis Gerakan Video Kontinu
    this.motionAnalyzer.addFrame(inputData);
    const motion = this.motionAnalyzer.analyze();

    // B. Prioritas 1: Cek Gestur Posisi Tubuh & Gerakan Video Dinamis
    if (pose) {
      const bodyGesture = this.detectBodyAnchored(pose, hands, motion);
      if (bodyGesture) return this.voteFilter(bodyGesture, null, motion);
    }

    // C. Prioritas 2: Gestur Jari Tangan Kanonikal (Bebas Rotasi)
    if (!hands || hands.length === 0) {
      return null;
    }

    const primaryHand = hands[0];
    const f = this.extractHandFeatures(primaryHand.landmarks);
    if (!f) return null;

    const diagnostic = {
      thumb: f.thumbUp ? 'Jempol Atas' : (f.thumbDown ? 'Jempol Bawah' : (f.thumb ? 'Jempol Buka' : 'Jempol Lipat')),
      index: f.index ? 'Telunjuk Lurus' : 'Telunjuk Lipat',
      middle: f.middle ? 'Tengah Lurus' : 'Tengah Lipat',
      ring: f.ring ? 'Manis Lurus' : 'Manis Lipat',
      pinky: f.pinky ? 'Kelingking Lurus' : 'Kelingking Lipat',
      total: f.totalExtended,
      motion: motion.label
    };

    let candidate = null;

    // THUMBS UP -> Ya / Bagus
    if (f.thumbUp && f.extendedCount === 0) {
      candidate = { id: 'ya_setuju', text: 'Ya / Bagus 👍', label: 'Ya / Bagus', type: 'word', confidence: 0.98 };
    }
    // THUMBS DOWN -> Tidak
    else if (f.thumbDown && f.extendedCount === 0) {
      candidate = { id: 'tidak_bukan', text: 'Tidak 👎', label: 'Tidak', type: 'word', confidence: 0.97 };
    }
    // I LOVE YOU (🤟): [1, 1, 0, 0, 1]
    else if (f.thumb && f.index && !f.middle && !f.ring && f.pinky) {
      candidate = { id: 'i_love_you', text: 'Aku Cinta Kamu 🤟', label: 'I Love You', type: 'word', confidence: 0.99 };
    }
    // KEREN / ROCK ON (🤘): [0, 1, 0, 0, 1]
    else if (!f.thumb && f.index && !f.middle && !f.ring && f.pinky) {
      candidate = { id: 'keren', text: 'Keren! 🤘', label: 'Keren / Rock', type: 'word', confidence: 0.97 };
    }
    // TELEPON / SHAKA / Y (🤙): [1, 0, 0, 0, 1]
    else if (f.thumb && !f.index && !f.middle && !f.ring && f.pinky) {
      candidate = { id: 'telepon', text: 'Hubungi Saya 🤙', label: 'Telepon / Huruf Y', type: 'word', confidence: 0.98 };
    }
    // OKE / SEMPURNA (👌): Pinch Jempol & Telunjuk, 3 jari lurus
    else if (f.pinchIndex < 0.38 && f.middle && f.ring && f.pinky) {
      candidate = { id: 'oke', text: 'Oke 👌', label: 'OK / Sempurna', type: 'word', confidence: 0.98 };
    }
    // DAMAI / PEACE / V (✌️): [0, 1, 1, 0, 0]
    else if (f.index && f.middle && !f.ring && !f.pinky && f.distIndexMid > 0.22) {
      candidate = { id: 'damai', text: 'Damai ✌️', label: 'Damai / Huruf V', type: 'word', confidence: 0.98 };
    }
    // HURUF U: [0, 1, 1, 0, 0] Rapat
    else if (f.index && f.middle && !f.ring && !f.pinky && f.distIndexMid <= 0.22) {
      candidate = { id: 'U', text: 'U', label: 'Huruf U', type: 'letter', confidence: 0.95 };
    }
    // HURUF R: Telunjuk & tengah bersilangan
    else if (f.areIndexMidCrossed) {
      candidate = { id: 'R', text: 'R', label: 'Huruf R', type: 'letter', confidence: 0.95 };
    }
    // HURUF L: [1, 1, 0, 0, 0]
    else if (f.thumb && f.index && !f.middle && !f.ring && !f.pinky) {
      candidate = { id: 'L', text: 'L', label: 'Huruf L', type: 'letter', confidence: 0.98 };
    }
    // HURUF W: [0, 1, 1, 1, 0]
    else if (f.index && f.middle && f.ring && !f.pinky && !f.thumb) {
      candidate = { id: 'W', text: 'W', label: 'Huruf W', type: 'letter', confidence: 0.96 };
    }
    // ANGKA 3: [1, 1, 1, 0, 0]
    else if (f.thumb && f.index && f.middle && !f.ring && !f.pinky) {
      candidate = { id: 'num_3', text: '3', label: 'Angka 3', type: 'number', confidence: 0.95 };
    }
    // HURUF B / ANGKA 4: [0, 1, 1, 1, 1]
    else if (f.extendedCount === 4 && !f.thumb) {
      candidate = { id: 'B', text: 'B', label: 'Huruf B', type: 'letter', confidence: 0.96 };
    }
    // FUSI HALO (LAMBAIAN VIDEO) VS ANGKA 5 (TANGAN DIAM)
    else if (f.totalExtended >= 4 && f.index && f.middle && f.ring && f.pinky) {
      if (motion && motion.isWaving) {
        candidate = { id: 'halo', text: 'Halo! 👋', label: 'Halo (Lambaian Tangan)', type: 'word', confidence: 0.99 };
      } else {
        candidate = { id: 'num_5', text: '5', label: 'Angka 5 (Tangan Diam)', type: 'number', confidence: 0.96 };
      }
    }
    // HURUF D / ANGKA 1: [0, 1, 0, 0, 0]
    else if (f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) {
      if (f.pinchMiddle < 0.35) {
        candidate = { id: 'D', text: 'D', label: 'Huruf D', type: 'letter', confidence: 0.94 };
      } else {
        candidate = { id: 'num_1', text: '1', label: 'Angka 1', type: 'number', confidence: 0.95 };
      }
    }
    // HURUF I: [0, 0, 0, 0, 1]
    else if (f.pinky && !f.index && !f.middle && !f.ring && !f.thumb) {
      candidate = { id: 'I', text: 'I', label: 'Huruf I', type: 'letter', confidence: 0.96 };
    }
    // HURUF C: Melengkung
    else if (f.totalExtended <= 2 && f.pinchIndex > 0.35 && f.pinchIndex < 0.8 && f.thumb) {
      candidate = { id: 'C', text: 'C', label: 'Huruf C', type: 'letter', confidence: 0.92 };
    }
    // HURUF O: Bulat
    else if (f.pinchIndex < 0.32 && f.pinchMiddle < 0.35 && f.extendedCount === 0) {
      candidate = { id: 'O', text: 'O', label: 'Huruf O', type: 'letter', confidence: 0.93 };
    }
    // HURUF A: Mengepal
    else if (f.isFist && !f.thumbUp && !f.thumbDown) {
      candidate = { id: 'A', text: 'A', label: 'Huruf A', type: 'letter', confidence: 0.93 };
    }

    if (candidate) {
      return this.voteFilter(candidate, diagnostic, motion);
    }

    return {
      id: 'detecting',
      text: '',
      label: `Mendeteksi (${f.totalExtended} Jari)`,
      type: 'status',
      confidence: 0.85,
      diagnostic,
      motion
    };
  }

  // Voting konsistensi temporal
  voteFilter(candidate, diagnostic, motion) {
    if (!candidate || candidate.id === 'detecting') {
      return { ...candidate, diagnostic, motion };
    }

    this.predictionWindow.push(candidate);
    if (this.predictionWindow.length > this.windowSize) {
      this.predictionWindow.shift();
    }

    const counts = {};
    this.predictionWindow.forEach(item => {
      counts[item.id] = (counts[item.id] || 0) + 1;
    });

    let bestId = candidate.id;
    let maxCount = 0;
    Object.keys(counts).forEach(id => {
      if (counts[id] > maxCount) {
        maxCount = counts[id];
        bestId = id;
      }
    });

    const bestItem = this.predictionWindow.find(i => i.id === bestId) || candidate;
    return {
      ...bestItem,
      consistency: maxCount / this.predictionWindow.length,
      diagnostic,
      motion
    };
  }

  reset() {
    this.predictionWindow = [];
    if (this.motionAnalyzer) this.motionAnalyzer.reset();
  }
}

window.SignRecognizer = SignRecognizer;
