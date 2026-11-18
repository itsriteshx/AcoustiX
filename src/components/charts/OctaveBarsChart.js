import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

export const OctaveBarsChart = ({
  octaves = [],
  targetAvg = 0.55,
  width = 330,
  height = 170,
}) => {
  const paddingLeft = 32;
  const paddingBottom = 26;
  const paddingTop = 16;
  const paddingRight = 14;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxRT = 1.2;

  const scaleY = (rt) => {
    const clamped = Math.max(0, Math.min(maxRT, rt));
    return paddingTop + (1 - clamped / maxRT) * chartHeight;
  };

  const barWidth = 24;
  const numBars = octaves.length;
  const gap = (chartWidth - numBars * barWidth) / (numBars + 1);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Horizontal grid lines */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((rt) => {
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

        {/* Target average guideline */}
        {targetAvg && (
          <Line
            x1={paddingLeft}
            y1={scaleY(targetAvg)}
            x2={width - paddingRight}
            y2={scaleY(targetAvg)}
            stroke={COLORS.accent}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        )}

        {/* Frequency bars */}
        {octaves.map((item, idx) => {
          const x = paddingLeft + gap + idx * (barWidth + gap);
          const y = scaleY(item.rt60);
          const barHeight = height - paddingBottom - y;
          const isBass = item.band <= 250;
          const barColor = isBass ? '#38BDF8' : COLORS.primary;

          return (
            <React.Fragment key={item.band}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barHeight)}
                rx={4}
                fill={barColor}
              />
              <SvgText
                x={x + barWidth / 2}
                y={y - 4}
                fill={COLORS.text}
                fontSize={8}
                fontWeight="bold"
                textAnchor="middle"
              >
                {`${item.rt60.toFixed(2)}s`}
              </SvgText>
              <SvgText
                x={x + barWidth / 2}
                y={height - paddingBottom + 16}
                fill={COLORS.textSecondary}
                fontSize={9}
                textAnchor="middle"
              >
                {item.band >= 1000 ? `${item.band / 1000}k` : `${item.band}`}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.footerRow}>
        <Text style={styles.subtext}>125Hz to 4kHz Octave Bands (ISO 3382)</Text>
        <Text style={[styles.subtext, { color: COLORS.accent }]}>
          Target: {targetAvg.toFixed(2)}s
        </Text>
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 6,
  },
  subtext: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
});
