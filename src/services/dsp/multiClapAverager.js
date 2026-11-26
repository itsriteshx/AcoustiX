import { ROOM_TARGET_SPECS } from '../../constants/targets.js';

/**
 * ISO 3382 Multi-Position / Multi-Clap Averaging Engine
 *
 * Averages N individual AcousticMeasurement runs (typically 3 positions)
 * to suppress spatial standing-wave variance and improve RT60 precision.
 */

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((acc, v) => acc + (v - m) * (v - m), 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Averages multiple AcousticMeasurement objects into a single Master Room Profile.
 *
 * @param {Array<Object>} measurements - Array of >= 2 valid AcousticMeasurement objects.
 * @returns {Object} Averaged AcousticMeasurement with multiClapStats metadata.
 */
export function averageMeasurements(measurements) {
  if (!measurements || measurements.length === 0) {
    throw new Error('No measurements provided to average.');
  }
  if (measurements.length === 1) {
    return measurements[0];
  }

  const base = measurements[measurements.length - 1];
  const count = measurements.length;

  const rt60List = measurements.map((m) => m.overallRT60);
  const avgRT60 = Number(mean(rt60List).toFixed(2));
  const rt60StdDev = Number(stdDev(rt60List).toFixed(3));

  const avgEdt = Number(mean(measurements.map((m) => m.edt)).toFixed(2));
  const avgT20 = Number(mean(measurements.map((m) => m.t20)).toFixed(2));
  const avgT30 = Number(mean(measurements.map((m) => m.t30)).toFixed(2));
  const avgRSquared = Number(mean(measurements.map((m) => m.rSquared)).toFixed(3));
  const avgPeakDb = Number(mean(measurements.map((m) => m.peakDb)).toFixed(1));
  const avgNoiseDb = Number(mean(measurements.map((m) => m.noiseFloorDb)).toFixed(1));
  const avgSnrDb = Number(mean(measurements.map((m) => m.snrDb)).toFixed(1));
  const avgBassRatio = Number(mean(measurements.map((m) => m.bassRatio)).toFixed(2));
  const avgTrebleRatio = Number(mean(measurements.map((m) => m.trebleRatio)).toFixed(2));

  // Average octave bands
  const baseBands = base.octaveBands || [];
  const avgOctaveBands = baseBands.map((bandObj, idx) => {
    const bandRT60s = measurements.map((m) => m.octaveBands?.[idx]?.rt60 ?? bandObj.rt60);
    const bandT20s = measurements.map((m) => m.octaveBands?.[idx]?.t20 ?? bandObj.t20);
    const bandR2s = measurements.map((m) => m.octaveBands?.[idx]?.rSquared ?? bandObj.rSquared);
    return {
      band: bandObj.band,
      rt60: Number(mean(bandRT60s).toFixed(2)),
      t20: Number(mean(bandT20s).toFixed(2)),
      rSquared: Number(mean(bandR2s).toFixed(3)),
    };
  });

  // Average decay curve points by index
  const minLen = Math.min(...measurements.map((m) => (m.decayCurve || []).length));
  const avgDecayCurve = [];
  for (let i = 0; i < minLen; i++) {
    const timeMs = Math.round(mean(measurements.map((m) => m.decayCurve[i].timeMs)));
    const energyDb = Number(mean(measurements.map((m) => m.decayCurve[i].energyDb)).toFixed(2));
    avgDecayCurve.push({ timeMs, energyDb });
  }

  // Average clarity metrics if present
  const clarityRuns = measurements.map((m) => m.clarity).filter(Boolean);
  let avgClarity = base.clarity;
  if (clarityRuns.length > 0) {
    const avgC50 = Number(mean(clarityRuns.map((c) => c.c50)).toFixed(1));
    const avgC80 = Number(mean(clarityRuns.map((c) => c.c80)).toFixed(1));
    const avgD50 = Number(mean(clarityRuns.map((c) => c.d50)).toFixed(1));
    const avgSti = Number(mean(clarityRuns.map((c) => c.sti)).toFixed(2));
    const stiRating =
      avgSti >= 0.75 ? 'Excellent' : avgSti >= 0.60 ? 'Good' : avgSti >= 0.45 ? 'Fair' : avgSti >= 0.30 ? 'Poor' : 'Bad';

    avgClarity = {
      ...clarityRuns[0],
      c50: avgC50,
      c80: avgC80,
      d50: avgD50,
      sti: avgSti,
      stiRating,
    };
  }

  // Re-evaluate room suitability on averaged RT60
  const roomSuitability = Object.values(ROOM_TARGET_SPECS).map((spec) => {
    const isCompliant = avgRT60 >= spec.minRT60 && avgRT60 <= spec.maxRT60;
    return {
      category: spec.category,
      name: spec.name,
      targetMin: spec.minRT60,
      targetMax: spec.maxRT60,
      description: isCompliant
        ? `Compliant with ${spec.name} target range (${spec.minRT60}s - ${spec.maxRT60}s).`
        : avgRT60 < spec.minRT60
        ? `Too dry for ${spec.name} (minimum recommended is ${spec.minRT60}s).`
        : `Too reverberant for ${spec.name} (exceeds ${spec.maxRT60}s limit).`,
      isCompliant,
    };
  });

  let warmth = 'neutral';
  if (avgBassRatio > 1.15) warmth = 'warm';
  else if (avgBassRatio < 0.95) warmth = 'bright';

  const repeatability =
    rt60StdDev <= 0.03 ? 'High Precision' : rt60StdDev <= 0.08 ? 'Good Consistency' : 'High Spatial Variance';

  return {
    ...base,
    id: 'meas-avg-' + Date.now(),
    createdAt: new Date().toISOString(),
    overallRT60: avgRT60,
    edt: avgEdt,
    t20: avgT20,
    t30: avgT30,
    rSquared: avgRSquared,
    peakDb: avgPeakDb,
    noiseFloorDb: avgNoiseDb,
    snrDb: avgSnrDb,
    bassRatio: avgBassRatio,
    trebleRatio: avgTrebleRatio,
    clarity: avgClarity,
    octaveBands: avgOctaveBands,
    decayCurve: avgDecayCurve,
    multiClapStats: {
      count,
      individualRT60s: rt60List,
      stdDev: rt60StdDev,
      repeatability,
    },
    interpretation: {
      ...base.interpretation,
      warmth,
      summary: `${count}-Position ISO 3382 Average (RT60: ${avgRT60}s ± ${rt60StdDev}s). ${repeatability} across sampled room locations.`,
      roomSuitability,
    },
  };
}
