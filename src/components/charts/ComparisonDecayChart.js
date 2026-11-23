import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Rect } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

export const ComparisonDecayChart = ({
  curveA = [],
  curveB = [],
  nameA = 'Room A',
  nameB = 'Room B',
  rtA = 0.5,
  rtB = 0.5,
  width = 330,
  height = 190,
}) => {
  const paddingLeft = 36;
  const paddingBottom = 26;
  const paddingTop = 14;
  const paddingRight = 14;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxTime = Math.max(
    ...curveA.map((p) => p.timeMs || 0),
    ...curveB.map((p) => p.timeMs || 0),
    800
  );

  const minDb = -60;
  const maxDb = 0;

  const scaleX = (timeMs) => paddingLeft + (timeMs / maxTime) * chartWidth;
  const scaleY = (db) => {
    const clamped = Math.max(minDb, Math.min(maxDb, db));
    return paddingTop + ((maxDb - clamped) / (maxDb - minDb)) * chartHeight;
  };

  const buildPath = (points) => {
    if (!points || points.length === 0) return '';
    return points.reduce((acc, pt, index) => {
      const x = scaleX(pt.timeMs);
      const y = scaleY(pt.energyDb);
      return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const pathA = buildPath(curveA);
  const pathB = buildPath(curveB);

  const colorA = '#38BDF8'; // Sky Blue
  const colorB = '#FB923C'; // Orange

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* dB Grid lines */}
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

        {/* Curve A */}
        {pathA ? <Path d={pathA} stroke={colorA} strokeWidth={2.5} fill="none" /> : null}

        {/* Curve B */}
        {pathB ? <Path d={pathB} stroke={colorB} strokeWidth={2.5} fill="none" /> : null}
      </Svg>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colorA }]} />
          <Text style={styles.legendLabel} numberOfLines={1}>
            {nameA} ({rtA.toFixed(2)}s)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colorB }]} />
          <Text style={styles.legendLabel} numberOfLines={1}>
            {nameB} ({rtB.toFixed(2)}s)
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
    paddingTop: 10,
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
