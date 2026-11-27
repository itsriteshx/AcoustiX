import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Share } from 'react-native';
import { buildMeasurementsCsv } from './csvFormatter.js';

export { buildMeasurementsCsv };

/**
 * Writes measurements to a .csv file in cache and opens the native share sheet.
 *
 * @param {Array<Object>} measurements
 * @returns {Promise<boolean>}
 */
export async function exportHistoryCsv(measurements) {
  try {
    const csv = buildMeasurementsCsv(measurements);
    const filePath = `${FileSystem.cacheDirectory}acoustitape_audits_${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(filePath, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export AcoustiTape CSV Dataset',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      await Share.share({
        title: 'AcoustiTape Room Audits (CSV)',
        message: csv,
      });
    }
    return true;
  } catch (error) {
    console.error('[csvExporter] Export error:', error);
    Alert.alert('CSV Export Failed', error.message || 'Could not export CSV dataset.');
    return false;
  }
}
