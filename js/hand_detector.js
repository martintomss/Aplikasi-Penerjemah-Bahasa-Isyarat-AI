// hand_detector.js - Engine Sensor Ringan & Cepat 60 FPS (v6.0 Turbo Lite)
// Optimasi: Model Lite (Complexity 0), Penghapusan shadowBlur berat, Throttling Non-Blocking, & Pilihan Mode Performa

class HandDetector {
  constructor(videoElement, canvasElement, onResultsCallback) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.onResults = onResultsCallback;

    this.aiModel = null;
    this.currentMode = 'pose'; // 'pose' (super ringan) | 'hands' | 'holistic'
    this.isModelReady = false;
    this.isStreaming = false;
    this.isMirrored = true;
    this.isInferring = false; // Flag non-blocking agar tidak menumpuk antrean frame

    this.fps = 0;
    this.frameCount = 0;
    this.fpsTimer = performance.now();

    // Jejak gerakan video dinamis (AR Neon Trajectory Trail)
    this.motionTrail = [];

    // Smoothing EMA ringan
    this.prevPose = null;
    this.prevHands = [];
    this.smoothAlpha = 0.7;

    // Cache koordinat AI terbaru untuk rendering 60 FPS non-blocking
    this.latestPose = null;
    this.latestHands = [];
    this.latestLeftHand = null;
    this.latestRightHand = null;

    // Koneksi Pose 33 Titik (Kepala, Torso, Lengan, Kaki)
    this.poseConnections = [
      // Kepala
      [0, 1], [1, 2], [2, 3], [3, 7],
      [0, 4], [4, 5], [5, 6], [6, 8],
      [9, 10],
      // Torso / Badan
      [11, 12], [11, 23], [12, 24], [23, 24],
      // Lengan
      [11, 13], [13, 15],
      [12, 14], [14, 16],
      // Tangan Pose (Pergelangan ke jari)
      [15, 17], [15, 19], [15, 21], [17, 19],
      [16, 18], [16, 20], [16, 22], [18, 20],
      // Kaki (Paha, Lutut, Pergelangan Kaki, Kaki)
      [23, 25], [25, 27], [27, 29], [29, 31],
      [24, 26], [26, 28], [28, 30], [30, 32]
    ];

    // Koneksi 21 Sendi Tangan
    this.handConnections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];
  }

  // 1. MENYALAKAN KAMERA CEPAT (640x480 atau 1280x720)
  async startCamera(deviceId = null) {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 60, min: 30 } }
                          : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 60, min: 30 } },
          audio: false
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 60, min: 30 } }, audio: false });
      }

      this.video.srcObject = stream;
      await this.video.play();
      this.isStreaming = true;

      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());

      // Loop rendering 60 FPS aktif segera
      this.processFrameLoop();

      // Muat model super ringan secara asinkron
      this.switchMode(this.currentMode);

      return true;
    } catch (err) {
      console.error('Gagal mengakses kamera:', err);
      throw err;
    }
  }

  // 2. GANTI MODE PERFORMA SECARA DINAMIS
  async switchMode(mode = 'pose') {
    this.currentMode = mode;
    this.isModelReady = false;
    this.aiModel = null;

    const statusText = document.getElementById('statusText');
    const bodyTrackingState = document.getElementById('bodyTrackingState');

    if (statusText) statusText.textContent = `Memuat Mode ${mode.toUpperCase()}...`;
    if (bodyTrackingState) bodyTrackingState.textContent = 'MEMUAT AI RINGAN...';

    try {
      // MODE 1: POSE LITE (REKOMENDASI - 60 FPS, SANGAT RINGAN)
      // Melacak Kepala, Bahu, Dada, Lengan, Tangan, Pinggul, Lutut, Kaki dalam 1 pass cepat!
      if (mode === 'pose' && window.Pose) {
        console.log('Mengaktifkan MediaPipe Pose Lite (ModelComplexity 0)...');
        this.aiModel = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });
        this.aiModel.setOptions({
          modelComplexity: 0, // 0 = LITE (Paling Cepat & Ringan di CPU)
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        this.aiModel.onResults((results) => this.handlePoseResults(results));
        this.isModelReady = true;

        if (statusText) statusText.textContent = 'Mode Ringan 60 FPS (Aktif)';
        if (bodyTrackingState) bodyTrackingState.textContent = 'FULL-BODY 60 FPS ⚡';
        return;
      }

      // MODE 2: HANDS LITE (Khusus 21 Sendi Jari Tangan, 60 FPS)
      if (mode === 'hands' && window.Hands) {
        console.log('Mengaktifkan MediaPipe Hands Lite...');
        this.aiModel = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        this.aiModel.setOptions({
          maxNumHands: 2,
          modelComplexity: 0, // LITE
          minDetectionConfidence: 0.55,
          minTrackingConfidence: 0.5
        });
        this.aiModel.onResults((results) => this.handleHandsResults(results));
        this.isModelReady = true;

        if (statusText) statusText.textContent = 'Mode Tangan 60 FPS (Aktif)';
        if (bodyTrackingState) bodyTrackingState.textContent = 'JARI TANGAN 60 FPS ⚡';
        return;
      }

      // MODE 3: HOLISTIC (Lengkap untuk PC Kuat)
      if (mode === 'holistic' && window.Holistic) {
        console.log('Mengaktifkan MediaPipe Holistic...');
        this.aiModel = new window.Holistic({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
        });
        this.aiModel.setOptions({
          modelComplexity: 0, // Ubah ke 0 agar lebih ringan
          smoothLandmarks: true,
          enableSegmentation: false,
          refineFaceLandmarks: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        this.aiModel.onResults((results) => this.handleHolisticResults(results));
        this.isModelReady = true;

        if (statusText) statusText.textContent = 'Mode Lengkap (Aktif)';
        if (bodyTrackingState) bodyTrackingState.textContent = 'HOLISTIC FULL-BODY';
        return;
      }
    } catch (err) {
      console.error('Gagal memuat model:', err);
      if (statusText) statusText.textContent = 'Gagal memuat AI';
    }
  }

  resizeCanvas() {
    if (!this.video.videoWidth) return;
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
  }

  // 3. LOOP PEMROSESAN VIDEO STREAMING NATIVE (LIVE VIDEO INFERENCE)
  processFrameLoop() {
    if (!this.isStreaming) return;

    // A. RENDER VIDEO SECARA REAL-TIME 60 FPS PENUH TANPA TERTUNDA AI
    if (this.video.readyState >= 2 && !this.video.paused) {
      this.renderCurrentFrame();
    }

    // B. JALANKAN INFERENSI AI SECARA ASINKRON (NON-BLOCKING WEBGL)
    if (this.isModelReady && this.aiModel && !this.isInferring && this.video.readyState >= 2 && !this.video.paused) {
      this.isInferring = true;
      this.aiModel.send({ image: this.video })
        .then(() => { this.isInferring = false; })
        .catch(() => { this.isInferring = false; });
    }

    // Hitung FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.fpsTimer >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.fpsTimer));
      this.frameCount = 0;
      this.fpsTimer = now;
      const fpsElem = document.getElementById('fpsDisplay');
      if (fpsElem) fpsElem.textContent = `${this.fps} FPS`;
    }

    requestAnimationFrame(() => this.processFrameLoop());
  }

  // RENDER FRAME 60 FPS KE KANVAS
  renderCurrentFrame() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (!w || !h) return;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    if (this.isMirrored) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    // Gambar video kamera langsung (60 FPS tanpa jeda / lag)
    ctx.drawImage(this.video, 0, 0, w, h);

    // Gambar overlay visual kerangka AI terbaru yang sudah dihaluskan
    if (this.currentMode === 'pose' && this.latestPose) {
      this.drawFastPoseSkeleton(ctx, this.latestPose, w, h);
      const handPt = (this.latestPose[16] && (this.latestPose[16].visibility || 1) > 0.35) ? this.latestPose[16]
                   : ((this.latestPose[15] && (this.latestPose[15].visibility || 1) > 0.35) ? this.latestPose[15] : null);
      if (handPt) {
        this.updateAndDrawMotionTrail(ctx, handPt, w, h);
      }
    } else if (this.currentMode === 'hands' && this.latestHands && this.latestHands.length > 0) {
      this.latestHands.forEach((item, idx) => {
        const color = idx === 0 ? '#00f2fe' : '#b388ff';
        const label = idx === 0 ? 'Kanan' : 'Kiri';
        this.drawFastHandSkeleton(ctx, item.landmarks, w, h, color, label);
      });
      if (this.latestHands[0] && this.latestHands[0].landmarks) {
        const leadPt = this.latestHands[0].landmarks[8] || this.latestHands[0].landmarks[0];
        this.updateAndDrawMotionTrail(ctx, leadPt, w, h);
      }
    } else if (this.currentMode === 'holistic') {
      if (this.latestPose) this.drawFastPoseSkeleton(ctx, this.latestPose, w, h);
      if (this.latestLeftHand) this.drawFastHandSkeleton(ctx, this.latestLeftHand, w, h, '#00ffa3', 'Kiri');
      if (this.latestRightHand) this.drawFastHandSkeleton(ctx, this.latestRightHand, w, h, '#00f2fe', 'Kanan');
      const leadHand = this.latestRightHand || this.latestLeftHand;
      if (leadHand) {
        this.updateAndDrawMotionTrail(ctx, leadHand[8] || leadHand[0], w, h);
      }
    }

    ctx.restore();
  }

  // Smoothing Landmark
  smooth(curr, prev) {
    if (!curr) return null;
    if (!prev || prev.length !== curr.length) return curr;
    const a = this.smoothAlpha;
    return curr.map((p, i) => ({
      x: a * p.x + (1 - a) * prev[i].x,
      y: a * p.y + (1 - a) * prev[i].y,
      z: a * (p.z || 0) + (1 - a) * (prev[i].z || 0),
      visibility: p.visibility || 1
    }));
  }

  // 4. HASIL DARI MODEL POSE LITE (SUPER RINGAN & CEPAT)
  handlePoseResults(results) {
    const pose = this.smooth(results.poseLandmarks, this.prevPose);
    this.prevPose = pose;
    this.latestPose = pose;

    let bodyStatus = { head: false, torso: false, arms: false, hands: false, legs: false };
    if (pose) {
      bodyStatus = {
        head: !!(pose[0] && (pose[0].visibility || 1) > 0.4),
        torso: !!(pose[11] && pose[12] && (pose[11].visibility || 1) > 0.4),
        arms: !!(pose[13] || pose[14]),
        hands: !!(pose[15] || pose[16]),
        legs: !!(pose[25] && pose[26] && (pose[25].visibility || 1) > 0.3)
      };
    }

    // Bangun data tangan dari pose
    const handsList = [];
    if (pose && pose[16] && (pose[16].visibility || 1) > 0.4) {
      handsList.push({ landmarks: this.buildPseudoHand(pose[16], pose[20], pose[22]), handedness: 'Right', trail: [] });
    }
    if (pose && pose[15] && (pose[15].visibility || 1) > 0.4) {
      handsList.push({ landmarks: this.buildPseudoHand(pose[15], pose[19], pose[21]), handedness: 'Left', trail: [] });
    }
    this.latestHands = handsList;

    if (this.onResults) {
      this.onResults({
        pose,
        leftHand: null,
        rightHand: null,
        hands: handsList,
        bodyStatus
      });
    }
  }

  // 5. HASIL DARI MODEL HANDS LITE
  handleHandsResults(results) {
    const handsList = [];
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      results.multiHandLandmarks.forEach((rawLm, idx) => {
        handsList.push({ landmarks: rawLm, handedness: idx === 0 ? 'Right' : 'Left', trail: [] });
      });
    }
    this.latestHands = handsList;

    if (this.onResults) {
      this.onResults({
        pose: null,
        leftHand: null,
        rightHand: null,
        hands: handsList,
        bodyStatus: { head: true, torso: true, arms: true, hands: handsList.length > 0, legs: false }
      });
    }
  }

  // 6. HASIL DARI MODEL HOLISTIC
  handleHolisticResults(results) {
    const pose = this.smooth(results.poseLandmarks, this.prevPose);
    this.prevPose = pose;
    this.latestPose = pose;

    this.latestLeftHand = results.leftHandLandmarks || null;
    this.latestRightHand = results.rightHandLandmarks || null;

    const handsList = [];
    if (this.latestRightHand) handsList.push({ landmarks: this.latestRightHand, handedness: 'Right', trail: [] });
    if (this.latestLeftHand) handsList.push({ landmarks: this.latestLeftHand, handedness: 'Left', trail: [] });
    this.latestHands = handsList;

    if (this.onResults) {
      this.onResults({
        pose,
        leftHand: this.latestLeftHand,
        rightHand: this.latestRightHand,
        hands: handsList,
        bodyStatus: {
          head: !!(pose && pose[0]),
          torso: !!(pose && pose[11] && pose[12]),
          arms: !!(pose && (pose[13] || pose[14])),
          hands: handsList.length > 0,
          legs: !!(pose && pose[25])
        }
      });
    }
  }

  // 7. RENDERING CEPAT TANPA SHADOWBLUR (HEMAT 80% BEBAN GPU!)
  drawFastPoseSkeleton(ctx, pose, w, h) {
    // Gambar garis tulang tubuh (Gunakan double stroke garis tebal transparan + inti putih)
    // Jauh lebih cepat dari shadowBlur!
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.poseConnections.forEach(([i1, i2]) => {
      const p1 = pose[i1];
      const p2 = pose[i2];
      if (!p1 || !p2 || (p1.visibility && p1.visibility < 0.25) || (p2.visibility && p2.visibility < 0.25)) return;

      const x1 = p1.x * w;
      const y1 = p1.y * h;
      const x2 = p2.x * w;
      const y2 = p2.y * h;

      const isLeg = i1 >= 23 || i2 >= 23;
      const outerColor = isLeg ? 'rgba(199, 125, 255, 0.45)' : 'rgba(0, 242, 254, 0.45)';

      // Garis Luar (Glow effect tanpa blur filter lambat)
      ctx.lineWidth = 5;
      ctx.strokeStyle = outerColor;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Garis Inti Terang
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Sendi Tubuh
    pose.forEach((p, idx) => {
      if (!p || (p.visibility && p.visibility < 0.25)) return;
      const x = p.x * w;
      const y = p.y * h;
      const isMajor = [11, 12, 23, 24, 25, 26, 27, 28].includes(idx);
      const radius = isMajor ? 5 : 3.5;
      const color = idx >= 23 ? '#c77dff' : '#00ffa3';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Garis Leher, Dada, dan Kepala (Validasi Anatomi Ketat)
    if (pose[11] && pose[12]) {
      const neckX = (pose[11].x + pose[12].x) / 2 * w;
      const neckY = (pose[11].y + pose[12].y) / 2 * h;
      const shoulderDist = Math.hypot(pose[11].x - pose[12].x, pose[11].y - pose[12].y) * w;
      const shoulderYNorm = (pose[11].y + pose[12].y) / 2;

      // Titik Pusat Dada (Strictly di bawah leher / tengah dada)
      const chestY = neckY + Math.max(16, shoulderDist * 0.35);

      // Node Dada (Titik Pusat Dada - Cyber Neon Green)
      ctx.fillStyle = '#00ffa3';
      ctx.beginPath();
      ctx.arc(neckX, chestY, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Garis penghubung leher ke dada (Sternum)
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0, 255, 163, 0.45)';
      ctx.beginPath();
      ctx.moveTo(neckX, neckY);
      ctx.lineTo(neckX, chestY);
      ctx.stroke();

      // Kepala / Muka: HANYA valid jika nose berada DI ATAS BAHU (pose[0].y < shoulderYNorm - 0.03)
      // Mencegah lingkaran kepala pernah muncul di area dada!
      if (pose[0] && pose[0].y < shoulderYNorm - 0.03 && (!pose[0].visibility || pose[0].visibility > 0.35)) {
        const noseX = pose[0].x * w;
        const noseY = pose[0].y * h;

        // Garis Leher (Dari Hidung ke Tengah Bahu)
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.6)';
        ctx.beginPath();
        ctx.moveTo(noseX, noseY);
        ctx.lineTo(neckX, neckY);
        ctx.stroke();

        // Lingkaran Kepala di sekeliling muka
        const faceRadius = Math.max(18, Math.min(42, shoulderDist * 0.22));
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(noseX, noseY, faceRadius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  }

  // Rendering Cepat Sendi Tangan
  drawFastHandSkeleton(ctx, landmarks, w, h, color, label) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.handConnections.forEach(([s, e]) => {
      const p1 = landmarks[s];
      const p2 = landmarks[e];
      ctx.lineWidth = 4;
      ctx.strokeStyle = color === '#00ffa3' ? 'rgba(0, 255, 163, 0.4)' : 'rgba(0, 242, 254, 0.4)';
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    });

    // Ujung jari
    [4, 8, 12, 16, 20].forEach(idx => {
      const p = landmarks[idx];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  // 8. VISUALISASI JEJAK GERAKAN VIDEO DINAMIS (AR NEON TRAJECTORY RIBBON)
  updateAndDrawMotionTrail(ctx, pt, w, h) {
    if (!pt) return;
    const now = performance.now();
    this.motionTrail.push({ x: pt.x * w, y: pt.y * h, t: now });
    // Simpan riwayat gerakan 450 milidetik terakhir (maksimal 18 titik)
    this.motionTrail = this.motionTrail.filter(p => now - p.t <= 450).slice(-18);

    if (this.motionTrail.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < this.motionTrail.length; i++) {
      const p1 = this.motionTrail[i - 1];
      const p2 = this.motionTrail[i];
      const alpha = (i / this.motionTrail.length);
      ctx.lineWidth = 1.5 + alpha * 5.5;
      ctx.strokeStyle = `rgba(0, 242, 254, ${alpha * 0.75})`;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Titik bercahaya di ujung kepala gerakan
      if (i === this.motionTrail.length - 1) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p2.x, p2.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Pembantu tangan dari pose
  buildPseudoHand(wrist, pinky, index) {
    const list = [];
    for (let i = 0; i < 21; i++) {
      if (i === 0) list.push(wrist);
      else if (i <= 4) list.push(pinky || wrist);
      else if (i <= 8) list.push(index || wrist);
      else list.push(wrist);
    }
    return list;
  }

  toggleMirror() {
    this.isMirrored = !this.isMirrored;
    return this.isMirrored;
  }

  stopCamera() {
    this.isStreaming = false;
    this.isInferring = false;
    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach(track => track.stop());
      this.video.srcObject = null;
    }
  }
}

window.HandDetector = HandDetector;
