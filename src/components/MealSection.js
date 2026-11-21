// Meal Section Card Component
// Displays Breakfast, Lunch, Dinner, Snacks with item list and quick-add action.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function MealSection({
  title = 'Breakfast',
  icon = '🍳',
  items = [],
  onAddItem,
  onDeleteItem,
  theme
}) {
  const [expanded, setExpanded] = useState(true);

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  items.forEach(i => {
    totalCalories += Number(i.calories) || 0;
    totalProtein += Number(i.protein) || 0;
    totalCarbs += Number(i.carbs) || 0;
    totalFat += Number(i.fat) || 0;
  });

  const handleAddPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    if (onAddItem) onAddItem();
  };

  const handleDeletePress = (itemIndex) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    if (onDeleteItem) onDeleteItem(itemIndex);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerLeft}
          activeOpacity={0.7}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.mealIcon}>{icon}</Text>
          <View style={styles.headerTitleCol}>
            <Text style={[styles.mealTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.mealSubtitle, { color: theme.textMuted }]}>
              {items.length} {items.length === 1 ? 'item' : 'items'} • {Math.round(totalProtein)}g P • {Math.round(totalCarbs)}g C • {Math.round(totalFat)}g F
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <Text style={[styles.calorieBadge, { color: theme.calorie }]}>
            {Math.round(totalCalories)} kcal
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.cardSecondary }]}
            onPress={handleAddPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.addButtonText, { color: theme.text }]}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Item List */}
      {expanded && items.length > 0 && (
        <View style={styles.itemList}>
          {items.map((item, idx) => (
            <View
              key={item.id || idx}
              style={[
                styles.itemRow,
                { borderTopColor: theme.cardBorder },
                idx > 0 && { borderTopWidth: 1 }
              ]}
            >
              <Text style={styles.itemIcon}>{item.icon || '🍽️'}</Text>
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemPortion, { color: theme.textMuted }]}>
                  {item.portion || `${item.grams || 100}g`} • {item.calories} kcal
                </Text>
              </View>

              <View style={styles.itemMacros}>
                <Text style={[styles.itemMacroText, { color: theme.protein }]}>
                  {Math.round(item.protein || 0)}p
                </Text>
                <Text style={[styles.itemMacroText, { color: theme.carbs }]}>
                  {Math.round(item.carbs || 0)}c
                </Text>
                <Text style={[styles.itemMacroText, { color: theme.fat }]}>
                  {Math.round(item.fat || 0)}f
                </Text>

                <TouchableOpacity
                  onPress={() => handleDeletePress(idx)}
                  style={styles.deleteButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.deleteText, { color: theme.danger }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {expanded && items.length === 0 && (
        <TouchableOpacity
          style={[styles.emptyPrompt, { borderColor: theme.cardBorder }]}
          onPress={handleAddPress}
          activeOpacity={0.6}
        >
          <Text style={[styles.emptyPromptText, { color: theme.textMuted }]}>
            No food logged yet. Tap to add or snap a photo.
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
    overflow: 'hidden'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  mealIcon: {
    fontSize: 24,
    marginRight: 10
  },
  headerTitleCol: {
    flex: 1
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  mealSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  calorieBadge: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 10
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700'
  },
  itemList: {
    marginTop: 12,
    paddingTop: 4
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10
  },
  itemIcon: {
    fontSize: 20,
    marginRight: 10
  },
  itemDetails: {
    flex: 1,
    marginRight: 8
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600'
  },
  itemPortion: {
    fontSize: 12,
    marginTop: 2
  },
  itemMacros: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemMacroText: {
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: 3
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700'
  },
  emptyPrompt: {
    marginTop: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center'
  },
  emptyPromptText: {
    fontSize: 12,
    fontWeight: '500'
  }
});
