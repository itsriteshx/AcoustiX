import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system';

let currentPlayer = null;
let currentListener = null;

/**
 * Encodes a Uint8Array into a standard Base64 string in pure JavaScript.
 *
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function uint8ArrayToBase64(bytes) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  const len = bytes.length;
  const rem = len % 3;
  const mainLen = len - rem;

  for (let i = 0; i < mainLen; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    base64 +=
      chars[(chunk >> 18) & 63] +
      chars[(chunk >> 12) & 63] +
      chars[(chunk >> 6) & 63] +
      chars[chunk & 63];
  }

  if (rem === 1) {
    const chunk = bytes[mainLen];
    base64 += chars[(chunk >> 2) & 63] + chars[(chunk << 4) & 63] + '==';
  } else if (rem === 2) {
    const chunk = (bytes[mainLen] << 8) | bytes[mainLen + 1];
    base64 +=
      chars[(chunk >> 10) & 63] +
      chars[(chunk >> 4) & 63] +
      chars[(chunk << 2) & 63] +
      '=';
  }

  return base64;
}

/**
 * Builds a standard 44-byte RIFF WAV file from mono 16-bit PCM Float32Array [-1.0, 1.0].
 *
 * @param {Float32Array} samples - Audio samples.
 * @param {number} sampleRate - Sample rate in Hz (e.g. 44100).
 * @returns {Uint8Array} Binary WAV buffer.
 */
function createWavBuffer(samples, sampleRate = 44100) {
  const numSamples = samples.length;
  const byteRate = sampleRate * 2; // 1 channel * 16-bit (2 bytes)
  const blockAlign = 2;
  const dataSize = numSamples * 2;
  const buffer = new Uint8Array(44 + dataSize);
  const view = new DataView(buffer.buffer);

  // RIFF header
  buffer[0] = 0x52; // 'R'
  buffer[1] = 0x49; // 'I'
  buffer[2] = 0x46; // 'F'
  buffer[3] = 0x46; // 'F'
  view.setUint32(4, 36 + dataSize, true); // file size - 8
  buffer[8] = 0x57; // 'W'
  buffer[9] = 0x41; // 'A'
  buffer[10] = 0x56; // 'V'
  buffer[11] = 0x45; // 'E'

  // 'fmt ' chunk
  buffer[12] = 0x66; // 'f'
  buffer[13] = 0x6d; // 'm'
  buffer[14] = 0x74; // 't'
  buffer[15] = 0x20; // ' '
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16)

  // 'data' chunk
  buffer[36] = 0x64; // 'd'
  buffer[37] = 0x61; // 'a'
  buffer[38] = 0x74; // 't'
  buffer[39] = 0x61; // 'a'
  view.setUint32(40, dataSize, true);

  // PCM 16-bit samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1.0, Math.min(1.0, samples[i]));
    const intSample = s < 0 ? Math.floor(s * 32768) : Math.floor(s * 32767);
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return buffer;
}

/**
 * Synthesizes a 60ms band-limited Dirac acoustic impulse burst (1 kHz carrier + sharp decay).
 * Replaces manual handclapping with a precision acoustic pulse.
 *
 * @param {number} sampleRate
 * @returns {Float32Array}
 */
export function generateDiracImpulse(sampleRate = 44100) {
  const durationSec = 0.08;
  const N = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    const t = i / sampleRate;
    // 1 kHz pulse with rapid exponential damping envelope (tau = 12ms)
    const env = Math.exp(-t / 0.012);
    const carrier = Math.sin(2 * Math.PI * 1000 * t);
    samples[i] = carrier * env * 0.95;
  }
  return samples;
}

/**
 * Synthesizes a 2.5-second logarithmic sine sweep (20 Hz to 20,000 Hz) per ISO 3382.
 *
 * @param {number} sampleRate
 * @returns {Float32Array}
 */
export function generateSineSweep(sampleRate = 44100) {
  const durationSec = 2.5;
  const f1 = 20;
  const f2 = 20000;
  const N = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(N);
  const lnRatio = Math.log(f2 / f1);

  for (let i = 0; i < N; i++) {
    const t = i / sampleRate;
    // Instantaneous phase for logarithmic sweep: phi(t) = 2*pi*f1 * ( (f2/f1)^(t/T) - 1 ) / ln(f2/f1)
    const phase = ((2 * Math.PI * f1) / lnRatio) * (Math.pow(f2 / f1, t / durationSec) - 1);
    let sample = Math.sin(phase);

    // 25ms cosine fade in and fade out to prevent clicks
    const fadeSamples = Math.floor(sampleRate * 0.025);
    if (i < fadeSamples) {
      sample *= 0.5 * (1 - Math.cos((Math.PI * i) / fadeSamples));
    } else if (i > N - fadeSamples) {
      sample *= 0.5 * (1 - Math.cos((Math.PI * (N - i)) / fadeSamples));
    }

    samples[i] = sample * 0.85;
  }
  return samples;
}

/**
 * Synthesizes a 2.0-second Pink Noise burst (-3 dB/octave) using Paul Kellet's filter.
 *
 * @param {number} sampleRate
 * @returns {Float32Array}
 */
export function generatePinkNoise(sampleRate = 44100) {
  const durationSec = 2.0;
  const N = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(N);

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < N; i++) {
    const white = Math.random() * 2 - 1;

    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;

    let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;

    // Apply 30ms fade in/out
    const fadeSamples = Math.floor(sampleRate * 0.03);
    if (i < fadeSamples) {
      pink *= i / fadeSamples;
    } else if (i > N - fadeSamples) {
      pink *= (N - i) / fadeSamples;
    }

    samples[i] = Math.max(-1.0, Math.min(1.0, pink * 0.22));
  }
  return samples;
}

/**
 * Plays a synthesized acoustic signal over loudspeaker or connected Bluetooth/AUX sound system.
 *
 * @param {'impulse' | 'sweep' | 'pink_noise'} signalType
 * @param {Function} [onFinished] - Callback when playback ends.
 * @returns {Promise<boolean>}
 */
export async function playAcousticSignal(signalType = 'impulse', onFinished) {
  try {
    await stopAcousticSignal();

    const sampleRate = 44100;
    let samples;
    if (signalType === 'sweep') {
      samples = generateSineSweep(sampleRate);
    } else if (signalType === 'pink_noise') {
      samples = generatePinkNoise(sampleRate);
    } else {
      samples = generateDiracImpulse(sampleRate);
    }

    const wavBuffer = createWavBuffer(samples, sampleRate);
    const base64 = uint8ArrayToBase64(wavBuffer);
    const filePath = `${FileSystem.cacheDirectory}test_${signalType}.wav`;

    await FileSystem.writeAsStringAsync(filePath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'doNotMix',
    });

    const player = createAudioPlayer({ uri: filePath });
    player.volume = 1.0;
    currentPlayer = player;

    currentListener = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        stopAcousticSignal().catch(() => {});
        if (onFinished) onFinished();
      }
    });

    player.play();
    return true;
  } catch (error) {
    console.error('[signalGenerator] Playback error:', error);
    if (onFinished) onFinished();
    return false;
  }
}

/**
 * Stops any actively playing test signal.
 */
export async function stopAcousticSignal() {
  if (currentListener) {
    try {
      currentListener.remove();
    } catch (_) {}
    currentListener = null;
  }
  if (currentPlayer) {
    try {
      currentPlayer.pause();
      currentPlayer.remove();
    } catch (_) {}
    currentPlayer = null;
  }
}
