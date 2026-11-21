// Cal AI Water Intake Tracker Component
// Interactive water logging with +250ml / -250ml quick controls and progress indicator.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function WaterTracker({
  waterMl = 0,
  targetMl = 2500,
  onChangeWater,
  theme
}) {
  const percent = targetMl > 0 ? Math.min(100, Math.round((waterMl / targetMl) * 100)) : 0;
  const glasses = Math.round(waterMl / 250);

  const handleAdd = (amount) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    const newTotal = Math.max(0, waterMl + amount);
    if (onChangeWater) onChangeWater(newTotal);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.icon}>💧</Text>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Hydration</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              {waterMl} / {targetMl} ml ({glasses} glasses)
            </Text>
          </View>
        </View>

        <View style={styles.buttonsGroup}>
          <TouchableOpacity
            style={[styles.stepBtn, { backgroundColor: theme.cardSecondary }]}
            onPress={() => handleAdd(-250)}
            disabled={waterMl <= 0}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepBtnText, { color: theme.textMuted }]}>-250</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepBtn, styles.stepBtnAdd, { backgroundColor: theme.waterLight, borderColor: theme.water }]}
            onPress={() => handleAdd(250)}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepBtnText, { color: theme.water, fontWeight: '700' }]}>+250ml</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.track, { backgroundColor: theme.cardSecondary }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: theme.water }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    fontSize: 22,
    marginRight: 10
  },
  title: {
    fontSize: 16,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2
  },
  buttonsGroup: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 6
  },
  stepBtnAdd: {
    borderWidth: 1
  },
  stepBtnText: {
    fontSize: 12
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: 4
  }
});
