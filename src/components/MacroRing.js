// Cal AI Signature Circular Calorie Meter Component
// Thick black progress stroke, large bold numerical focus, pure white backdrop.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function MacroRing({
  size = 230,
  strokeWidth = 16,
  consumed = 0,
  target = 2150,
  theme
}) {
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  // Calorie calculations
  const remaining = Math.max(0, target - consumed);
  const progressRatio = target > 0 ? Math.min(1, consumed / target) : 0;
  const strokeDashoffset = circumference - (circumference * progressRatio);

  return (
    <View style={styles.container}>
      {/* SVG Ring */}
      <View style={[styles.svgWrapper, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {/* Subtle Grey Track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#F0F0F0"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Thick Solid Black Progress Arc */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#111111"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>

        {/* Center Calorie Focus */}
        <View style={styles.centerContent}>
          <Text style={styles.remainingValue}>
            {remaining.toLocaleString()}
          </Text>
          <Text style={styles.remainingLabel}>
            REMAINING
          </Text>
        </View>
      </View>

      {/* Sub-Metrics: Consumed vs Target */}
      <View style={styles.subMetricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>EATEN</Text>
          <Text style={styles.metricNumber}>{consumed.toLocaleString()}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>TARGET</Text>
          <Text style={styles.metricNumber}>{target.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10
  },
  svgWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center'
  },
  remainingValue: {
    fontSize: 54,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -1.5,
    includeFontPadding: false
  },
  remainingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#858585',
    letterSpacing: 1.8,
    marginTop: 2
  },
  subMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
    paddingHorizontal: 30
  },
  metricItem: {
    alignItems: 'center',
    flex: 1
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#858585',
    letterSpacing: 1.2,
    marginBottom: 4
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111'
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#EAEAEA'
  }
});
