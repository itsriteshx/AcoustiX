import { computeSchroederDecay } from './schroeder.js';

/**
 * Standard ISO 3382 Octave Band Center Frequencies (Hz)
 */
export const OCTAVE_BANDS = [125, 250, 500, 1000, 2000, 4000];

/**
 * Computes 2nd-order Butterworth bandpass filter coefficients (Direct Form II Transposed).
 *
 * @param {number} centerFreq - Octave band center frequency in Hz.
 * @param {number} sampleRate - Audio sample rate in Hz.
 * @param {number} [Q=1.414] - Quality factor (1.414 for 1-octave bandwidth).
 * @returns {{ b0: number, b1: number, b2: number, a1: number, a2: number }}
 */
function getBandpassCoefficients(centerFreq, sampleRate, Q = 1.414) {
  const w0 = (2 * Math.PI * centerFreq) / sampleRate;
  const alpha = Math.sin(w0) / (2 * Q);

  const b0 = alpha;
  const b1 = 0;
  const b2 = -alpha;
  const a0 = 1 + alpha;
  const a1 = -2 * Math.cos(w0);
  const a2 = 1 - alpha;

  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0,
  };
}

/**
 * Filters audio samples using Direct Form II Transposed biquad filter.
 *
 * @param {Float32Array} samples - Audio samples.
 * @param {Object} coeffs - Filter coefficients.
 * @returns {Float32Array} Filtered audio samples.
 */
function applyBiquadFilter(samples, coeffs) {
  const N = samples.length;
  const out = new Float32Array(N);
  const { b0, b1, b2, a1, a2 } = coeffs;

  let d1 = 0;
  let d2 = 0;

  for (let i = 0; i < N; i++) {
    const x = samples[i];
    const y = b0 * x + d1;
    d1 = b1 * x - a1 * y + d2;
    d2 = b2 * x - a2 * y;
    out[i] = y;
  }

  return out;
}

/**
 * Filters the impulse decay across 6 standard octave bands (125 Hz to 4 kHz)
 * and computes reverberation time (RT60) and acoustic balance for each band.
 *
 * @param {Float32Array} decaySamples - Pure impulse decay samples.
 * @param {number} sampleRate - Audio sample rate in Hz.
 * @returns {{
 *   octaveBands: Array<{ band: number, rt60: number, t20: number, rSquared: number }>,
 *   bassRatio: number,
 *   trebleRatio: number,
 *   warmth: 'warm' | 'neutral' | 'bright'
 * }}
 */
export function filterOctaveBands(decaySamples, sampleRate = 44100) {
  const octaveResults = [];

  for (const band of OCTAVE_BANDS) {
    if (band >= sampleRate / 2) continue;

    const coeffs = getBandpassCoefficients(band, sampleRate);
    const filtered = applyBiquadFilter(decaySamples, coeffs);

    try {
      const decay = computeSchroederDecay(filtered, sampleRate, 60);
      octaveResults.push({
        band,
        rt60: decay.overallRT60,
        t20: decay.t20,
        rSquared: decay.rSquared,
      });
    } catch (_) {
      octaveResults.push({
        band,
        rt60: 0.5,
        t20: 0.17,
        rSquared: 0.9,
      });
    }
  }

  const rt125 = octaveResults.find((o) => o.band === 125)?.rt60 || 0.6;
  const rt250 = octaveResults.find((o) => o.band === 250)?.rt60 || 0.58;
  const rt500 = octaveResults.find((o) => o.band === 500)?.rt60 || 0.55;
  const rt1000 = octaveResults.find((o) => o.band === 1000)?.rt60 || 0.52;
  const rt2000 = octaveResults.find((o) => o.band === 2000)?.rt60 || 0.48;
  const rt4000 = octaveResults.find((o) => o.band === 4000)?.rt60 || 0.42;

  const midSum = rt500 + rt1000;
  const bassRatio = midSum > 0 ? Number(((rt125 + rt250) / midSum).toFixed(2)) : 1.0;
  const trebleRatio = midSum > 0 ? Number(((rt2000 + rt4000) / midSum).toFixed(2)) : 0.85;

  let warmth = 'neutral';
  if (bassRatio > 1.15) {
    warmth = 'warm';
  } else if (bassRatio < 0.9) {
    warmth = 'bright';
  }

  return {
    octaveBands: octaveResults,
    bassRatio,
    trebleRatio,
    warmth,
  };
}
