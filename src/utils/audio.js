import { getAssetPath } from './paths';

// Web Audio API & Custom Audio Files Engine for FloraOS
// Dual-mode audio engine:
// 1. Automatically detects and plays real audio files placed in /public/sounds/
//    (error.mp3, notification.mp3, click.mp3, window_open.mp3, success.mp3, startup.mp3)
// 2. Seamlessly falls back to Web Audio API synthesis if no custom file is present

let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
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
};

// Candidate paths for custom audio in /public/sounds/
const CUSTOM_AUDIO_CANDIDATES = {
  error: [getAssetPath('/sounds/error.mp3'), getAssetPath('/sounds/error.wav'), getAssetPath('/sounds/error.ogg'), getAssetPath('/sounds/warning.mp3'), getAssetPath('/sounds/warning.wav')],
  notification: [getAssetPath('/sounds/notification.mp3'), getAssetPath('/sounds/notification.wav'), getAssetPath('/sounds/notification.ogg'), getAssetPath('/sounds/chime.mp3')],
  click: [getAssetPath('/sounds/click.mp3'), getAssetPath('/sounds/click.wav'), getAssetPath('/sounds/click.ogg')],
  window_open: [getAssetPath('/sounds/window_open.mp3'), getAssetPath('/sounds/window_open.wav'), getAssetPath('/sounds/window_open.ogg')],
  success: [getAssetPath('/sounds/success.mp3'), getAssetPath('/sounds/success.wav'), getAssetPath('/sounds/success.ogg')],
  startup: [getAssetPath('/sounds/startup.mp3'), getAssetPath('/sounds/startup.wav'), getAssetPath('/sounds/startup.ogg')]
};

// Active verified custom sound files
export const activeCustomAudio = {};

/**
 * Probes the /public/sounds/ directory to detect user-placed audio files
 */
export const probeAudioFiles = async () => {
  if (typeof window === 'undefined') return;
  for (const [type, paths] of Object.entries(CUSTOM_AUDIO_CANDIDATES)) {
    for (const path of paths) {
      try {
        const res = await fetch(path, { method: 'HEAD' });
        const contentType = res.headers.get('content-type') || '';
        // If file exists and is not an HTML SPA fallback page
        if (res.ok && !contentType.includes('text/html')) {
          activeCustomAudio[type] = path;
          break;
        }
      } catch {}
    }
  }
};

// Run probe immediately upon module load
if (typeof window !== 'undefined') {
  probeAudioFiles();
}

/**
 * Helper to play custom user audio if available, or fallback to Web Audio synthesis
 */
const playCustomOrFallback = (type, volume, fallbackFn) => {
  const customUrl = activeCustomAudio[type];
  if (customUrl) {
    try {
      const audio = new Audio(customUrl);
      audio.volume = Math.max(0, Math.min(1, volume));
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          fallbackFn(volume);
        });
      }
      return;
    } catch {
      fallbackFn(volume);
      return;
    }
  }
  fallbackFn(volume);
};

/* ========================================================
   1. SYNTHETIC SOUND GENERATORS (Fallback)
   ======================================================== */

const synthWarningSound = (volume = 0.75) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.linearRampToValueAtTime(0.22 * volume, now + 0.012);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    masterGain.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.35);
    filter.connect(masterGain);

    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(240, now);
    osc1.frequency.exponentialRampToValueAtTime(180, now + 0.08);
    osc1.connect(filter);
    osc1.start(now);
    osc1.stop(now + 0.45);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(290, now);
    osc2.frequency.exponentialRampToValueAtTime(220, now + 0.1);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.14 * volume, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    osc2.connect(gain2);
    gain2.connect(filter);
    osc2.start(now);
    osc2.stop(now + 0.45);

    const oscPunch = ctx.createOscillator();
    oscPunch.type = 'sine';
    oscPunch.frequency.setValueAtTime(150, now);
    oscPunch.exponentialRampToValueAtTime(60, now + 0.06);

    const punchGain = ctx.createGain();
    punchGain.gain.setValueAtTime(0.18 * volume, now);
    punchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    oscPunch.connect(punchGain);
    punchGain.connect(masterGain);
    oscPunch.start(now);
    oscPunch.stop(now + 0.1);
  } catch (err) {
    console.debug('Audio not allowed or supported', err);
  }
};

const synthNotificationSound = (volume = 0.8) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18 * volume, now);
    masterGain.connect(ctx.destination);

    const notes = [
      { freq: 659.25, time: 0, duration: 0.35, gain: 0.12 },
      { freq: 880.00, time: 0.075, duration: 0.40, gain: 0.14 },
      { freq: 1108.73, time: 0.15, duration: 0.55, gain: 0.18 }
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();
      const noteGain = ctx.createGain();

      const startTime = now + note.time;
      const endTime = startTime + note.duration;

      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.linearRampToValueAtTime(note.gain * volume, startTime + 0.01);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, endTime);
      noteGain.connect(masterGain);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, startTime);
      osc.connect(noteGain);
      osc.start(startTime);
      osc.stop(endTime);

      oscHarmonic.type = 'triangle';
      oscHarmonic.frequency.setValueAtTime(note.freq * 2, startTime);
      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(note.gain * 0.25 * volume, startTime);
      harmGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);
      oscHarmonic.connect(harmGain);
      harmGain.connect(noteGain);
      oscHarmonic.start(startTime);
      oscHarmonic.stop(startTime + 0.2);
    });
  } catch (err) {
    console.debug('Audio error', err);
  }
};

const synthClickSound = (volume = 0.35) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.06 * volume, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.025);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.028);
  } catch (err) {
    console.debug('Audio not allowed', err);
  }
};

const synthWindowOpenSound = (volume = 0.5) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.07 * volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    gain.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.connect(gain);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.1);
    osc.connect(filter);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (err) {
    console.debug('Audio error', err);
  }
};

const synthSuccessSound = (volume = 0.6) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.08 * volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440.00, now);
    osc.frequency.setValueAtTime(659.25, now + 0.08);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.32);
  } catch (err) {
    console.debug('Audio not allowed', err);
  }
};

const synthStartupSound = (volume = 0.8) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + (i * 0.07);

      gain.gain.setValueAtTime(0.06 * volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.8);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.connect(gain);
      osc.start(startTime);
      osc.stop(startTime + 1.8);
    });
  } catch (err) {
    console.debug('Audio not allowed', err);
  }
};

/* ========================================================
   2. PUBLIC PLAYBACK METHODS (Custom File -> Synth Fallback)
   ======================================================== */

export const playWarningSound = (volume = 0.75) => {
  playCustomOrFallback('error', volume, synthWarningSound);
};

export const playErrorSound = playWarningSound;

export const playNotificationSound = (volume = 0.8) => {
  playCustomOrFallback('notification', volume, synthNotificationSound);
};

export const playClickSound = (volume = 0.35) => {
  playCustomOrFallback('click', volume, synthClickSound);
};

export const playWindowOpenSound = (volume = 0.5) => {
  playCustomOrFallback('window_open', volume, synthWindowOpenSound);
};

export const playSuccessSound = (volume = 0.6) => {
  playCustomOrFallback('success', volume, synthSuccessSound);
};

export const playStartupSound = (volume = 0.8) => {
  playCustomOrFallback('startup', volume, synthStartupSound);
};
