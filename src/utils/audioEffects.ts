let audioCtx: AudioContext | null = null;
let isMuted = false;
let processOscillator: OscillatorNode | null = null;
let processGain: GainNode | null = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const setMuted = (muted: boolean) => {
  isMuted = muted;
  if (muted && processGain) {
    // Fade out processing loop if muted mid-process
    try {
      processGain.gain.setValueAtTime(processGain.gain.value, audioCtx?.currentTime || 0);
      processGain.gain.exponentialRampToValueAtTime(0.0001, (audioCtx?.currentTime || 0) + 0.2);
      setTimeout(() => {
        if (processOscillator) {
          processOscillator.stop();
          processOscillator = null;
          processGain = null;
        }
      }, 200);
    } catch (e) {
      // Ignore audio errors
    }
  }
};

export const getMuted = () => isMuted;

// Subtle mechanical tactile tick (Hover)
export const playHoverSound = () => {
  if (isMuted) return;
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {
    // Audio context not initialized or blocked
  }
};

// Tactile card drop/reorder tick
export const playReorderSound = () => {
  if (isMuted) return;
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {
    // Audio context not initialized
  }
};

// Cybernetic arpeggio sweep on file upload
export const playUploadSound = () => {
  if (isMuted) return;
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;
    
    // Play 3 quick rising chime notes
    const notes = [440, 660, 880];
    notes.forEach((freq, idx) => {
      const time = now + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.2, time + 0.08);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.04, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.12);
    });
  } catch (e) {
    // Audio context block
  }
};

// Processing Loop - Oscillating engine/scanner sound
export const playProcessLoop = () => {
  if (isMuted) return;
  try {
    const ctx = initAudio();
    if (processOscillator) return; // Already running

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, ctx.currentTime); // Low hum

    // Low Frequency Oscillator to modulate the frequency for "scanner" feel
    lfo.frequency.setValueAtTime(3, ctx.currentTime); // 3Hz wobble
    lfoGain.gain.setValueAtTime(12, ctx.currentTime); // wobble range +/-12Hz

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.2); // Smooth fade in

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(ctx.destination);

    lfo.start();
    osc.start();

    processOscillator = osc;
    processGain = gain;
  } catch (e) {
    // Error starting loop
  }
};

// Stop Processing Loop
export const stopProcessLoop = () => {
  if (!processOscillator || !processGain) return;
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;
    processGain.gain.setValueAtTime(processGain.gain.value, now);
    processGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15); // Fade out
    
    const tempOsc = processOscillator;
    processOscillator = null;
    processGain = null;

    setTimeout(() => {
      try {
        tempOsc.stop();
      } catch (e) {}
    }, 160);
  } catch (e) {
    processOscillator = null;
    processGain = null;
  }
};

// Completion chime - beautiful pentatonic crystal chord
export const playCompletionSound = () => {
  if (isMuted) return;
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;

    // Pentatonic scale notes (C5, D5, E5, G5, A5, C6)
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    
    freqs.forEach((freq, idx) => {
      const time = now + idx * 0.08; // Staggered arpeggio
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      // Add subtle vibrato
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.5, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.03, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc2.start(time);
      osc.stop(time + 1.3);
      osc2.stop(time + 1.3);
    });
  } catch (e) {
    // Error playing chime
  }
};

// Error Buzzer
export const playErrorSound = () => {
  if (isMuted) return;
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.25);

    // Apply filter to make it "cyber" / low-pass buzz
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Error
  }
};
