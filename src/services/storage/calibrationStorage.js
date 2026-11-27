import AsyncStorage from '@react-native-async-storage/async-storage';

const CALIBRATION_KEY = '@acoustitape_spl_offset';
const MIN_OFFSET = -15.0;
const MAX_OFFSET = 15.0;

/**
 * Clamps calibration offset to safe bounds [-15.0, +15.0] dB.
 *
 * @param {number} value
 * @returns {number}
 */
export function clampCalibrationOffset(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(Math.max(MIN_OFFSET, Math.min(MAX_OFFSET, num)).toFixed(1));
}

/**
 * Loads the persisted microphone SPL calibration offset in dB.
 *
 * @returns {Promise<number>}
 */
export async function getSplCalibrationOffset() {
  try {
    const raw = await AsyncStorage.getItem(CALIBRATION_KEY);
    if (raw === null) return 0;
    return clampCalibrationOffset(parseFloat(raw));
  } catch (error) {
    console.error('[calibrationStorage] Load error:', error);
    return 0;
  }
}

/**
 * Persists the microphone SPL calibration offset in dB.
 *
 * @param {number} offsetDb
 * @returns {Promise<number>}
 */
export async function saveSplCalibrationOffset(offsetDb) {
  const clamped = clampCalibrationOffset(offsetDb);
  try {
    await AsyncStorage.setItem(CALIBRATION_KEY, String(clamped));
  } catch (error) {
    console.error('[calibrationStorage] Save error:', error);
  }
  return clamped;
}
