'use client';

/**
 * Hook de efeitos sonoros - Web Audio API
 * Sons sintéticos estilo Blade Runner, keep it simple.
 */

let audioCtx: AudioContext | null = null;
let ambientNodes: {
  oscillators: OscillatorNode[];
  gains: GainNode[];
  masterGain: GainNode | null;
  lfo: OscillatorNode | null;
} | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume se estiver suspenso (política de autoplay)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Som de sucesso - tom ascendente suave
 */
export function playSuccess() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn('[SoundFX] playSuccess error:', e);
  }
}

/**
 * Som de erro - buzz dissonante curto
 */
export function playError() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.setValueAtTime(120, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

/**
 * Som de transição - whoosh suave
 */
export function playTransition() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Onda sine suave, frequência estável
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.2);

    // Filtro passa-baixa para suavizar
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);

    // Volume bem baixo com fade suave
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.warn('[SoundFX] playTransition error:', e);
  }
}

/**
 * Som de conclusão - acorde ascendente (despertar)
 */
export function playComplete() {
  const ctx = getAudioContext();
  const frequencies = [400, 500, 600, 800]; // Acorde maior ascendente

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);

    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.1 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.5);
  });
}

/**
 * Som de typing/input - click suave
 */
export function playClick() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);

  gain.gain.setValueAtTime(0.03, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.02);
}

/**
 * Ambient pad - Vangelis/Blade Runner style
 * CS-80 vibes: etéreo, melancólico, com reverb e shimmer
 */
export function startAmbient() {
  try {
    if (ambientNodes) return; // Já está tocando

    const ctx = getAudioContext();
    console.log('[SoundFX] Starting Vangelis-style ambient...');

    // Master gain (volume bem baixo - subliminar)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 6); // Fade in lento 6s
    masterGain.connect(ctx.destination);

    // Reverb simulado com delay + feedback
    const delayNode = ctx.createDelay(2.0);
    const feedbackGain = ctx.createGain();
    const reverbFilter = ctx.createBiquadFilter();

    delayNode.delayTime.setValueAtTime(0.4, ctx.currentTime);
    feedbackGain.gain.setValueAtTime(0.3, ctx.currentTime); // Feedback para reverb longo
    reverbFilter.type = 'lowpass';
    reverbFilter.frequency.setValueAtTime(2000, ctx.currentTime); // Reverb mais escuro

    delayNode.connect(feedbackGain);
    feedbackGain.connect(reverbFilter);
    reverbFilter.connect(delayNode);
    delayNode.connect(masterGain);

    // Dry/Wet mix node
    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    dryGain.gain.setValueAtTime(0.6, ctx.currentTime);
    wetGain.gain.setValueAtTime(0.4, ctx.currentTime);
    dryGain.connect(masterGain);
    wetGain.connect(delayNode);

    // LFO muito lento (breathing - 1 ciclo a cada 30s)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.033, ctx.currentTime);
    lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
    lfo.connect(lfoGain);
    lfo.start();

    // Acorde Amaj7 nas oitavas altas - som "agridoce" do Blade Runner
    // A4, C#5, E5, G#5 (com 7ª maior para aquele feeling melancólico)
    const frequencies = [440, 554.37, 659.25, 830.61];
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    frequencies.forEach((freq, i) => {
      // Três osciladores por nota: fundamental + detuned para chorus
      [-4, 0, 4].forEach((detune) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.detune.setValueAtTime(detune, ctx.currentTime);

        // LFO modula frequência sutilmente
        lfoGain.connect(osc.frequency);

        // Volume: notas mais altas mais suaves
        const vol = 0.12 / (i + 1);
        gain.gain.setValueAtTime(vol, ctx.currentTime);

        osc.connect(gain);
        gain.connect(dryGain);
        gain.connect(wetGain);

        osc.start();
        oscillators.push(osc);
        gains.push(gain);
      });
    });

    // Shimmer: harmônicos bem altos e sutis (oitava acima, bem quiet)
    const shimmerFreqs = [880, 1108.73, 1318.51];
    shimmerFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const shimmerFilter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      // Leve movimento no shimmer
      osc.detune.setValueAtTime(0, ctx.currentTime);

      // Filtro para suavizar shimmer
      shimmerFilter.type = 'lowpass';
      shimmerFilter.frequency.setValueAtTime(3000, ctx.currentTime);

      // Volume muito baixo
      gain.gain.setValueAtTime(0.02, ctx.currentTime);

      osc.connect(shimmerFilter);
      shimmerFilter.connect(gain);
      gain.connect(wetGain); // Shimmer só no wet (reverb)

      osc.start();
      oscillators.push(osc);
      gains.push(gain);
    });

    ambientNodes = { oscillators, gains, masterGain, lfo };
  } catch (e) {
    console.warn('[SoundFX] startAmbient error:', e);
  }
}

/**
 * Para o ambient com fade out suave
 */
export function stopAmbient() {
  if (!ambientNodes) return;

  const ctx = getAudioContext();
  const { oscillators, masterGain, lfo } = ambientNodes;

  // Fade out bem suave (3 segundos)
  if (masterGain) {
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
  }

  // Para tudo após fade out
  setTimeout(() => {
    oscillators.forEach((osc) => {
      try { osc.stop(); } catch {}
    });
    if (lfo) {
      try { lfo.stop(); } catch {}
    }
    ambientNodes = null;
  }, 3200);
}

/**
 * Hook que retorna todas as funções de som
 */
export function useSoundFX() {
  return {
    playSuccess,
    playError,
    playTransition,
    playComplete,
    playClick,
    startAmbient,
    stopAmbient,
  };
}
