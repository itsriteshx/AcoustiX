/**
 * Architectural Room Modes & Standing Wave Resonance Calculator
 *
 * Computes axial & tangential room eigenfrequencies below 250 Hz:
 *   f(nx, ny, nz) = (c / 2) * sqrt((nx/L)^2 + (ny/W)^2 + (nz/H)^2)
 * where c = 343 m/s (speed of sound at 20°C).
 *
 * Also computes:
 * - Schroeder Crossover Frequency: f_s = 2000 * sqrt(RT60 / V)
 * - Coincident Mode Stacking / Bolt Ratio check
 */

const SPEED_OF_SOUND = 343; // m/s at 20°C

/**
 * Calculates room standing-wave modes, Schroeder frequency, and ratio warnings.
 *
 * @param {number} length - Room length in meters.
 * @param {number} width - Room width in meters.
 * @param {number} height - Room height in meters.
 * @param {number} [rt60=0.6] - Current RT60 in seconds.
 * @returns {{
 *   volume: number,
 *   schroederFreq: number,
 *   ratioStatus: string,
 *   ratioMessage: string,
 *   isRatioHealthy: boolean,
 *   modes: Array<{ freq: number, type: string, axis: string, indices: string, severity: string }>
 * }}
 */
export function calculateRoomModes(length, width, height, rt60 = 0.6) {
  const L = Math.max(1, length);
  const W = Math.max(1, width);
  const H = Math.max(1, height);
  const volume = Number((L * W * H).toFixed(1));

  // Schroeder Frequency: transition between modal & diffuse sound fields
  const schroederFreq = Math.round(2000 * Math.sqrt(Math.max(0.15, rt60) / volume));

  // Check dimension ratios for coincident standing waves
  const dims = [L, W, H].sort((a, b) => a - b); // [H, W, L]
  const r1 = dims[1] / dims[0];
  const r2 = dims[2] / dims[0];

  const isSquareLike =
    Math.abs(L - W) / Math.max(L, W) < 0.08 ||
    Math.abs(W - H) / Math.max(W, H) < 0.08 ||
    Math.abs(L - H) / Math.max(L, H) < 0.08;
  const isMultiple =
    Math.abs(r1 - Math.round(r1)) < 0.08 || Math.abs(r2 - Math.round(r2)) < 0.08;

  let ratioStatus = 'Optimal Dispersion';
  let ratioMessage = 'Dimensions avoid severe harmonic mode stacking (good Bolt-area balance).';
  let isRatioHealthy = true;

  if (isSquareLike) {
    ratioStatus = 'Coincident Modes Warning';
    ratioMessage = 'Two room dimensions are nearly equal. Expect strong bass boom & null spots at identical frequencies.';
    isRatioHealthy = false;
  } else if (isMultiple) {
    ratioStatus = 'Harmonic Multiple Warning';
    ratioMessage = 'One dimension is an integer multiple of another, reinforcing 2nd/3rd harmonic standing waves.';
    isRatioHealthy = false;
  }

  const modes = [];
  const maxOrder = 4;
  const maxFreq = 250;

  for (let nx = 0; nx <= maxOrder; nx++) {
    for (let ny = 0; ny <= maxOrder; ny++) {
      for (let nz = 0; nz <= maxOrder; nz++) {
        if (nx === 0 && ny === 0 && nz === 0) continue;

        const nonZeroCount = (nx > 0 ? 1 : 0) + (ny > 0 ? 1 : 0) + (nz > 0 ? 1 : 0);
        // Focus on Axial (strongest) and Tangential (moderate) modes
        if (nonZeroCount > 2) continue;

        const freq =
          (SPEED_OF_SOUND / 2) *
          Math.sqrt((nx / L) ** 2 + (ny / W) ** 2 + (nz / H) ** 2);

        if (freq <= maxFreq) {
          let type = 'Axial';
          let severity = 'High';
          if (nonZeroCount === 2) {
            type = 'Tangential';
            severity = 'Medium';
          }

          let axis = '';
          if (nx > 0 && ny === 0 && nz === 0) axis = 'Length (X)';
          else if (ny > 0 && nx === 0 && nz === 0) axis = 'Width (Y)';
          else if (nz > 0 && nx === 0 && ny === 0) axis = 'Height (Z)';
          else axis = '2-Axis';

          modes.push({
            freq: Number(freq.toFixed(1)),
            type,
            axis,
            indices: `(${nx},${ny},${nz})`,
            severity,
          });
        }
      }
    }
  }

  modes.sort((a, b) => a.freq - b.freq);

  return {
    volume,
    schroederFreq,
    ratioStatus,
    ratioMessage,
    isRatioHealthy,
    modes: modes.slice(0, 18),
  };
}
