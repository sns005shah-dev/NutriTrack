// Screen 2: Cal AI Minimalist Food Diary
// Pure white background, horizontal date selector strip, minimal Breakfast/Lunch/Dinner/Snacks cards.

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { computeDailyTotals, computeMealTotals } from '../services/nutritionCalculator';
import { getLocalDateString, formatDateHuman, getDayNameAndNum } from '../services/dateService';
import { PlusIcon, TrashIcon } from '../components/Icons';

export default function DiaryScreen({
  appState,
  selectedDate,
  onSelectDate,
  onOpenScanForMeal,
  onOpenQuickLogForMeal,
  onOpenFoodDbForMeal,
  onDeleteMealItem
}) {
  const todayStr = getLocalDateString(0);

  // Generate 7-day pill strip centered around today strictly using local calendar dates
  const datePills = [];
  for (let offset = -4; offset <= 2; offset++) {
    const fullDate = getLocalDateString(offset);
    const { dayName, dayNum } = getDayNameAndNum(fullDate);
    datePills.push({ fullDate, dayName, dayNum, isToday: fullDate === todayStr });
  }

  const currentLog = (appState && appState.logs && appState.logs[selectedDate]) || {
    waterMl: 0,
    meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }
  };

  const dailyTotals = computeDailyTotals(currentLog);
  const userProfile = appState?.userProfile || { calorieTarget: 2150 };

  const mealCategories = [
    { key: 'breakfast', title: 'Breakfast', icon: '🍳' },
    { key: 'lunch', title: 'Lunch', icon: '🥗' },
    { key: 'dinner', title: 'Dinner', icon: '🥩' },
    { key: 'snacks', title: 'Snacks', icon: '🍎' }
  ];

  const handleDateChange = (date) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    if (onSelectDate) onSelectDate(date);
  };

  const handleDelete = (mealKey, index) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    if (onDeleteMealItem) onDeleteMealItem(mealKey, index, selectedDate);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Title */}
      <View style={styles.topHeader}>
        <Text style={styles.dateLabel}>
          {formatDateHuman(selectedDate).toUpperCase()}
        </Text>
        <Text style={styles.screenTitle}>Food Diary</Text>
      </View>

      {/* Minimal Date Selector Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateStrip}
      >
        {datePills.map((pill) => {
          const isSelected = selectedDate === pill.fullDate;
          return (
            <TouchableOpacity
              key={pill.fullDate}
              style={[
                styles.datePill,
                isSelected && styles.datePillActive
              ]}
              onPress={() => handleDateChange(pill.fullDate)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillDayName,
                  isSelected && styles.pillTextActive
                ]}
              >
                {pill.dayName}
              </Text>
              <Text
                style={[
                  styles.pillDayNum,
                  isSelected && styles.pillTextActive
                ]}
              >
                {pill.dayNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Minimal Daily Totals Bar */}
      <View style={styles.dailyTotalsBar}>
        <View>
          <Text style={styles.totalsCalorieValue}>
            {dailyTotals.calories}{' '}
            <Text style={styles.totalsBudget}>/ {userProfile.calorieTarget} kcal</Text>
          </Text>
          <Text style={styles.totalsMacroSub}>
            {Math.round(dailyTotals.protein)}g Protein • {Math.round(dailyTotals.carbs)}g Carbs • {Math.round(dailyTotals.fat)}g Fat
          </Text>
        </View>
      </View>

      {/* 4 Minimal Meal Sections */}
      {mealCategories.map((meal) => {
        const items = (currentLog.meals && currentLog.meals[meal.key]) || [];
        const mealTotals = computeMealTotals(items);

        return (
          <View key={meal.key} style={styles.mealSectionCard}>
            {/* Meal Header */}
            <View style={styles.mealHeader}>
              <View style={styles.mealHeaderTitleRow}>
                <Text style={styles.mealIcon}>{meal.icon}</Text>
                <View>
                  <Text style={styles.mealTitle}>{meal.title}</Text>
                  <Text style={styles.mealSubtext}>
                    {items.length} {items.length === 1 ? 'item' : 'items'} • {mealTotals.calories} kcal
                  </Text>
                </View>
              </View>

              {/* Add Button */}
              <TouchableOpacity
                style={styles.addMealButton}
                onPress={() => onOpenScanForMeal(meal.key, selectedDate)}
                activeOpacity={0.7}
              >
                <PlusIcon size={14} color="#111111" strokeWidth={2.4} />
                <Text style={styles.addMealText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Food Entries List */}
            {items.length > 0 ? (
              <View style={styles.foodItemsList}>
                {items.map((item, idx) => (
                  <View
                    key={item.id || idx}
                    style={[
                      styles.foodItemRow,
                      idx > 0 && { borderTopWidth: 1, borderTopColor: '#EAEAEA' }
                    ]}
                  >
                    <Text style={styles.foodThumb}>{item.icon || '🍽️'}</Text>
                    <View style={styles.foodMainInfo}>
                      <Text style={styles.foodName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.foodPortion}>
                        {item.portion || `${item.grams}g`}
                      </Text>
                    </View>

                    <View style={styles.foodCaloriesCol}>
                      <Text style={styles.foodCalories}>
                        {item.calories} <Text style={styles.foodUnit}>kcal</Text>
                      </Text>
                      <Text style={styles.foodMacros}>
                        {Math.round(item.protein || 0)}p • {Math.round(item.carbs || 0)}c • {Math.round(item.fat || 0)}f
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(meal.key, idx)}
                      style={styles.deleteButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <TrashIcon size={16} color="#858585" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyMealBox}>
                <Text style={styles.emptyMealText}>No foods logged</Text>
              </View>
            )}

            {/* Quick Logging Shortcuts Bar */}
            <View style={styles.mealActionRow}>
              <TouchableOpacity
                style={styles.mealActionPill}
                onPress={() => onOpenScanForMeal(meal.key, selectedDate)}
              >
                <Text style={styles.mealActionText}>📷 Scan Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mealActionPill}
                onPress={() => onOpenQuickLogForMeal(meal.key, selectedDate)}
              >
                <Text style={styles.mealActionText}>⚡ Quick Log</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mealActionPill}
                onPress={() => onOpenFoodDbForMeal(meal.key, selectedDate)}
              >
                <Text style={styles.mealActionText}>🔍 Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <View style={{ height: 110 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10
  },
  topHeader: {
    marginBottom: 10
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#858585',
    letterSpacing: 1.2
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.6,
    marginTop: 2
  },
  dateStrip: {
    flexDirection: 'row',
    paddingBottom: 14
  },
  datePill: {
    width: 54,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  datePillActive: {
    backgroundColor: '#111111',
    borderColor: '#111111'
  },
  pillDayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#858585',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  pillDayNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111111',
    marginTop: 4
  },
  pillTextActive: {
    color: '#FFFFFF'
  },
  dailyTotalsBar: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 14,
    marginBottom: 16
  },
  totalsCalorieValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.4
  },
  totalsBudget: {
    fontSize: 13,
    fontWeight: '500',
    color: '#858585'
  },
  totalsMacroSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#858585',
    marginTop: 3
  },
  mealSectionCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginBottom: 14,
    overflow: 'hidden'
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14
  },
  mealHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  mealIcon: {
    fontSize: 22,
    marginRight: 10
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111'
  },
  mealSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: '#858585',
    marginTop: 1
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  addMealText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
    marginLeft: 4
  },
  foodItemsList: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 12
  },
  foodItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10
  },
  foodThumb: {
    fontSize: 20,
    marginRight: 10
  },
  foodMainInfo: {
    flex: 1,
    marginRight: 8
  },
  foodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111'
  },
  foodPortion: {
    fontSize: 11,
    fontWeight: '500',
    color: '#858585',
    marginTop: 1
  },
  foodCaloriesCol: {
    alignItems: 'flex-end',
    marginRight: 8
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111'
  },
  foodUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: '#858585'
  },
  foodMacros: {
    fontSize: 10,
    color: '#858585',
    marginTop: 1
  },
  deleteButton: {
    padding: 4
  },
  emptyMealBox: {
    paddingVertical: 10,
    alignItems: 'center'
  },
  emptyMealText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#858585'
  },
  mealActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    paddingTop: 8
  },
  mealActionPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingVertical: 6,
    marginHorizontal: 3
  },
  mealActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111111'
  }
});
