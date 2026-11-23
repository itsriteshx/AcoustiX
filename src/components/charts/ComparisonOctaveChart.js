import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

export const ComparisonOctaveChart = ({
  octavesA = [],
  octavesB = [],
  nameA = 'Room A',
  nameB = 'Room B',
  width = 330,
  height = 180,
}) => {
  const paddingLeft = 32;
  const paddingBottom = 26;
  const paddingTop = 16;
  const paddingRight = 14;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxRT = 1.4;

  const scaleY = (rt) => {
    const clamped = Math.max(0, Math.min(maxRT, rt));
    return paddingTop + (1 - clamped / maxRT) * chartHeight;
  };

  const bands = [125, 250, 500, 1000, 2000, 4000];
  const groupWidth = chartWidth / bands.length;
  const barWidth = 10;
  const colorA = '#38BDF8';
  const colorB = '#FB923C';

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0.3, 0.6, 0.9, 1.2].map((rt) => {
          const y = scaleY(rt);
          return (
            <React.Fragment key={rt}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke={COLORS.gridLine}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <SvgText
                x={paddingLeft - 6}
                y={y + 4}
                fill={COLORS.textMuted}
                fontSize={9}
                textAnchor="end"
              >
                {`${rt.toFixed(1)}s`}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Grouped Octave Bars */}
        {bands.map((band, idx) => {
          const groupCenterX = paddingLeft + idx * groupWidth + groupWidth / 2;
          const rtValA = octavesA.find((o) => o.band === band)?.rt60 || 0;
          const rtValB = octavesB.find((o) => o.band === band)?.rt60 || 0;

          const yA = scaleY(rtValA);
          const yB = scaleY(rtValB);

          const hA = height - paddingBottom - yA;
          const hB = height - paddingBottom - yB;

          return (
            <React.Fragment key={band}>
              {/* Bar A */}
              <Rect
                x={groupCenterX - barWidth - 1}
                y={yA}
                width={barWidth}
                height={Math.max(2, hA)}
                rx={2}
                fill={colorA}
              />
              {/* Bar B */}
              <Rect
                x={groupCenterX + 1}
                y={yB}
                width={barWidth}
                height={Math.max(2, hB)}
                rx={2}
                fill={colorB}
              />
              {/* Band Label */}
              <SvgText
                x={groupCenterX}
                y={height - paddingBottom + 16}
                fill={COLORS.textSecondary}
                fontSize={9}
                textAnchor="middle"
              >
                {band >= 1000 ? `${band / 1000}k` : `${band}`}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colorA }]} />
          <Text style={styles.legendLabel} numberOfLines={1}>
            {nameA}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colorB }]} />
          <Text style={styles.legendLabel} numberOfLines={1}>
            {nameB}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 6,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 4,
    borderRadius: 2,
  },
  legendLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
  },
});
