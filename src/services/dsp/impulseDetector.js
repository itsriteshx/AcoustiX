/**
 * ISO 3382 Impulse Response Detector & Signal Conditioner
 *
 * Detects the sound onset (t0), estimates pre-impulse background noise floor,
 * windows the signal, and checks for dynamic range (SNR) and double-claps.
 */

/**
 * Configuration parameters for impulse detection
 */
const DEFAULT_CONFIG = {
  preTriggerMs: 60, // Pre-trigger lead-in to preserve (ms)
  noiseSafetyGuardMs: 15, // Gap before onset to avoid rising-edge contamination (ms)
  postTriggerSec: 2.5, // Extract 2.5 seconds of decay tail
  onsetThresholdFraction: 0.08, // 8% of peak amplitude marks true wave arrival
  minSnrDb: 25.0, // Minimum SNR required for reliable ISO 3382 T20 fit
  clippingThreshold: 0.985, // Flag digital clipping if amplitude exceeds 98.5%
  envelopeBlockMs: 8, // 8ms window for smooth energy envelope calculation
  doubleClapWindowMs: 300, // Window to inspect for double-clap (ms)
  doubleClapDipRatio: 0.30, // Valley threshold (envelope drops < 30% of peak)
  doubleClapReboundRatio: 0.60, // Rebound threshold (secondary peak > 60% of peak)
};

/**
 * Analyzes raw audio PCM samples, locates the impulse arrival (t0),
 * windows the audio, and computes acoustic signal quality metrics.
 *
 * @param {Float32Array} samples - Raw mono PCM samples [-1.0, 1.0].
 * @param {number} sampleRate - Sample rate in Hz (e.g. 44100).
 * @param {Object} [config] - Optional custom thresholds.
 * @returns {{
 *   isValid: boolean,
 *   onsetIndex: number,
 *   peakIndex: number,
 *   onsetMs: number,
 *   peakDb: number,
 *   noiseFloorDb: number,
 *   snrDb: number,
 *   isClipped: boolean,
 *   isDoubleClap: boolean,
 *   validationMessage: string,
 *   trimmedSamples: Float32Array,
 *   decaySamples: Float32Array,
 * }}
 */
export function detectImpulse(samples, sampleRate = 44100, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!samples || samples.length < sampleRate * 0.5) {
    return {
      isValid: false,
      validationMessage: 'Audio recording is too short (< 0.5s) to analyze.',
      trimmedSamples: new Float32Array(0),
      decaySamples: new Float32Array(0),
    };
  }

  // 1. Locate Global Maximum Peak
  let maxAbs = 0;
  let peakIndex = 0;
  for (let i = 0; i < samples.length; i++) {
    const absVal = Math.abs(samples[i]);
    if (absVal > maxAbs) {
      maxAbs = absVal;
      peakIndex = i;
    }
  }

  const peakDb = maxAbs > 0 ? Number((20 * Math.log10(maxAbs)).toFixed(1)) : -100;
  const isClipped = maxAbs >= cfg.clippingThreshold;

  // 2. Backtrack to find true onset (t0)
  const onsetThreshold = maxAbs * cfg.onsetThresholdFraction;
  let onsetIndex = peakIndex;
  while (onsetIndex > 0 && Math.abs(samples[onsetIndex]) > onsetThreshold) {
    onsetIndex--;
  }

  // 3. Pre-trigger Window & Noise Floor Estimation
  const safetyGuardSamples = Math.floor((cfg.noiseSafetyGuardMs / 1000) * sampleRate);
  const preTriggerSamplesCount = Math.floor((cfg.preTriggerMs / 1000) * sampleRate);

  const noiseEnd = Math.max(0, onsetIndex - safetyGuardSamples);
  const noiseStart = Math.max(0, noiseEnd - preTriggerSamplesCount);

  let sumSqNoise = 0;
  let noiseCount = 0;

  if (noiseEnd > noiseStart) {
    for (let i = noiseStart; i < noiseEnd; i++) {
      sumSqNoise += samples[i] * samples[i];
      noiseCount++;
    }
  }

  // Fallback: if onset was too early in recording (< 50ms), measure the first 50ms
  if (noiseCount === 0) {
    const fallbackCount = Math.min(samples.length, Math.floor(0.05 * sampleRate));
    for (let i = 0; i < fallbackCount; i++) {
      sumSqNoise += samples[i] * samples[i];
      noiseCount++;
    }
  }

  const rmsNoise = noiseCount > 0 ? Math.sqrt(sumSqNoise / noiseCount) : 0.0001;
  const noiseFloorDb = rmsNoise > 0 ? Number((20 * Math.log10(rmsNoise)).toFixed(1)) : -60;
  const snrDb = Number((peakDb - noiseFloorDb).toFixed(1));

  // 4. Double-Clap Detection via Block-RMS Energy Envelope
  // We compute 8ms block RMS so zero-crossings do not trigger false valleys
  const blockSize = Math.floor((cfg.envelopeBlockMs / 1000) * sampleRate);
  const searchBlocks = Math.floor((cfg.doubleClapWindowMs / 1000) * (sampleRate / blockSize));
  const peakBlock = Math.floor(peakIndex / blockSize);

  let maxEnvelope = 0;
  const envelope = [];

  for (let b = 0; b < searchBlocks; b++) {
    const blockStart = (peakBlock + b) * blockSize;
    if (blockStart + blockSize > samples.length) break;

    let sumSq = 0;
    for (let j = 0; j < blockSize; j++) {
      const s = samples[blockStart + j];
      sumSq += s * s;
    }
    const envVal = Math.sqrt(sumSq / blockSize);
    envelope.push(envVal);
    if (envVal > maxEnvelope) maxEnvelope = envVal;
  }

  let isDoubleClap = false;
  if (maxEnvelope > 0) {
    const dipLevel = maxEnvelope * cfg.doubleClapDipRatio;
    const reboundLevel = maxEnvelope * cfg.doubleClapReboundRatio;

    // Forward scan: detect a second clap occurring AFTER the main peak
    let hasDippedAfter = false;
    for (let b = 1; b < envelope.length; b++) {
      if (envelope[b] < dipLevel) {
        hasDippedAfter = true;
      } else if (hasDippedAfter && envelope[b] > reboundLevel) {
        isDoubleClap = true;
        break;
      }
    }

    // Backward scan: detect an earlier clap occurring BEFORE a louder main peak
    if (!isDoubleClap && peakBlock > 2) {
      const startBack = Math.max(0, peakBlock - searchBlocks);
      let hasDippedBefore = false;
      for (let b = peakBlock - 1; b >= startBack; b--) {
        const blockStart = b * blockSize;
        let sumSq = 0;
        for (let j = 0; j < blockSize; j++) {
          const s = samples[blockStart + j];
          sumSq += s * s;
        }
        const envVal = Math.sqrt(sumSq / blockSize);
        if (envVal < dipLevel) {
          hasDippedBefore = true;
        } else if (hasDippedBefore && envVal > reboundLevel) {
          isDoubleClap = true;
          break;
        }
      }
    }
  }

  // 5. Windowing & Trimming
  // Include 50ms before onset for visual lead-in and Schroeder baseline
  const trimLeadIn = Math.max(0, onsetIndex - Math.floor(0.05 * sampleRate));
  const postTriggerSamplesCount = Math.floor(cfg.postTriggerSec * sampleRate);
  const trimEnd = Math.min(samples.length, onsetIndex + postTriggerSamplesCount);
  const trimmedLength = trimEnd - trimLeadIn;

  const trimmedSamples = new Float32Array(trimmedLength);
  for (let i = 0; i < trimmedLength; i++) {
    trimmedSamples[i] = samples[trimLeadIn + i];
  }

  // Pure decay tail (from onset index onward)
  const decayLength = trimEnd - onsetIndex;
  const decaySamples = new Float32Array(decayLength);
  for (let i = 0; i < decayLength; i++) {
    decaySamples[i] = samples[onsetIndex + i];
  }

  // 6. Signal Validation & Quality Coaching
  let isValid = true;
  let validationMessage = 'Clean impulse response captured successfully!';

  if (peakDb < -32) {
    isValid = false;
    validationMessage =
      'Clap was too quiet (peak < -32 dB). Please clap hands together more firmly.';
  } else if (snrDb < cfg.minSnrDb) {
    isValid = false;
    validationMessage = `Insufficient dynamic range (SNR ${snrDb} dB < ${cfg.minSnrDb} dB). Move to a quieter room or clap harder.`;
  } else if (isDoubleClap) {
    isValid = false;
    validationMessage =
      'Double-clap or flutter echo detected. Please produce a single, sharp handclap.';
  } else if (isClipped) {
    isValid = true;
    validationMessage =
      'Microphone reached near-clipping level. Hold phone slightly further from clap for purest linearity.';
  }

  return {
    isValid,
    onsetIndex,
    peakIndex,
    onsetMs: Number(((onsetIndex / sampleRate) * 1000).toFixed(1)),
    peakDb,
    noiseFloorDb,
    snrDb,
    isClipped,
    isDoubleClap,
    validationMessage,
    trimmedSamples,
    decaySamples,
  };
}
