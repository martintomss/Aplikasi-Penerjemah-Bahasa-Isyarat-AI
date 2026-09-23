// text_translator.js - Manajemen Penerjemahan Teks, Grace-Period Timer, & Indonesian TTS (v3.0)
class TextTranslator {
  constructor(options = {}) {
    this.text = '';
    this.history = [];
    this.holdDurationMs = options.holdDurationMs || 550; // Waktu tahan dipercepat agar responsif
    this.cooldownMs = options.cooldownMs || 450;
    this.autoSpeak = false;

    this.currentCandidate = null;
    this.holdStartTime = null;
    this.lastSeenTime = 0;
    this.lastCommittedId = null;
    this.lastCommittedTime = 0;

    // Callbacks
    this.onProgress = options.onProgress || (() => {});
    this.onTextChange = options.onTextChange || (() => {});
    this.onCommit = options.onCommit || (() => {});
    this.onSuggestions = options.onSuggestions || (() => {});

    // TTS Setup
    this.synth = window.speechSynthesis || null;
    this.selectedVoice = null;
    this.initTTS();
  }

  initTTS() {
    if (!this.synth) return;
    const loadVoices = () => {
      const voices = this.synth.getVoices();
      this.selectedVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID')) ||
                           voices.find(v => v.default) || voices[0];
    };
    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  // Pemrosesan hasil per frame dengan toleransi Grace-Period
  processGesture(recognitionResult) {
    const now = performance.now();

    // Jika tidak ada deteksi atau hanya status umum
    if (!recognitionResult || recognitionResult.type === 'status' || !recognitionResult.id || recognitionResult.id === 'detecting') {
      // Berikan toleransi 180ms sebelum mereset hold timer untuk mencegah getaran kamera sesaat
      if (this.currentCandidate && (now - this.lastSeenTime < 180)) {
        return;
      }
      this.resetHold();
      return;
    }

    const { id, text, type } = recognitionResult;

    // Gestur dinamis memiliki durasi hold lebih singkat
    const isDynamic = recognitionResult.label && (
      recognitionResult.label.includes('Melambai') ||
      recognitionResult.label.includes('Angguk') ||
      recognitionResult.label.includes('Geleng')
    );
    const targetHoldMs = isDynamic ? 340 : this.holdDurationMs;

    // Cek Cooldown untuk gestur yang sama persis
    if (this.lastCommittedId === id && (now - this.lastCommittedTime) < this.cooldownMs) {
      this.onProgress(0, recognitionResult);
      return;
    }

    // Jika masih gestur yang sama
    if (this.currentCandidate && this.currentCandidate.id === id) {
      this.lastSeenTime = now;
      const elapsed = now - this.holdStartTime;
      const progress = Math.min(100, (elapsed / targetHoldMs) * 100);

      this.onProgress(progress, recognitionResult);

      if (progress > 55 && Math.random() < 0.25) {
        if (window.soundFX) window.soundFX.playTick();
      }

      if (progress >= 100) {
        this.commitGesture(recognitionResult);
        this.resetHold();
        this.lastCommittedId = id;
        this.lastCommittedTime = now;
      }
    } else {
      // Jika gestur baru muncul
      this.currentCandidate = recognitionResult;
      this.holdStartTime = now;
      this.lastSeenTime = now;
      this.onProgress(0, recognitionResult);
    }
  }

  resetHold() {
    this.currentCandidate = null;
    this.holdStartTime = null;
    this.lastSeenTime = 0;
    this.onProgress(0, null);
  }

  // Komit karakter atau kata
  commitGesture(gesture) {
    let added = '';
    if (gesture.type === 'word') {
      if (this.text.length > 0 && !this.text.endsWith(' ')) {
        this.text += ' ';
      }
      this.text += gesture.text;
      added = gesture.text;
    } else if (gesture.type === 'letter' || gesture.type === 'number') {
      this.text += gesture.text;
      added = gesture.text;
    }

    if (window.soundFX) window.soundFX.playLock();

    this.onTextChange(this.text);
    this.onCommit(added, gesture);
    this.updateWordSuggestions();

    if (this.autoSpeak && gesture.type === 'word') {
      this.speak(gesture.text);
    }
  }

  // Autocomplete Kata Bahasa Indonesia
  updateWordSuggestions() {
    if (!window.INDONESIAN_WORDS) {
      this.onSuggestions([]);
      return;
    }

    const parts = this.text.split(' ');
    const lastWord = parts[parts.length - 1].toUpperCase().trim();

    if (!lastWord || lastWord.length === 0) {
      this.onSuggestions([]);
      return;
    }

    const matches = window.INDONESIAN_WORDS.filter(w => w.startsWith(lastWord) && w !== lastWord).slice(0, 5);
    this.onSuggestions(matches);
  }

  applySuggestion(completedWord) {
    const parts = this.text.split(' ');
    parts.pop();
    parts.push(completedWord);
    this.text = parts.join(' ') + ' ';

    if (window.soundFX) window.soundFX.playLock();
    this.onTextChange(this.text);
    this.updateWordSuggestions();
  }

  addSpace() {
    if (this.text.length > 0 && !this.text.endsWith(' ')) {
      this.text += ' ';
      this.onTextChange(this.text);
      this.updateWordSuggestions();
      if (window.soundFX) window.soundFX.playTick();
    }
  }

  backspace() {
    if (this.text.length > 0) {
      this.text = this.text.slice(0, -1);
      this.onTextChange(this.text);
      this.updateWordSuggestions();
      if (window.soundFX) window.soundFX.playClear();
    }
  }

  clear() {
    if (this.text.trim().length > 0) {
      this.history.unshift({
        text: this.text,
        timestamp: new Date().toLocaleTimeString('id-ID')
      });
      if (this.history.length > 15) this.history.pop();
    }
    this.text = '';
    this.onTextChange(this.text);
    this.onSuggestions([]);
    if (window.soundFX) window.soundFX.playClear();
  }

  async copyText() {
    if (!this.text) return false;
    try {
      await navigator.clipboard.writeText(this.text);
      return true;
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = this.text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  }

  speak(customText = null) {
    if (!this.synth) return;
    const toSpeak = customText || this.text;
    if (!toSpeak || toSpeak.trim() === '') return;

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(toSpeak);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    this.synth.speak(utterance);
  }

  toggleAutoSpeak() {
    this.autoSpeak = !this.autoSpeak;
    return this.autoSpeak;
  }
}

window.TextTranslator = TextTranslator;
