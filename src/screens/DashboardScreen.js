// Screen 1: Cal AI Minimalist Home Dashboard
// Large calorie ring with thick black stroke, protein/carbs/fat cards, prominent black scan button & food log.

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import * as Haptics from 'expo-haptics';

import MacroRing from '../components/MacroRing';
import MacroCards from '../components/MacroCards';
import { CameraIcon, SearchIcon, FlameIcon, ChevronRightIcon } from '../components/Icons';
import { calculateStreak } from '../services/nutritionCalculator';

export default function DashboardScreen({
  dayLog,
  userProfile,
  dailyTotals,
  logs,
  onOpenScan,
  onOpenQuickLog,
  onOpenFoodDb,
  onNavigateToDiary
}) {
  // Format current date e.g. "Wednesday, Nov 20"
  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  // Calculate genuine dynamic streak based on actual logged days
  const streak = calculateStreak(logs, dayLog?.date);

  // Extract logged items across meals
  const loggedItems = [];
  if (dayLog && dayLog.meals) {
    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach((mType) => {
      const items = dayLog.meals[mType] || [];
      items.forEach((item) => {
        loggedItems.push({ ...item, mealCategory: mType });
      });
    });
  }

  const handleAction = (cb) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    if (cb) cb();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header: Date & Subtle Streak */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.dateLabel}>{todayDate.toUpperCase()}</Text>
          <Text style={styles.screenTitle}>Today</Text>
        </View>

        <View style={styles.streakPill}>
          <FlameIcon size={14} color="#111111" />
          <Text style={styles.streakText}>
            {streak > 0 ? `${streak}d streak` : 'Day 1'}
          </Text>
        </View>
      </View>

      {/* Hero Circular Calorie Ring */}
      <View style={styles.ringCard}>
        <MacroRing
          size={230}
          strokeWidth={16}
          consumed={dailyTotals.calories}
          target={userProfile.calorieTarget}
        />
      </View>

      {/* 4. Complete 5-Metric Macro & Nutrition Progress Section */}
      <MacroCards
        proteinConsumed={dailyTotals.protein}
        proteinTarget={userProfile?.proteinTarget || 140}
        carbsConsumed={dailyTotals.carbs}
        carbsTarget={userProfile?.carbsTarget || 230}
        fatConsumed={dailyTotals.fat}
        fatTarget={userProfile?.fatTarget || 65}
        fiberConsumed={dailyTotals.fiber}
        fiberTarget={userProfile?.fiberTarget || 30}
        sugarConsumed={dailyTotals.sugar}
        sugarTarget={userProfile?.sugarTarget || 50}
      />

      {/* Large Prominent Black Scan Button */}
      <TouchableOpacity
        style={styles.primaryScanButton}
        onPress={() => handleAction(onOpenScan)}
        activeOpacity={0.85}
      >
        <CameraIcon size={20} color="#FFFFFF" strokeWidth={2} />
        <Text style={styles.primaryScanButtonText}>Scan Food</Text>
      </TouchableOpacity>

      {/* Secondary Fast Action Buttons: Quick Log & Food Search */}
      <View style={styles.secondaryActionsRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleAction(onOpenQuickLog)}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>⚡ Quick Log</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleAction(onOpenFoodDb)}
          activeOpacity={0.7}
        >
          <SearchIcon size={14} color="#111111" strokeWidth={2} />
          <Text style={[styles.secondaryButtonText, { marginLeft: 6 }]}>Food Search</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Food Summary Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        <TouchableOpacity
          onPress={() => handleAction(onNavigateToDiary)}
          style={styles.viewAllRow}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.viewAllText}>View Diary</Text>
          <ChevronRightIcon size={14} color="#858585" />
        </TouchableOpacity>
      </View>

      {loggedItems.length > 0 ? (
        <View style={styles.foodListContainer}>
          {loggedItems.map((item, idx) => (
            <View
              key={item.id || idx}
              style={[
                styles.foodItemCard,
                idx > 0 && { borderTopWidth: 1, borderTopColor: '#EAEAEA' }
              ]}
            >
              <Text style={styles.foodThumb}>{item.icon || '🍽️'}</Text>
              <View style={styles.foodDetails}>
                <Text style={styles.foodName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.foodPortion}>
                  {item.portion || `${item.grams}g`} • {item.mealCategory.toUpperCase()}
                </Text>
              </View>

              <View style={styles.foodCaloriesCol}>
                <Text style={styles.foodCaloriesValue}>
                  {item.calories} <Text style={styles.calorieUnit}>kcal</Text>
                </Text>
                <Text style={styles.foodMacroSummary}>
                  {Math.round(item.protein || 0)}p • {Math.round(item.carbs || 0)}c • {Math.round(item.fat || 0)}f
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Your nutrition journey starts today.</Text>
          <Text style={styles.emptySubtitle}>
            Scan a meal photo, quick-log with AI, or search the offline food database to begin tracking.
          </Text>
          <View style={styles.emptyActionsRow}>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => handleAction(onOpenScan)}
              activeOpacity={0.85}
            >
              <CameraIcon size={16} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>Scan Meal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emptyActionBtnSecondary}
              onPress={() => handleAction(onOpenQuickLog)}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyActionBtnSecText}>⚡ Quick Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Safe bottom spacing for bottom navigation bar */}
      <View style={{ height: 88 }} />
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
    paddingTop: 12
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
    marginLeft: 6
  },
  ringCard: {
    alignItems: 'center',
    marginVertical: 10
  },
  primaryScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: '#111111',
    borderRadius: 16,
    marginVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3
  },
  primaryScanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginHorizontal: 3
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#858585',
    marginRight: 2
  },
  foodListContainer: {
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  foodItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  foodThumb: {
    fontSize: 22,
    marginRight: 12
  },
  foodDetails: {
    flex: 1,
    marginRight: 8
  },
  foodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111'
  },
  foodPortion: {
    fontSize: 12,
    fontWeight: '500',
    color: '#858585',
    marginTop: 2
  },
  foodCaloriesCol: {
    alignItems: 'flex-end'
  },
  foodCaloriesValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111'
  },
  calorieUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#858585'
  },
  foodMacroSummary: {
    fontSize: 11,
    fontWeight: '500',
    color: '#858585',
    marginTop: 2
  },
  emptyCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderStyle: 'dashed',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#858585',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 10
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  emptyActionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14
  },
  emptyActionBtnSecText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700'
  }
});
