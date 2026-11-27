function escapeCsvCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const CSV_HEADERS = [
  'ID',
  'Room Name',
  'Venue',
  'Date',
  'RT60 (s)',
  'EDT (s)',
  'T20 (s)',
  'T30 (s)',
  'Fit R2',
  'SNR (dB)',
  'Bass Ratio',
  'Treble Ratio',
  'C50 (dB)',
  'C80 (dB)',
  'D50 (%)',
  'STI',
  'STI Rating',
  'Surface Materials',
];

/**
 * Converts an array of AcousticMeasurement objects into an RFC-4180 CSV string.
 *
 * @param {Array<Object>} measurements
 * @returns {string}
 */
export function buildMeasurementsCsv(measurements) {
  if (!Array.isArray(measurements) || measurements.length === 0) {
    throw new Error('No measurements available to export.');
  }

  const lines = [CSV_HEADERS.map(escapeCsvCell).join(',')];

  for (const m of measurements) {
    const row = [
      m.id || '',
      m.roomName || '',
      m.location?.venueName || 'Unspecified Venue',
      m.createdAt || '',
      typeof m.overallRT60 === 'number' ? m.overallRT60.toFixed(2) : '',
      typeof m.edt === 'number' ? m.edt.toFixed(2) : '',
      typeof m.t20 === 'number' ? m.t20.toFixed(2) : '',
      typeof m.t30 === 'number' ? m.t30.toFixed(2) : '',
      typeof m.rSquared === 'number' ? m.rSquared.toFixed(3) : '',
      typeof m.snrDb === 'number' ? m.snrDb.toFixed(1) : '',
      typeof m.bassRatio === 'number' ? m.bassRatio.toFixed(2) : '',
      typeof m.trebleRatio === 'number' ? m.trebleRatio.toFixed(2) : '',
      m.clarity ? m.clarity.c50.toFixed(1) : '',
      m.clarity ? m.clarity.c80.toFixed(1) : '',
      m.clarity ? m.clarity.d50.toFixed(1) : '',
      m.clarity ? m.clarity.sti.toFixed(2) : '',
      m.clarity ? m.clarity.stiRating : '',
      Array.isArray(m.surfaceMaterials) ? m.surfaceMaterials.join('; ') : '',
    ];
    lines.push(row.map(escapeCsvCell).join(','));
  }

  return lines.join('\n');
}
