import { detectImpulse } from './impulseDetector.js';
import { computeSchroederDecay } from './schroeder.js';
import { filterOctaveBands } from './octaveFilter.js';
import { ROOM_TARGET_SPECS } from '../../constants/targets.js';

/**
 * Full ISO 3382 Acoustic Processing Pipeline
 *
 * Takes raw audio PCM samples, processes the waveform through:
 * 1. Impulse onset detection & noise floor estimation (Day 3)
 * 2. Schroeder backward energy integration & linear regression (Day 4)
 * 3. 6-band octave Butterworth bandpass filtering (Day 5)
 * 4. Acoustic ratio indices and room compliance classification
 *
 * @param {Float32Array} rawSamples - Mono audio samples [-1.0, 1.0].
 * @param {number} sampleRate - Sample rate in Hz (e.g. 44100).
 * @param {string} [roomName='Measured Space'] - Name of room.
 * @returns {Object} Complete AcousticMeasurement object.
 */
export function analyzeAcoustics(rawSamples, sampleRate = 44100, roomName = 'Measured Space') {
  // Step 1: Detect impulse onset, noise floor and SNR
  const impulse = detectImpulse(rawSamples, sampleRate);
  if (!impulse.isValid) {
    throw new Error(impulse.validationMessage);
  }

  // Step 2: Compute Schroeder backward integration & regression on broadband decay
  const decay = computeSchroederDecay(impulse.decaySamples, sampleRate, 120);

  // Step 3: 6-Band Octave Filtering (125 Hz to 4 kHz)
  const spectral = filterOctaveBands(impulse.decaySamples, sampleRate);

  // Step 4: Evaluate Room Suitability against ISO 3382 benchmarks
  const roomSuitability = Object.values(ROOM_TARGET_SPECS).map((spec) => {
    const isCompliant =
      decay.overallRT60 >= spec.minRT60 && decay.overallRT60 <= spec.maxRT60;
    return {
      category: spec.category,
      name: spec.name,
      targetMin: spec.minRT60,
      targetMax: spec.maxRT60,
      description: isCompliant
        ? `Compliant with ${spec.name} target range (${spec.minRT60}s - ${spec.maxRT60}s).`
        : decay.overallRT60 < spec.minRT60
        ? `Too dry for ${spec.name} (minimum recommended is ${spec.minRT60}s).`
        : `Too reverberant for ${spec.name} (exceeds ${spec.maxRT60}s limit).`,
      isCompliant,
    };
  });

  // Step 5: Summary interpretation text
  let summary = '';
  if (decay.overallRT60 < 0.45) {
    summary = `Dry acoustic environment (RT60: ${decay.overallRT60}s). Excellent for recording studios, podcasts, and nearfield listening.`;
  } else if (decay.overallRT60 <= 0.75) {
    summary = `Well-balanced room acoustic (RT60: ${decay.overallRT60}s). Ideal speech intelligibility for classrooms, offices, and conference rooms.`;
  } else if (decay.overallRT60 <= 1.4) {
    summary = `Lively reverberation (RT60: ${decay.overallRT60}s). Rich sustain suitable for live acoustic music and recitals.`;
  } else {
    summary = `Highly reverberant space (RT60: ${decay.overallRT60}s). Suited for choral singing, cathedrals, or large worship spaces.`;
  }

  return {
    id: 'meas-' + Date.now(),
    roomName,
    createdAt: new Date().toISOString(),
    overallRT60: decay.overallRT60,
    edt: decay.edt,
    t20: decay.t20,
    t30: decay.t30,
    rSquared: decay.rSquared,
    peakDb: impulse.peakDb,
    noiseFloorDb: impulse.noiseFloorDb,
    snrDb: impulse.snrDb,
    bassRatio: spectral.bassRatio,
    trebleRatio: spectral.trebleRatio,
    octaveBands: spectral.octaveBands,
    decayCurve: decay.decayCurve,
    interpretation: {
      summary,
      warmth: spectral.warmth,
      roomSuitability,
    },
  };
}
