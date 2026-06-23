let audioCtx: AudioContext | null = null;
let isMuted = false;
let processOscillator: OscillatorNode | null = null;
let processOscillator2: OscillatorNode | null = null;
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
      processGain.gain.exponentialRampToValueAtTime(0.0001, (audioCtx?.currentTime || 0) + 0.3);
      setTimeout(() => {
        if (processOscillator) {
          try { processOscillator.stop(); } catch(e){}
          processOscillator = null;
        }
        if (processOscillator2) {
          try { processOscillator2.stop(); } catch(e){}
          processOscillator2 = null;
        }
        processGain = null;
      }, 310);
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

// Cybernetic arpeggio sweep on file upload -> Soothing warm acoustic chime
export const playUploadSound = () => {
  if (isMuted) return;
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Warm, soothing major dyad (C5 and E5) + soft E6 shimmer
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now);

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1318.51, now); // soft high octave helper

    // Very gentle attack and slow decay envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.08); // 80ms soft fade-in
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2); // 1.2s long relaxing tail

    osc1.connect(gain);
    osc2.connect(gain);
    
    // Lower volume for shimmer
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.12, now); // 12% of main volume
    osc3.connect(shimmerGain);
    shimmerGain.connect(gain);

    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + 1.3);
    osc2.stop(now + 1.3);
    osc3.stop(now + 1.3);
  } catch (e) {
    // Audio context block
  }
};

// Processing Loop - Soothing ambient meditation synthesizer pad
export const playProcessLoop = () => {
  if (isMuted) return;
  try {
    const ctx = initAudio();
    if (processOscillator) return; // Already running

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo1 = ctx.createOscillator();
    const lfo2 = ctx.createOscillator();
    const lfoGain1 = ctx.createGain();
    const lfoGain2 = ctx.createGain();
    const gain = ctx.createGain();

    // Warm, soothing dyad (A3 at 220Hz and E4 at 330Hz - perfect fifth chord)
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(220, ctx.currentTime);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(330, ctx.currentTime);

    // Subtle LFO drift to emulate moving analog pads
    lfo1.frequency.setValueAtTime(0.08, ctx.currentTime); // 12-second cycle
    lfoGain1.gain.setValueAtTime(1.5, ctx.currentTime); // +/- 1.5Hz drift

    lfo2.frequency.setValueAtTime(0.06, ctx.currentTime); // 16-second cycle
    lfoGain2.gain.setValueAtTime(2.0, ctx.currentTime); // +/- 2Hz drift

    // Connect modulators to pitch
    lfo1.connect(lfoGain1);
    lfoGain1.connect(osc1.frequency);
    
    lfo2.connect(lfoGain2);
    lfoGain2.connect(osc2.frequency);

    // Set gentle, breathing sound volume
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.4); // 400ms soft fade-in

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    lfo1.start();
    lfo2.start();
    osc1.start();
    osc2.start();

    processOscillator = osc1;
    processOscillator2 = osc2;
    processGain = gain;
  } catch (e) {
    // Error starting loop
  }
};

// Stop Processing Loop
export const stopProcessLoop = () => {
  if (!processGain) return;
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;
    processGain.gain.setValueAtTime(processGain.gain.value, now);
    processGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3); // 300ms soft fade-out
    
    const tempOsc1 = processOscillator;
    const tempOsc2 = processOscillator2;
    
    processOscillator = null;
    processOscillator2 = null;
    processGain = null;

    setTimeout(() => {
      try {
        tempOsc1?.stop();
        tempOsc2?.stop();
      } catch (e) {}
    }, 310);
  } catch (e) {
    processOscillator = null;
    processOscillator2 = null;
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
