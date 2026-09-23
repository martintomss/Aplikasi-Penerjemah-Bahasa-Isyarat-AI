// app.js - Controller Utama Aplikasi Penerjemah Bahasa Isyarat Full-Body (v5.0)
document.addEventListener('DOMContentLoaded', () => {
  // 1. Elemen DOM
  const videoElem = document.getElementById('webcamVideo');
  const canvasElem = document.getElementById('arCanvas');
  const startCameraBtn = document.getElementById('startCameraBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');
  const mirrorToggleBtn = document.getElementById('mirrorToggleBtn');
  const muteToggleBtn = document.getElementById('muteToggleBtn');
  const cameraPlaceholder = document.getElementById('cameraPlaceholder');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const handsCountBadge = document.getElementById('handsCountBadge');
  const bodyPartBadge = document.getElementById('bodyPartBadge');
  const bodyTrackingState = document.getElementById('bodyTrackingState');
  const modeSelect = document.getElementById('modeSelect');
  const sensitivitySelect = document.getElementById('sensitivitySelect');

  // Tag Bagian Tubuh (Kepala, Badan, Lengan, Tangan, Kaki)
  const tagHead = document.getElementById('tagHead');
  const tagTorso = document.getElementById('tagTorso');
  const tagArms = document.getElementById('tagArms');
  const tagHands = document.getElementById('tagHands');
  const tagLegs = document.getElementById('tagLegs');

  // HUD Elemen
  const hudGestureBadge = document.getElementById('hudGestureBadge');
  const hudGestureName = document.getElementById('hudGestureName');
  const hudGestureDetail = document.getElementById('hudGestureDetail');
  const hudGestureIcon = document.getElementById('hudGestureIcon');
  const progressCircle = document.getElementById('gestureProgressCircle');

  // Diagnostic Elemen
  const hudDiagnosticBar = document.getElementById('hudDiagnosticBar');
  const diagThumb = document.getElementById('diagThumb');
  const diagIndex = document.getElementById('diagIndex');
  const diagMiddle = document.getElementById('diagMiddle');
  const diagRing = document.getElementById('diagRing');
  const diagPinky = document.getElementById('diagPinky');

  // Papan Terjemahan Teks di Bawah Kamera
  const translatedTextElem = document.getElementById('translatedText');
  const textPlaceholderElem = document.getElementById('textPlaceholder');
  const predictionBar = document.getElementById('predictionBar');
  const predictionChips = document.getElementById('predictionChips');
  const speakBtn = document.getElementById('speakBtn');
  const copyBtn = document.getElementById('copyBtn');
  const spaceBtn = document.getElementById('spaceBtn');
  const backspaceBtn = document.getElementById('backspaceBtn');
  const clearBtn = document.getElementById('clearBtn');
  const autoSpeakToggle = document.getElementById('autoSpeakToggle');

  // Mode Latihan & Kamus
  const practiceName = document.getElementById('practiceName');
  const practiceIcon = document.getElementById('practiceIcon');
  const practiceGuide = document.getElementById('practiceGuide');
  const practiceStatus = document.getElementById('practiceStatus');
  const nextPracticeBtn = document.getElementById('nextPracticeBtn');
  const openDictBtn = document.getElementById('openDictBtn');
  const closeDictBtn = document.getElementById('closeDictBtn');
  const dictionaryModal = document.getElementById('dictionaryModal');
  const dictCardsContainer = document.getElementById('dictCardsContainer');
  const quickDictGrid = document.getElementById('quickDictGrid');
  const quickFilterBar = document.getElementById('quickFilterBar');
  const modalFilterBar = document.getElementById('modalFilterBar');
  const toastNotice = document.getElementById('toastNotice');

  // 2. Inisialisasi Modul
  const recognizer = new window.SignRecognizer();

  const translator = new window.TextTranslator({
    holdDurationMs: 480,
    cooldownMs: 420,
    onProgress: (percent, gesture) => {
      updateHUDProgress(percent, gesture);
    },
    onTextChange: (newText) => {
      renderText(newText);
    },
    onCommit: (addedText, gesture) => {
      checkPracticeMatch(gesture);
    },
    onSuggestions: (suggestions) => {
      renderSuggestions(suggestions);
    }
  });

  // Handler Hasil Deteksi Full-Body (Pose, Wajah, Tangan, Kaki)
  const onDetectorResults = (data) => {
    if (!data) {
      updateBodyTags(null);
      translator.processGesture(null);
      hideHUDGesture();
      hideDiagnostic();
      return;
    }

    const { pose, hands, bodyStatus } = data;

    // Update status anggota tubuh
    updateBodyTags(bodyStatus);

    if (handsCountBadge) {
      handsCountBadge.textContent = `${hands.length} Tangan`;
    }

    if (bodyPartBadge) {
      bodyPartBadge.textContent = (bodyStatus && bodyStatus.torso) ? 'Badan: Aktif' : 'Badan: Menunggu';
    }

    if (bodyTrackingState) {
      bodyTrackingState.textContent = (bodyStatus && (bodyStatus.torso || bodyStatus.head))
        ? 'TUBUH TERDETEKSI ✅'
        : 'MENUNGGU SUBJEK';
    }

    // Klasifikasi Gestur (Full-Body + Hands)
    const result = recognizer.recognize(data);
    if (result) {
      showHUDGesture(result);
      if (result.diagnostic) {
        showDiagnostic(result.diagnostic);
      } else {
        hideDiagnostic();
      }
      translator.processGesture(result);
    } else {
      translator.processGesture(null);
      hideHUDGesture();
      hideDiagnostic();
    }
  };

  const detector = new window.HandDetector(videoElem, canvasElem, onDetectorResults);

  // 3. UI Helpers
  function updateBodyTags(status) {
    if (!status) {
      [tagHead, tagTorso, tagArms, tagHands, tagLegs].forEach(tag => {
        if (tag) tag.classList.remove('detected');
      });
      return;
    }
    if (tagHead) tagHead.classList.toggle('detected', !!status.head);
    if (tagTorso) tagTorso.classList.toggle('detected', !!status.torso);
    if (tagArms) tagArms.classList.toggle('detected', !!status.arms);
    if (tagHands) tagHands.classList.toggle('detected', !!status.hands);
    if (tagLegs) tagLegs.classList.toggle('detected', !!status.legs);
  }

  function renderText(text) {
    if (text && text.length > 0) {
      translatedTextElem.textContent = text;
      textPlaceholderElem.style.display = 'none';
    } else {
      translatedTextElem.textContent = '';
      textPlaceholderElem.style.display = 'inline';
    }
  }

  function renderSuggestions(suggestions) {
    if (!predictionBar || !predictionChips) return;
    if (!suggestions || suggestions.length === 0) {
      predictionBar.style.display = 'none';
      predictionChips.innerHTML = '';
      return;
    }

    predictionChips.innerHTML = '';
    suggestions.forEach(word => {
      const chip = document.createElement('div');
      chip.className = 'prediction-chip';
      chip.textContent = word;
      chip.addEventListener('click', () => {
        translator.applySuggestion(word);
        showToast(`Kata "${word}" diterapkan`);
      });
      predictionChips.appendChild(chip);
    });
    predictionBar.style.display = 'flex';
  }

  function showHUDGesture(gesture) {
    hudGestureBadge.classList.add('visible');
    hudGestureName.textContent = gesture.label;
    hudGestureIcon.textContent = getGestureIcon(gesture.id);
    const pct = Math.round((gesture.confidence || 0.95) * 100);
    hudGestureDetail.textContent = gesture.id === 'detecting' ? 'Menyesuaikan Pose...' : `${pct}% Cocok`;
  }

  function hideHUDGesture() {
    hudGestureBadge.classList.remove('visible');
    updateHUDProgress(0, null);
  }

  function showDiagnostic(diag) {
    if (!hudDiagnosticBar) return;
    hudDiagnosticBar.style.display = 'flex';

    if (diagThumb) {
      diagThumb.textContent = diag.thumb;
      diagThumb.className = 'diagnostic-pill' + (diag.thumb.includes('Buka') || diag.thumb.includes('Atas') ? ' active' : '');
    }
    if (diagIndex) {
      diagIndex.textContent = diag.index;
      diagIndex.className = 'diagnostic-pill' + (diag.index.includes('Lurus') ? ' active' : '');
    }
    if (diagMiddle) {
      diagMiddle.textContent = diag.middle;
      diagMiddle.className = 'diagnostic-pill' + (diag.middle.includes('Lurus') ? ' active' : '');
    }
    if (diagRing) {
      diagRing.textContent = diag.ring;
      diagRing.className = 'diagnostic-pill' + (diag.ring.includes('Lurus') ? ' active' : '');
    }
    if (diagPinky) {
      diagPinky.textContent = diag.pinky;
      diagPinky.className = 'diagnostic-pill' + (diag.pinky.includes('Lurus') ? ' active' : '');
    }
  }

  function hideDiagnostic() {
    if (hudDiagnosticBar) {
      hudDiagnosticBar.style.display = 'none';
    }
  }

  function updateHUDProgress(percent, gesture) {
    if (!progressCircle) return;
    const circumference = 2 * Math.PI * 18;
    const offset = circumference - (percent / 100) * circumference;
    progressCircle.style.strokeDasharray = `${circumference}`;
    progressCircle.style.strokeDashoffset = `${offset}`;

    if (percent > 0) {
      progressCircle.style.stroke = percent >= 95 ? '#00ffa3' : '#00f2fe';
    }
  }

  function getGestureIcon(id) {
    const item = window.SIGN_DICTIONARY.find(d => d.id === id);
    return item ? item.icon : '✨';
  }

  function showToast(msg) {
    if (!toastNotice) return;
    toastNotice.textContent = msg;
    toastNotice.classList.add('show');
    setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 2400);
  }

  // 4. Mode Latihan (Practice Mode)
  let currentPracticeTarget = null;
  const practiceItems = window.SIGN_DICTIONARY.filter(d => [
    'halo', 'terima_kasih', 'makan', 'cinta', 'tolong', 'rumah', 'ya_setuju', 'tidak_bukan',
    'i_love_you', 'damai', 'oke', 'L', 'V', 'W', 'Y', 'A', 'B'
  ].includes(d.id));

  function setPracticeTarget(item) {
    currentPracticeTarget = item;
    if (practiceName) practiceName.textContent = item.label;
    if (practiceIcon) practiceIcon.textContent = item.icon;
    if (practiceGuide) practiceGuide.textContent = item.tips || item.desc;
    if (practiceStatus) {
      practiceStatus.textContent = 'Menunggu Pose Tubuh...';
      practiceStatus.className = 'practice-status-badge waiting';
    }
  }

  function nextPractice() {
    const currentIdx = practiceItems.findIndex(i => i.id === (currentPracticeTarget ? currentPracticeTarget.id : ''));
    const nextIdx = (currentIdx + 1) % practiceItems.length;
    setPracticeTarget(practiceItems[nextIdx]);
  }

  function checkPracticeMatch(gesture) {
    if (!currentPracticeTarget) return;
    if (gesture.id === currentPracticeTarget.id) {
      if (practiceStatus) {
        practiceStatus.textContent = 'Berhasil! Cocok ✅';
        practiceStatus.className = 'practice-status-badge match';
      }
      if (window.soundFX) window.soundFX.playSuccess();
      showToast(`Hebat! Pose ${currentPracticeTarget.label} Sempurna! 🎉`);

      setTimeout(() => {
        nextPractice();
      }, 1600);
    }
  }

  // 5. Inisialisasi Kamus & Filter
  function renderQuickGrid(category = 'all') {
    if (!quickDictGrid || !window.SIGN_DICTIONARY) return;
    quickDictGrid.innerHTML = '';

    const filtered = category === 'all'
      ? window.SIGN_DICTIONARY.slice(0, 24)
      : window.SIGN_DICTIONARY.filter(d => d.category.toLowerCase().includes(category.toLowerCase()));

    filtered.forEach(item => {
      const chip = document.createElement('div');
      chip.className = 'sign-chip';
      chip.title = `${item.label} - ${item.desc}`;
      chip.innerHTML = `
        <div class="sign-chip-icon">${item.icon}</div>
        <div class="sign-chip-label">${item.text}</div>
      `;
      chip.addEventListener('click', () => {
        setPracticeTarget(item);
        showToast(`Latihan: ${item.label}`);
      });
      quickDictGrid.appendChild(chip);
    });
  }

  function renderModalCards(filter = 'all') {
    if (!dictCardsContainer || !window.SIGN_DICTIONARY) return;
    dictCardsContainer.innerHTML = '';

    let items = window.SIGN_DICTIONARY;
    if (filter === 'dynamic') {
      items = items.filter(d => d.isDynamic);
    } else if (filter === 'twoHands') {
      items = items.filter(d => d.twoHands);
    } else if (filter !== 'all') {
      items = items.filter(d => d.category.toLowerCase().includes(filter.toLowerCase()));
    }

    const groups = {};
    items.forEach(it => {
      const cat = it.category || 'Lainnya';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(it);
    });

    Object.keys(groups).forEach(cat => {
      const catItems = groups[cat];
      const catBlock = document.createElement('div');
      catBlock.innerHTML = `<div class="dict-category-title">${cat} (${catItems.length})</div>`;

      const list = document.createElement('div');
      list.className = 'dict-cards-list';

      catItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'dict-card';

        let badgeHtml = '';
        if (item.isDynamic) badgeHtml += `<span class="dict-badge dynamic">⚡ Gerak Dinamis</span>`;
        if (item.twoHands) badgeHtml += `<span class="dict-badge two-hands">🤲 2 Tangan</span>`;

        card.innerHTML = `
          <div class="dict-card-head">
            <span class="dict-card-icon">${item.icon}</span>
            <span class="dict-card-title">${item.label}</span>
            ${badgeHtml}
          </div>
          <div class="dict-card-desc">${item.desc}</div>
          <div class="dict-card-tips">💡 ${item.tips}</div>
        `;

        card.addEventListener('click', () => {
          setPracticeTarget(item);
          dictionaryModal.classList.remove('active');
          showToast(`Target latihan: ${item.label}`);
        });

        list.appendChild(card);
      });

      catBlock.appendChild(list);
      dictCardsContainer.appendChild(catBlock);
    });
  }

  // Filter Listeners
  if (quickFilterBar) {
    quickFilterBar.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-chip')) {
        quickFilterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        renderQuickGrid(e.target.dataset.cat);
      }
    });
  }

  if (modalFilterBar) {
    modalFilterBar.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-filter-btn')) {
        modalFilterBar.querySelectorAll('.modal-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderModalCards(e.target.dataset.filter);
      }
    });
  }

  // 6. Camera & Button Listeners
  startCameraBtn.addEventListener('click', async () => {
    try {
      startCameraBtn.disabled = true;
      statusText.textContent = 'Menyalakan Kamera...';

      await detector.startCamera();

      cameraPlaceholder.style.display = 'none';
      stopCameraBtn.style.display = 'inline-flex';
      startCameraBtn.style.display = 'none';

      statusDot.classList.add('active');
      statusText.textContent = 'Kamera Aktif';
      showToast('Kamera aktif! Posisikan tubuh Anda di depan kamera.');
    } catch (err) {
      console.error('Camera start error:', err);
      let errMsg = 'Gagal menyalakan kamera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Izin kamera belum diberikan. Klik ikon gembok / kamera di sebelah kiri bilah URL browser Anda untuk mengizinkan akses kamera, lalu coba lagi.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'Perangkat kamera tidak ditemukan. Pastikan webcam sudah tersambung.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'Kamera sedang digunakan oleh aplikasi lain (misalnya Zoom, Google Meet, atau Teams). Tutup aplikasi tersebut terlebih dahulu.';
      }
      alert(errMsg);
      statusText.textContent = 'Kamera Gagal';
      startCameraBtn.disabled = false;
    }
  });

  stopCameraBtn.addEventListener('click', () => {
    detector.stopCamera();
    cameraPlaceholder.style.display = 'flex';
    startCameraBtn.style.display = 'inline-flex';
    startCameraBtn.disabled = false;
    stopCameraBtn.style.display = 'none';

    statusDot.classList.remove('active');
    statusText.textContent = 'Sensor Dimatikan';
    if (handsCountBadge) handsCountBadge.textContent = '0 Tangan';
    if (bodyPartBadge) bodyPartBadge.textContent = 'Badan: Siap';
    updateBodyTags(null);
    hideHUDGesture();
    hideDiagnostic();
    showToast('Sensor kamera dimatikan');
  });

  mirrorToggleBtn.addEventListener('click', () => {
    const isMirrored = detector.toggleMirror();
    showToast(isMirrored ? 'Mode Cermin: Aktif' : 'Mode Cermin: Nonaktif');
  });

  muteToggleBtn.addEventListener('click', () => {
    const isMuted = window.soundFX.toggleMute();
    muteToggleBtn.innerHTML = isMuted ? '🔇' : '🔊';
    muteToggleBtn.title = isMuted ? 'Nyalakan Suara' : 'Matikan Suara';
    showToast(isMuted ? 'Suara Dimatikan' : 'Suara Dinyalakan');
  });

  if (modeSelect) {
    modeSelect.addEventListener('change', (e) => {
      detector.switchMode(e.target.value);
      showToast(`Mode diubah: ${modeSelect.options[modeSelect.selectedIndex].text}`);
    });
  }

  if (sensitivitySelect) {
    sensitivitySelect.addEventListener('change', (e) => {
      const ms = parseInt(e.target.value, 10);
      translator.holdDurationMs = ms;
      showToast(`Kecepatan respons: ${ms}ms`);
    });
  }

  // Tombol Teks
  spaceBtn.addEventListener('click', () => translator.addSpace());
  backspaceBtn.addEventListener('click', () => translator.backspace());
  clearBtn.addEventListener('click', () => {
    translator.clear();
    showToast('Teks dibersihkan');
  });

  copyBtn.addEventListener('click', async () => {
    const ok = await translator.copyText();
    if (ok) {
      showToast('Teks berhasil disalin ke clipboard! 📋');
    } else {
      showToast('Tidak ada teks untuk disalin.');
    }
  });

  speakBtn.addEventListener('click', () => {
    if (!translator.text || translator.text.trim() === '') {
      showToast('Belum ada teks untuk diucapkan');
      return;
    }
    translator.speak();
    showToast('Membacakan teks... 🗣️');
  });

  autoSpeakToggle.addEventListener('change', (e) => {
    translator.autoSpeak = e.target.checked;
    showToast(e.target.checked ? 'Suara otomatis diaktifkan' : 'Suara otomatis dinonaktifkan');
  });

  nextPracticeBtn.addEventListener('click', () => nextPractice());

  // Modal Kamus
  openDictBtn.addEventListener('click', () => {
    dictionaryModal.classList.add('active');
    renderModalCards('all');
  });

  closeDictBtn.addEventListener('click', () => {
    dictionaryModal.classList.remove('active');
  });

  dictionaryModal.addEventListener('click', (e) => {
    if (e.target === dictionaryModal) {
      dictionaryModal.classList.remove('active');
    }
  });

  // Setup Awal
  renderQuickGrid('all');
  renderModalCards('all');
  setPracticeTarget(practiceItems[0]);
});
