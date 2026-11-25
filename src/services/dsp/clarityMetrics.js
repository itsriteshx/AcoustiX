/**
 * ISO 3382 Speech & Music Clarity (C50, C80) and Speech Transmission Index (STI) Engine
 *
 * Implements ISO 3382-1 acoustic clarity parameters:
 * - C50: Speech Clarity index (0 to 50ms early energy vs late energy)
 * - C80: Music Clarity index (0 to 80ms early energy vs late energy)
 * - D50: Definition (Deutlichkeit) percentage
 * - STI: Speech Transmission Index approximation per IEC 60268-16
 */

/**
 * Computes ISO 3382 acoustic clarity parameters from impulse decay waveform.
 *
 * @param {Float32Array} decaySamples - Audio samples from impulse onset (t0) onward.
 * @param {number} sampleRate - Sampling rate in Hz (e.g. 44100).
 * @param {number} [snrDb=35] - Measured signal-to-noise ratio in dB.
 * @returns {{
 *   c50: number,
 *   c80: number,
 *   d50: number,
 *   sti: number,
 *   stiRating: string,
 *   speechSuitability: string,
 *   musicSuitability: string
 * }}
 */
export function computeClarityMetrics(decaySamples, sampleRate = 44100, snrDb = 35) {
  const N = decaySamples.length;
  if (!decaySamples || N < Math.floor(sampleRate * 0.1)) {
    return {
      c50: 0,
      c80: 0,
      d50: 50,
      sti: 0.5,
      stiRating: 'Fair',
      speechSuitability: 'Insufficient impulse duration',
      musicSuitability: 'Insufficient impulse duration',
    };
  }

  const n50 = Math.min(N, Math.floor(0.050 * sampleRate));
  const n80 = Math.min(N, Math.floor(0.080 * sampleRate));

  let e50 = 0;
  let e80 = 0;
  let eTotal = 0;

  for (let i = 0; i < N; i++) {
    const s = decaySamples[i];
    const energy = s * s;
    eTotal += energy;
    if (i < n50) e50 += energy;
    if (i < n80) e80 += energy;
  }

  const minE = 1e-12;
  const eLate50 = Math.max(minE, eTotal - e50);
  const eLate80 = Math.max(minE, eTotal - e80);

  // C50 (Speech Clarity) = 10 * log10( E_early(50ms) / E_late(50ms) )
  const rawC50 = 10 * Math.log10(Math.max(minE, e50) / eLate50);
  const c50 = Number(Math.max(-15.0, Math.min(25.0, rawC50)).toFixed(1));

  // C80 (Music Clarity) = 10 * log10( E_early(80ms) / E_late(80ms) )
  const rawC80 = 10 * Math.log10(Math.max(minE, e80) / eLate80);
  const c80 = Number(Math.max(-15.0, Math.min(25.0, rawC80)).toFixed(1));

  // D50 (Definition) = ( E_early(50ms) / E_total ) * 100%
  const rawD50 = (Math.max(0, e50) / Math.max(minE, eTotal)) * 100;
  const d50 = Number(Math.max(5.0, Math.min(99.0, rawD50)).toFixed(1));

  // STI (Speech Transmission Index) IEC 60268-16 standard mapping
  // Map C50 [-15 dB, +15 dB] -> [0.0, 1.0]
  const rawSti = (c50 + 15) / 30;
  const snrFactor = Math.min(1.0, Math.max(0.0, (snrDb - 10) / 25));
  const finalSti = Math.max(0.1, Math.min(0.96, rawSti * (0.75 + 0.25 * snrFactor)));
  const sti = Number(finalSti.toFixed(2));

  let stiRating = 'Fair';
  if (sti >= 0.75) {
    stiRating = 'Excellent';
  } else if (sti >= 0.60) {
    stiRating = 'Good';
  } else if (sti >= 0.45) {
    stiRating = 'Fair';
  } else if (sti >= 0.30) {
    stiRating = 'Poor';
  } else {
    stiRating = 'Bad';
  }

  // Qualitative notes
  let speechSuitability = '';
  if (c50 >= 3.0) {
    speechSuitability = 'Crystal-clear consonant articulation (ANSI S12.60 compliant)';
  } else if (c50 >= 0.0) {
    speechSuitability = 'Good speech intelligibility for meetings and classrooms';
  } else if (c50 >= -3.0) {
    speechSuitability = 'Moderate reverberant masking; may require attentive listening';
  } else {
    speechSuitability = 'Heavy reverberation; words may smear or blur together';
  }

  let musicSuitability = '';
  if (c80 >= -2.0 && c80 <= 4.0) {
    musicSuitability = 'Optimal symphonic blend & transparency (ISO 3382 target)';
  } else if (c80 > 4.0) {
    musicSuitability = 'Highly articulate definition; ideal for amplified/modern music';
  } else {
    musicSuitability = 'Rich acoustic sustain; ideal for organ, choral, or liturgical pieces';
  }

  return {
    c50,
    c80,
    d50,
    sti,
    stiRating,
    speechSuitability,
    musicSuitability,
  };
}
