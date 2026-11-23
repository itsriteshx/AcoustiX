import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@acoustitape_measurements_v1';

/**
 * Saves a new acoustic measurement record to persistent storage.
 *
 * @param {Object} measurement - The complete AcousticMeasurement object.
 * @returns {Promise<boolean>} True if saved successfully.
 */
export async function saveMeasurement(measurement) {
  try {
    const existing = await getAllMeasurements();
    // Prepend new measurement (newest first)
    const updated = [measurement, ...existing.filter((m) => m.id !== measurement.id)];
    // Cap at 50 saved room audits to prevent excessive storage
    const trimmed = updated.slice(0, 50);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return true;
  } catch (error) {
    console.error('[historyStorage] Error saving measurement:', error);
    return false;
  }
}

/**
 * Retrieves all saved room acoustic measurements.
 *
 * @returns {Promise<Array<Object>>} Array of saved measurements.
 */
export async function getAllMeasurements() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[historyStorage] Error reading measurements:', error);
    return [];
  }
}

/**
 * Deletes a measurement by its unique ID.
 *
 * @param {string} id - The measurement ID.
 * @returns {Promise<boolean>}
 */
export async function deleteMeasurement(id) {
  try {
    const existing = await getAllMeasurements();
    const filtered = existing.filter((m) => m.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('[historyStorage] Error deleting measurement:', error);
    return false;
  }
}

/**
 * Clears all saved room measurements.
 *
 * @returns {Promise<boolean>}
 */
export async function clearAllMeasurements() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('[historyStorage] Error clearing storage:', error);
    return false;
  }
}
