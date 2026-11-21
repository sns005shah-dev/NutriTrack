// Cal AI Macro Pill & Progress Bar Component
// Clean macro breakdown display with target grams and progress indicator.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MacroBar({
  label = 'Protein',
  consumed = 0,
  target = 140,
  color = '#3B82F6',
  lightColor = 'rgba(59, 130, 246, 0.15)',
  theme
}) {
  const remaining = Math.max(0, Math.round(target - consumed));
  const progressPercent = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        </View>
        <Text style={[styles.remaining, { color: theme.textMuted }]}>
          {remaining}g left
        </Text>
      </View>

      {/* Progress Track */}
      <View style={[styles.track, { backgroundColor: theme.cardSecondary }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              width: `${progressPercent}%`
            }
          ]}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.consumedText, { color: theme.text }]}>
          {Math.round(consumed)}g
        </Text>
        <Text style={[styles.targetText, { color: theme.textMuted }]}>
          / {target}g ({progressPercent}%)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 4
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  label: {
    fontSize: 13,
    fontWeight: '700'
  },
  remaining: {
    fontSize: 11,
    fontWeight: '500'
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4
  },
  fill: {
    height: '100%',
    borderRadius: 3
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4
  },
  consumedText: {
    fontSize: 14,
    fontWeight: '800'
  },
  targetText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4
  }
});
