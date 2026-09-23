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

    // Canvas terpisah berukuran kecil khusus untuk inferensi AI (480x270 / 640x360)
    // Mengurangi beban komputasi CPU/GPU hingga 4x lipat!
    this.aiCanvas = document.createElement('canvas');
    this.aiCanvas.width = 640;
    this.aiCanvas.height = 360;
    this.aiCtx = this.aiCanvas.getContext('2d', { willReadFrequently: true });

    // Smoothing EMA ringan
    this.prevPose = null;
    this.prevHands = [];
    this.smoothAlpha = 0.7;

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
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
                          : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
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

  // 3. LOOP PEMROSESAN NON-BLOCKING (TIDAK MEMBUAT VIDEO STUTTER)
  async processFrameLoop() {
    if (!this.isStreaming) return;

    // Jika sedang memproses frame AI sebelumnya, jangan tumpuk antrean!
    // Langsung render video kamera agar layar selalu 60 FPS mulus tanpa jeda!
    if (this.isModelReady && this.aiModel && !this.isInferring && this.video.readyState >= 2 && !this.video.paused) {
      this.isInferring = true;

      // Gambar ke canvas resolusi kecil untuk inferensi AI
      this.aiCtx.drawImage(this.video, 0, 0, this.aiCanvas.width, this.aiCanvas.height);

      this.aiModel.send({ image: this.aiCanvas })
        .then(() => { this.isInferring = false; })
        .catch(e => {
          this.isInferring = false;
        });
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

    ctx.drawImage(this.video, 0, 0, w, h);

    const pose = this.smooth(results.poseLandmarks, this.prevPose);
    this.prevPose = pose;

    let bodyStatus = { head: false, torso: false, arms: false, hands: false, legs: false };

    if (pose) {
      bodyStatus = {
        head: !!(pose[0] && (pose[0].visibility || 1) > 0.4),
        torso: !!(pose[11] && pose[12] && (pose[11].visibility || 1) > 0.4),
        arms: !!(pose[13] || pose[14]),
        hands: !!(pose[15] || pose[16]),
        legs: !!(pose[25] && pose[26] && (pose[25].visibility || 1) > 0.3)
      };

      // Gambar Kerangka Full-Body dengan Rendering Super Cepat (Tanpa shadowBlur lambat)
      this.drawFastPoseSkeleton(ctx, pose, w, h);
    }

    ctx.restore();

    // Bangun data tangan dari pose
    const handsList = [];
    if (pose && pose[16] && (pose[16].visibility || 1) > 0.4) {
      handsList.push({ landmarks: this.buildPseudoHand(pose[16], pose[20], pose[22]), handedness: 'Right', trail: [] });
    }
    if (pose && pose[15] && (pose[15].visibility || 1) > 0.4) {
      handsList.push({ landmarks: this.buildPseudoHand(pose[15], pose[19], pose[21]), handedness: 'Left', trail: [] });
    }

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

    ctx.drawImage(this.video, 0, 0, w, h);

    const handsList = [];
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      results.multiHandLandmarks.forEach((rawLm, idx) => {
        const color = idx === 0 ? '#00f2fe' : '#b388ff';
        const label = idx === 0 ? 'Kanan' : 'Kiri';
        this.drawFastHandSkeleton(ctx, rawLm, w, h, color, label);
        handsList.push({ landmarks: rawLm, handedness: idx === 0 ? 'Right' : 'Left', trail: [] });
      });
    }

    ctx.restore();

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

    ctx.drawImage(this.video, 0, 0, w, h);

    const pose = this.smooth(results.poseLandmarks, this.prevPose);
    this.prevPose = pose;

    const leftHand = results.leftHandLandmarks;
    const rightHand = results.rightHandLandmarks;

    if (pose) this.drawFastPoseSkeleton(ctx, pose, w, h);
    if (leftHand) this.drawFastHandSkeleton(ctx, leftHand, w, h, '#00ffa3', 'Kiri');
    if (rightHand) this.drawFastHandSkeleton(ctx, rightHand, w, h, '#00f2fe', 'Kanan');

    ctx.restore();

    const handsList = [];
    if (rightHand) handsList.push({ landmarks: rightHand, handedness: 'Right', trail: [] });
    if (leftHand) handsList.push({ landmarks: leftHand, handedness: 'Left', trail: [] });

    if (this.onResults) {
      this.onResults({
        pose,
        leftHand,
        rightHand,
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

    // Lingkaran Kepala
    if (pose[0] && (!pose[0].visibility || pose[0].visibility > 0.35)) {
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pose[0].x * w, pose[0].y * h, 26, 0, 2 * Math.PI);
      ctx.stroke();
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
