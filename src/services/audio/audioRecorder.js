import {
  AudioModule,
  IOSOutputFormat,
  AudioQuality,
  setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { requestMicrophonePermission } from './audioPermissions';
import { base64ToUint8Array, parseWavAudio } from './wavParser';

let currentRecorder = null;
let meteringInterval = null;

/**
 * Audiophile recording preset optimized for ISO 3382 acoustic measurement.
 * Uses 16-bit Linear PCM WAV on iOS (uncompressed) and high-bitrate mono on Android.
 */
const ACOUSTIC_RECORDING_PRESET = {
  extension: '.wav',
  sampleRate: 44100,
  numberOfChannels: 1,
  bitRate: 1411200,
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
    sampleRate: 44100,
  },
  ios: {
    extension: '.wav',
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.MAX,
    sampleRate: 44100,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 256000,
  },
};

function clearMeteringTimer() {
  if (meteringInterval) {
    clearInterval(meteringInterval);
    meteringInterval = null;
  }
}

/**
 * Prepares the audio subsystem for acoustic recording via expo-audio.
 */
async function configureAudioSession() {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'doNotMix',
  });
}

/**
 * Starts recording the room impulse response.
 *
 * @param {Function} onStatusUpdate - Callback receiving `{ meteringDb: number, durationMs: number }`.
 * @returns {Promise<boolean>} True if recording started successfully.
 */
export async function startImpulseRecording(onStatusUpdate) {
  const hasPermission = await requestMicrophonePermission();
  if (!hasPermission) {
    throw new Error('Microphone permission was denied.');
  }

  clearMeteringTimer();
  if (currentRecorder) {
    try {
      await currentRecorder.stop();
    } catch (_) {}
    currentRecorder = null;
  }

  await configureAudioSession();

  const recorder = new AudioModule.AudioRecorder(ACOUSTIC_RECORDING_PRESET);
  await recorder.prepareToRecordAsync(ACOUSTIC_RECORDING_PRESET);
  recorder.record();
  currentRecorder = recorder;

  if (onStatusUpdate) {
    meteringInterval = setInterval(() => {
      if (!currentRecorder) return;
      try {
        const status = currentRecorder.getStatus();
        if (status && status.isRecording) {
          const meteringDb =
            typeof status.metering === 'number' ? status.metering : -60;
          onStatusUpdate({
            meteringDb,
            durationMs: status.durationMillis || 0,
          });
        }
      } catch (_) {}
    }, 80);
  }

  return true;
}

/**
 * Stops recording and extracts normalized Float32Array PCM samples.
 */
export async function stopImpulseRecording() {
  clearMeteringTimer();

  if (!currentRecorder) {
    throw new Error('No active recording found to stop.');
  }

  const recorder = currentRecorder;
  currentRecorder = null;

  await recorder.stop();
  const uri = recorder.uri;

  if (!uri) {
    throw new Error('Failed to retrieve recording file URI.');
  }

  const base64Data = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const rawBytes = base64ToUint8Array(base64Data);
  const parsed = parseWavAudio(rawBytes);

  let maxAbs = 0;
  let sumSqFirst100ms = 0;
  const first100msSamples = Math.min(
    parsed.samples.length,
    Math.floor(parsed.sampleRate * 0.1)
  );

  for (let i = 0; i < parsed.samples.length; i++) {
    const abs = Math.abs(parsed.samples[i]);
    if (abs > maxAbs) maxAbs = abs;
    if (i < first100msSamples) {
      sumSqFirst100ms += parsed.samples[i] * parsed.samples[i];
    }
  }

  const peakDb =
    maxAbs > 0 ? Number((20 * Math.log10(maxAbs)).toFixed(1)) : -90;
  const rmsNoise =
    first100msSamples > 0
      ? Math.sqrt(sumSqFirst100ms / first100msSamples)
      : 0.001;
  const noiseFloorDb =
    rmsNoise > 0 ? Number((20 * Math.log10(rmsNoise)).toFixed(1)) : -60;

  return {
    uri,
    fileSizeBytes: rawBytes.length,
    sampleRate: parsed.sampleRate,
    channels: parsed.channels,
    bitDepth: parsed.bitDepth,
    durationSec: parsed.durationSec,
    samples: parsed.samples,
    peakDb,
    noiseFloorDb,
  };
}

/**
 * Cancels and discards the active recording.
 */
export async function cancelImpulseRecording() {
  clearMeteringTimer();
  if (currentRecorder) {
    try {
      await currentRecorder.stop();
    } catch (_) {}
    currentRecorder = null;
  }
}
