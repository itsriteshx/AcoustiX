/**
 * Generates sample ISO 3382 measurement data for UI demonstration and testing.
 */
export function generateSampleMeasurement(roomName = 'Classroom 302') {
  const rt60 = 0.58;
  const decayPoints = [];
  const totalDurationMs = 1200;
  const stepMs = 20;

  for (let t = 0; t <= totalDurationMs; t += stepMs) {
    const idealDb = -(60 / rt60) * (t / 1000);
    const noise = (Math.random() - 0.5) * 0.8;
    const energyDb = Math.max(-55, Number((idealDb + noise).toFixed(2)));
    decayPoints.push({ timeMs: t, energyDb });
  }

  return {
    id: 'meas-' + Date.now(),
    roomName,
    createdAt: new Date().toISOString(),
    overallRT60: 0.58,
    edt: 0.52,
    t20: 0.19,
    t30: 0.29,
    rSquared: 0.985,
    peakDb: 88.4,
    noiseFloorDb: -48.2,
    snrDb: 40.2,
    bassRatio: 1.15,
    trebleRatio: 0.88,
    location: {
      isGeoTagged: true,
      latitude: 28.6139,
      longitude: 77.2090,
      altitude: 216,
      venueName: 'Academic Block 4, Campus',
      city: 'University Campus',
      formattedAddress: 'Room 302, Academic Block 4',
    },
    photoUri: null,
    surfaceMaterials: ['Carpet Flooring', 'Acoustic Ceiling Tiles', 'Plasterboard Walls'],
    octaveBands: [
      { band: 125, rt60: 0.72, t20: 0.24, rSquared: 0.96 },
      { band: 250, rt60: 0.65, t20: 0.21, rSquared: 0.98 },
      { band: 500, rt60: 0.58, t20: 0.19, rSquared: 0.99 },
      { band: 1000, rt60: 0.55, t20: 0.18, rSquared: 0.99 },
      { band: 2000, rt60: 0.51, t20: 0.17, rSquared: 0.98 },
      { band: 4000, rt60: 0.44, t20: 0.15, rSquared: 0.97 },
    ],
    decayCurve: decayPoints,
    interpretation: {
      summary: 'Well-balanced room acoustic. Speech intelligibility is very good with minimal flutter echo.',
      warmth: 'warm',
      roomSuitability: [
        {
          category: 'classroom',
          name: 'Classroom / Lecture',
          targetMin: 0.5,
          targetMax: 0.75,
          description: 'Within ideal ANSI S12.60 target range for lecture clarity.',
          isCompliant: true,
        },
        {
          category: 'conference_speech',
          name: 'Meeting Room',
          targetMin: 0.45,
          targetMax: 0.65,
          description: 'Excellent speech definition for calls and presentations.',
          isCompliant: true,
        },
        {
          category: 'recording_studio',
          name: 'Control Room',
          targetMin: 0.25,
          targetMax: 0.4,
          description: 'Slightly too reflective for critical audio mastering.',
          isCompliant: false,
        },
      ],
    },
  };
}
