import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { requestMicrophonePermission } from './audioPermissions';
import { base64ToUint8Array, parseWavAudio } from './wavParser';

let currentRecording = null;
let statusInterval = null;

/**
 * Audiophile recording preset optimized for ISO 3382 acoustic measurement.
 * Uses 16-bit Linear PCM WAV on iOS (uncompressed) and high-bitrate mono on Android.
 */
const ACOUSTIC_RECORDING_PRESET = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 256000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.MAX,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 1411200,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 256000,
  },
};

/**
 * Prepares the audio subsystem for acoustic recording.
 */
async function configureAudioSession() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
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

  // Stop any active recording before starting a new one
  if (currentRecording) {
    try {
      await currentRecording.stopAndUnloadAsync();
    } catch (_) {}
    currentRecording = null;
  }

  await configureAudioSession();

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(ACOUSTIC_RECORDING_PRESET);

  if (onStatusUpdate) {
    recording.setOnRecordingStatusUpdate((status) => {
      if (status.isRecording) {
        // Expo provides metering from -160 dB to 0 dB
        const meteringDb = status.metering !== undefined ? status.metering : -60;
        onStatusUpdate({
          meteringDb,
          durationMs: status.durationMillis || 0,
        });
      }
    });
  }

  await recording.startAsync();
  currentRecording = recording;
  return true;
}

/**
 * Stops recording and extracts normalized Float32Array PCM samples.
 *
 * @returns {Promise<{
 *   uri: string,
 *   fileSizeBytes: number,
 *   sampleRate: number,
 *   channels: number,
 *   bitDepth: number,
 *   durationSec: number,
 *   samples: Float32Array,
 *   peakDb: number,
 *   noiseFloorDb: number
 * }>}
 */
export async function stopImpulseRecording() {
  if (!currentRecording) {
    throw new Error('No active recording found to stop.');
  }

  const recording = currentRecording;
  currentRecording = null;

  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();

  if (!uri) {
    throw new Error('Failed to retrieve recording file URI.');
  }

  // Read recorded audio bytes into memory via base64
  const base64Data = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const rawBytes = base64ToUint8Array(base64Data);
  const parsed = parseWavAudio(rawBytes);

  // Calculate audio waveform peak amplitude & noise floor estimate
  let maxAbs = 0;
  let sumSqFirst100ms = 0;
  const first100msSamples = Math.min(parsed.samples.length, Math.floor(parsed.sampleRate * 0.1));

  for (let i = 0; i < parsed.samples.length; i++) {
    const abs = Math.abs(parsed.samples[i]);
    if (abs > maxAbs) maxAbs = abs;
    if (i < first100msSamples) {
      sumSqFirst100ms += parsed.samples[i] * parsed.samples[i];
    }
  }

  const peakDb = maxAbs > 0 ? Number((20 * Math.log10(maxAbs)).toFixed(1)) : -90;
  const rmsNoise = first100msSamples > 0 ? Math.sqrt(sumSqFirst100ms / first100msSamples) : 0.001;
  const noiseFloorDb = rmsNoise > 0 ? Number((20 * Math.log10(rmsNoise)).toFixed(1)) : -60;

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
  if (currentRecording) {
    try {
      await currentRecording.stopAndUnloadAsync();
    } catch (_) {}
    currentRecording = null;
  }
}
