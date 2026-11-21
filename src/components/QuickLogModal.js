// Cal AI Minimalist Natural Language Quick Log Modal
// Gemini 3.5 Flash-Lite Natural Language Processing + Pre-save Portion Adjustments & Duplicate Protection.

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { analyzeMealText } from '../services/aiService';
import { formatDateHuman } from '../services/dateService';
import { CrossIcon, TrashIcon } from './Icons';

const POPULAR_MEALS = [
  '2 boiled eggs and 2 slices of bread',
  '100g chicken biryani',
  '2 besan chillas',
  '1 grilled chicken breast with 1 cup brown rice',
  '1 medium apple and 20g almonds'
];

const VAGUE_TERMS = ['food', 'lunch', 'dinner', 'breakfast', 'meal', 'meals', 'snack', 'snacks', 'eat', 'eating', 'something', 'stuff'];

export default function QuickLogModal({
  visible = false,
  onClose,
  onAddMealItems,
  defaultMealType = 'breakfast',
  aiConfig,
  targetDate
}) {
  const [query, setQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState(defaultMealType);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [editableItems, setEditableItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { key: 'lunch', label: 'Lunch', icon: '🥗' },
    { key: 'dinner', label: 'Dinner', icon: '🥩' },
    { key: 'snacks', label: 'Snacks', icon: '🍎' }
  ];

  const handleAnalyze = async (textToRun) => {
    const text = (textToRun || query).trim();
    if (!text) return;

    // Vague Query Validation
    const words = text.toLowerCase().split(/\s+/);
    if (text.length < 3 || (words.length === 1 && VAGUE_TERMS.includes(words[0]))) {
      setErrorMsg("Please specify the exact food item and portion (e.g. '2 boiled eggs and 1 slice toast' or '1 cup rice and dal').");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    setLoading(true);
    setErrorMsg('');
    setParsedResult(null);
    setEditableItems([]);

    try {
      const res = await analyzeMealText(text, aiConfig?.apiKey, aiConfig?.activeModel);
      setParsedResult(res);
      setEditableItems(res.items || []);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    } catch (err) {
      setErrorMsg(err.message || 'Failed to analyze meal.');
    } finally {
      setLoading(false);
    }
  };

  // Adjust grams & macro scaling before saving
  const handleUpdateItemGrams = (idx, newGramsStr) => {
    const newGrams = parseFloat(newGramsStr) || 0;
    const updated = [...editableItems];
    const item = updated[idx];
    const prevGrams = item.grams || 100;
    const ratio = prevGrams > 0 && newGrams > 0 ? newGrams / prevGrams : 1;

    updated[idx] = {
      ...item,
      grams: newGrams,
      portion: `${newGrams}g`,
      calories: Math.round(item.calories * ratio),
      protein: Math.round(item.protein * ratio * 10) / 10,
      carbs: Math.round(item.carbs * ratio * 10) / 10,
      fat: Math.round(item.fat * ratio * 10) / 10,
      fiber: Math.round((item.fiber || 0) * ratio * 10) / 10,
      sugar: Math.round((item.sugar || 0) * ratio * 10) / 10
    };
    setEditableItems(updated);
  };

  const handleDeleteItem = (idx) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    const updated = editableItems.filter((_, i) => i !== idx);
    setEditableItems(updated);
  };

  // Confirm and Add to Diary with Double-Tap Protection
  const handleConfirmAdd = () => {
    if (isSubmitting || editableItems.length === 0) return;
    setIsSubmitting(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    if (onAddMealItems) {
      onAddMealItems(selectedMealType, editableItems, targetDate);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      handleClose();
    }, 200);
  };

  const handleClose = () => {
    setQuery('');
    setParsedResult(null);
    setEditableItems([]);
    setErrorMsg('');
    setLoading(false);
    setIsSubmitting(false);
    if (onClose) onClose();
  };

  // Live computed totals from editable items
  const totalCals = editableItems.reduce((acc, i) => acc + (Number(i.calories) || 0), 0);
  const totalProtein = editableItems.reduce((acc, i) => acc + (Number(i.protein) || 0), 0);
  const totalCarbs = editableItems.reduce((acc, i) => acc + (Number(i.carbs) || 0), 0);
  const totalFat = editableItems.reduce((acc, i) => acc + (Number(i.fat) || 0), 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <CrossIcon size={20} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>AI Quick Log</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Target Date Pill */}
          {targetDate ? (
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>
                LOGGING FOR: {formatDateHuman(targetDate).toUpperCase()}
              </Text>
            </View>
          ) : null}

          {/* Target Meal Selector */}
          <Text style={styles.sectionLabel}>TARGET MEAL</Text>
          <View style={styles.mealSelectorRow}>
            {mealTypes.map((m) => {
              const active = selectedMealType === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.mealPill,
                    active && styles.mealPillActive
                  ]}
                  onPress={() => setSelectedMealType(m.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mealPillIcon}>{m.icon}</Text>
                  <Text
                    style={[
                      styles.mealPillLabel,
                      active && styles.mealPillLabelActive
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description Input Card */}
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 2 boiled eggs and 2 slices of whole wheat bread"
              placeholderTextColor="#858585"
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                if (errorMsg) setErrorMsg('');
              }}
              multiline
              numberOfLines={3}
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[
                styles.quantifyBtn,
                (!query.trim() || loading) && { opacity: 0.6 }
              ]}
              onPress={() => handleAnalyze()}
              disabled={!query.trim() || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.quantifyBtnText}>Quantify with AI ⚡</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Popular Samples */}
          {!parsedResult && !loading && (
            <View style={styles.samplesContainer}>
              <Text style={styles.sectionLabel}>POPULAR SAMPLES</Text>
              <View style={styles.samplesWrap}>
                {POPULAR_MEALS.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.sampleChip}
                    onPress={() => {
                      setQuery(item);
                      handleAnalyze(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sampleChipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Error Box */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Analysis Results Display */}
          {editableItems.length > 0 && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle}>
                    {parsedResult?.meal_name || 'Analyzed Meal'}
                  </Text>
                  <Text style={styles.resultMacros}>
                    {Math.round(totalProtein)}g Protein • {Math.round(totalCarbs)}g Carbs • {Math.round(totalFat)}g Fat
                  </Text>
                </View>

                <View style={styles.resultCalBadge}>
                  <Text style={styles.resultCalNumber}>
                    {totalCals}{' '}
                    <Text style={styles.resultCalUnit}>kcal</Text>
                  </Text>
                </View>
              </View>

              <Text style={styles.editHintLabel}>
                DETECTED FOOD ITEMS (TAP GRAMS TO EDIT):
              </Text>

              <View style={styles.itemsList}>
                {editableItems.map((item, idx) => (
                  <View key={item.id || idx} style={styles.itemRow}>
                    <Text style={styles.itemEmoji}>{item.icon || '🍽️'}</Text>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View style={styles.gramsInputRow}>
                        <TextInput
                          style={styles.gramsInput}
                          keyboardType="numeric"
                          value={String(item.grams || '')}
                          onChangeText={(v) => handleUpdateItemGrams(idx, v)}
                        />
                        <Text style={styles.gramsSuffix}>g ({item.portion || ''})</Text>
                      </View>
                    </View>
                    <View style={styles.itemCalsCol}>
                      <Text style={styles.itemCalText}>
                        {item.calories} <Text style={{ fontSize: 10, color: '#858585' }}>kcal</Text>
                      </Text>
                      <Text style={styles.itemMacroText}>
                        {item.protein}p • {item.carbs}c • {item.fat}f
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(idx)}
                      style={styles.deleteItemBtn}
                    >
                      <TrashIcon size={16} color="#858585" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <Text style={styles.disclaimerText}>
                Estimates based on USDA reference standards. Tap grams to adjust portions before saving.
              </Text>

              {/* Save Button with Debounce Protection */}
              <TouchableOpacity
                style={[styles.saveBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleConfirmAdd}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    Save to {mealTypes.find(m => m.key === selectedMealType)?.label || 'Diary'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA'
  },
  closeBtn: {
    padding: 6
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111'
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  dateBadge: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: 0.5
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#858585',
    letterSpacing: 1,
    marginBottom: 8
  },
  mealSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  mealPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginHorizontal: 3
  },
  mealPillActive: {
    backgroundColor: '#111111',
    borderColor: '#111111'
  },
  mealPillIcon: {
    fontSize: 16,
    marginBottom: 2
  },
  mealPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#858585'
  },
  mealPillLabelActive: {
    color: '#FFFFFF'
  },
  inputCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    marginBottom: 16
  },
  textInput: {
    minHeight: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 12,
    fontSize: 14,
    color: '#111111',
    textAlignVertical: 'top',
    marginBottom: 12
  },
  quantifyBtn: {
    height: 46,
    backgroundColor: '#111111',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  quantifyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  samplesContainer: {
    marginBottom: 16
  },
  samplesWrap: {
    gap: 8
  },
  sampleChip: {
    backgroundColor: '#F6F6F6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  sampleChipText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500'
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    lineHeight: 16
  },
  resultsContainer: {
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    marginBottom: 16
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA'
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111'
  },
  resultMacros: {
    fontSize: 12,
    color: '#858585',
    marginTop: 2
  },
  resultCalBadge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  resultCalNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111111'
  },
  resultCalUnit: {
    fontSize: 10,
    color: '#858585',
    fontWeight: '600'
  },
  editHintLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#858585',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8
  },
  itemsList: {
    gap: 8
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  itemEmoji: {
    fontSize: 20,
    marginRight: 10
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111'
  },
  gramsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3
  },
  gramsInput: {
    height: 26,
    width: 48,
    backgroundColor: '#F6F6F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
    padding: 0
  },
  gramsSuffix: {
    fontSize: 11,
    color: '#858585',
    marginLeft: 6
  },
  itemCalsCol: {
    alignItems: 'flex-end',
    marginRight: 8
  },
  itemCalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111'
  },
  itemMacroText: {
    fontSize: 10,
    color: '#858585',
    marginTop: 2
  },
  deleteItemBtn: {
    padding: 6
  },
  disclaimerText: {
    fontSize: 10,
    color: '#858585',
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 14
  },
  saveBtn: {
    height: 48,
    backgroundColor: '#111111',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
