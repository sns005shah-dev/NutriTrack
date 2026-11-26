// NutriTrack AI — First-Time User Onboarding Flow
// Minimalist, high-polish Cal AI style multi-step onboarding wizard.
// Collects baseline metrics and calculates clinical starting targets using Mifflin-St Jeor.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Alert
} from 'react-native';
import * as Haptics from 'expo-haptics';

import {
  calculateRecommendedTargets,
  lbsToKg,
  kgToLbs,
  ftInToCm,
  cmToFtIn,
  formatWeight,
  formatHeight
} from '../services/nutritionCalculator';
import { ChevronLeftIcon, CheckIcon, SparkleIcon } from '../components/Icons';

export default function OnboardingScreen({ onComplete, initialProfile = {} }) {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Form State
  const [name, setName] = useState(initialProfile.name || '');
  const [weightUnit, setWeightUnit] = useState(initialProfile.weightUnit || 'kg');
  const [heightUnit, setHeightUnit] = useState(initialProfile.heightUnit || 'cm');

  const [gender, setGender] = useState(initialProfile.gender || 'male'); // 'male' | 'female' | 'skip'
  const [age, setAge] = useState(initialProfile.age ? String(initialProfile.age) : '28');

  // Height Inputs
  const [heightCm, setHeightCm] = useState(initialProfile.heightCm ? String(initialProfile.heightCm) : '175');
  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('9');

  // Weight Inputs
  const [weightVal, setWeightVal] = useState(
    initialProfile.weightKg
      ? String(weightUnit === 'lbs' ? kgToLbs(initialProfile.weightKg) : initialProfile.weightKg)
      : '70'
  );
  const [targetWeightVal, setTargetWeightVal] = useState(
    initialProfile.targetWeightKg
      ? String(weightUnit === 'lbs' ? kgToLbs(initialProfile.targetWeightKg) : initialProfile.targetWeightKg)
      : '65'
  );

  const [goal, setGoal] = useState(initialProfile.goal || 'lose'); // 'lose' | 'build_muscle' | 'gain' | 'maintain'
  const [activityLevel, setActivityLevel] = useState(initialProfile.activityLevel || 'moderate');
  const [dietaryPreference, setDietaryPreference] = useState(initialProfile.dietaryPreference || 'non_vegetarian');

  // Calculated Targets state for Step 6
  const [calculatedTargets, setCalculatedTargets] = useState(null);

  const handleNext = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    // Validation per step
    if (step === 2) {
      const a = parseInt(age, 10);
      if (!a || a < 12 || a > 110) {
        Alert.alert('Invalid Age', 'Please enter a valid age between 12 and 110.');
        return;
      }
    }

    if (step === 3) {
      let finalHeightCm = 170;
      if (heightUnit === 'cm') {
        finalHeightCm = parseFloat(heightCm) || 170;
        if (finalHeightCm < 80 || finalHeightCm > 250) {
          Alert.alert('Invalid Height', 'Please enter a valid height in cm (80–250 cm).');
          return;
        }
      } else {
        const ft = parseFloat(heightFt) || 0;
        const inc = parseFloat(heightIn) || 0;
        finalHeightCm = ftInToCm(ft, inc);
        if (finalHeightCm < 80 || finalHeightCm > 250) {
          Alert.alert('Invalid Height', 'Please enter a valid height in feet and inches.');
          return;
        }
      }

      const w = parseFloat(weightVal);
      if (!w || w <= 20 || w > 400) {
        Alert.alert('Invalid Weight', `Please enter a valid weight in ${weightUnit}.`);
        return;
      }
    }

    if (step === 5) {
      // Perform clinical targets calculation
      const finalHeight = heightUnit === 'cm'
        ? (parseFloat(heightCm) || 175)
        : ftInToCm(heightFt, heightIn);

      const parsedWeight = parseFloat(weightVal) || 70;
      const finalWeightKg = weightUnit === 'lbs' ? lbsToKg(parsedWeight) : parsedWeight;

      const parsedAge = parseInt(age, 10) || 28;

      const targets = calculateRecommendedTargets(
        finalWeightKg,
        finalHeight,
        parsedAge,
        gender,
        activityLevel,
        goal
      );

      setCalculatedTargets(targets);
      setStep(6);
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    const finalHeight = heightUnit === 'cm'
      ? (parseFloat(heightCm) || 175)
      : ftInToCm(heightFt, heightIn);

    const parsedWeight = parseFloat(weightVal) || 70;
    const finalWeightKg = weightUnit === 'lbs' ? lbsToKg(parsedWeight) : parsedWeight;

    const parsedTargetWeight = parseFloat(targetWeightVal) || finalWeightKg;
    const finalTargetWeightKg = weightUnit === 'lbs' ? lbsToKg(parsedTargetWeight) : parsedTargetWeight;

    const profileData = {
      name: name.trim(),
      age: parseInt(age, 10) || 28,
      gender,
      heightCm: finalHeight,
      weightKg: finalWeightKg,
      startingWeightKg: finalWeightKg,
      targetWeightKg: finalTargetWeightKg,
      goal,
      activityLevel,
      dietaryPreference,
      weightUnit,
      heightUnit,
      measurementUnit: heightUnit === 'ft/in' ? 'in' : 'cm'
    };

    if (onComplete) {
      onComplete(profileData, calculatedTargets);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header & Progress Bar */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {step > 1 && step < 6 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ChevronLeftIcon size={20} color="#111111" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}

          <Text style={styles.stepIndicator}>
            {step === 6 ? 'Ready' : `Step ${step} of ${totalSteps - 1}`}
          </Text>

          {step < 5 && step !== 1 ? (
            <TouchableOpacity onPress={handleNext} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}
        </View>

        {/* Progress Bar Line */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentWrap}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================================= */}
        {/* STEP 1: WELCOME & PREFERRED UNITS                                         */}
        {/* ========================================================================= */}
        {step === 1 && (
          <View style={styles.stepBox}>
            <Text style={styles.welcomeSuper}>NUTRITRACK AI</Text>
            <Text style={styles.stepTitle}>Welcome to NutriTrack</Text>
            <Text style={styles.stepSubtitle}>
              Let's calibrate your daily nutrition targets based on your unique body metrics.
            </Text>

            <Text style={[styles.fieldLabel, { marginTop: 24 }]}>YOUR NAME (OPTIONAL)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Alex"
              placeholderTextColor="#858585"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>PREFERRED WEIGHT UNIT</Text>
            <View style={styles.toggleRow}>
              {[
                { key: 'kg', label: 'Kilograms (kg)' },
                { key: 'lbs', label: 'Pounds (lbs)' }
              ].map((u) => {
                const active = weightUnit === u.key;
                return (
                  <TouchableOpacity
                    key={u.key}
                    style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                    onPress={() => setWeightUnit(u.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>
                      {u.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>PREFERRED HEIGHT UNIT</Text>
            <View style={styles.toggleRow}>
              {[
                { key: 'cm', label: 'Centimeters (cm)' },
                { key: 'ft/in', label: 'Feet / Inches (ft/in)' }
              ].map((u) => {
                const active = heightUnit === u.key;
                return (
                  <TouchableOpacity
                    key={u.key}
                    style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                    onPress={() => setHeightUnit(u.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>
                      {u.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: BIOLOGICAL SEX & AGE                                              */}
        {/* ========================================================================= */}
        {step === 2 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>Sex & Age</Text>
            <Text style={styles.stepSubtitle}>
              Used strictly for the clinical Mifflin-St Jeor metabolic rate formula.
            </Text>

            <Text style={[styles.fieldLabel, { marginTop: 24 }]}>BIOLOGICAL SEX</Text>
            <View style={styles.cardOptionsCol}>
              {[
                { key: 'male', label: 'Male', sub: '+5 kcal BMR formula constant' },
                { key: 'female', label: 'Female', sub: '-161 kcal BMR formula constant' },
                { key: 'skip', label: 'Prefer not to say', sub: 'Uses standard metabolic baseline' }
              ].map((item) => {
                const active = gender === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.optionCard, active && styles.optionCardActive]}
                    onPress={() => setGender(item.key)}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
                        {item.label}
                      </Text>
                      <Text style={styles.optionSub}>{item.sub}</Text>
                    </View>
                    {active && <CheckIcon size={18} color="#111111" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>AGE (YEARS)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              placeholder="e.g. 28"
              placeholderTextColor="#858585"
              value={age}
              onChangeText={setAge}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: CURRENT WEIGHT & HEIGHT                                           */}
        {/* ========================================================================= */}
        {step === 3 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>Body Metrics</Text>
            <Text style={styles.stepSubtitle}>
              Enter your current height and weight to calculate your baseline metabolic burn.
            </Text>

            <Text style={[styles.fieldLabel, { marginTop: 24 }]}>
              CURRENT WEIGHT ({weightUnit.toUpperCase()})
            </Text>
            <TextInput
              style={styles.largeInput}
              keyboardType="decimal-pad"
              placeholder={weightUnit === 'lbs' ? '160.0' : '72.5'}
              placeholderTextColor="#858585"
              value={weightVal}
              onChangeText={setWeightVal}
            />

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>
              HEIGHT ({heightUnit.toUpperCase()})
            </Text>
            {heightUnit === 'cm' ? (
              <TextInput
                style={styles.largeInput}
                keyboardType="numeric"
                placeholder="175"
                placeholderTextColor="#858585"
                value={heightCm}
                onChangeText={setHeightCm}
              />
            ) : (
              <View style={styles.rowInputs}>
                <View style={styles.flexOne}>
                  <TextInput
                    style={styles.largeInput}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor="#858585"
                    value={heightFt}
                    onChangeText={setHeightFt}
                  />
                  <Text style={styles.inputUnderLabel}>FEET</Text>
                </View>
                <View style={{ width: 14 }} />
                <View style={styles.flexOne}>
                  <TextInput
                    style={styles.largeInput}
                    keyboardType="numeric"
                    placeholder="9"
                    placeholderTextColor="#858585"
                    value={heightIn}
                    onChangeText={setHeightIn}
                  />
                  <Text style={styles.inputUnderLabel}>INCHES</Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: PRIMARY GOAL & TARGET WEIGHT                                      */}
        {/* ========================================================================= */}
        {step === 4 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>What's your goal?</Text>
            <Text style={styles.stepSubtitle}>
              We calibrate your caloric target and protein split to match your goal safely.
            </Text>

            <View style={[styles.cardOptionsCol, { marginTop: 20 }]}>
              {[
                {
                  key: 'lose',
                  label: 'Lose Weight',
                  sub: 'Sustainable 500 kcal deficit (~0.5 kg/week fat loss)'
                },
                {
                  key: 'build_muscle',
                  label: 'Build Muscle',
                  sub: 'Higher protein & slight surplus (+275 kcal) for hypertrophy'
                },
                {
                  key: 'maintain',
                  label: 'Maintain Weight',
                  sub: 'Balanced caloric intake matching total daily energy burn'
                },
                {
                  key: 'gain',
                  label: 'Gain Weight',
                  sub: 'Caloric surplus (+450 kcal) for steady mass gain'
                }
              ].map((item) => {
                const active = goal === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.optionCard, active && styles.optionCardActive]}
                    onPress={() => setGoal(item.key)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
                        {item.label}
                      </Text>
                      <Text style={styles.optionSub}>{item.sub}</Text>
                    </View>
                    {active && <CheckIcon size={18} color="#111111" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>
              TARGET GOAL WEIGHT ({weightUnit.toUpperCase()})
            </Text>
            <TextInput
              style={styles.textInput}
              keyboardType="decimal-pad"
              placeholder={weightUnit === 'lbs' ? '150.0' : '68.0'}
              placeholderTextColor="#858585"
              value={targetWeightVal}
              onChangeText={setTargetWeightVal}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: ACTIVITY LEVEL & DIETARY PREFERENCE                               */}
        {/* ========================================================================= */}
        {step === 5 && (
          <View style={styles.stepBox}>
            <Text style={styles.stepTitle}>Lifestyle & Diet</Text>
            <Text style={styles.stepSubtitle}>
              Fine-tune energy expenditure and food recommendations.
            </Text>

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>ACTIVITY LEVEL</Text>
            <View style={styles.cardOptionsCol}>
              {[
                { key: 'sedentary', label: 'Sedentary', sub: 'Desk job, little to no regular exercise' },
                { key: 'light', label: 'Lightly Active', sub: 'Light exercise or brisk walking 1–3 days/wk' },
                { key: 'moderate', label: 'Moderately Active', sub: 'Moderate exercise or gym 3–5 days/wk' },
                { key: 'very', label: 'Very Active', sub: 'Heavy exercise or athletic training 6–7 days/wk' }
              ].map((item) => {
                const active = activityLevel === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.optionCard, active && styles.optionCardActive]}
                    onPress={() => setActivityLevel(item.key)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
                        {item.label}
                      </Text>
                      <Text style={styles.optionSub}>{item.sub}</Text>
                    </View>
                    {active && <CheckIcon size={18} color="#111111" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>DIETARY PREFERENCE</Text>
            <View style={styles.tagsWrap}>
              {[
                { key: 'non_vegetarian', label: 'Non-Vegetarian' },
                { key: 'vegetarian', label: 'Vegetarian' },
                { key: 'eggetarian', label: 'Eggetarian' },
                { key: 'vegan', label: 'Vegan' },
                { key: 'other', label: 'Other' }
              ].map((item) => {
                const active = dietaryPreference === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.tagPill, active && styles.tagPillActive]}
                    onPress={() => setDietaryPreference(item.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagPillText, active && styles.tagPillTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>Calculate My Targets ⚡</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: PERSONALIZED SUMMARY & CONFIRMATION                               */}
        {/* ========================================================================= */}
        {step === 6 && calculatedTargets && (
          <View style={styles.stepBox}>
            <View style={styles.summaryBadge}>
              <SparkleIcon size={14} color="#111111" />
              <Text style={styles.summaryBadgeText}>PERSONALIZED PLAN</Text>
            </View>

            <Text style={styles.stepTitle}>
              {name ? `Plan for ${name}` : 'Your Daily Plan'}
            </Text>
            <Text style={styles.stepSubtitle}>
              Calibrated using clinical Mifflin-St Jeor formulas for your {goal === 'lose' ? 'fat loss' : goal === 'build_muscle' ? 'muscle building' : goal === 'gain' ? 'weight gain' : 'maintenance'} goal.
            </Text>

            {/* Hero Calorie Card */}
            <View style={styles.heroTargetCard}>
              <Text style={styles.heroTargetLabel}>DAILY CALORIE BUDGET</Text>
              <Text style={styles.heroTargetNumber}>
                {calculatedTargets.calorieTarget.toLocaleString()}{' '}
                <Text style={styles.heroTargetUnit}>kcal</Text>
              </Text>

              <View style={styles.tdeeRow}>
                <Text style={styles.tdeeText}>
                  Maintenance Burn (TDEE): {calculatedTargets.maintenanceCalories} kcal
                </Text>
                <Text style={styles.tdeeSub}>
                  {goal === 'lose' ? '(-500 kcal daily deficit)' : goal === 'build_muscle' || goal === 'gain' ? '(caloric surplus for growth)' : '(caloric equilibrium)'}
                </Text>
              </View>
            </View>

            {/* 5 Nutrition Target Cards */}
            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>DAILY NUTRIENT TARGETS</Text>

            <View style={styles.targetsGrid}>
              <View style={styles.targetGridCell}>
                <View style={[styles.cellPip, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.cellLabel}>PROTEIN</Text>
                <Text style={styles.cellValue}>{calculatedTargets.proteinTarget}g</Text>
              </View>

              <View style={styles.targetGridCell}>
                <View style={[styles.cellPip, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.cellLabel}>CARBS</Text>
                <Text style={styles.cellValue}>{calculatedTargets.carbsTarget}g</Text>
              </View>

              <View style={styles.targetGridCell}>
                <View style={[styles.cellPip, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.cellLabel}>FAT</Text>
                <Text style={styles.cellValue}>{calculatedTargets.fatTarget}g</Text>
              </View>

              <View style={styles.targetGridCell}>
                <View style={[styles.cellPip, { backgroundColor: '#A78BFA' }]} />
                <Text style={styles.cellLabel}>FIBRE</Text>
                <Text style={styles.cellValue}>{calculatedTargets.fiberTarget}g</Text>
              </View>

              <View style={styles.targetGridCell}>
                <View style={[styles.cellPip, { backgroundColor: '#EC4899' }]} />
                <Text style={styles.cellLabel}>SUGAR</Text>
                <Text style={styles.cellValue}>&lt; {calculatedTargets.sugarTarget}g</Text>
              </View>

              <View style={styles.targetGridCell}>
                <View style={[styles.cellPip, { backgroundColor: '#0EA5E9' }]} />
                <Text style={styles.cellLabel}>WATER</Text>
                <Text style={styles.cellValue}>{initialProfile.waterTargetMl > 0 ? initialProfile.waterTargetMl : 2500}ml</Text>
              </View>
            </View>

            {/* Clinical Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerTitle}>Medical & Nutrition Guidance</Text>
              <Text style={styles.disclaimerBody}>
                These targets are calculated estimates based on the Mifflin-St Jeor equation and standard macronutrient distributions. They provide a safe starting point and are not clinical medical prescriptions. You can manually adjust your targets at any time in Profile & Settings.
              </Text>
            </View>

            {/* Finish Action Button */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleFinish} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>Start Using NutriTrack AI</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  backBtn: {
    padding: 4
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: '#858585',
    letterSpacing: 0.5
  },
  skipBtn: {
    padding: 4
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#858585'
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#111111',
    borderRadius: 2
  },
  container: {
    flex: 1
  },
  contentWrap: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40
  },
  stepBox: {
    flex: 1
  },
  welcomeSuper: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#858585',
    marginBottom: 6
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: '#111111',
    marginBottom: 6
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#858585',
    lineHeight: 18,
    marginBottom: 10
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#858585',
    marginBottom: 8
  },
  textInput: {
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#111111'
  },
  largeInput: {
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center'
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  flexOne: {
    flex: 1
  },
  inputUnderLabel: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: '#858585',
    marginTop: 6
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  toggleBtnActive: {
    backgroundColor: '#111111',
    borderColor: '#111111'
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#858585'
  },
  toggleBtnTextActive: {
    color: '#FFFFFF'
  },
  cardOptionsCol: {
    gap: 10
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 16,
    padding: 16
  },
  optionCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#111111',
    borderWidth: 1.8
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 2
  },
  optionTitleActive: {
    color: '#111111'
  },
  optionSub: {
    fontSize: 11,
    color: '#858585'
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12
  },
  tagPillActive: {
    backgroundColor: '#111111',
    borderColor: '#111111'
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#858585'
  },
  tagPillTextActive: {
    color: '#FFFFFF'
  },
  primaryButton: {
    backgroundColor: '#111111',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },

  // Step 6 Summary
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    marginBottom: 10
  },
  summaryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#111111'
  },
  heroTargetCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 18,
    padding: 18,
    marginVertical: 12
  },
  heroTargetLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#858585',
    marginBottom: 4
  },
  heroTargetNumber: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#111111'
  },
  heroTargetUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#858585'
  },
  tdeeRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5'
  },
  tdeeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111111'
  },
  tdeeSub: {
    fontSize: 11,
    color: '#858585',
    marginTop: 2
  },
  targetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  targetGridCell: {
    width: '31%',
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  cellPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 6
  },
  cellLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#858585',
    marginBottom: 2
  },
  cellValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111'
  },
  disclaimerBox: {
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
    padding: 14,
    marginTop: 16
  },
  disclaimerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4
  },
  disclaimerBody: {
    fontSize: 10,
    color: '#858585',
    lineHeight: 14
  }
});
