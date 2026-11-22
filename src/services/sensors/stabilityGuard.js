import { Accelerometer } from 'expo-sensors';

let accelerometerSubscription = null;

/**
 * Initializes and starts listening to accelerometer data.
 *
 * @param {Function} onUpdate - Callback receiving `{ pitch: number, roll: number, isSteady: boolean, isLevel: boolean, isBumped: boolean, gForce: number }`
 * @param {number} [updateIntervalMs=100] - Polling interval in ms.
 */
export function startStabilityGuard(onUpdate, updateIntervalMs = 100) {
  stopStabilityGuard();

  try {
    Accelerometer.setUpdateInterval(updateIntervalMs);

    let recentMagnitudes = [];
    const windowSize = 5;

    accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
      // Total acceleration in Gs (1.0 = normal Earth gravity)
      const gForce = Math.sqrt(x * x + y * y + z * z);

      // Detect sudden bump / drop artifact
      const isBumped = gForce > 1.75;

      // Track recent magnitude variance to detect hand tremors / phone movement
      recentMagnitudes.push(gForce);
      if (recentMagnitudes.length > windowSize) {
        recentMagnitudes.shift();
      }

      let variance = 0;
      if (recentMagnitudes.length >= 3) {
        const avg = recentMagnitudes.reduce((a, b) => a + b, 0) / recentMagnitudes.length;
        variance = recentMagnitudes.reduce((sum, val) => sum + Math.abs(val - avg), 0) / recentMagnitudes.length;
      }

      // Phone is steady if variance is very low (< 0.08G)
      const isSteady = variance < 0.08 && !isBumped;

      // Calculate tilt angles in degrees
      // Pitch: forward/backward tilt
      // Roll: left/right tilt
      const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
      const roll = Math.atan2(-x, z) * (180 / Math.PI);

      // ISO 3382 recommends holding phone upright or flat within +/- 15 degrees
      const isLevel = Math.abs(roll) < 20 && Math.abs(pitch) < 30;

      onUpdate({
        pitch: Math.round(pitch),
        roll: Math.round(roll),
        gForce: Number(gForce.toFixed(2)),
        isSteady,
        isLevel,
        isBumped,
      });
    });
  } catch (error) {
    console.warn('[stabilityGuard] Accelerometer unavailable:', error);
  }
}

/**
 * Stops accelerometer subscription.
 */
export function stopStabilityGuard() {
  if (accelerometerSubscription) {
    try {
      accelerometerSubscription.remove();
    } catch (_) {}
    accelerometerSubscription = null;
  }
}
