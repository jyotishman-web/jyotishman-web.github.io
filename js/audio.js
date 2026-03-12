// ═══════════════════════════════════════════════
//  AUDIO ENGINE  (Web Audio API — no files needed)
// ═══════════════════════════════════════════════
'use strict';

let audioCtx     = null;
let engineOsc    = null;
let engineOsc2   = null;
let engineFilter = null;
let engineGain   = null;
let audioReady   = false;

function initAudio() {
  if (audioReady) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // ── Jeep engine: deep square + sawtooth sub-harmonic ──
    engineOsc        = audioCtx.createOscillator();
    engineOsc.type   = 'square';
    engineOsc.frequency.value = 38;      // very low idle

    engineOsc2       = audioCtx.createOscillator();
    engineOsc2.type  = 'sawtooth';
    engineOsc2.frequency.value = 19;     // one octave below — sub rumble

    const mix1 = audioCtx.createGain(); mix1.gain.value = 0.6;
    const mix2 = audioCtx.createGain(); mix2.gain.value = 0.55;
    engineOsc.connect(mix1);
    engineOsc2.connect(mix2);

    // Gentle soft-clip overdrive (not harsh distortion)
    const waveShaper  = audioCtx.createWaveShaper();
    const curve       = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (i * 2) / 512 - 1;
      curve[i] = (3 + 18) * x / (Math.PI + 18 * Math.abs(x));
    }
    waveShaper.curve      = curve;
    waveShaper.oversample = '2x';

    // Heavy lowpass — keeps only the deep exhaust rumble
    engineFilter           = audioCtx.createBiquadFilter();
    engineFilter.type      = 'lowpass';
    engineFilter.frequency.value = 180;
    engineFilter.Q.value   = 0.8;

    // Peaking band at 90 Hz for "bwaaah" exhaust resonance
    const bandpass         = audioCtx.createBiquadFilter();
    bandpass.type          = 'peaking';
    bandpass.frequency.value = 90;
    bandpass.Q.value       = 1.2;
    bandpass.gain.value    = 8;

    engineGain             = audioCtx.createGain();
    engineGain.gain.value  = 0;

    mix1.connect(waveShaper);
    mix2.connect(waveShaper);
    waveShaper.connect(engineFilter);
    engineFilter.connect(bandpass);
    bandpass.connect(engineGain);
    engineGain.connect(audioCtx.destination);

    engineOsc.start();
    engineOsc2.start();
    audioReady = true;
  } catch (e) {
    console.warn('Audio init failed:', e);
  }
}

function updateEngineSound(rpm, gasOn, brakeOn) {
  if (!audioReady || !audioCtx) return;
  const t = audioCtx.currentTime;

  // Jeep RPM range → deep pitch (35–75 Hz), never screamy
  const baseFreq = 35 + (rpm / MAX_RPM) * 40;
  engineOsc.frequency.setTargetAtTime(baseFreq,       t, 0.12);
  engineOsc2.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.15);

  // Filter opens slightly under throttle — exhaust opens up
  engineFilter.frequency.setTargetAtTime(gasOn ? 280 : 150, t, 0.15);

  // Volume: idle hum → load roar
  const vol = gasOn ? 0.32 : brakeOn ? 0.20 : 0.13;
  engineGain.gain.setTargetAtTime(vol, t, 0.08);
}

function muteEngine() {
  if (!audioReady || !engineGain) return;
  engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.3);
}

function playSound(type) {
  if (!audioReady || !audioCtx) return;
  const t = audioCtx.currentTime;

  if (type === 'coin') {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.25);

  } else if (type === 'fuel') {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.35);

    const osc2  = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046, t + 0.1);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.setValueAtTime(0.25, t + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc2.connect(gain2); gain2.connect(audioCtx.destination);
    osc2.start(t); osc2.stop(t + 0.5);

  } else if (type === 'crash') {
    const buf  = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.6, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.08));
    const src  = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    const filt = audioCtx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 180;
    src.buffer = buf;
    gain.gain.setValueAtTime(1.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination);
    src.start(t);

  } else if (type === 'land') {
    const buf  = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.15, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.02));
    const src  = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    const filt = audioCtx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 300;
    src.buffer = buf;
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination);
    src.start(t);

  } else if (type === 'screech') {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220 + Math.random() * 80, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.18);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.2);
  }
}
