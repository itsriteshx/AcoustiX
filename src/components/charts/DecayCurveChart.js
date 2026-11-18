import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Rect } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

export const DecayCurveChart = ({
  points = [],
  overallRT60,
  width = 330,
  height = 180,
}) => {
  if (!points || points.length === 0) {
    return (
      <View style={[styles.placeholder, { width, height }]}>
        <Text style={styles.placeholderText}>No decay curve data available</Text>
      </View>
    );
  }

  const paddingLeft = 36;
  const paddingBottom = 26;
  const paddingTop = 14;
  const paddingRight = 14;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxTime = Math.max(...points.map((p) => p.timeMs), 800);
  const minDb = -60;
  const maxDb = 0;

  const scaleX = (timeMs) => paddingLeft + (timeMs / maxTime) * chartWidth;
  const scaleY = (db) => {
    const clamped = Math.max(minDb, Math.min(maxDb, db));
    return paddingTop + ((maxDb - clamped) / (maxDb - minDb)) * chartHeight;
  };

  const pathD = points.reduce((acc, pt, index) => {
    const x = scaleX(pt.timeMs);
    const y = scaleY(pt.energyDb);
    return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const yMinus5 = scaleY(-5);
  const yMinus25 = scaleY(-25);
  const fitBandHeight = yMinus25 - yMinus5;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* T20 evaluation zone (-5 dB to -25 dB) */}
        <Rect
          x={paddingLeft}
          y={yMinus5}
          width={chartWidth}
          height={fitBandHeight}
          fill={COLORS.primary}
          opacity={0.08}
        />

        {/* Horizontal dB Grid lines */}
        {[0, -20, -40, -60].map((db) => {
          const y = scaleY(db);
          return (
            <React.Fragment key={db}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke={COLORS.gridLine}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText
                x={paddingLeft - 6}
                y={y + 4}
                fill={COLORS.textMuted}
                fontSize={9}
                textAnchor="end"
              >
                {`${db}`}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Time Grid lines */}
        {[0.25, 0.5, 0.75, 1.0].map((fraction) => {
          const time = Math.round(maxTime * fraction);
          const x = scaleX(time);
          return (
            <React.Fragment key={fraction}>
              <Line
                x1={x}
                y1={paddingTop}
                x2={x}
                y2={height - paddingBottom}
                stroke={COLORS.gridLine}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText
                x={x}
                y={height - paddingBottom + 16}
                fill={COLORS.textMuted}
                fontSize={9}
                textAnchor="middle"
              >
                {`${time}ms`}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Schroeder Energy Decay Curve */}
        <Path d={pathD} stroke={COLORS.curve} strokeWidth={2.5} fill="none" />

        {/* Linear regression slope overlay */}
        {overallRT60 && (
          <Line
            x1={scaleX(0)}
            y1={scaleY(0)}
            x2={scaleX(Math.min(maxTime, overallRT60 * 1000))}
            y2={scaleY(-60)}
            stroke={COLORS.fitLine}
            strokeWidth={1.5}
            strokeDasharray="5 3"
          />
        )}
      </Svg>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: COLORS.curve }]} />
          <Text style={styles.legendLabel}>Schroeder Decay (EDC)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: COLORS.fitLine }]} />
          <Text style={styles.legendLabel}>T20 Fit (-5 to -25dB)</Text>
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
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 10,
    height: 3,
    borderRadius: 2,
  },
  legendLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});
