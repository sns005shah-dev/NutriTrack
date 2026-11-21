// Cal AI Minimal Macro & Nutrition Progress Cards
// Displays all 5 core nutrition metrics: Protein, Carbs, Fat, Fibre, and Sugar.
// Compact 2-row layout with clean light grey cards and designated progress bar colours.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MacroCards({
  proteinConsumed = 0,
  proteinTarget = 140,
  carbsConsumed = 0,
  carbsTarget = 230,
  fatConsumed = 0,
  fatTarget = 65,
  fiberConsumed = 0,
  fiberTarget = 30,
  sugarConsumed = 0,
  sugarTarget = 50,
  theme
}) {
  // Row 1: The 3 Primary Macronutrients
  const row1 = [
    {
      key: 'protein',
      label: 'PROTEIN',
      consumed: proteinConsumed,
      target: proteinTarget,
      color: '#3B82F6' // Blue
    },
    {
      key: 'carbs',
      label: 'CARBS',
      consumed: carbsConsumed,
      target: carbsTarget,
      color: '#F59E0B' // Orange
    },
    {
      key: 'fat',
      label: 'FAT',
      consumed: fatConsumed,
      target: fatTarget,
      color: '#22C55E' // Green
    }
  ];

  // Row 2: Fibre & Sugar
  const row2 = [
    {
      key: 'fiber',
      label: 'FIBRE',
      consumed: fiberConsumed,
      target: fiberTarget,
      color: '#A78BFA' // Purple
    },
    {
      key: 'sugar',
      label: 'SUGAR',
      consumed: sugarConsumed,
      target: sugarTarget,
      color: '#EC4899' // Pink
    }
  ];

  const renderCard = (m, isWide = false) => {
    const remaining = Math.max(0, Math.round(m.target - m.consumed));
    const percent = m.target > 0 ? Math.min(100, Math.round((m.consumed / m.target) * 100)) : 0;

    return (
      <View key={m.key} style={[styles.card, isWide && styles.cardWide]}>
        {/* Header: Label + Tiny Color Pip */}
        <View style={styles.headerRow}>
          <Text style={styles.label}>{m.label}</Text>
          <View style={[styles.colorPip, { backgroundColor: m.color }]} />
        </View>

        {/* Amount Remaining Focus */}
        <View style={styles.remainingRow}>
          <Text style={styles.remainingGrams}>{remaining}</Text>
          <Text style={styles.unitText}>g left</Text>
        </View>

        {/* Horizontal Progress Bar */}
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${percent}%`,
                backgroundColor: m.color
              }
            ]}
          />
        </View>

        {/* Consumed vs Daily Target */}
        <View style={styles.footerRow}>
          <Text style={styles.consumedSub}>
            {Math.round(m.consumed)} / {m.target}g
          </Text>
          {isWide && (
            <Text style={[styles.percentSub, { color: m.color }]}>
              {percent}%
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Row 1: Protein, Carbs, Fat */}
      <View style={styles.row}>
        {row1.map((m) => renderCard(m, false))}
      </View>

      {/* Row 2: Fibre, Sugar */}
      <View style={[styles.row, { marginTop: 8 }]}>
        {row2.map((m) => renderCard(m, true))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 14
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  card: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  cardWide: {
    flex: 1
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  label: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#858585',
    letterSpacing: 0.8
  },
  colorPip: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6
  },
  remainingGrams: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.5
  },
  unitText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#858585',
    marginLeft: 3
  },
  track: {
    height: 4,
    backgroundColor: '#EBEBEB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6
  },
  fill: {
    height: '100%',
    borderRadius: 2
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  consumedSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#858585'
  },
  percentSub: {
    fontSize: 9.5,
    fontWeight: '700'
  }
});
