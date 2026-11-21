// NutriTrack AI — Cal AI Inspired Insights & Health Dashboard
// Nutrition & Health (Primary Tab): Calorie Balance, Macro Breakdown (Energy %), Fibre & Sugar Tracking,
// 24 Essential Micronutrients with Adult RDA %, and Personalized Health Scorecard.
// Body & Progress (Secondary Tab): Weight Tracking, 3-Point Moving Average Trend Charts, BMI Screening,
// 8-Point Body Circumference Measurements, Body Composition (DEXA/BIA), and WHO/CDC Safe Pace Guidance.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';
import Svg, { Rect, Line, Circle, Polyline, Path, Text as SvgText } from 'react-native-svg';

import {
  calculateBMI,
  calculateWeightGoalProgress,
  computeMovingAverage,
  computeDailyTotals,
  kgToLbs,
  lbsToKg,
  cmToIn,
  inToCm,
  formatWeight,
  formatMeasurement,
  RDA_STANDARDS
} from '../services/nutritionCalculator';
import { getTodayDateString } from '../services/storageService';

// Icons
import {
  ScaleIcon,
  RulerIcon,
  ActivityIcon,
  EditIcon,
  PlusIcon,
  FlameIcon,
  SparkleIcon,
  CheckIcon
} from '../components/Icons';

// Body Tracker Modals
import {
  LogWeightModal,
  LogMeasurementsModal,
  LogCompositionModal,
  EditHeightModal
} from '../components/BodyTrackerModals';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Five Consistent Signature Nutrition Colors
const NUTRITION_COLORS = {
  protein: '#3B82F6', // Blue
  carbs: '#F59E0B',   // Orange
  fat: '#22C55E',     // Green
  fiber: '#A78BFA',   // Purple
  sugar: '#EC4899',   // Pink
  saturatedFat: '#EF4444' // Red
};

export default function InsightsScreen({
  appState,
  onSaveWeight,
  onDeleteWeight,
  onSaveMeasurements,
  onSaveComposition,
  onUpdateProfile
}) {
  // Navigation sub-tab: 'nutrition' (Nutrition & Health, default) | 'body' (Body & Progress)
  const [subTab, setSubTab] = useState('nutrition');

  // Nutrition timeframe filter: 'TODAY' | '7D' | '30D'
  const [nutritionRange, setNutritionRange] = useState('7D');

  // Micronutrient category filter: 'all' | 'vitamins' | 'minerals'
  const [microCategory, setMicroCategory] = useState('all');

  // Chart range filter for weight
  const [weightRange, setWeightRange] = useState('30D'); // '7D' | '30D' | '3M' | '6M' | '1Y' | 'ALL'

  // Modal states
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [editingWeightEntry, setEditingWeightEntry] = useState(null);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [showCompositionModal, setShowCompositionModal] = useState(false);
  const [showHeightModal, setShowHeightModal] = useState(false);

  // Profile data
  const profile = appState?.userProfile || {
    calorieTarget: 2150,
    proteinTarget: 140,
    carbsTarget: 230,
    fatTarget: 65,
    fiberTarget: 30,
    sugarTarget: 50,
    waterTargetMl: 2500,
    weightKg: 74.2,
    startingWeightKg: 78.0,
    targetWeightKg: 70.0,
    targetWeightDate: '',
    heightCm: 175,
    goal: 'lose',
    weightUnit: 'kg',
    measurementUnit: 'cm'
  };

  const weightUnit = profile.weightUnit || 'kg';
  const measurementUnit = profile.measurementUnit || 'cm';

  // Weight logs sorted chronologically
  const weightLogs = useMemo(() => {
    const list = [...(appState?.weightLogs || [])];
    list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return list;
  }, [appState?.weightLogs]);

  // Current weight is either latest entry or profile weight
  const latestWeightEntry = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;
  const currentWeightKg = latestWeightEntry ? latestWeightEntry.weightKg : (profile.weightKg || 74.2);
  const startingWeightKg = profile.startingWeightKg || (weightLogs[0] ? weightLogs[0].weightKg : currentWeightKg);
  const targetWeightKg = profile.targetWeightKg || 70.0;

  // Weight goal calculation
  const goalProgress = useMemo(() => {
    return calculateWeightGoalProgress(startingWeightKg, currentWeightKg, targetWeightKg, profile.goal);
  }, [startingWeightKg, currentWeightKg, targetWeightKg, profile.goal]);

  // Filtered weight data based on selected range
  const filteredWeightData = useMemo(() => {
    if (weightLogs.length === 0) return [];
    if (weightRange === 'ALL') return weightLogs;

    const daysMap = { '7D': 7, '30D': 30, '3M': 90, '6M': 180, '1Y': 365 };
    const maxDays = daysMap[weightRange] || 30;
    const cutoffDate = getTodayDateString(-maxDays);

    const filtered = weightLogs.filter((w) => w.date >= cutoffDate);
    return filtered.length > 0 ? filtered : weightLogs.slice(-5);
  }, [weightLogs, weightRange]);

  // Moving average trend points (3-point window)
  const smoothedWeightData = useMemo(() => {
    return computeMovingAverage(filteredWeightData, 3);
  }, [filteredWeightData]);

  // BMI Calculation
  const bmiData = useMemo(() => {
    return calculateBMI(currentWeightKg, profile.heightCm);
  }, [currentWeightKg, profile.heightCm]);

  // Body Measurements
  const measurementLogs = useMemo(() => {
    const list = [...(appState?.measurementLogs || [])];
    list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return list;
  }, [appState?.measurementLogs]);

  const latestMeasurements = measurementLogs.length > 0 ? measurementLogs[measurementLogs.length - 1] : {};
  const startingMeasurements = measurementLogs.length > 0 ? measurementLogs[0] : {};

  // Body Composition
  const compositionLogs = useMemo(() => {
    const list = [...(appState?.compositionLogs || [])];
    list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return list;
  }, [appState?.compositionLogs]);

  const latestComposition = compositionLogs.length > 0 ? compositionLogs[compositionLogs.length - 1] : null;
  const startingComposition = compositionLogs.length > 0 ? compositionLogs[0] : null;

  // Weight Pace Calculation (Rate of change per week)
  const weightPace = useMemo(() => {
    if (filteredWeightData.length < 2) return null;
    const first = filteredWeightData[0];
    const last = filteredWeightData[filteredWeightData.length - 1];
    const d1 = new Date(first.date);
    const d2 = new Date(last.date);
    const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    const diffKg = last.weightKg - first.weightKg;
    const weeklyRateKg = Math.round((diffKg / diffDays) * 7 * 10) / 10;
    const weeklyRateDisplay = weightUnit === 'lbs' ? kgToLbs(weeklyRateKg) : weeklyRateKg;
    const isSafe = Math.abs(weeklyRateKg) <= 1.0;
    return {
      rate: weeklyRateDisplay,
      isLoss: weeklyRateKg < 0,
      isSafe,
      diffDays
    };
  }, [filteredWeightData, weightUnit]);

  // --- NUTRITION AGGREGATIONS ---
  // Compile nutrition data across selected timeframe (Today, 7D, 30D)
  const nutritionAggregates = useMemo(() => {
    const days = nutritionRange === 'TODAY' ? 1 : nutritionRange === '7D' ? 7 : 30;
    const dailyList = [];
    const totalsSum = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      saturatedFat: 0,
      waterMl: 0,
      // Micros
      vitA: 0, vitC: 0, vitD: 0, vitE: 0, vitK: 0,
      vitB1: 0, vitB2: 0, vitB3: 0, vitB5: 0, vitB6: 0, vitB7: 0, vitB9: 0, vitB12: 0,
      calcium: 0, iron: 0, magnesium: 0, zinc: 0, potassium: 0, sodium: 0,
      phosphorus: 0, selenium: 0, copper: 0, manganese: 0, iodine: 0
    };

    let loggedDaysCount = 0;

    for (let i = days - 1; i >= 0; i--) {
      const dateStr = getTodayDateString(-i);
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() - i);
      const dayLabel = dayDate.toLocaleDateString('en-US', { weekday: 'narrow' });

      const log = appState?.logs?.[dateStr];
      const t = computeDailyTotals(log);

      if (t.calories > 0) {
        loggedDaysCount++;
      }

      dailyList.push({
        dateStr,
        label: dayLabel,
        calories: t.calories,
        isToday: i === 0
      });

      // Accumulate
      Object.keys(totalsSum).forEach((key) => {
        totalsSum[key] += t[key] || 0;
      });
    }

    const divisor = Math.max(1, loggedDaysCount || 1);
    const dailyAvg = {
      calories: Math.round(totalsSum.calories / divisor),
      protein: Math.round((totalsSum.protein / divisor) * 10) / 10,
      carbs: Math.round((totalsSum.carbs / divisor) * 10) / 10,
      fat: Math.round((totalsSum.fat / divisor) * 10) / 10,
      fiber: Math.round((totalsSum.fiber / divisor) * 10) / 10,
      sugar: Math.round((totalsSum.sugar / divisor) * 10) / 10,
      saturatedFat: Math.round((totalsSum.saturatedFat / divisor) * 10) / 10,
      waterMl: Math.round(totalsSum.waterMl / divisor)
    };

    // Calculate micro averages
    const microAvg = {};
    Object.keys(RDA_STANDARDS).forEach((k) => {
      const avgVal = totalsSum[k] / divisor;
      microAvg[k] = Math.round(avgVal * 10) / 10;
    });

    return {
      dailyList,
      loggedDaysCount,
      dailyAvg,
      microAvg
    };
  }, [appState?.logs, nutritionRange]);

  // Macro calorie energy percentages
  const macroEnergy = useMemo(() => {
    const p = nutritionAggregates.dailyAvg.protein * 4;
    const c = nutritionAggregates.dailyAvg.carbs * 4;
    const f = nutritionAggregates.dailyAvg.fat * 9;
    const total = p + c + f || 1;
    return {
      proteinPct: Math.round((p / total) * 100),
      carbsPct: Math.round((c / total) * 100),
      fatPct: Math.round((f / total) * 100)
    };
  }, [nutritionAggregates.dailyAvg]);

  // Personalized Insights Scorecard Calculations
  const personalizedInsights = useMemo(() => {
    const avgCals = nutritionAggregates.dailyAvg.calories;
    const targetCals = profile.calorieTarget;
    const diff = avgCals - targetCals;

    // Consistency: % of days within +/- 15% of target
    const validDays = nutritionAggregates.dailyList.filter((d) => d.calories > 0);
    const consistentDays = validDays.filter(
      (d) => Math.abs(d.calories - targetCals) <= targetCals * 0.15
    ).length;
    const consistencyScore = validDays.length > 0 ? Math.round((consistentDays / validDays.length) * 100) : 100;

    // Protein Density: grams per 1000 kcal
    const proteinDensity = avgCals > 0 ? Math.round((nutritionAggregates.dailyAvg.protein / avgCals) * 1000) : 0;

    // Micronutrient coverage rating
    const standards = Object.keys(RDA_STANDARDS);
    const metCount = standards.filter((key) => {
      const val = nutritionAggregates.microAvg[key] || 0;
      const target = RDA_STANDARDS[key].rda;
      if (RDA_STANDARDS[key].isLimit) {
        return val <= target;
      }
      return val >= target * 0.7; // at least 70% RDA
    }).length;
    const microCoverageScore = Math.round((metCount / standards.length) * 100);

    return {
      avgCals,
      diff,
      consistencyScore,
      proteinDensity,
      microCoverageScore
    };
  }, [nutritionAggregates, profile.calorieTarget]);

  // Handlers for toggles
  const handleToggleWeightUnit = () => {
    const next = weightUnit === 'kg' ? 'lbs' : 'kg';
    if (onUpdateProfile) onUpdateProfile({ weightUnit: next });
  };

  const handleToggleMeasurementUnit = () => {
    const next = measurementUnit === 'cm' ? 'in' : 'cm';
    if (onUpdateProfile) onUpdateProfile({ measurementUnit: next });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentWrap}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.topLabel}>INSIGHTS</Text>
        <Text style={styles.screenTitle}>Health & Progress</Text>
      </View>

      {/* Cal AI Segmented Sub-Tab Switcher: Nutrition & Health (1st) | Body & Progress (2nd) */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, subTab === 'nutrition' && styles.segmentBtnActive]}
          onPress={() => setSubTab('nutrition')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, subTab === 'nutrition' && styles.segmentTextActive]}>
            Nutrition & Health
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, subTab === 'body' && styles.segmentBtnActive]}
          onPress={() => setSubTab('body')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, subTab === 'body' && styles.segmentTextActive]}>
            Body & Progress
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================================= */}
      {/* 1. NUTRITION & HEALTH SUB-TAB (PRIMARY & DEFAULT TAB)                      */}
      {/* ========================================================================= */}
      {subTab === 'nutrition' && (
        <View>
          {/* Timeframe selector: Daily (Today) | Weekly (7D) | Monthly (30D) */}
          <View style={styles.nutritionRangeRow}>
            {[
              { id: 'TODAY', label: 'Daily (Today)' },
              { id: '7D', label: 'Weekly (7D)' },
              { id: '30D', label: 'Monthly (30D)' }
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.rangeButton,
                  nutritionRange === item.id && styles.rangeButtonActive
                ]}
                onPress={() => setNutritionRange(item.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.rangeButtonText,
                    nutritionRange === item.id && styles.rangeButtonTextActive
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* New User Welcome Banner when no meals are logged yet */}
          {nutritionAggregates.loggedDaysCount === 0 && (
            <View style={{
              backgroundColor: '#F6F6F6',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#EAEAEA',
              padding: 16,
              marginBottom: 16
            }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111111', marginBottom: 4 }}>
                Welcome to Nutrition & Health
              </Text>
              <Text style={{ fontSize: 12, color: '#858585', lineHeight: 17 }}>
                Log your first meal using the camera scanner or AI quick log to reveal your calorie balance, macronutrient breakdown, and 24 essential micronutrients.
              </Text>
            </View>
          )}

          {/* Calorie Intake Hero Summary Card */}
          <View style={styles.heroRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>
                {nutritionRange === 'TODAY' ? 'TODAY INTAKE' : 'DAILY AVERAGE'}
              </Text>
              <Text style={styles.summaryNumber}>
                {nutritionAggregates.dailyAvg.calories.toLocaleString()}{' '}
                <Text style={styles.summaryUnit}>kcal</Text>
              </Text>
              <Text style={styles.summarySub}>
                Target: {profile.calorieTarget.toLocaleString()} kcal
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>NET BALANCE</Text>
              <Text
                style={[
                  styles.summaryNumber,
                  personalizedInsights.diff <= 0 ? styles.greenText : styles.darkText
                ]}
              >
                {personalizedInsights.diff <= 0
                  ? `-${Math.abs(personalizedInsights.diff)}`
                  : `+${personalizedInsights.diff}`}{' '}
                <Text style={styles.summaryUnit}>kcal</Text>
              </Text>
              <Text style={styles.summarySub}>
                {personalizedInsights.diff <= 0 ? 'Caloric Deficit' : 'Caloric Surplus'}
              </Text>
            </View>
          </View>

          {/* Calorie Intake Bar Chart */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>CALORIE TRENDS</Text>
              <Text style={styles.hintSub}>Target: {profile.calorieTarget} kcal</Text>
            </View>

            <View style={styles.barChartWrap}>
              <CalorieBarChartSvg
                data={nutritionAggregates.dailyList}
                targetCal={profile.calorieTarget}
              />
            </View>
          </View>

          {/* Complete Macronutrient Breakdown Card with 5 Consistent Colors */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>MACRONUTRIENT BREAKDOWN</Text>
              <Text style={styles.hintSub}>% of total daily energy</Text>
            </View>

            {/* Macro Energy Distribution Bar: Protein (Blue), Carbs (Orange), Fat (Green) */}
            <View style={styles.macroSplitBar}>
              <View
                style={[
                  styles.macroSplitSegment,
                  { backgroundColor: NUTRITION_COLORS.protein, flex: Math.max(5, macroEnergy.proteinPct) }
                ]}
              />
              <View
                style={[
                  styles.macroSplitSegment,
                  { backgroundColor: NUTRITION_COLORS.carbs, flex: Math.max(5, macroEnergy.carbsPct) }
                ]}
              />
              <View
                style={[
                  styles.macroSplitSegment,
                  { backgroundColor: NUTRITION_COLORS.fat, flex: Math.max(5, macroEnergy.fatPct) }
                ]}
              />
            </View>

            <View style={styles.macroDistributionLabels}>
              <Text style={[styles.macroDistLabel, { color: NUTRITION_COLORS.protein }]}>
                Protein {macroEnergy.proteinPct}%
              </Text>
              <Text style={[styles.macroDistLabel, { color: NUTRITION_COLORS.carbs }]}>
                Carbs {macroEnergy.carbsPct}%
              </Text>
              <Text style={[styles.macroDistLabel, { color: NUTRITION_COLORS.fat }]}>
                Fat {macroEnergy.fatPct}%
              </Text>
            </View>

            {/* Complete Nutrition Metrics List: Protein, Carbs, Fat, Fibre, Sugar, Saturated Fat */}
            {[
              {
                label: 'Protein',
                val: nutritionAggregates.dailyAvg.protein,
                target: profile.proteinTarget || 140,
                unit: 'g',
                color: NUTRITION_COLORS.protein
              },
              {
                label: 'Carbohydrates',
                val: nutritionAggregates.dailyAvg.carbs,
                target: profile.carbsTarget || 230,
                unit: 'g',
                color: NUTRITION_COLORS.carbs
              },
              {
                label: 'Dietary Fat',
                val: nutritionAggregates.dailyAvg.fat,
                target: profile.fatTarget || 65,
                unit: 'g',
                color: NUTRITION_COLORS.fat
              },
              {
                label: 'Dietary Fibre',
                val: nutritionAggregates.dailyAvg.fiber,
                target: profile.fiberTarget || 30,
                unit: 'g',
                color: NUTRITION_COLORS.fiber
              },
              {
                label: 'Sugar',
                val: nutritionAggregates.dailyAvg.sugar,
                target: profile.sugarTarget || 50,
                unit: 'g',
                color: NUTRITION_COLORS.sugar
              },
              {
                label: 'Saturated Fat',
                val: nutritionAggregates.dailyAvg.saturatedFat,
                target: 20,
                unit: 'g',
                color: NUTRITION_COLORS.saturatedFat
              }
            ].map((m) => {
              const pct = m.target ? Math.min(100, Math.round((m.val / m.target) * 100)) : 0;
              return (
                <View key={m.label} style={styles.macroCardRow}>
                  <View style={styles.macroInfoLeft}>
                    <View style={[styles.macroColorPip, { backgroundColor: m.color }]} />
                    <View>
                      <Text style={styles.macroRowName}>{m.label}</Text>
                      <Text style={styles.macroRowSub}>
                        Target: {m.target} {m.unit}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.macroInfoRight}>
                    <Text style={styles.macroRowValue}>
                      {m.val} <Text style={styles.macroRowUnit}>{m.unit}</Text>
                    </Text>
                    <View style={styles.miniProgressTrack}>
                      <View style={[styles.miniProgressFill, { width: `${pct}%`, backgroundColor: m.color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Complete Micronutrient Tracking Section (24 Essential Micros) */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowAlign}>
                <SparkleIcon size={16} color="#7C3AED" />
                <Text style={styles.cardLabel}>MICRONUTRIENT AUDIT (RDA)</Text>
              </View>

              <Text style={styles.hintSub}>Official Adult RDA</Text>
            </View>

            {/* Filter pills: All | Vitamins | Minerals */}
            <View style={styles.filterPillsRow}>
              {[
                { id: 'all', label: 'All (24)' },
                { id: 'vitamins', label: 'Vitamins (13)' },
                { id: 'minerals', label: 'Minerals (11)' }
              ].map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.filterPill, microCategory === c.id && styles.filterPillActive]}
                  onPress={() => setMicroCategory(c.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      microCategory === c.id && styles.filterPillTextActive
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Micronutrient Items */}
            {Object.keys(RDA_STANDARDS)
              .filter((k) => {
                if (microCategory === 'vitamins') return k.startsWith('vit');
                if (microCategory === 'minerals') return !k.startsWith('vit');
                return true;
              })
              .map((key) => {
                const item = RDA_STANDARDS[key];
                const val = nutritionAggregates.microAvg[key] || 0;
                const rda = item.rda;
                const pct = Math.min(100, Math.round((val / rda) * 100));
                const isOverLimit = item.isLimit && val > rda;

                return (
                  <View key={key} style={styles.microItemRow}>
                    <View style={styles.microItemLeft}>
                      <Text style={styles.microName}>{item.name}</Text>
                      <Text style={styles.microRdaSub}>
                        RDA: {rda} {item.unit}
                      </Text>
                    </View>

                    <View style={styles.microItemRight}>
                      <View style={styles.microValueRow}>
                        <Text style={[styles.microCurrentVal, isOverLimit && styles.redText]}>
                          {val} {item.unit}
                        </Text>
                        <Text style={[styles.microPctBadge, isOverLimit ? styles.redText : styles.purpleText]}>
                          {isOverLimit ? 'EXCEEDED' : `${pct}%`}
                        </Text>
                      </View>

                      <View style={styles.microProgressTrack}>
                        <View
                          style={[
                            styles.microProgressFill,
                            {
                              width: `${pct}%`,
                              backgroundColor: isOverLimit ? '#DC2626' : '#7C3AED'
                            }
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
          </View>

          {/* Personalized Health & Nutrition Insights */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowAlign}>
                <SparkleIcon size={16} color="#111111" />
                <Text style={styles.cardLabel}>PERSONALIZED HEALTH SCORECARD</Text>
              </View>
            </View>

            <View style={styles.scorecardGrid}>
              <View style={styles.scorecardCell}>
                <Text style={styles.scoreLabel}>NUTRITION CONSISTENCY</Text>
                <Text style={styles.scoreValue}>{personalizedInsights.consistencyScore}%</Text>
                <Text style={styles.scoreDesc}>Days within target range</Text>
              </View>

              <View style={styles.scorecardCell}>
                <Text style={styles.scoreLabel}>PROTEIN DENSITY</Text>
                <Text style={styles.scoreValue}>{personalizedInsights.proteinDensity}g</Text>
                <Text style={styles.scoreDesc}>Per 1,000 kcal intake</Text>
              </View>

              <View style={styles.scorecardCell}>
                <Text style={styles.scoreLabel}>MICRONUTRIENT COVERAGE</Text>
                <Text style={styles.scoreValue}>{personalizedInsights.microCoverageScore}%</Text>
                <Text style={styles.scoreDesc}>Essential RDA vitamins/minerals</Text>
              </View>

              <View style={styles.scorecardCell}>
                <Text style={styles.scoreLabel}>HYDRATION</Text>
                <Text style={styles.scoreValue}>
                  {nutritionAggregates.dailyAvg.waterMl} ml
                </Text>
                <Text style={styles.scoreDesc}>
                  Target: {profile.waterTargetMl || 2500} ml
                </Text>
              </View>
            </View>

            <View style={styles.recommendationBox}>
              <Text style={styles.recTitle}>AI Clinical Recommendation</Text>
              <Text style={styles.recText}>
                {personalizedInsights.consistencyScore >= 80
                  ? 'Excellent nutritional consistency! Your macro balance is well aligned with muscle preservation during your caloric deficit.'
                  : 'Focus on stabilizing your day-to-day caloric variance. Maintaining consistent protein intake prevents metabolic slowdown.'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* 2. BODY & PROGRESS SUB-TAB (SECONDARY TAB)                                */}
      {/* ========================================================================= */}
      {subTab === 'body' && (
        <View>
          {/* Weight Overview Hero Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowAlign}>
                <ScaleIcon size={18} color="#111111" />
                <Text style={styles.cardLabel}>WEIGHT TRACKING</Text>
              </View>

              <TouchableOpacity
                style={styles.unitTogglePill}
                onPress={handleToggleWeightUnit}
                activeOpacity={0.7}
              >
                <Text style={styles.unitToggleText}>{weightUnit.toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weightHeroRow}>
              <View>
                <Text style={styles.heroWeightNumber}>
                  {formatWeight(currentWeightKg, weightUnit)}
                </Text>
                <Text style={styles.heroWeightSub}>Current recorded weight</Text>
              </View>

              <TouchableOpacity
                style={styles.actionPillBtn}
                onPress={() => {
                  setEditingWeightEntry(null);
                  setShowWeightModal(true);
                }}
                activeOpacity={0.85}
              >
                <PlusIcon size={14} color="#FFFFFF" />
                <Text style={styles.actionPillText}>Log Weight</Text>
              </TouchableOpacity>
            </View>

            {/* Starting / Target / Total Change */}
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>STARTING</Text>
                <Text style={styles.statValue}>
                  {formatWeight(startingWeightKg, weightUnit)}
                </Text>
              </View>

              <View style={styles.statCol}>
                <Text style={styles.statLabel}>TARGET</Text>
                <Text style={styles.statValue}>
                  {formatWeight(targetWeightKg, weightUnit)}
                </Text>
              </View>

              <View style={styles.statCol}>
                <Text style={styles.statLabel}>TOTAL CHANGE</Text>
                <Text
                  style={[
                    styles.statValue,
                    goalProgress.totalChangeKg < 0 ? styles.greenText : styles.darkText
                  ]}
                >
                  {goalProgress.totalChangeKg > 0 ? '+' : ''}
                  {formatWeight(goalProgress.totalChangeKg, weightUnit)}
                </Text>
              </View>
            </View>

            {/* Goal Progress Bar */}
            <View style={styles.progressBarWrap}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressGoalText}>
                  Goal Progress ({goalProgress.progressPercent}%)
                </Text>
                <Text style={styles.progressRemainingText}>
                  {formatWeight(goalProgress.remainingKg, weightUnit)} remaining
                </Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, Math.max(4, goalProgress.progressPercent))}%` }
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Interactive Weight Trends Chart */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowAlign}>
                <ActivityIcon size={18} color="#111111" />
                <Text style={styles.cardLabel}>WEIGHT PROGRESS CHART</Text>
              </View>

              {weightPace && (
                <View style={styles.paceBadge}>
                  <Text style={styles.paceBadgeText}>
                    {weightPace.rate > 0 ? `+${weightPace.rate}` : weightPace.rate} {weightUnit}/wk
                  </Text>
                </View>
              )}
            </View>

            {/* Timeframe Selector Pills */}
            <View style={styles.filterPillsRow}>
              {['7D', '30D', '3M', '6M', '1Y', 'ALL'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.filterPill, weightRange === r && styles.filterPillActive]}
                  onPress={() => setWeightRange(r)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      weightRange === r && styles.filterPillTextActive
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* SVG Weight Line & Moving Average Chart */}
            <View style={styles.chartWrapper}>
              <WeightChartSvg
                data={smoothedWeightData}
                targetKg={targetWeightKg}
                weightUnit={weightUnit}
              />
            </View>

            {/* Chart Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#111111' }]} />
                <Text style={styles.legendLabel}>Actual Weigh-in</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: '#2563EB' }]} />
                <Text style={styles.legendLabel}>Moving Average Trend</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDashed, { borderColor: '#858585' }]} />
                <Text style={styles.legendLabel}>Target</Text>
              </View>
            </View>

            <Text style={styles.chartExplainer}>
              *Moving average trend smooths daily water, glycogen, and sodium fluctuations to reveal your true underlying body mass trajectory.
            </Text>
          </View>

          {/* Recent Weight Entries */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>RECENT WEIGH-INS</Text>
              <Text style={styles.hintSub}>Tap to edit or delete</Text>
            </View>

            {weightLogs.length === 0 ? (
              <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#858585', marginBottom: 10 }}>
                  No weigh-ins recorded yet.
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#111111',
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 12
                  }}
                  onPress={() => {
                    setEditingWeightEntry(null);
                    setShowWeightModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                    + Record First Weigh-in
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              weightLogs.slice(-4).reverse().map((entry, idx) => (
                <TouchableOpacity
                  key={entry.id || idx}
                  style={styles.weightEntryRow}
                  onPress={() => {
                    setEditingWeightEntry(entry);
                    setShowWeightModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.entryDate}>{entry.date}</Text>
                    {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}
                  </View>

                  <View style={styles.rowAlign}>
                    <Text style={styles.entryWeight}>
                      {formatWeight(entry.weightKg, weightUnit)}
                    </Text>
                    <EditIcon size={14} color="#858585" style={{ marginLeft: 8 }} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* BMI Tracking Section */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>BMI SCREENING</Text>
              <TouchableOpacity
                style={styles.textActionBtn}
                onPress={() => setShowHeightModal(true)}
              >
                <Text style={styles.textActionBtnText}>Edit Height</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bmiHeroRow}>
              <View>
                <Text style={styles.bmiValueText}>{bmiData.bmi}</Text>
                <Text style={styles.bmiSub}>Body Mass Index</Text>
              </View>

              <View style={[styles.bmiCategoryBadge, { backgroundColor: bmiData.color + '15' }]}>
                <Text style={[styles.bmiCategoryText, { color: bmiData.color }]}>
                  {bmiData.category}
                </Text>
              </View>
            </View>

            {/* BMI Meter Spectrum Bar */}
            <View style={styles.bmiMeterContainer}>
              <View style={[styles.bmiSegment, { backgroundColor: '#3B82F6', flex: 18.5 }]} />
              <View style={[styles.bmiSegment, { backgroundColor: '#16A34A', flex: 6.4 }]} />
              <View style={[styles.bmiSegment, { backgroundColor: '#D97706', flex: 5.0 }]} />
              <View style={[styles.bmiSegment, { backgroundColor: '#DC2626', flex: 10.1 }]} />
            </View>
            <View style={styles.bmiScaleLabels}>
              <Text style={styles.bmiScaleText}>Underweight (&lt;18.5)</Text>
              <Text style={styles.bmiScaleText}>Normal (18.5–24.9)</Text>
              <Text style={styles.bmiScaleText}>Over (25–29.9)</Text>
              <Text style={styles.bmiScaleText}>Obese (30+)</Text>
            </View>

            {/* Inputs used */}
            <View style={styles.bmiDetailsBox}>
              <Text style={styles.bmiDetailItem}>
                Height Used: <Text style={styles.boldText}>{profile.heightCm} cm ({bmiData.heightM} m)</Text>
              </Text>
              <Text style={styles.bmiDetailItem}>
                Weight Used: <Text style={styles.boldText}>{formatWeight(currentWeightKg, weightUnit)}</Text>
              </Text>
            </View>

            {/* Clinical Disclaimer */}
            <Text style={styles.disclaimerText}>
              Disclaimer: Body Mass Index (BMI) is a clinical screening metric based solely on weight and height. It does not measure body fat percentage or differentiate lean muscle tissue from adipose tissue. Consult a healthcare practitioner for personal clinical evaluation.
            </Text>
          </View>

          {/* Body Measurements Section */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowAlign}>
                <RulerIcon size={18} color="#111111" />
                <Text style={styles.cardLabel}>BODY MEASUREMENTS</Text>
              </View>

              <TouchableOpacity
                style={styles.unitTogglePill}
                onPress={handleToggleMeasurementUnit}
                activeOpacity={0.7}
              >
                <Text style={styles.unitToggleText}>{measurementUnit.toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.measurementsGrid}>
              {[
                { label: 'Chest', key: 'chest' },
                { label: 'Waist', key: 'waist' },
                { label: 'Hips', key: 'hips' },
                { label: 'Left Arm', key: 'leftArm' },
                { label: 'Right Arm', key: 'rightArm' },
                { label: 'Thighs', key: 'thighs' },
                { label: 'Neck', key: 'neck' },
                { label: 'Calves', key: 'calves' }
              ].map((m) => {
                const currentVal = latestMeasurements[m.key];
                const startVal = startingMeasurements[m.key];
                const diff = (currentVal && startVal) ? Math.round((currentVal - startVal) * 10) / 10 : null;

                return (
                  <View key={m.key} style={styles.measurementCell}>
                    <Text style={styles.measureCellLabel}>{m.label}</Text>
                    <Text style={styles.measureCellValue}>
                      {currentVal ? formatMeasurement(currentVal, measurementUnit) : '—'}
                    </Text>
                    {diff !== null && diff !== 0 && (
                      <Text
                        style={[
                          styles.measureDiff,
                          diff < 0 ? styles.greenText : styles.darkText
                        ]}
                      >
                        {diff > 0 ? `+${formatMeasurement(diff, measurementUnit)}` : formatMeasurement(diff, measurementUnit)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.actionPillBtn, { marginTop: 14, alignSelf: 'center', width: '100%' }]}
              onPress={() => setShowMeasurementsModal(true)}
              activeOpacity={0.85}
            >
              <PlusIcon size={14} color="#FFFFFF" />
              <Text style={styles.actionPillText}>Log Body Measurements</Text>
            </TouchableOpacity>
          </View>

          {/* Body Composition Section */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowAlign}>
                <ActivityIcon size={18} color="#111111" />
                <Text style={styles.cardLabel}>BODY COMPOSITION</Text>
              </View>

              <TouchableOpacity
                style={styles.actionPillBtnSmall}
                onPress={() => setShowCompositionModal(true)}
                activeOpacity={0.85}
              >
                <PlusIcon size={12} color="#FFFFFF" />
                <Text style={styles.actionPillTextSmall}>Log</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.compositionRow}>
              <View style={styles.compCard}>
                <Text style={styles.compLabel}>BODY FAT</Text>
                <Text style={styles.compValue}>
                  {latestComposition?.bodyFatPct ? `${latestComposition.bodyFatPct}%` : '—'}
                </Text>
                {startingComposition?.bodyFatPct && latestComposition?.bodyFatPct ? (
                  <Text style={styles.compSub}>
                    Start: {startingComposition.bodyFatPct}%
                  </Text>
                ) : null}
              </View>

              <View style={styles.compCard}>
                <Text style={styles.compLabel}>MUSCLE MASS</Text>
                <Text style={styles.compValue}>
                  {latestComposition?.muscleMassKg ? formatWeight(latestComposition.muscleMassKg, weightUnit) : '—'}
                </Text>
                {startingComposition?.muscleMassKg && latestComposition?.muscleMassKg ? (
                  <Text style={styles.compSub}>
                    Start: {formatWeight(startingComposition.muscleMassKg, weightUnit)}
                  </Text>
                ) : null}
              </View>

              <View style={styles.compCard}>
                <Text style={styles.compLabel}>LEAN MASS</Text>
                <Text style={styles.compValue}>
                  {latestComposition?.leanMassKg ? formatWeight(latestComposition.leanMassKg, weightUnit) : '—'}
                </Text>
                {startingComposition?.leanMassKg && latestComposition?.leanMassKg ? (
                  <Text style={styles.compSub}>
                    Start: {formatWeight(startingComposition.leanMassKg, weightUnit)}
                  </Text>
                ) : null}
              </View>
            </View>

            <Text style={styles.disclaimerText}>
              Note: Body composition metrics are entered manually from bioelectrical impedance smart scales or clinical DEXA scans. NutriTrack AI avoids fake estimation claims to preserve clinical integrity.
            </Text>
          </View>

          {/* Goal & Safe Guidance Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.rowAlign}>
                <FlameIcon size={16} color="#111111" />
                <Text style={styles.cardLabel}>GOAL & HEALTHY GUIDANCE</Text>
              </View>
            </View>

            <View style={styles.goalInfoRow}>
              <View>
                <Text style={styles.goalTitle}>
                  {profile.goal === 'lose' ? 'Weight Loss (Deficit)' : profile.goal === 'gain' ? 'Lean Mass Gain (Surplus)' : 'Maintenance'}
                </Text>
                <Text style={styles.goalTargetDate}>
                  Target: {formatWeight(targetWeightKg, weightUnit)}
                  {profile.targetWeightDate ? ` by ${profile.targetWeightDate}` : ''}
                </Text>
              </View>

              <View style={styles.safePacePill}>
                <CheckIcon size={14} color="#16A34A" />
                <Text style={styles.safePacePillText}>Safe Rate</Text>
              </View>
            </View>

            <Text style={styles.guidanceExplainer}>
              According to the World Health Organization (WHO) and clinical nutrition standards, a sustainable, healthy rate of weight change is 0.5 to 1.0 kg (1 to 2 lbs) per week. More rapid loss often causes lean muscle degradation and metabolic slowing.
            </Text>
          </View>
        </View>
      )}

      {/* --- MODALS --- */}
      <LogWeightModal
        visible={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        onSaveWeight={onSaveWeight}
        onDeleteWeight={onDeleteWeight}
        editingEntry={editingWeightEntry}
        weightUnit={weightUnit}
      />

      <LogMeasurementsModal
        visible={showMeasurementsModal}
        onClose={() => setShowMeasurementsModal(false)}
        onSaveMeasurements={onSaveMeasurements}
        measurementUnit={measurementUnit}
        latestValues={latestMeasurements}
      />

      <LogCompositionModal
        visible={showCompositionModal}
        onClose={() => setShowCompositionModal(false)}
        onSaveComposition={onSaveComposition}
        weightUnit={weightUnit}
      />

      <EditHeightModal
        visible={showHeightModal}
        onClose={() => setShowHeightModal(false)}
        currentHeightCm={profile.heightCm || 175}
        onSaveHeight={(newH) => {
          if (onUpdateProfile) onUpdateProfile({ heightCm: newH });
        }}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// =========================================================================
// SVG HELPER COMPONENTS
// =========================================================================

// Weight Trend Line Chart with Moving Average Curve
function WeightChartSvg({ data = [], targetKg = 70, weightUnit = 'kg' }) {
  const chartW = SCREEN_WIDTH - 64;
  const chartH = 150;
  const paddingX = 24;
  const paddingY = 20;

  if (!data || data.length === 0) {
    return (
      <View style={{ height: chartH, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#858585', fontSize: 13 }}>No weight logs recorded for this range.</Text>
      </View>
    );
  }

  // Find min and max for scaling
  const allWeights = data.map((d) => d.weightKg);
  allWeights.push(targetKg);
  const minW = Math.min(...allWeights) - 1.0;
  const maxW = Math.max(...allWeights) + 1.0;
  const rangeW = maxW - minW || 1;

  const getX = (idx) => {
    if (data.length === 1) return chartW / 2;
    return paddingX + (idx / (data.length - 1)) * (chartW - paddingX * 2);
  };

  const getY = (w) => {
    return chartH - paddingY - ((w - minW) / rangeW) * (chartH - paddingY * 2);
  };

  // Build points string for actual weigh-in polyline
  const actualPoints = data.map((d, i) => `${getX(i)},${getY(d.weightKg)}`).join(' ');

  // Build points string for moving average polyline
  const movingAvgPoints = data
    .filter((d) => d.movingAvgKg !== undefined)
    .map((d, i) => `${getX(i)},${getY(d.movingAvgKg)}`)
    .join(' ');

  const targetY = getY(targetKg);

  return (
    <Svg width={chartW} height={chartH + 24}>
      {/* Target weight dotted line */}
      <Line
        x1={paddingX}
        y1={targetY}
        x2={chartW - paddingX}
        y2={targetY}
        stroke="#A3A3A3"
        strokeWidth="1.2"
        strokeDasharray="4 4"
      />

      {/* Actual weigh-in line */}
      <Polyline
        points={actualPoints}
        fill="none"
        stroke="#D4D4D4"
        strokeWidth="1.5"
      />

      {/* Moving Average Line (Smooth Blue) */}
      <Polyline
        points={movingAvgPoints}
        fill="none"
        stroke="#2563EB"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots on actual data points */}
      {data.map((d, i) => {
        const x = getX(i);
        const y = getY(d.weightKg);
        return (
          <Circle
            key={i}
            cx={x}
            cy={y}
            r="3.5"
            fill="#111111"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
        );
      })}

      {/* Date labels on X-axis */}
      {data.map((d, i) => {
        if (i === 0 || i === data.length - 1 || (data.length > 4 && i === Math.floor(data.length / 2))) {
          const x = getX(i);
          const shortDate = (d.date || '').slice(5); // MM-DD
          return (
            <SvgText
              key={'lbl_' + i}
              x={x}
              y={chartH + 16}
              fontSize="10"
              fill="#858585"
              textAnchor="middle"
            >
              {shortDate}
            </SvgText>
          );
        }
        return null;
      })}
    </Svg>
  );
}

// Calorie Intake Daily Bars Chart
function CalorieBarChartSvg({ data = [], targetCal = 2150 }) {
  const chartW = SCREEN_WIDTH - 64;
  const chartH = 110;
  const maxCal = Math.max(targetCal * 1.25, ...data.map((d) => d.calories || 0));
  const targetY = chartH - (targetCal / maxCal) * chartH;

  const count = data.length || 7;
  const barWidth = Math.max(12, Math.min(26, Math.floor((chartW - 20) / count) - 8));
  const spacing = (chartW - 20) / count;

  return (
    <Svg width={chartW} height={chartH + 24}>
      {/* Target Dotted Line */}
      <Line
        x1="10"
        y1={targetY}
        x2={chartW - 10}
        y2={targetY}
        stroke="#D4D4D4"
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      {/* Daily Bars */}
      {data.map((d, idx) => {
        const x = 14 + idx * spacing;
        const barH = d.calories > 0 ? (d.calories / maxCal) * chartH : 4;
        const y = chartH - barH;
        const color = d.isToday ? '#111111' : '#858585';

        return (
          <Rect
            key={idx}
            x={x}
            y={y}
            width={barWidth}
            height={barH}
            rx="5"
            fill={color}
          />
        );
      })}

      {/* Day Labels */}
      {data.map((d, idx) => {
        const x = 14 + idx * spacing + barWidth / 2;
        return (
          <SvgText
            key={'txt_' + idx}
            x={x}
            y={chartH + 16}
            fontSize="10"
            fontWeight={d.isToday ? '700' : '400'}
            fill={d.isToday ? '#111111' : '#858585'}
            textAnchor="middle"
          >
            {d.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// =========================================================================
// STYLES — CAL AI MINIMALIST MONOCHROME THEME
// =========================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  contentWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40
  },
  topHeader: {
    marginBottom: 16
  },
  topLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#858585',
    marginBottom: 4
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: '#111111'
  },

  // Segmented Control
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 3,
    marginBottom: 20
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  segmentBtnActive: {
    backgroundColor: '#111111'
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#858585'
  },
  segmentTextActive: {
    color: '#FFFFFF'
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#111111'
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  hintSub: {
    fontSize: 11,
    color: '#858585'
  },

  // Hero Weight Section
  weightHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18
  },
  heroWeightNumber: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#111111'
  },
  heroWeightSub: {
    fontSize: 12,
    color: '#858585',
    marginTop: 2
  },
  unitTogglePill: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  unitToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111'
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6
  },
  actionPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600'
  },
  actionPillBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4
  },
  actionPillTextSmall: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600'
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 14
  },
  statCol: {
    flex: 1,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#858585',
    marginBottom: 3
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111'
  },
  darkText: {
    color: '#111111'
  },
  greenText: {
    color: '#16A34A'
  },
  redText: {
    color: '#DC2626'
  },
  purpleText: {
    color: '#7C3AED'
  },
  boldText: {
    fontWeight: '700',
    color: '#111111'
  },

  // Progress Bar
  progressBarWrap: {
    marginTop: 4
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  progressGoalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111111'
  },
  progressRemainingText: {
    fontSize: 12,
    color: '#858585'
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#111111',
    borderRadius: 4
  },

  // Chart
  paceBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  paceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111111'
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F5F5F5'
  },
  filterPillActive: {
    backgroundColor: '#111111'
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#858585'
  },
  filterPillTextActive: {
    color: '#FFFFFF'
  },
  chartWrapper: {
    alignItems: 'center',
    marginVertical: 6
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4
  },
  legendLine: {
    width: 14,
    height: 3,
    borderRadius: 2
  },
  legendDashed: {
    width: 14,
    borderTopWidth: 1.5,
    borderStyle: 'dashed'
  },
  legendLabel: {
    fontSize: 10,
    color: '#858585'
  },
  chartExplainer: {
    fontSize: 10,
    color: '#A3A3A3',
    lineHeight: 14,
    marginTop: 10,
    textAlign: 'center'
  },

  // Weight Log Entries
  weightEntryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5'
  },
  entryDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111'
  },
  entryNote: {
    fontSize: 11,
    color: '#858585',
    marginTop: 2
  },
  entryWeight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111'
  },

  // BMI Section
  textActionBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6
  },
  textActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB'
  },
  bmiHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  bmiValueText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#111111'
  },
  bmiSub: {
    fontSize: 11,
    color: '#858585'
  },
  bmiCategoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14
  },
  bmiCategoryText: {
    fontSize: 13,
    fontWeight: '700'
  },
  bmiMeterContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6
  },
  bmiSegment: {
    height: '100%'
  },
  bmiScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  bmiScaleText: {
    fontSize: 9,
    color: '#858585'
  },
  bmiDetailsBox: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10
  },
  bmiDetailItem: {
    fontSize: 12,
    color: '#555555',
    marginVertical: 2
  },
  disclaimerText: {
    fontSize: 10,
    color: '#858585',
    lineHeight: 14
  },

  // Measurements Grid
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4
  },
  measurementCell: {
    width: '25%',
    padding: 6,
    alignItems: 'center'
  },
  measureCellLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#858585',
    marginBottom: 2
  },
  measureCellValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111'
  },
  measureDiff: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1
  },

  // Composition
  compositionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12
  },
  compCard: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center'
  },
  compLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#858585',
    marginBottom: 4
  },
  compValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111111'
  },
  compSub: {
    fontSize: 10,
    color: '#858585',
    marginTop: 2
  },

  // Guidance
  goalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111'
  },
  goalTargetDate: {
    fontSize: 12,
    color: '#858585',
    marginTop: 2
  },
  safePacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  safePacePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A'
  },
  guidanceExplainer: {
    fontSize: 11,
    color: '#858585',
    lineHeight: 16
  },

  // Nutrition Tab Range Selector
  nutritionRangeRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10
  },
  rangeButtonActive: {
    backgroundColor: '#FFFFFF'
  },
  rangeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#858585'
  },
  rangeButtonTextActive: {
    color: '#111111'
  },

  // Hero Summary
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 16,
    padding: 16
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: '#858585',
    marginBottom: 6
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: '#111111'
  },
  summaryUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#858585'
  },
  summarySub: {
    fontSize: 11,
    color: '#858585',
    marginTop: 4
  },
  barChartWrap: {
    alignItems: 'center',
    marginTop: 8
  },

  // Macro Split Bar
  macroSplitBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8
  },
  macroSplitSegment: {
    height: '100%'
  },
  macroDistributionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  macroDistLabel: {
    fontSize: 11,
    fontWeight: '700'
  },
  macroCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5'
  },
  macroInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  macroColorPip: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  macroRowName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111'
  },
  macroRowSub: {
    fontSize: 11,
    color: '#858585'
  },
  macroInfoRight: {
    alignItems: 'flex-end',
    width: 110
  },
  macroRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4
  },
  macroRowUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: '#858585'
  },
  miniProgressTrack: {
    width: 100,
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden'
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2
  },

  // Micronutrients List
  microItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5'
  },
  microItemLeft: {
    flex: 1
  },
  microName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111'
  },
  microRdaSub: {
    fontSize: 10,
    color: '#858585'
  },
  microItemRight: {
    width: 130,
    alignItems: 'flex-end'
  },
  microValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  microCurrentVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111'
  },
  microPctBadge: {
    fontSize: 10,
    fontWeight: '700'
  },
  microProgressTrack: {
    width: 120,
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden'
  },
  microProgressFill: {
    height: '100%',
    borderRadius: 2
  },

  // Personalized Scorecard
  scorecardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14
  },
  scorecardCell: {
    width: '48%',
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
    padding: 12
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#858585',
    marginBottom: 4
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111111'
  },
  scoreDesc: {
    fontSize: 10,
    color: '#858585',
    marginTop: 2
  },
  recommendationBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12
  },
  recTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4
  },
  recText: {
    fontSize: 11,
    color: '#555555',
    lineHeight: 16
  }
});
