import { Share, Alert } from 'react-native';

/**
 * Formats an acoustic measurement into a professional audit report text.
 *
 * @param {Object} measurement - The complete AcousticMeasurement object.
 * @returns {string} Formatted audit report text.
 */
export function formatAuditReport(measurement) {
  const dateStr = new Date(measurement.createdAt).toLocaleString();
  const venueStr = measurement.location?.venueName || 'Unspecified Venue';
  const coordsStr = measurement.location?.isGeoTagged
    ? `GPS: ${measurement.location.latitude}° N, ${measurement.location.longitude}° E (Alt: ${measurement.location.altitude || 0}m)`
    : 'GPS: Not geo-tagged';

  const materialsStr =
    measurement.surfaceMaterials && measurement.surfaceMaterials.length > 0
      ? measurement.surfaceMaterials.join(', ')
      : 'Standard drywall / uncalibrated';

  const octavesTable = (measurement.octaveBands || [])
    .map((o) => `  • ${o.band >= 1000 ? o.band / 1000 + ' kHz' : o.band + ' Hz'}: ${o.rt60.toFixed(2)}s (R² ${(o.rSquared * 100).toFixed(0)}%)`)
    .join('\n');

  const complianceList = (measurement.interpretation?.roomSuitability || [])
    .map((s) => `  ${s.isCompliant ? '[PASS]' : '[FAIL]'} ${s.name}: ${s.description}`)
    .join('\n');

  return `
========================================
   ACOUSTITAPE: ROOM ACOUSTIC AUDIT
   ISO 3382 Architectural Measurement
========================================

VENUE / SPACE:
  Room: ${measurement.roomName}
  Location: ${venueStr}
  ${coordsStr}
  Date & Time: ${dateStr}
  Surface Materials: ${materialsStr}

PRIMARY ACOUSTIC METRIC:
  RT60 (Reverberation Time): ${measurement.overallRT60.toFixed(2)} seconds
  Fit Linearity (R²): ${(measurement.rSquared * 100).toFixed(1)}% (ISO 3382 Valid)

ISO 3382 TECHNICAL PARAMETERS:
  • T20 (-5 to -25 dB): ${measurement.t20.toFixed(2)}s
  • T30 (-5 to -35 dB): ${measurement.t30.toFixed(2)}s
  • Early Decay Time (EDT): ${measurement.edt.toFixed(2)}s
  • Peak Sound Pressure: ${measurement.peakDb} dBFS
  • Background Noise Floor: ${measurement.noiseFloorDb} dBFS
  • Signal-to-Noise Ratio: ${measurement.snrDb} dB
${
  measurement.clarity
    ? `
ACOUSTIC CLARITY & SPEECH INTELLIGIBILITY:
  • Speech Transmission Index (STI): ${measurement.clarity.sti.toFixed(2)} [${measurement.clarity.stiRating.toUpperCase()}]
  • Speech Clarity (C50): ${measurement.clarity.c50 > 0 ? '+' : ''}${measurement.clarity.c50.toFixed(1)} dB (${measurement.clarity.speechSuitability})
  • Music Clarity (C80): ${measurement.clarity.c80 > 0 ? '+' : ''}${measurement.clarity.c80.toFixed(1)} dB (${measurement.clarity.musicSuitability})
  • Sound Definition (D50): ${measurement.clarity.d50.toFixed(1)}%`
    : ''
}

FREQUENCY SPECTRUM (OCTAVE BANDS):
${octavesTable}

ACOUSTIC BALANCE & COLORATION:
  • Bass Ratio (Warmth): ${measurement.bassRatio.toFixed(2)} [${measurement.interpretation?.warmth?.toUpperCase() || 'NEUTRAL'}]
  • Treble Ratio (Brilliance): ${measurement.trebleRatio.toFixed(2)}
  • Acoustic Summary: ${measurement.interpretation?.summary || 'Standard decay profile.'}

ROOM SUITABILITY CHECKLIST:
${complianceList}

Generated with AcoustiTape Mobile Application
Schroeder Backward Integration Engine (ISO 3382)
========================================
`.trim();
}

/**
 * Shares or exports the acoustic audit report using native sharing dialogs.
 *
 * @param {Object} measurement - The complete AcousticMeasurement object.
 * @returns {Promise<boolean>}
 */
export async function shareAuditReport(measurement) {
  try {
    const reportText = formatAuditReport(measurement);
    await Share.share({
      title: `Acoustic Audit - ${measurement.roomName}`,
      message: reportText,
    });
    return true;
  } catch (error) {
    console.error('[exportService] Share error:', error);
    Alert.alert('Export Failed', 'Could not share acoustic report.');
    return false;
  }
}
