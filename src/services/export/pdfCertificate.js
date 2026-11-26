import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generates a print-ready HTML ISO 3382 Acoustic Compliance Certificate.
 *
 * @param {Object} measurement - Complete AcousticMeasurement object.
 * @returns {string} HTML markup for PDF rendering.
 */
export function buildCertificateHtml(measurement) {
  const dateStr = new Date(measurement.createdAt).toLocaleString();
  const venueStr = measurement.location?.venueName || 'Unspecified Venue';
  const coordsStr = measurement.location?.isGeoTagged
    ? `${measurement.location.latitude}° N, ${measurement.location.longitude}° E`
    : 'Not geo-tagged';

  const materials =
    measurement.surfaceMaterials && measurement.surfaceMaterials.length > 0
      ? measurement.surfaceMaterials.join(', ')
      : 'Standard interior finishes';

  const octaveRows = (measurement.octaveBands || [])
    .map(
      (b) => `
      <tr>
        <td>${b.band >= 1000 ? `${b.band / 1000} kHz` : `${b.band} Hz`}</td>
        <td><strong>${b.rt60.toFixed(2)} s</strong></td>
        <td>${b.t20.toFixed(2)} s</td>
        <td>${(b.rSquared * 100).toFixed(1)}%</td>
      </tr>`
    )
    .join('');

  const suitabilityRows = (measurement.interpretation?.roomSuitability || [])
    .map(
      (s) => `
      <div class="suit-row">
        <span class="badge ${s.isCompliant ? 'pass' : 'fail'}">${s.isCompliant ? 'PASS' : 'FAIL'}</span>
        <div>
          <strong>${escapeHtml(s.name)}</strong>
          <div class="muted">${escapeHtml(s.description)}</div>
        </div>
      </div>`
    )
    .join('');

  const clarityBlock = measurement.clarity
    ? `
    <div class="section">
      <h3>ISO 3382 Clarity &amp; Speech Intelligibility</h3>
      <div class="grid">
        <div class="cell"><div class="lbl">Speech Clarity (C50)</div><div class="val">${measurement.clarity.c50 > 0 ? '+' : ''}${measurement.clarity.c50.toFixed(1)} dB</div></div>
        <div class="cell"><div class="lbl">Music Clarity (C80)</div><div class="val">${measurement.clarity.c80 > 0 ? '+' : ''}${measurement.clarity.c80.toFixed(1)} dB</div></div>
        <div class="cell"><div class="lbl">Definition (D50)</div><div class="val">${measurement.clarity.d50.toFixed(1)}%</div></div>
        <div class="cell"><div class="lbl">STI Index</div><div class="val">${measurement.clarity.sti.toFixed(2)} (${escapeHtml(measurement.clarity.stiRating)})</div></div>
      </div>
    </div>`
    : '';

  const avgNote = measurement.multiClapStats
    ? `<div class="avg-pill">${measurement.multiClapStats.count}-Position ISO Average • σ = ±${measurement.multiClapStats.stdDev.toFixed(2)}s (${escapeHtml(measurement.multiClapStats.repeatability)})</div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 28px; }
    .header { background: #0f172a; color: #f8fafc; padding: 20px 24px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 20px; font-weight: 800; color: #06b6d4; letter-spacing: 0.5px; }
    .sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .stamp { border: 2px solid #10b981; color: #10b981; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 11px; letter-spacing: 1px; }
    .meta { margin-top: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; font-size: 12px; line-height: 1.6; }
    .hero { margin-top: 16px; border: 2px solid #06b6d4; border-radius: 12px; padding: 18px; text-align: center; background: #ecfeff; }
    .hero-lbl { font-size: 11px; font-weight: 700; color: #0891b2; letter-spacing: 1.2px; }
    .hero-val { font-size: 44px; font-weight: 800; color: #0f172a; margin: 4px 0; }
    .avg-pill { display: inline-block; background: #cffafe; color: #0e7490; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; margin-top: 4px; }
    .section { margin-top: 18px; }
    h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px; }
    .grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .cell { flex: 1; min-width: 21%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
    .lbl { font-size: 10px; color: #64748b; text-transform: uppercase; }
    .val { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 7px 10px; text-align: left; }
    th { background: #f1f5f9; color: #334155; font-size: 11px; text-transform: uppercase; }
    .suit-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    .badge { font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; }
    .pass { background: #d1fae5; color: #065f46; }
    .fail { background: #fee2e2; color: #991b1b; }
    .muted { color: #64748b; font-size: 11px; }
    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">ACOUSTITAPE</div>
      <div class="sub">ISO 3382 Architectural Room Acoustics Compliance Certificate</div>
    </div>
    <div class="stamp">ISO 3382 VALID</div>
  </div>

  <div class="meta">
    <strong>Room / Space:</strong> ${escapeHtml(measurement.roomName)} &nbsp;|&nbsp;
    <strong>Venue:</strong> ${escapeHtml(venueStr)}<br/>
    <strong>Coordinates:</strong> ${escapeHtml(coordsStr)} &nbsp;|&nbsp;
    <strong>Measured:</strong> ${escapeHtml(dateStr)}<br/>
    <strong>Surface Finishes:</strong> ${escapeHtml(materials)}
  </div>

  <div class="hero">
    <div class="hero-lbl">MEASURED REVERBERATION TIME (RT60)</div>
    <div class="hero-val">${measurement.overallRT60.toFixed(2)} s</div>
    <div class="muted">Linearity Fit R² = ${(measurement.rSquared * 100).toFixed(1)}% &nbsp;•&nbsp; SNR = ${measurement.snrDb.toFixed(1)} dB</div>
    ${avgNote}
  </div>

  <div class="section">
    <h3>ISO 3382 Decay &amp; Balance Parameters</h3>
    <div class="grid">
      <div class="cell"><div class="lbl">T20 (-5 to -25 dB)</div><div class="val">${measurement.t20.toFixed(2)} s</div></div>
      <div class="cell"><div class="lbl">T30 (-5 to -35 dB)</div><div class="val">${measurement.t30.toFixed(2)} s</div></div>
      <div class="cell"><div class="lbl">Early Decay (EDT)</div><div class="val">${measurement.edt.toFixed(2)} s</div></div>
      <div class="cell"><div class="lbl">Bass / Treble Ratio</div><div class="val">${measurement.bassRatio.toFixed(2)} / ${measurement.trebleRatio.toFixed(2)}</div></div>
    </div>
  </div>

  ${clarityBlock}

  <div class="section">
    <h3>6-Band Octave Frequency Spectrum</h3>
    <table>
      <thead><tr><th>Octave Band</th><th>RT60</th><th>T20</th><th>Fit R²</th></tr></thead>
      <tbody>${octaveRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h3>Room Purpose Suitability</h3>
    ${suitabilityRows}
  </div>

  <div class="footer">
    Generated by AcoustiTape Mobile Acoustic Instrument (Project Code: 2501010309) • Schroeder Backward Integration Engine
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generates a PDF file from the measurement and opens the native share sheet.
 *
 * @param {Object} measurement
 * @returns {Promise<boolean>}
 */
export async function exportPdfCertificate(measurement) {
  try {
    const html = buildCertificateHtml(measurement);
    const { uri } = await Print.printToFileAsync({ html });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `AcoustiTape Certificate - ${measurement.roomName}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      await Print.printAsync({ html });
    }
    return true;
  } catch (error) {
    console.error('[pdfCertificate] Export error:', error);
    Alert.alert('PDF Export Failed', error.message || 'Could not generate PDF certificate.');
    return false;
  }
}
