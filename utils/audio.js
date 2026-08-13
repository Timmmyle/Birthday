let audioCtx = null;
let soundEnabled = false;

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  if (enabled && typeof window !== "undefined" && !audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
}

export function isSoundEnabled() {
  return soundEnabled;
}

function getAudioContext() {
  if (!soundEnabled) return null;
  if (typeof window === "undefined") return null;
  
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 8-Bit sounds synthesis using Web Audio API
export function playCoinSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
  osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

export function playSpinTick() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.04);
}

export function playWinSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
  const duration = 0.08;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(freq, now + i * duration);

    gain.gain.setValueAtTime(0.08, now + i * duration);
    gain.gain.exponentialRampToValueAtTime(0.005, now + i * duration + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * duration);
    osc.stop(now + i * duration + duration);
  });
}

export function playJackpotSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Celebratory retro arcade arpeggio
  const notes = [
    523.25, 659.25, 783.99, 1046.50, 
    783.99, 1046.50, 1318.51, 1567.98,
    1318.51, 1567.98, 2093.00
  ];
  const duration = 0.06;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(freq, now + i * duration);

    gain.gain.setValueAtTime(0.1, now + i * duration);
    gain.gain.exponentialRampToValueAtTime(0.005, now + i * duration + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * duration);
    osc.stop(now + i * duration + duration);
  });
}

export function playExplosionSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.35);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}
