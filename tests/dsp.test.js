import test from 'node:test';
import assert from 'node:assert/strict';

import { detectImpulse } from '../src/services/dsp/impulseDetector.js';
import { computeSchroederDecay } from '../src/services/dsp/schroeder.js';
import { filterOctaveBands } from '../src/services/dsp/octaveFilter.js';
import { computeClarityMetrics } from '../src/services/dsp/clarityMetrics.js';
import { calculateRoomModes } from '../src/services/dsp/roomModes.js';
import { averageMeasurements } from '../src/services/dsp/multiClapAverager.js';
import { parseWavAudio } from '../src/services/audio/wavParser.js';

const SAMPLE_RATE = 44100;

/**
 * Helper: Generates a synthetic exponential room impulse response with known RT60.
 * Envelope: exp(-6.9078 * t / rt60) so energy drops 60 dB at t = rt60.
 */
function createSyntheticClap(targetRT60 = 0.6, durationSec = 2.0, noiseAmp = 0.001) {
  const N = Math.floor(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(N);
  const onsetIdx = Math.floor(SAMPLE_RATE * 0.2); // 200ms pre-trigger silence

  for (let i = 0; i < N; i++) {
    const noise = (Math.random() * 2 - 1) * noiseAmp;
    if (i < onsetIdx) {
      samples[i] = noise;
    } else {
      const t = (i - onsetIdx) / SAMPLE_RATE;
      const env = Math.exp((-6.9078 * t) / targetRT60);
      const carrier = Math.sin(2 * Math.PI * 500 * t) + 0.5 * Math.sin(2 * Math.PI * 1200 * t);
      samples[i] = Math.max(-1, Math.min(1, 0.55 * env * carrier + noise));
    }
  }
  return samples;
}

test('detectImpulse: accepts clean single handclap and computes valid SNR', () => {
  const samples = createSyntheticClap(0.6, 2.0, 0.001);
  const res = detectImpulse(samples, SAMPLE_RATE);

  assert.equal(res.isValid, true);
  assert.ok(res.onsetIndex > 0, 'Onset index should be positive');
  assert.ok(res.snrDb >= 20, `Expected SNR >= 20 dB, got ${res.snrDb}`);
  assert.ok(res.decaySamples.length > SAMPLE_RATE * 0.5);
});

test('detectImpulse: rejects silence / quiet room with no impulse', () => {
  const silent = new Float32Array(SAMPLE_RATE * 1.5);
  for (let i = 0; i < silent.length; i++) {
    silent[i] = (Math.random() * 2 - 1) * 0.002;
  }
  const res = detectImpulse(silent, SAMPLE_RATE);
  assert.equal(res.isValid, false);
  assert.match(res.validationMessage, /No clear clap|too quiet/i);
});

test('detectImpulse: rejects double-clap artifact', () => {
  const samples = createSyntheticClap(0.25, 2.0, 0.0005);
  // Inject a second loud clap 300ms after the first (0.2s + 0.3s = 0.5s)
  const secondIdx = Math.floor(SAMPLE_RATE * 0.5);
  for (let i = 0; i < 4000 && secondIdx + i < samples.length; i++) {
    samples[secondIdx + i] = 0.85 * Math.exp(-i / 1200) * Math.sin(i * 0.2);
  }
  const res = detectImpulse(samples, SAMPLE_RATE);
  assert.equal(res.isValid, false);
  assert.match(res.validationMessage, /Double-clap/i);
});

test('computeSchroederDecay: recovers target RT60 accurately with high R^2', () => {
  const targetRT60 = 0.65;
  const samples = createSyntheticClap(targetRT60, 2.0, 0.0);
  const onset = Math.floor(SAMPLE_RATE * 0.2);
  const decayTail = samples.slice(onset);

  const decay = computeSchroederDecay(decayTail, SAMPLE_RATE, 100);
  assert.ok(
    Math.abs(decay.overallRT60 - targetRT60) < 0.12,
    `Expected RT60 near ${targetRT60}s, got ${decay.overallRT60}s`
  );
  assert.ok(decay.rSquared >= 0.95, `Expected R^2 >= 0.95, got ${decay.rSquared}`);
  assert.equal(decay.decayCurve[0].energyDb, 0);
  assert.ok(decay.decayCurve.length >= 80);
});

test('computeSchroederDecay: throws on decay tail shorter than 0.2s', () => {
  const tiny = new Float32Array(1000);
  assert.throws(() => computeSchroederDecay(tiny, SAMPLE_RATE), /too short/i);
});

test('filterOctaveBands: returns all 6 ISO 3382 octave bands and ratios', () => {
  const samples = createSyntheticClap(0.6, 1.8, 0.0005);
  const decayTail = samples.slice(Math.floor(SAMPLE_RATE * 0.2));

  const spectral = filterOctaveBands(decayTail, SAMPLE_RATE);
  assert.equal(spectral.octaveBands.length, 6);
  assert.deepEqual(
    spectral.octaveBands.map((b) => b.band),
    [125, 250, 500, 1000, 2000, 4000]
  );
  assert.ok(spectral.bassRatio > 0);
  assert.ok(spectral.trebleRatio > 0);
  assert.ok(['warm', 'neutral', 'bright'].includes(spectral.warmth));
});

test('computeClarityMetrics: computes C50, C80, D50, and valid STI rating', () => {
  const samples = createSyntheticClap(0.55, 1.5, 0.0005);
  const decayTail = samples.slice(Math.floor(SAMPLE_RATE * 0.2));

  const clarity = computeClarityMetrics(decayTail, SAMPLE_RATE, 40);
  assert.ok(typeof clarity.c50 === 'number');
  assert.ok(typeof clarity.c80 === 'number');
  assert.ok(clarity.d50 >= 5 && clarity.d50 <= 99);
  assert.ok(clarity.sti >= 0.1 && clarity.sti <= 0.96);
  assert.ok(['Excellent', 'Good', 'Fair', 'Poor', 'Bad'].includes(clarity.stiRating));
});

test('calculateRoomModes: computes Schroeder crossover and detects square-room warning', () => {
  const squareRoom = calculateRoomModes(5.0, 5.0, 3.0, 0.6);
  assert.equal(squareRoom.isRatioHealthy, false);
  assert.match(squareRoom.ratioStatus, /Coincident/i);
  assert.ok(squareRoom.schroederFreq > 100);
  assert.ok(squareRoom.modes.length > 0);

  const wellProportioned = calculateRoomModes(7.0, 4.8, 3.0, 0.5);
  assert.equal(wellProportioned.isRatioHealthy, true);
  assert.equal(wellProportioned.modes[0].type, 'Axial');
});

test('averageMeasurements: averages 3 measurements and computes stdDev', () => {
  const base = {
    roomName: 'Lab 101',
    overallRT60: 0.55,
    edt: 0.5,
    t20: 0.18,
    t30: 0.28,
    rSquared: 0.98,
    peakDb: -2,
    noiseFloorDb: -48,
    snrDb: 46,
    bassRatio: 1.05,
    trebleRatio: 0.95,
    clarity: { c50: 2.5, c80: 4.0, d50: 64, sti: 0.72, stiRating: 'Good' },
    octaveBands: [{ band: 500, rt60: 0.55, t20: 0.18, rSquared: 0.98 }],
    decayCurve: [{ timeMs: 0, energyDb: 0 }, { timeMs: 500, energyDb: -30 }],
    interpretation: { summary: '', warmth: 'neutral', roomSuitability: [] },
  };

  const m1 = { ...base, overallRT60: 0.54 };
  const m2 = { ...base, overallRT60: 0.56 };
  const m3 = { ...base, overallRT60: 0.58 };

  const avg = averageMeasurements([m1, m2, m3]);
  assert.equal(avg.overallRT60, 0.56);
  assert.equal(avg.multiClapStats.count, 3);
  assert.equal(avg.multiClapStats.repeatability, 'High Precision');
});

test('parseWavAudio: parses valid 16-bit mono RIFF WAV buffer', () => {
  const numSamples = 100;
  const buf = new Uint8Array(44 + numSamples * 2);
  const view = new DataView(buf.buffer);
  buf.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  view.setUint32(4, 36 + numSamples * 2, true);
  buf.set([0x57, 0x41, 0x56, 0x45], 8); // WAVE
  buf.set([0x66, 0x6d, 0x74, 0x20], 12); // fmt 
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  buf.set([0x64, 0x61, 0x74, 0x61], 36); // data
  view.setUint32(40, numSamples * 2, true);
  view.setInt16(44, 16384, true); // ~0.5 amplitude

  const parsed = parseWavAudio(buf);
  assert.equal(parsed.sampleRate, SAMPLE_RATE);
  assert.equal(parsed.channels, 1);
  assert.equal(parsed.bitDepth, 16);
  assert.equal(parsed.samples.length, numSamples);
  assert.ok(Math.abs(parsed.samples[0] - 0.5) < 0.001);
});
