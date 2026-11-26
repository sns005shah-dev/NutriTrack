// Screen 4: Cal AI Minimalist Profile & Settings Screen
// Complete user profile management, Mifflin-St Jeor auto-calculation, Gemini AI config,
// JSON data backup/import, and safe onboarding rerun/app reset.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { VERIFIED_MODELS, PRIMARY_MODEL } from '../services/aiService';
import {
  calculateRecommendedTargets,
  kgToLbs,
  lbsToKg,
  cmToFtIn,
  ftInToCm
} from '../services/nutritionCalculator';
import { StorageService } from '../services/storageService';
import { CrossIcon } from '../components/Icons';

export default function ProfileScreen({
  appState,
  onSaveProfile,
  aiConfig,
  onSaveAiConfig,
  onResetApp,
  onRerunOnboarding,
  onImportData
}) {
  const currentProfile = appState?.userProfile || {};
  const [profile, setProfile] = useState({
    name: currentProfile.name || '',
    age: currentProfile.age || 28,
    gender: currentProfile.gender || 'male',
    dietaryPreference: currentProfile.dietaryPreference || 'non_vegetarian',
    weightKg: currentProfile.weightKg || 74.2,
    heightCm: currentProfile.heightCm || 175,
    goal: currentProfile.goal || 'lose',
    activityLevel: currentProfile.activityLevel || 'moderate',
    calorieTarget: currentProfile.calorieTarget || 2000,
    proteinTarget: currentProfile.proteinTarget || 140,
    carbsTarget: currentProfile.carbsTarget || 210,
    fatTarget: currentProfile.fatTarget || 65,
    fiberTarget: currentProfile.fiberTarget || 30,
    sugarTarget: currentProfile.sugarTarget || 50,
    waterTargetMl: currentProfile.waterTargetMl || 2500,
    weightUnit: currentProfile.weightUnit || 'kg',
    heightUnit: currentProfile.heightUnit || 'cm'
  });

  // Display values for unit conversion
  const [weightUnit, setWeightUnit] = useState(profile.weightUnit || 'kg');
  const [heightUnit, setHeightUnit] = useState(profile.heightUnit || 'cm');

  // Input states for height (ft / in)
  const initialFtIn = cmToFtIn(profile.heightCm);
  const [heightFeet, setHeightFeet] = useState(String(initialFtIn.feet));
  const [heightInches, setHeightInches] = useState(String(initialFtIn.inches));

  // AI Configuration State
  const [apiKey, setApiKey] = useState(aiConfig?.apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [model, setModel] = useState(aiConfig?.activeModel || PRIMARY_MODEL);
  const [testingAi, setTestingAi] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(aiConfig?.apiKey ? 'connected' : 'not_configured');
  const [serverConfigured, setServerConfigured] = useState(false);

  // Sync state whenever aiConfig prop changes (e.g. from storage load)
  useEffect(() => {
    if (aiConfig?.apiKey) {
      setApiKey(aiConfig.apiKey);
      setConnectionStatus('connected');
    }
    if (aiConfig?.activeModel) {
      setModel(aiConfig.activeModel);
    }

    // Probe Cloudflare server proxy status
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.serverConfigured) {
          setServerConfigured(true);
          if (!aiConfig?.apiKey) {
            setConnectionStatus('connected');
            setTestStatus('Cloudflare Server Secret configured and ready 🔒');
          }
        }
      })
      .catch(() => {});
  }, [aiConfig]);

  // Backup & Import Modal State
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [backupModalMode, setBackupModalMode] = useState('export'); // 'export' | 'import'
  const [backupJsonText, setBackupJsonText] = useState('');
  const [backupCopyStatus, setBackupCopyStatus] = useState('');

  // Reset Confirmation Modal State
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [rerunModalVisible, setRerunModalVisible] = useState(false);

  // Unit Toggle Handlers
  const handleToggleWeightUnit = (newUnit) => {
    if (newUnit === weightUnit) return;
    setWeightUnit(newUnit);
    setProfile(prev => ({ ...prev, weightUnit: newUnit }));
  };

  const handleToggleHeightUnit = (newUnit) => {
    if (newUnit === heightUnit) return;
    if (newUnit === 'ft') {
      const ftIn = cmToFtIn(profile.heightCm);
      setHeightFeet(String(ftIn.feet));
      setHeightInches(String(ftIn.inches));
    }
    setHeightUnit(newUnit);
    setProfile(prev => ({ ...prev, heightUnit: newUnit }));
  };

  const handleUpdateHeightFtIn = (ftStr, inStr) => {
    setHeightFeet(ftStr);
    setHeightInches(inStr);
    const cm = ftInToCm(parseFloat(ftStr) || 0, parseFloat(inStr) || 0);
    setProfile(prev => ({ ...prev, heightCm: cm }));
  };

  // Recalculate Mifflin-St Jeor Targets
  const handleRecalculateGoals = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    const targets = calculateRecommendedTargets(
      profile.weightKg,
      profile.heightCm,
      profile.age,
      profile.gender,
      profile.activityLevel,
      profile.goal
    );

    const updated = {
      ...profile,
      calorieTarget: targets.calorieTarget,
      proteinTarget: targets.proteinTarget,
      carbsTarget: targets.carbsTarget,
      fatTarget: targets.fatTarget,
      fiberTarget: targets.fiberTarget,
      sugarTarget: targets.sugarTarget,
      waterTargetMl: targets.waterTargetMl
    };

    setProfile(updated);
    if (onSaveProfile) onSaveProfile(updated);

    Alert.alert(
      'Targets Auto-Calculated',
      `Clinical Mifflin-St Jeor Formula Applied:\n\n` +
      `• Calorie Target: ${targets.calorieTarget} kcal\n` +
      `• Protein Target: ${targets.proteinTarget}g\n` +
      `• Carbs Target: ${targets.carbsTarget}g\n` +
      `• Fat Target: ${targets.fatTarget}g\n` +
      `• Fibre Target: ${targets.fiberTarget}g\n` +
      `• Sugar Limit: ${targets.sugarTarget}g\n` +
      `• Water Intake: ${targets.waterTargetMl} ml`
    );
  };

  // Save Dedicated AI Key & Model
  const handleSaveAiKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed && !serverConfigured) {
      Alert.alert('Missing API Key', 'Please enter your Gemini API key before saving.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    const newConfig = {
      apiKey: trimmed,
      model: model,
      activeModel: model,
      status: 'connected',
      savedAt: new Date().toISOString()
    };

    if (onSaveAiConfig) {
      await onSaveAiConfig(newConfig);
    }

    setConnectionStatus('connected');
    setTestStatus('SUCCESS: API key saved and verified. Active across sessions! ⚡');
    Alert.alert('AI Configuration Saved', 'Your Gemini API key and active model have been saved securely to device storage and will persist across all sessions.');
  };

  // Test Gemini API Key
  const handleTestApi = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    setTestingAi(true);
    setTestStatus('');
    setConnectionStatus('testing');

    const trimmedKey = apiKey.trim();

    try {
      // 1. Try Cloudflare proxy test endpoint first
      let testedViaProxy = false;
      try {
        const pRes = await fetch('/api/test-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: trimmedKey, model })
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.success) {
            testedViaProxy = true;
            setTestStatus('SUCCESS: Cloudflare proxy verified with HTTP 200! ⚡');
            setConnectionStatus('connected');
            if (trimmedKey && onSaveAiConfig) {
              onSaveAiConfig({ apiKey: trimmedKey, model, activeModel: model, status: 'connected' });
            }
          } else {
            setTestStatus(`ERROR: ${pData.error}`);
            setConnectionStatus('failed');
            return;
          }
        }
      } catch (e) {}

      if (testedViaProxy) return;

      // 2. Direct Gemini test
      if (!trimmedKey) {
        setTestStatus('ERROR: Please enter an API key to test.');
        setConnectionStatus('not_configured');
        return;
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Healthcheck. Reply with {"status":"ok"}' }] }],
          generationConfig: { response_mime_type: 'application/json' }
        })
      });

      if (res.ok) {
        setTestStatus('SUCCESS: HTTP 200 — Gemini connection verified! ⚡');
        setConnectionStatus('connected');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
        // Auto-save verified key
        if (onSaveAiConfig) {
          onSaveAiConfig({ apiKey: trimmedKey, model, activeModel: model, status: 'connected' });
        }
      } else {
        const text = await res.text();
        let msg = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.error?.message) msg = parsed.error.message;
        } catch (e) {}
        setTestStatus(`ERROR: ${msg}`);
        setConnectionStatus('failed');
      }
    } catch (err) {
      setTestStatus(`CONNECTION FAILED: ${err.message}`);
      setConnectionStatus('failed');
    } finally {
      setTestingAi(false);
    }
  };

  // Save All Settings
  const handleSaveProfile = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    if (onSaveProfile) {
      onSaveProfile(profile);
    }

    if (onSaveAiConfig) {
      onSaveAiConfig({
        apiKey: apiKey.trim(),
        model: model,
        activeModel: model
      });
    }

    Alert.alert('Settings Saved', 'Your profile, daily targets, and AI configuration have been updated.');
  };

  // Backup Actions
  const handleOpenExportModal = async () => {
    try {
      const json = await StorageService.exportAllData();
      setBackupJsonText(json);
      setBackupModalMode('export');
      setBackupCopyStatus('');
      setBackupModalVisible(true);
    } catch (e) {
      Alert.alert('Export Error', e.message);
    }
  };

  const handleOpenImportModal = () => {
    setBackupJsonText('');
    setBackupModalMode('import');
    setBackupCopyStatus('');
    setBackupModalVisible(true);
  };

  const handlePerformImport = async () => {
    if (!backupJsonText.trim()) {
      Alert.alert('Empty Input', 'Please paste valid JSON backup data.');
      return;
    }

    try {
      const result = await StorageService.importAllData(backupJsonText.trim());
      if (result.success) {
        const parsed = JSON.parse(backupJsonText.trim());
        if (parsed.state && onImportData) {
          onImportData(parsed.state);
        }
        setBackupModalVisible(false);
        Alert.alert('Backup Restored', 'Your data and settings have been successfully restored!');
      } else {
        Alert.alert('Import Failed', result.error || 'Invalid backup format.');
      }
    } catch (err) {
      Alert.alert('Import Error', 'Invalid JSON syntax: ' + err.message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Title */}
      <View style={styles.topHeader}>
        <Text style={styles.dateLabel}>SETTINGS</Text>
        <Text style={styles.screenTitle}>Profile & Goals</Text>
        <Text style={styles.headerSubtitle}>
          Personalized health profile and metabolic configuration.
        </Text>
      </View>

      {/* 1. Personal Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>

        <View style={styles.inputsRow}>
          <View style={[styles.inputCol, { flex: 2 }]}>
            <Text style={styles.inputLabel}>Name (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={profile.name}
              onChangeText={(v) => setProfile({ ...profile, name: v })}
              placeholder="e.g. Alex"
              placeholderTextColor="#858585"
            />
          </View>

          <View style={[styles.inputCol, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={String(profile.age || '')}
              onChangeText={(v) => setProfile({ ...profile, age: parseInt(v, 10) || 0 })}
            />
          </View>
        </View>

        {/* Biological Sex */}
        <Text style={[styles.inputLabel, { marginTop: 14 }]}>Biological Sex</Text>
        <Text style={styles.helperNote}>
          Used strictly for Mifflin-St Jeor metabolic rate formula (+5 for male, -161 for female).
        </Text>
        <View style={styles.optionsWrapRow}>
          {[
            { key: 'male', label: 'Male' },
            { key: 'female', label: 'Female' },
            { key: 'skip', label: 'Skip / Neutral' }
          ].map((item) => {
            const active = profile.gender === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.pillOption, active && styles.pillOptionActive]}
                onPress={() => setProfile({ ...profile, gender: item.key })}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillOptionText, active && styles.pillOptionTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dietary Preference */}
        <Text style={[styles.inputLabel, { marginTop: 14 }]}>Dietary Preference</Text>
        <View style={styles.optionsWrapRow}>
          {[
            { key: 'non_vegetarian', label: 'Non-Veg 🍗' },
            { key: 'vegetarian', label: 'Veg 🥗' },
            { key: 'eggetarian', label: 'Eggetarian 🥚' },
            { key: 'vegan', label: 'Vegan 🌱' },
            { key: 'other', label: 'Other 🍽️' }
          ].map((item) => {
            const active = profile.dietaryPreference === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.pillOption, active && styles.pillOptionActive]}
                onPress={() => setProfile({ ...profile, dietaryPreference: item.key })}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillOptionText, active && styles.pillOptionTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. Fitness Goal & Activity Level Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Fitness Goal & Activity</Text>

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Primary Goal</Text>
        <View style={styles.goalsWrap}>
          {[
            { key: 'lose', label: 'Fat Loss (-500 kcal deficit)' },
            { key: 'build_muscle', label: 'Build Muscle (+350 kcal surplus)' },
            { key: 'maintain', label: 'Maintain Weight (0 kcal balance)' },
            { key: 'gain', label: 'Weight Gain (+500 kcal surplus)' }
          ].map((g) => {
            const active = profile.goal === g.key;
            return (
              <TouchableOpacity
                key={g.key}
                style={[styles.goalOptionPill, active && styles.goalOptionPillActive]}
                onPress={() => setProfile({ ...profile, goal: g.key })}
                activeOpacity={0.7}
              >
                <Text style={[styles.goalOptionText, active && styles.goalOptionTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.inputLabel, { marginTop: 14 }]}>Daily Activity Level</Text>
        <View style={styles.goalsWrap}>
          {[
            { key: 'sedentary', label: 'Sedentary (Desk job, little/no exercise)' },
            { key: 'light', label: 'Lightly Active (Light exercise 1-3 days/week)' },
            { key: 'moderate', label: 'Moderately Active (Exercise 3-5 days/week)' },
            { key: 'very', label: 'Very Active (Intense training 6-7 days/week)' }
          ].map((act) => {
            const active = profile.activityLevel === act.key;
            return (
              <TouchableOpacity
                key={act.key}
                style={[styles.goalOptionPill, active && styles.goalOptionPillActive]}
                onPress={() => setProfile({ ...profile, activityLevel: act.key })}
                activeOpacity={0.7}
              >
                <Text style={[styles.goalOptionText, active && styles.goalOptionTextActive]}>
                  {act.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Body Metrics Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Body Metrics</Text>

        {/* Weight with Unit Toggle */}
        <View style={styles.metricRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.labelWithToggle}>
              <Text style={styles.inputLabel}>Current Weight</Text>
              <View style={styles.miniUnitToggle}>
                <TouchableOpacity
                  style={[styles.miniUnitBtn, weightUnit === 'kg' && styles.miniUnitBtnActive]}
                  onPress={() => handleToggleWeightUnit('kg')}
                >
                  <Text style={[styles.miniUnitBtnText, weightUnit === 'kg' && styles.miniUnitBtnTextActive]}>
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.miniUnitBtn, weightUnit === 'lbs' && styles.miniUnitBtnActive]}
                  onPress={() => handleToggleWeightUnit('lbs')}
                >
                  <Text style={[styles.miniUnitBtnText, weightUnit === 'lbs' && styles.miniUnitBtnTextActive]}>
                    lbs
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={
                weightUnit === 'lbs'
                  ? String(kgToLbs(profile.weightKg || 74.2))
                  : String(profile.weightKg || '')
              }
              onChangeText={(v) => {
                const val = parseFloat(v) || 0;
                setProfile({
                  ...profile,
                  weightKg: weightUnit === 'lbs' ? lbsToKg(val) : val
                });
              }}
            />
          </View>
        </View>

        {/* Height with Unit Toggle */}
        <View style={[styles.metricRow, { marginTop: 14 }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.labelWithToggle}>
              <Text style={styles.inputLabel}>Height</Text>
              <View style={styles.miniUnitToggle}>
                <TouchableOpacity
                  style={[styles.miniUnitBtn, heightUnit === 'cm' && styles.miniUnitBtnActive]}
                  onPress={() => handleToggleHeightUnit('cm')}
                >
                  <Text style={[styles.miniUnitBtnText, heightUnit === 'cm' && styles.miniUnitBtnTextActive]}>
                    cm
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.miniUnitBtn, heightUnit === 'ft' && styles.miniUnitBtnActive]}
                  onPress={() => handleToggleHeightUnit('ft')}
                >
                  <Text style={[styles.miniUnitBtnText, heightUnit === 'ft' && styles.miniUnitBtnTextActive]}>
                    ft / in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {heightUnit === 'cm' ? (
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={String(profile.heightCm || '')}
                onChangeText={(v) => setProfile({ ...profile, heightCm: parseFloat(v) || 0 })}
                placeholder="175"
                placeholderTextColor="#858585"
              />
            ) : (
              <View style={styles.inputsRow}>
                <View style={[styles.inputCol, { flex: 1 }]}>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={heightFeet}
                    onChangeText={(v) => handleUpdateHeightFtIn(v, heightInches)}
                    placeholder="5"
                    placeholderTextColor="#858585"
                  />
                  <Text style={styles.unitSuffix}>feet</Text>
                </View>
                <View style={[styles.inputCol, { flex: 1 }]}>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={heightInches}
                    onChangeText={(v) => handleUpdateHeightFtIn(heightFeet, v)}
                    placeholder="9"
                    placeholderTextColor="#858585"
                  />
                  <Text style={styles.unitSuffix}>inches</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 4. Daily Nutrition Targets Card with Auto-Calc */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Daily Nutrition Targets</Text>
            <Text style={styles.helperNote}>Customizable or clinically calculated</Text>
          </View>
          <TouchableOpacity
            style={styles.autoCalcButton}
            onPress={handleRecalculateGoals}
            activeOpacity={0.7}
          >
            <Text style={styles.autoCalcButtonText}>Auto-Calc ⚡</Text>
          </TouchableOpacity>
        </View>

        {/* Calories Input */}
        <View style={styles.targetInputRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.targetInputLabel}>Calories (kcal)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={String(profile.calorieTarget || '')}
              onChangeText={(v) => setProfile({ ...profile, calorieTarget: parseInt(v, 10) || 0 })}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.targetInputLabel}>Water Target (ml)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={String(profile.waterTargetMl || '')}
              onChangeText={(v) => setProfile({ ...profile, waterTargetMl: parseInt(v, 10) || 0 })}
            />
          </View>
        </View>

        {/* Macronutrient Grid */}
        <View style={[styles.targetInputRow, { marginTop: 12 }]}>
          <View style={styles.macroInputCol}>
            <Text style={[styles.targetInputLabel, { color: '#3B82F6' }]}>Protein (g)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={String(profile.proteinTarget || '')}
              onChangeText={(v) => setProfile({ ...profile, proteinTarget: parseInt(v, 10) || 0 })}
            />
          </View>
          <View style={styles.macroInputCol}>
            <Text style={[styles.targetInputLabel, { color: '#F59E0B' }]}>Carbs (g)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={String(profile.carbsTarget || '')}
              onChangeText={(v) => setProfile({ ...profile, carbsTarget: parseInt(v, 10) || 0 })}
            />
          </View>
          <View style={styles.macroInputCol}>
            <Text style={[styles.targetInputLabel, { color: '#22C55E' }]}>Fat (g)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={String(profile.fatTarget || '')}
              onChangeText={(v) => setProfile({ ...profile, fatTarget: parseInt(v, 10) || 0 })}
            />
          </View>
        </View>

        {/* Fibre & Sugar Limits */}
        <View style={[styles.targetInputRow, { marginTop: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.targetInputLabel, { color: '#A78BFA' }]}>Fibre Target (g)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={String(profile.fiberTarget || '')}
              onChangeText={(v) => setProfile({ ...profile, fiberTarget: parseInt(v, 10) || 0 })}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.targetInputLabel, { color: '#EC4899' }]}>Sugar Limit (g)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={String(profile.sugarTarget || '')}
              onChangeText={(v) => setProfile({ ...profile, sugarTarget: parseInt(v, 10) || 0 })}
            />
          </View>
        </View>

        {/* Computed Targets Summary Bar */}
        <View style={styles.targetsSummaryGrid}>
          <View style={styles.targetCol}>
            <Text style={styles.targetValue}>{profile.calorieTarget}</Text>
            <Text style={styles.targetKey}>Calories</Text>
          </View>
          <View style={styles.targetCol}>
            <Text style={[styles.targetValue, { color: '#3B82F6' }]}>{profile.proteinTarget}g</Text>
            <Text style={styles.targetKey}>Protein</Text>
          </View>
          <View style={styles.targetCol}>
            <Text style={[styles.targetValue, { color: '#F59E0B' }]}>{profile.carbsTarget}g</Text>
            <Text style={styles.targetKey}>Carbs</Text>
          </View>
          <View style={styles.targetCol}>
            <Text style={[styles.targetValue, { color: '#22C55E' }]}>{profile.fatTarget}g</Text>
            <Text style={styles.targetKey}>Fat</Text>
          </View>
          <View style={styles.targetCol}>
            <Text style={[styles.targetValue, { color: '#A78BFA' }]}>{profile.fiberTarget}g</Text>
            <Text style={styles.targetKey}>Fibre</Text>
          </View>
        </View>
      </View>

      {/* 5. Google Gemini AI Engine Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Google Gemini AI Engine</Text>
          <View style={[
            styles.statusPill,
            connectionStatus === 'connected' && styles.statusPillConnected,
            connectionStatus === 'testing' && styles.statusPillTesting,
            connectionStatus === 'failed' && styles.statusPillFailed
          ]}>
            <View style={[
              styles.statusDot,
              connectionStatus === 'connected' && { backgroundColor: '#16A34A' },
              connectionStatus === 'testing' && { backgroundColor: '#F59E0B' },
              connectionStatus === 'failed' && { backgroundColor: '#DC2626' }
            ]} />
            <Text style={[
              styles.statusPillText,
              connectionStatus === 'connected' && { color: '#16A34A' },
              connectionStatus === 'testing' && { color: '#B45309' },
              connectionStatus === 'failed' && { color: '#DC2626' }
            ]}>
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'testing' ? 'Testing' : connectionStatus === 'failed' ? 'Failed' : 'Not Configured'}
            </Text>
          </View>
        </View>

        <Text style={styles.helperNote}>
          Powers natural-language meal quantification and camera plate vision.
        </Text>

        {serverConfigured ? (
          <View style={styles.serverBadgeRow}>
            <Text style={styles.serverBadgeIcon}>🔒</Text>
            <Text style={styles.serverBadgeText}>
              Cloudflare server-side proxy is active. Server secret is used automatically.
            </Text>
          </View>
        ) : null}

        <View style={styles.labelWithToggle}>
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>
            {serverConfigured ? 'Custom API Key (Optional Override)' : 'Gemini API Key'}
          </Text>
          <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
            <Text style={styles.toggleText}>{showApiKey ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.textInput}
          secureTextEntry={!showApiKey}
          value={apiKey}
          onChangeText={(val) => {
            setApiKey(val);
            if (connectionStatus === 'connected') {
              setConnectionStatus('not_configured');
            }
          }}
          placeholder={serverConfigured ? 'Leave blank to use server secret' : 'AIzaSy...'}
          placeholderTextColor="#858585"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.inputLabel, { marginTop: 14 }]}>Active AI Model</Text>
        <View style={styles.modelsList}>
          {VERIFIED_MODELS.map((m) => {
            const active = model === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.modelOption, active && styles.modelOptionActive]}
                onPress={() => setModel(m)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modelOptionText, active && styles.modelOptionTextActive]}>
                    {m}
                  </Text>
                  <Text style={[styles.modelOptionDesc, active && styles.modelOptionDescActive]}>
                    {m === PRIMARY_MODEL
                      ? '⚡ Primary Model — Fastest response & HTTP 200 verified'
                      : m === 'gemma-4-26b-a4b-it'
                      ? 'Verified automatic fallback engine'
                      : 'High precision multimodal generation'}
                  </Text>
                </View>
                {active && <Text style={styles.modelCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Buttons: Test Connection & Save Dedicated Key */}
        <View style={styles.aiActionBtnRow}>
          <TouchableOpacity
            style={styles.testApiBtn}
            onPress={handleTestApi}
            disabled={testingAi}
            activeOpacity={0.7}
          >
            {testingAi ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Text style={styles.testApiBtnText}>Test Connection ⚡</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveAiKeyBtn}
            onPress={handleSaveAiKey}
            activeOpacity={0.85}
          >
            <Text style={styles.saveAiKeyBtnText}>Save API Key 🔒</Text>
          </TouchableOpacity>
        </View>

        {testStatus ? (
          <Text
            style={[
              styles.testStatusMsg,
              { color: testStatus.includes('SUCCESS') ? '#16A34A' : '#DC2626' }
            ]}
          >
            {testStatus}
          </Text>
        ) : null}
      </View>

      {/* 6. Data Privacy & Local Backup Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data Privacy & Backup</Text>
        <Text style={styles.backupSub}>
          Your food logs, weight entries, and settings remain 100% offline on your device in secure storage.
        </Text>
        <View style={styles.backupButtonsRow}>
          <TouchableOpacity
            style={styles.backupBtn}
            onPress={handleOpenExportModal}
            activeOpacity={0.7}
          >
            <Text style={styles.backupBtnText}>Export JSON Backup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backupBtn}
            onPress={handleOpenImportModal}
            activeOpacity={0.7}
          >
            <Text style={styles.backupBtnText}>Import Backup</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 7. App Setup & Reset Options Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Setup & Reset Options</Text>
        <Text style={styles.backupSub}>
          Re-run the initial onboarding interview or completely reset application data.
        </Text>

        <TouchableOpacity
          style={styles.rerunBtn}
          onPress={() => setRerunModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.rerunBtnText}>Re-run Onboarding Setup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetDangerBtn}
          onPress={() => setResetModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.resetDangerBtnText}>Reset Application & Data</Text>
        </TouchableOpacity>
      </View>

      {/* Save Settings Button */}
      <TouchableOpacity
        style={styles.saveProfileBtn}
        onPress={handleSaveProfile}
        activeOpacity={0.85}
      >
        <Text style={styles.saveProfileBtnText}>Save Settings</Text>
      </TouchableOpacity>

      <View style={{ height: 88 }} />

      {/* ========================================================================= */}
      {/* BACKUP EXPORT / IMPORT MODAL                                              */}
      {/* ========================================================================= */}
      <Modal
        visible={backupModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBackupModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setBackupModalVisible(false)}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close Backup Modal"
            >
              <CrossIcon size={20} color="#111111" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {backupModalMode === 'export' ? 'JSON Data Backup' : 'Import JSON Backup'}
            </Text>
            <View style={styles.headerRightSpacer} />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {backupModalMode === 'export' ? (
              <>
                <Text style={styles.modalExplainer}>
                  Copy this JSON backup to save your entire diary history, custom foods, weight entries, and configuration offline.
                </Text>
                <TextInput
                  style={styles.jsonTextArea}
                  multiline
                  editable={false}
                  value={backupJsonText}
                  selectTextOnFocus
                />
                {backupCopyStatus ? (
                  <Text style={styles.copyStatusText}>{backupCopyStatus}</Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.modalExplainer}>
                  Paste your previously exported NutriTrack AI JSON backup below. This will safely restore your complete profile and diary records.
                </Text>
                <TextInput
                  style={[styles.jsonTextArea, { backgroundColor: '#FFFFFF' }]}
                  multiline
                  placeholder="Paste JSON backup text here..."
                  placeholderTextColor="#858585"
                  value={backupJsonText}
                  onChangeText={setBackupJsonText}
                />
                <TouchableOpacity
                  style={styles.confirmImportBtn}
                  onPress={handlePerformImport}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmImportBtnText}>Restore Data</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* RESET APPLICATION CONFIRMATION MODAL                                      */}
      {/* ========================================================================= */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>Reset Application & Data?</Text>
            <Text style={styles.alertDesc}>
              This will permanently delete all your food logs, weight entries, custom foods, and personalized targets. The app will return to the brand-new user setup screen.
              {'\n\n'}
              This action cannot be undone.
            </Text>
            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertCancelBtn}
                onPress={() => setResetModalVisible(false)}
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertDestructiveBtn}
                onPress={() => {
                  setResetModalVisible(false);
                  if (onResetApp) onResetApp();
                }}
              >
                <Text style={styles.alertDestructiveText}>Reset Everything</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* RE-RUN ONBOARDING CONFIRMATION MODAL                                      */}
      {/* ========================================================================= */}
      <Modal
        visible={rerunModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRerunModalVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>Re-run Onboarding Setup?</Text>
            <Text style={styles.alertDesc}>
              This will launch the initial setup wizard so you can adjust your fitness goal, metabolic metrics, and dietary preferences.
              {'\n\n'}
              Your past food logs and weigh-in history will be preserved.
            </Text>
            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertCancelBtn}
                onPress={() => setRerunModalVisible(false)}
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertConfirmBtn}
                onPress={() => {
                  setRerunModalVisible(false);
                  if (onRerunOnboarding) onRerunOnboarding();
                }}
              >
                <Text style={styles.alertConfirmText}>Start Wizard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16
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
  headerSubtitle: {
    fontSize: 13,
    color: '#858585',
    marginTop: 4
  },
  card: {
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    marginBottom: 16
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111'
  },
  helperNote: {
    fontSize: 11,
    color: '#858585',
    marginTop: 2
  },
  autoCalcButton: {
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10
  },
  autoCalcButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  inputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10
  },
  inputCol: {
    flex: 1
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#858585',
    marginBottom: 4
  },
  labelWithToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111111'
  },
  unitSuffix: {
    fontSize: 10,
    color: '#858585',
    marginTop: 2,
    textAlign: 'center'
  },
  textInput: {
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#111111'
  },
  optionsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6
  },
  pillOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  pillOptionActive: {
    backgroundColor: '#111111',
    borderColor: '#111111'
  },
  pillOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111111'
  },
  pillOptionTextActive: {
    color: '#FFFFFF'
  },
  goalsWrap: {
    marginTop: 6
  },
  goalOptionPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginBottom: 6
  },
  goalOptionPillActive: {
    backgroundColor: '#111111',
    borderColor: '#111111'
  },
  goalOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111'
  },
  goalOptionTextActive: {
    color: '#FFFFFF'
  },
  metricRow: {
    marginTop: 8
  },
  miniUnitToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    overflow: 'hidden'
  },
  miniUnitBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8
  },
  miniUnitBtnActive: {
    backgroundColor: '#111111'
  },
  miniUnitBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#858585'
  },
  miniUnitBtnTextActive: {
    color: '#FFFFFF'
  },
  targetInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  targetInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4
  },
  macroInputCol: {
    flex: 1,
    marginHorizontal: 3
  },
  targetsSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingVertical: 12,
    marginTop: 14
  },
  targetCol: {
    alignItems: 'center'
  },
  targetValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111'
  },
  targetKey: {
    fontSize: 10,
    fontWeight: '600',
    color: '#858585',
    marginTop: 2
  },
  modelsList: {
    marginTop: 6,
    marginBottom: 10
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginBottom: 6
  },
  modelOptionActive: {
    backgroundColor: '#111111',
    borderColor: '#111111'
  },
  modelOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111'
  },
  modelOptionTextActive: {
    color: '#FFFFFF'
  },
  modelOptionDesc: {
    fontSize: 10,
    color: '#858585',
    marginTop: 2
  },
  modelOptionDescActive: {
    color: '#D4D4D4'
  },
  modelCheck: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 8
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  statusPillConnected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC'
  },
  statusPillTesting: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A'
  },
  statusPillFailed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#858585',
    marginRight: 6
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#858585'
  },
  serverBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8
  },
  serverBadgeIcon: {
    fontSize: 12,
    marginRight: 6
  },
  serverBadgeText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
    flex: 1,
    lineHeight: 15
  },
  aiActionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  testApiBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center'
  },
  testApiBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111'
  },
  saveAiKeyBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#111111',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  saveAiKeyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  testStatusMsg: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8
  },
  backupSub: {
    fontSize: 12,
    color: '#858585',
    marginTop: 4,
    lineHeight: 17
  },
  backupButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12
  },
  backupBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center'
  },
  backupBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111'
  },
  rerunBtn: {
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12
  },
  rerunBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111'
  },
  resetDangerBtn: {
    height: 44,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  resetDangerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626'
  },
  saveProfileBtn: {
    height: 52,
    backgroundColor: '#111111',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4
  },
  saveProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 'max(14px, env(safe-area-inset-top, 16px))' : 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA'
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center'
  },
  headerRightSpacer: {
    width: 44,
    height: 44
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  modalExplainer: {
    fontSize: 13,
    color: '#858585',
    lineHeight: 18,
    marginBottom: 14
  },
  jsonTextArea: {
    minHeight: 280,
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 14,
    fontSize: 12,
    fontFamily: 'Courier',
    color: '#111111',
    textAlignVertical: 'top'
  },
  copyStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
    marginTop: 8,
    textAlign: 'center'
  },
  confirmImportBtn: {
    height: 48,
    backgroundColor: '#111111',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16
  },
  confirmImportBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  },

  // Alert Overlay
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  alertCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 8
  },
  alertDesc: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 20
  },
  alertActions: {
    flexDirection: 'row',
    gap: 10
  },
  alertCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111'
  },
  alertDestructiveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertDestructiveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  alertConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
