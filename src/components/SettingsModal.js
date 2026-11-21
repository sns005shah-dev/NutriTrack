// Settings & Personalization Modal
// Profile BMR/TDEE goals, Gemini AI key & model configuration, theme switch, backup export/import.

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { VERIFIED_MODELS, PRIMARY_MODEL } from '../services/aiService';
import { calculateRecommendedTargets } from '../services/nutritionCalculator';
import { StorageService } from '../services/storageService';

export default function SettingsModal({
  visible = false,
  onClose,
  userProfile = {},
  onSaveProfile,
  aiConfig = {},
  onSaveAiConfig,
  currentThemeMode = 'dark',
  onToggleTheme,
  theme
}) {
  const [profile, setProfile] = useState({ ...userProfile });
  const [apiKey, setApiKey] = useState(aiConfig?.apiKey || '');
  const [model, setModel] = useState(aiConfig?.activeModel || PRIMARY_MODEL);
  const [testingAi, setTestingAi] = useState(false);
  const [testStatus, setTestStatus] = useState('');

  const handleTestApi = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    setTestingAi(true);
    setTestStatus('');

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey.trim()
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ping nutrition API. Respond with {"status":"ok"}' }] }],
          generationConfig: { response_mime_type: 'application/json' }
        })
      });

      if (res.ok) {
        setTestStatus('SUCCESS: HTTP 200 — Gemini connection verified! ⚡');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
      } else {
        const text = await res.text();
        setTestStatus(`ERROR: HTTP ${res.status} — ${text.substring(0, 100)}`);
      }
    } catch (err) {
      setTestStatus(`CONNECTION FAILED: ${err.message}`);
    } finally {
      setTestingAi(false);
    }
  };

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
      ...targets
    };
    setProfile(updated);
    Alert.alert(
      'Goals Recalculated',
      `Based on Mifflin-St Jeor formula:\n• Calories: ${targets.calorieTarget} kcal\n• Protein: ${targets.proteinTarget}g\n• Carbs: ${targets.carbsTarget}g\n• Fat: ${targets.fatTarget}g\n• Water: ${targets.waterTargetMl}ml`
    );
  };

  const handleSaveAll = () => {
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
    if (onClose) onClose();
  };

  const handleExportData = async () => {
    try {
      const dataStr = await StorageService.exportAllData();
      Alert.alert('Data Backup Ready', `Exported ${dataStr.length} characters of diary logs & settings.`);
    } catch (e) {
      Alert.alert('Export Failed', e.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Settings & Goals</Text>
              <Text style={[styles.sheetSubtitle, { color: theme.textMuted }]}>
                Calorie targets, Gemini AI configuration & backup
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Theme Toggle */}
            <View style={[styles.sectionCard, { backgroundColor: theme.cardSecondary, borderColor: theme.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
              <View style={styles.toggleRow}>
                <Text style={[styles.label, { color: theme.text }]}>Theme Mode</Text>
                <TouchableOpacity
                  style={[styles.themeBtn, { backgroundColor: theme.card }]}
                  onPress={onToggleTheme}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.themeBtnText, { color: theme.calorie }]}>
                    {currentThemeMode === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Profile & Nutrition Goals */}
            <View style={[styles.sectionCard, { backgroundColor: theme.cardSecondary, borderColor: theme.cardBorder }]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Stats & Goals</Text>
                <TouchableOpacity onPress={handleRecalculateGoals}>
                  <Text style={[styles.recalcLink, { color: theme.calorie }]}>⚡ Auto-Calc</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Weight (kg)</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.cardBorder }]}
                    keyboardType="numeric"
                    value={String(profile.weightKg || '')}
                    onChangeText={v => setProfile({ ...profile, weightKg: parseFloat(v) || 0 })}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Height (cm)</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.cardBorder }]}
                    keyboardType="numeric"
                    value={String(profile.heightCm || '')}
                    onChangeText={v => setProfile({ ...profile, heightCm: parseFloat(v) || 0 })}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Age</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.cardBorder }]}
                    keyboardType="numeric"
                    value={String(profile.age || '')}
                    onChangeText={v => setProfile({ ...profile, age: parseInt(v, 10) || 0 })}
                  />
                </View>
              </View>

              {/* Goal Selector */}
              <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 10 }]}>Fitness Goal</Text>
              <View style={styles.goalRow}>
                {[
                  { key: 'lose', label: 'Fat Loss (-500 kcal)' },
                  { key: 'maintain', label: 'Maintain' },
                  { key: 'gain', label: 'Muscle Gain (+400)' }
                ].map(g => (
                  <TouchableOpacity
                    key={g.key}
                    style={[
                      styles.goalBtn,
                      {
                        backgroundColor: profile.goal === g.key ? theme.calorieLight : theme.card,
                        borderColor: profile.goal === g.key ? theme.calorie : 'transparent'
                      }
                    ]}
                    onPress={() => setProfile({ ...profile, goal: g.key })}
                  >
                    <Text
                      style={[
                        styles.goalBtnText,
                        { color: profile.goal === g.key ? theme.calorie : theme.textMuted }
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Daily Targets Output */}
              <View style={styles.targetGrid}>
                <View style={styles.targetItem}>
                  <Text style={[styles.targetVal, { color: theme.calorie }]}>{profile.calorieTarget} kcal</Text>
                  <Text style={[styles.targetKey, { color: theme.textMuted }]}>Calories</Text>
                </View>
                <View style={styles.targetItem}>
                  <Text style={[styles.targetVal, { color: theme.protein }]}>{profile.proteinTarget}g</Text>
                  <Text style={[styles.targetKey, { color: theme.textMuted }]}>Protein</Text>
                </View>
                <View style={styles.targetItem}>
                  <Text style={[styles.targetVal, { color: theme.carbs }]}>{profile.carbsTarget}g</Text>
                  <Text style={[styles.targetKey, { color: theme.textMuted }]}>Carbs</Text>
                </View>
                <View style={styles.targetItem}>
                  <Text style={[styles.targetVal, { color: theme.fat }]}>{profile.fatTarget}g</Text>
                  <Text style={[styles.targetKey, { color: theme.textMuted }]}>Fat</Text>
                </View>
              </View>
            </View>

            {/* Gemini AI Integration */}
            <View style={[styles.sectionCard, { backgroundColor: theme.cardSecondary, borderColor: theme.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Google Gemini AI Engine</Text>

              <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 8 }]}>Gemini API Key</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.cardBorder }]}
                secureTextEntry
                placeholder="AQ..."
                placeholderTextColor={theme.textMuted}
                value={apiKey}
                onChangeText={setApiKey}
              />

              <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 10 }]}>Active Model</Text>
              <View style={styles.modelList}>
                {VERIFIED_MODELS.map(m => {
                  const active = model === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.modelChip,
                        {
                          backgroundColor: active ? theme.calorieLight : theme.card,
                          borderColor: active ? theme.calorie : 'transparent'
                        }
                      ]}
                      onPress={() => setModel(m)}
                    >
                      <Text
                        style={[
                          styles.modelChipText,
                          { color: active ? theme.calorie : theme.textMuted, fontWeight: active ? '700' : '500' }
                        ]}
                      >
                        {m} {m === PRIMARY_MODEL ? '⚡ (Fastest)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.testBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={handleTestApi}
                disabled={testingAi}
              >
                {testingAi ? (
                  <ActivityIndicator color={theme.calorie} />
                ) : (
                  <Text style={[styles.testBtnText, { color: theme.text }]}>⚡ Test API Connection</Text>
                )}
              </TouchableOpacity>

              {testStatus ? (
                <Text
                  style={[
                    styles.testStatusText,
                    { color: testStatus.includes('SUCCESS') ? theme.success : theme.danger }
                  ]}
                >
                  {testStatus}
                </Text>
              ) : null}
            </View>

            {/* Data Backup & Export */}
            <View style={[styles.sectionCard, { backgroundColor: theme.cardSecondary, borderColor: theme.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Backup & Privacy</Text>
              <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 4 }]}>
                All food logs, custom foods, and settings are preserved offline on your device.
              </Text>
              <TouchableOpacity
                style={[styles.exportBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={handleExportData}
              >
                <Text style={[styles.exportBtnText, { color: theme.text }]}>📦 Export JSON Backup</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveAllBtn, { backgroundColor: theme.calorie }]}
            onPress={handleSaveAll}
            activeOpacity={0.8}
          >
            <Text style={styles.saveAllBtnText}>Save Settings ✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    maxHeight: '92%'
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800'
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '600'
  },
  scrollContent: {
    maxHeight: 500
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700'
  },
  recalcLink: {
    fontSize: 12,
    fontWeight: '700'
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  label: {
    fontSize: 14,
    fontWeight: '500'
  },
  themeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  themeBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  formCol: {
    flex: 1,
    marginHorizontal: 3
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13
  },
  goalRow: {
    marginTop: 6
  },
  goalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6
  },
  goalBtnText: {
    fontSize: 12,
    fontWeight: '600'
  },
  targetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)'
  },
  targetItem: {
    alignItems: 'center'
  },
  targetVal: {
    fontSize: 14,
    fontWeight: '700'
  },
  targetKey: {
    fontSize: 10,
    marginTop: 2
  },
  modelList: {
    marginTop: 6,
    marginBottom: 10
  },
  modelChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6
  },
  modelChipText: {
    fontSize: 12
  },
  testBtn: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  testStatusText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8
  },
  exportBtn: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  saveAllBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12
  },
  saveAllBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800'
  }
});
