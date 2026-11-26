// Cal AI Minimalist Food Scanner Modal
// Gemini 3.5 Flash-Lite Multimodal Vision, camera & gallery picker, pre-save portion editing, solid black save button.

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  StyleSheet,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { analyzeFoodImage } from '../services/aiService';
import { formatDateHuman } from '../services/dateService';
import {
  CameraIcon,
  ScanReticleIcon,
  CrossIcon,
  TrashIcon
} from './Icons';

export default function ScanModal({
  visible = false,
  onClose,
  onAddMealItems,
  defaultMealType = 'lunch',
  aiConfig,
  targetDate
}) {
  const [imageUri, setImageUri] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(defaultMealType);
  const [scanning, setScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [editableItems, setEditableItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultMealType) {
      setSelectedMealType(defaultMealType);
    }
  }, [defaultMealType, visible]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemGrams, setNewItemGrams] = useState('100');
  const [newItemCals, setNewItemCals] = useState('150');
  const [newItemProtein, setNewItemProtein] = useState('8');
  const [newItemCarbs, setNewItemCarbs] = useState('15');
  const [newItemFat, setNewItemFat] = useState('4');

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { key: 'lunch', label: 'Lunch', icon: '🥗' },
    { key: 'dinner', label: 'Dinner', icon: '🥩' },
    { key: 'snacks', label: 'Snacks', icon: '🍎' }
  ];

  const pickImage = async (useCamera = false) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    setErrorMsg('');
    setAnalysisResult(null);
    setEditableItems([]);

    // Web & PWA Camera / Gallery Fallback
    if (Platform.OS === 'web') {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (useCamera) {
          input.setAttribute('capture', 'environment');
        }
        input.onchange = (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result;
            setImageUri(dataUrl);
            const b64 = typeof dataUrl === 'string' ? dataUrl.split(',')[1] : '';
            const mime = file.type || 'image/jpeg';
            runVisionAnalysis(b64, mime);
          };
          reader.onerror = () => {
            setErrorMsg('Failed to read selected image.');
          };
          reader.readAsDataURL(file);
        };
        input.click();
      } catch (err) {
        setErrorMsg('Web image selection failed: ' + (err.message || 'unknown error'));
      }
      return;
    }

    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission Required', 'Please enable camera access in iOS Settings to scan meals.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.75,
        base64: true
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Photo Access Required', 'Please enable photo library access in iOS Settings.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.75,
        base64: true
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      runVisionAnalysis(asset.base64, asset.mimeType || 'image/jpeg');
    }
  };

  const runVisionAnalysis = async (b64, mime) => {
    setScanning(true);
    setErrorMsg('');
    try {
      const res = await analyzeFoodImage(
        b64,
        mime || 'image/jpeg',
        aiConfig?.apiKey,
        aiConfig?.activeModel
      );
      setAnalysisResult(res);
      setEditableItems(res.items || []);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    } catch (err) {
      setErrorMsg(err.message || 'Could not analyze food image. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  // Allow editing grams before saving
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

  const handleAddNewItem = () => {
    if (!newItemName.trim()) return;
    const item = {
      id: 'scan_manual_' + Date.now(),
      name: newItemName.trim(),
      portion: `${parseFloat(newItemGrams) || 100}g`,
      grams: parseFloat(newItemGrams) || 100,
      calories: parseInt(newItemCals, 10) || 0,
      protein: parseFloat(newItemProtein) || 0,
      carbs: parseFloat(newItemCarbs) || 0,
      fat: parseFloat(newItemFat) || 0,
      fiber: 2,
      sugar: 1,
      icon: '🍽️'
    };
    setEditableItems([...editableItems, item]);
    setNewItemName('');
    setShowAddItem(false);
  };

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
    setImageUri(null);
    setAnalysisResult(null);
    setEditableItems([]);
    setErrorMsg('');
    setScanning(false);
    setIsSubmitting(false);
    setShowAddItem(false);
    if (onClose) onClose();
  };

  // Recomputed totals
  const totalCals = editableItems.reduce((acc, i) => acc + (Number(i.calories) || 0), 0);
  const totalProtein = editableItems.reduce((acc, i) => acc + (Number(i.protein) || 0), 0);
  const totalCarbs = editableItems.reduce((acc, i) => acc + (Number(i.carbs) || 0), 0);
  const totalFat = editableItems.reduce((acc, i) => acc + (Number(i.fat) || 0), 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header with Safe Area Inset */}
        <View style={styles.modalHeaderWrapper}>
          <View style={styles.headerBar}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close Scan Modal"
            >
              <CrossIcon size={20} color="#111111" strokeWidth={2.4} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Scan Meal</Text>
            <View style={styles.headerRightSpacer} />
          </View>
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

          {/* Viewfinder Card */}
          {!imageUri ? (
            <View style={styles.viewfinderCard}>
              <View style={styles.reticleHolder}>
                <ScanReticleIcon size={110} color="#111111" strokeWidth={2.4} />
              </View>

              <Text style={styles.viewfinderTitle}>Position food plate in frame</Text>
              <Text style={styles.viewfinderSub}>
                Gemini Multimodal Vision will identify every food item and calculate exact calories and macros.
              </Text>

              {/* Action Buttons: Solid Black Primary + Clean Secondary */}
              <TouchableOpacity
                style={styles.primaryCaptureBtn}
                onPress={() => pickImage(true)}
                activeOpacity={0.85}
              >
                <CameraIcon size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.primaryCaptureText}>Take Food Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.galleryCaptureBtn}
                onPress={() => pickImage(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.galleryCaptureText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Selected Photo Preview & Scanning */
            <View style={styles.analysisContainer}>
              <View style={styles.photoWrapper}>
                <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
                {scanning && (
                  <View style={styles.scanningOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.scanningText}>Analyzing food with Gemini Vision...</Text>
                  </View>
                )}
              </View>

              {!scanning && (
                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={() => {
                    setImageUri(null);
                    setAnalysisResult(null);
                    setEditableItems([]);
                  }}
                >
                  <Text style={styles.retakeText}>↺ Retake or choose another photo</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Error Message */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Analysis Results Breakdown */}
          {editableItems.length > 0 && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detectedMealTitle}>
                    {analysisResult?.meal_name || 'Detected Meal'}
                  </Text>
                  <Text style={styles.detectedMealSub}>
                    {Math.round(totalProtein)}g Protein • {Math.round(totalCarbs)}g Carbs • {Math.round(totalFat)}g Fat
                  </Text>
                </View>

                <View style={styles.totalCalsBadge}>
                  <Text style={styles.totalCalsNumber}>
                    {totalCals} <Text style={styles.totalCalsUnit}>kcal</Text>
                  </Text>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
                DETECTED ITEMS (TAP GRAMS TO EDIT):
              </Text>

              {editableItems.map((item, idx) => (
                <View key={item.id || idx} style={styles.itemRow}>
                  <Text style={styles.itemEmoji}>{item.icon || '🍽️'}</Text>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.gramsRow}>
                      <TextInput
                        style={styles.gramsInput}
                        keyboardType="numeric"
                        defaultValue={String(item.grams || 100)}
                        onEndEditing={(e) => handleUpdateItemGrams(idx, e.nativeEvent.text)}
                      />
                      <Text style={styles.gramsUnit}>grams</Text>
                    </View>
                  </View>

                  <View style={styles.itemCalsCol}>
                    <Text style={styles.itemCalText}>
                      {item.calories} <Text style={{ fontSize: 10, color: '#858585' }}>kcal</Text>
                    </Text>
                    <Text style={styles.itemMacroText}>
                      {Math.round(item.protein)}p • {Math.round(item.carbs)}c • {Math.round(item.fat)}f
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteItem(idx)}
                    style={styles.deleteItemBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <TrashIcon size={16} color="#858585" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Custom Item Button & Form */}
              {showAddItem ? (
                <View style={styles.addItemFormCard}>
                  <Text style={styles.addItemFormTitle}>Add Missing Food Item</Text>
                  <TextInput
                    style={styles.addItemInput}
                    placeholder="Food name (e.g. Avocado)"
                    placeholderTextColor="#858585"
                    value={newItemName}
                    onChangeText={setNewItemName}
                  />
                  <View style={styles.addMiniRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.miniInputLabel}>Grams</Text>
                      <TextInput
                        style={styles.miniInput}
                        keyboardType="numeric"
                        value={newItemGrams}
                        onChangeText={setNewItemGrams}
                      />
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 6 }}>
                      <Text style={styles.miniInputLabel}>Calories</Text>
                      <TextInput
                        style={styles.miniInput}
                        keyboardType="numeric"
                        value={newItemCals}
                        onChangeText={setNewItemCals}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.miniInputLabel}>Protein (g)</Text>
                      <TextInput
                        style={styles.miniInput}
                        keyboardType="numeric"
                        value={newItemProtein}
                        onChangeText={setNewItemProtein}
                      />
                    </View>
                  </View>
                  <View style={styles.addItemBtnRow}>
                    <TouchableOpacity
                      style={styles.cancelAddItemBtn}
                      onPress={() => setShowAddItem(false)}
                    >
                      <Text style={styles.cancelAddItemText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmAddItemBtn}
                      onPress={handleAddNewItem}
                    >
                      <Text style={styles.confirmAddItemText}>Add to List</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addItemTriggerBtn}
                  onPress={() => setShowAddItem(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addItemTriggerText}>+ Add Item Missed by Vision</Text>
                </TouchableOpacity>
              )}

              {/* Disclaimer */}
              <Text style={styles.disclaimerText}>
                Estimates based on USDA reference standards. Tap grams to adjust portions before saving.
              </Text>

              {/* Prominent Solid Black Save Button with Double-Tap Protection */}
              <TouchableOpacity
                style={[styles.saveMealButton, isSubmitting && { opacity: 0.6 }]}
                onPress={handleConfirmAdd}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveMealButtonText}>
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
  modalHeaderWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    paddingTop: Platform.OS === 'web' ? 'max(14px, env(safe-area-inset-top, 16px))' : 14,
    paddingHorizontal: 16
  },
  headerBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center'
  },
  headerRightSpacer: {
    width: 44,
    height: 44
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 3,
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  mealPillActive: {
    backgroundColor: '#111111',
    borderColor: '#111111'
  },
  mealPillIcon: {
    fontSize: 13,
    marginRight: 4
  },
  mealPillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111111'
  },
  mealPillLabelActive: {
    color: '#FFFFFF'
  },
  viewfinderCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16
  },
  reticleHolder: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18
  },
  viewfinderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4
  },
  viewfinderSub: {
    fontSize: 12,
    color: '#858585',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 24
  },
  primaryCaptureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52,
    backgroundColor: '#111111',
    borderRadius: 16,
    marginBottom: 10
  },
  primaryCaptureText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8
  },
  galleryCaptureBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  galleryCaptureText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '600'
  },
  analysisContainer: {
    marginBottom: 14
  },
  photoWrapper: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000'
  },
  photo: {
    width: '100%',
    height: '100%'
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  scanningText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12
  },
  retakeBtn: {
    paddingVertical: 10,
    alignItems: 'center'
  },
  retakeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#858585'
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626'
  },
  resultsContainer: {
    marginTop: 4
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  detectedMealTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111111'
  },
  detectedMealSub: {
    fontSize: 12,
    color: '#858585',
    marginTop: 2
  },
  totalCalsBadge: {
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  totalCalsNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111111'
  },
  totalCalsUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#858585'
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 12,
    marginBottom: 8
  },
  itemEmoji: {
    fontSize: 22,
    marginRight: 10
  },
  itemInfo: {
    flex: 1,
    marginRight: 8
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111'
  },
  gramsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3
  },
  gramsInput: {
    width: 54,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center'
  },
  gramsUnit: {
    fontSize: 11,
    color: '#858585',
    marginLeft: 5
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
    padding: 4
  },
  saveMealButton: {
    height: 52,
    backgroundColor: '#111111',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14
  },
  saveMealButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  addItemTriggerBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#FFFFFF'
  },
  addItemTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111'
  },
  addItemFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 12,
    marginTop: 8
  },
  addItemFormTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8
  },
  addItemInput: {
    height: 38,
    backgroundColor: '#F6F6F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#111111',
    marginBottom: 8
  },
  addMiniRow: {
    flexDirection: 'row',
    marginBottom: 10
  },
  miniInputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#858585',
    marginBottom: 3
  },
  miniInput: {
    height: 34,
    backgroundColor: '#F6F6F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center'
  },
  addItemBtnRow: {
    flexDirection: 'row',
    gap: 8
  },
  cancelAddItemBtn: {
    flex: 1,
    height: 36,
    backgroundColor: '#F6F6F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelAddItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#858585'
  },
  confirmAddItemBtn: {
    flex: 1,
    height: 36,
    backgroundColor: '#111111',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  confirmAddItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  disclaimerText: {
    fontSize: 10,
    color: '#858585',
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 14
  }
});
