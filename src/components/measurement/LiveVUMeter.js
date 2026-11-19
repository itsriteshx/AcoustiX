import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';

export const LiveVUMeter = ({ meteringDb = -60, isActive = false }) => {
  // Metering in Expo is typically -160 dB to 0 dB, practical range for mic is -60 to 0 dB
  const minDb = -60;
  const maxDb = 0;
  const clampedDb = Math.max(minDb, Math.min(maxDb, meteringDb));
  const percentage = Math.round(((clampedDb - minDb) / (maxDb - minDb)) * 100);

  // Status classification
  let statusText = 'Room Quiet (Ideal)';
  let statusColor = COLORS.accent;

  if (clampedDb > -22) {
    statusText = 'Clap Detected / Loud';
    statusColor = COLORS.danger;
  } else if (clampedDb > -38) {
    statusText = 'Moderate Noise';
    statusColor = COLORS.warning;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.levelRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
        <Text style={styles.dbText}>
          {isActive ? `${clampedDb.toFixed(0)} dB` : '-- dB'}
        </Text>
      </View>

      {/* Meter Bar Background */}
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${isActive ? percentage : 0}%`,
              backgroundColor: statusColor,
            },
          ]}
        />
      </View>

      {/* Tick Marks */}
      <View style={styles.tickRow}>
        <Text style={styles.tickText}>-60 dB</Text>
        <Text style={styles.tickText}>-40 dB</Text>
        <Text style={styles.tickText}>-20 dB</Text>
        <Text style={styles.tickText}>0 dB</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.sm,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dbText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 10,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 5,
    overflow: 'hidden',
    width: '100%',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  tickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  tickText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
});
