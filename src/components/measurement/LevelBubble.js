import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';

export const LevelBubble = ({
  pitch = 0,
  roll = 0,
  isSteady = true,
  isLevel = true,
  isBumped = false,
  size = 72,
}) => {
  const radius = size / 2;
  const maxOffset = radius - 10;

  // Map pitch/roll (-30 to +30 degrees) to pixel offset
  const clamp = (val, max) => Math.max(-max, Math.min(max, val));
  const offsetX = clamp((roll / 30) * maxOffset, maxOffset);
  const offsetY = clamp((pitch / 30) * maxOffset, maxOffset);

  let bubbleColor = COLORS.accent;
  let statusText = 'Phone Steady & Level';

  if (isBumped) {
    bubbleColor = COLORS.danger;
    statusText = 'Bump / Movement Detected!';
  } else if (!isSteady) {
    bubbleColor = COLORS.warning;
    statusText = 'Holding Tremor (Hold Steady)';
  } else if (!isLevel) {
    bubbleColor = COLORS.warning;
    statusText = 'Phone Tilted';
  }

  return (
    <View style={styles.container}>
      <View style={styles.meterRow}>
        {/* SVG Spirit Level Bubble */}
        <Svg width={size} height={size}>
          {/* Outer ring */}
          <Circle
            cx={radius}
            cy={radius}
            r={radius - 2}
            stroke={COLORS.border}
            strokeWidth={1.5}
            fill={COLORS.surface}
          />
          {/* Target bullseye ring */}
          <Circle
            cx={radius}
            cy={radius}
            r={12}
            stroke={COLORS.surfaceLight}
            strokeWidth={1}
            fill="none"
          />
          {/* Crosshair lines */}
          <Line
            x1={radius - 8}
            y1={radius}
            x2={radius + 8}
            y2={radius}
            stroke={COLORS.gridLine}
            strokeWidth={1}
          />
          <Line
            x1={radius}
            y1={radius - 8}
            x2={radius}
            y2={radius + 8}
            stroke={COLORS.gridLine}
            strokeWidth={1}
          />
          {/* Dynamic Spirit Bubble */}
          <Circle
            cx={radius + offsetX}
            cy={radius + offsetY}
            r={8}
            fill={bubbleColor}
            opacity={0.9}
          />
        </Svg>

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <View style={[styles.dot, { backgroundColor: bubbleColor }]} />
            <Text style={[styles.statusTitle, { color: bubbleColor }]}>{statusText}</Text>
          </View>
          <Text style={styles.subtext}>
            Tilt: {roll}° Roll, {pitch}° Pitch • ISO 3382 Sensor Guard
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACING.xs,
    width: '100%',
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtext: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
