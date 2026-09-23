// sign_recognizer.js - Engine Pengenalan Bahasa Isyarat Presisi Tinggi (v7.0 Pemisah Tegas Muka vs Dada)
// Memisahkan secara tegas zona anatomi: MUKA (di atas bahu) vs DADA (di bawah bahu)

class SignRecognizer {
  constructor() {
    this.predictionWindow = [];
    this.windowSize = 5;
  }

  dist(p1, p2) {
    if (!p1 || !p2) return 999;
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  // Transformasi Kanonikal Tangan (21 Sendi)
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

  // 1. ZONA ANATOMI TUBUH TEGAS (MUKA VS DADA)
  // Menjamin Dada tidak pernah tertukar dengan Muka!
  detectBodyAnchored(pose, hands) {
    if (!pose || !pose[11] || !pose[12]) return null;

    // Garis Batas Kunci Anatomi
    const shoulderLeft = pose[11];
    const shoulderRight = pose[12];
    const shoulderY = (shoulderLeft.y + shoulderRight.y) / 2; // Garis batas horizontal bahu
    const shoulderWidth = Math.max(0.18, this.dist(shoulderLeft, shoulderRight));

    // Titik Pusat Dada (Strictly DI BAWAH BAHU)
    const chestX = (shoulderLeft.x + shoulderRight.x) / 2;
    const chestY = shoulderY + shoulderWidth * 0.35; // Berada 35% lebar bahu di bawah garis bahu
    const chest = { x: chestX, y: chestY };

    // Validasi Anatomi: Hidung & Muka HARUS berada di ATAS garis bahu!
    const isNoseValid = pose[0] && pose[0].y < shoulderY - 0.03;
    const nose = isNoseValid ? pose[0] : { x: chestX, y: shoulderY - shoulderWidth * 0.45 };

    const mouth = (pose[9] && pose[10] && pose[9].y < shoulderY)
      ? { x: (pose[9].x + pose[10].x) / 2, y: (pose[9].y + pose[10].y) / 2 }
      : { x: nose.x, y: Math.min(shoulderY - 0.04, nose.y + 0.05) };
    const forehead = { x: nose.x, y: nose.y - 0.08 };

    const leftWrist = pose[15];
    const rightWrist = pose[16];

    // ========================================================
    // A. ZONA DADA (STRICTLY DI BAWAH GARIS BAHU: Y > shoulderY)
    // ========================================================

    // 1. CINTA / SAYANG (Kedua tangan menyilang mendekap dada)
    if (leftWrist && rightWrist && leftWrist.y > shoulderY - 0.05 && rightWrist.y > shoulderY - 0.05) {
      const distCross1 = this.dist(leftWrist, shoulderRight);
      const distCross2 = this.dist(rightWrist, shoulderLeft);
      if (distCross1 < shoulderWidth * 0.65 && distCross2 < shoulderWidth * 0.65) {
        return { id: 'cinta', text: 'Cinta ❤️', label: 'Cinta (Peluk Dada)', type: 'word', confidence: 0.99 };
      }
    }

    // 2. TOLONG / MOHON (Kedua tangan rapat di depan dada)
    if (leftWrist && rightWrist && leftWrist.y > shoulderY - 0.05 && rightWrist.y > shoulderY - 0.05) {
      const distBetweenWrists = this.dist(leftWrist, rightWrist);
      const distToChest = this.dist(leftWrist, chest);
      if (distBetweenWrists < shoulderWidth * 0.45 && distToChest < shoulderWidth * 0.75) {
        return { id: 'tolong', text: 'Tolong / Mohon 🙏', label: 'Tolong (Dua Tangan di Dada)', type: 'word', confidence: 0.98 };
      }
    }

    // 3. RUMAH (Kedua tangan membentuk atap di depan dada)
    if (hands && hands.length >= 2) {
      const h1Tip = hands[0].landmarks[8];
      const h2Tip = hands[1].landmarks[8];
      const distTips = this.dist(h1Tip, h2Tip);
      const distWrists = this.dist(hands[0].landmarks[0], hands[1].landmarks[0]);
      if (distTips < shoulderWidth * 0.35 && distWrists > shoulderWidth * 0.6) {
        return { id: 'rumah', text: 'Rumah 🏠', label: 'Rumah (Atap Segitiga)', type: 'word', confidence: 0.98 };
      }
    }

    // GESTUR SATU TANGAN DENGAN PEMISAH ZONA TEGAS
    if (hands && hands.length > 0) {
      const h = hands[0];
      const f = this.extractHandFeatures(h.landmarks);
      if (!f) return null;

      const handY = f.wrist.y;
      const indexTip = f.indexTip;

      // --- ZONA DADA (handY > shoulderY - 0.02 && indexTip.y > shoulderY - 0.05) ---
      if (handY > shoulderY - 0.02 && indexTip.y > shoulderY - 0.05) {
        // SAYA / AKU: Telunjuk menunjuk tepat ke DADA sendiri
        if (this.dist(indexTip, chest) < shoulderWidth * 0.45 && f.index && !f.middle) {
          return { id: 'saya', text: 'Saya', label: 'Saya / Aku (Dada)', type: 'word', confidence: 0.98 };
        }

        // MAAF: Kepalan tangan berada di DADA
        if (this.dist(f.wrist, chest) < shoulderWidth * 0.5 && f.isFist) {
          return { id: 'maaf', text: 'Maaf 🙇', label: 'Maaf (Tangan di Dada)', type: 'word', confidence: 0.97 };
        }
      }

      // --- ZONA MUKA (STRICTLY DI ATAS BAHU: handY < shoulderY && indexTip.y < shoulderY - 0.04) ---
      if (handY < shoulderY && indexTip.y < shoulderY - 0.04) {
        // MAKAN: Tangan menguncup persis di MULUT (bukan di dada!)
        if (this.dist(indexTip, mouth) < shoulderWidth * 0.35 && f.totalExtended <= 2) {
          return { id: 'makan', text: 'Makan 🍽️', label: 'Makan (Di Mulut)', type: 'word', confidence: 0.97 };
        }

        // MINUM: Bentuk cangkir C di MULUT
        if (this.dist(f.wrist, mouth) < shoulderWidth * 0.4 && f.pinchIndex > 0.35 && f.pinchIndex < 0.8) {
          return { id: 'minum', text: 'Minum 🥤', label: 'Minum (Di Mulut)', type: 'word', confidence: 0.97 };
        }

        // PAHAM / BELAJAR: Di DAHI / PELIPIS
        if (this.dist(indexTip, forehead) < shoulderWidth * 0.38 && f.index) {
          return { id: 'paham', text: 'Paham 💡', label: 'Paham (Di Dahi)', type: 'word', confidence: 0.97 };
        }

        // TERIMA KASIH: Tangan datar di DAGU
        if (this.dist(f.wrist, mouth) < shoulderWidth * 0.42 && f.extendedCount >= 3) {
          return { id: 'terima_kasih', text: 'Terima Kasih 🙏', label: 'Terima Kasih (Dagu)', type: 'word', confidence: 0.96 };
        }
      }
    }

    return null;
  }

  // 2. KLASIFIKASI UTAMA
  recognize(inputData) {
    if (!inputData) {
      this.predictionWindow = [];
      return null;
    }

    const { pose, hands } = inputData;

    // 1. Cek Gestur Posisi Tubuh Tegas (Muka vs Dada)
    if (pose) {
      const bodyGesture = this.detectBodyAnchored(pose, hands);
      if (bodyGesture) return this.voteFilter(bodyGesture, null);
    }

    // 2. Gestur Jari Kanonikal (Bebas Rotasi)
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
      total: f.totalExtended
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
    // HALO / ANGKA 5: [1, 1, 1, 1, 1]
    else if (f.totalExtended >= 4 && f.index && f.middle && f.ring && f.pinky) {
      candidate = { id: 'halo', text: 'Halo! 👋', label: 'Halo / Hai', type: 'word', confidence: 0.96 };
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
      return this.voteFilter(candidate, diagnostic);
    }

    return {
      id: 'detecting',
      text: '',
      label: `Mendeteksi (${f.totalExtended} Jari)`,
      type: 'status',
      confidence: 0.85,
      diagnostic
    };
  }

  voteFilter(candidate, diagnostic) {
    if (!candidate || candidate.id === 'detecting') {
      return { ...candidate, diagnostic };
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
      diagnostic
    };
  }

  reset() {
    this.predictionWindow = [];
  }
}

window.SignRecognizer = SignRecognizer;
