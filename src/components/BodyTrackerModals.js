// Body Tracker Modals for Cal AI Monochrome Insights
// Weight Logging, Body Measurements, Body Composition, and Height Update Modals.

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet
} from 'react-native';
import * as Haptics from 'expo-haptics';

import {
  kgToLbs,
  lbsToKg,
  cmToIn,
  inToCm
} from '../services/nutritionCalculator';
import { getTodayDateString } from '../services/storageService';
import { CrossIcon, TrashIcon } from './Icons';

// --- 1. LOG WEIGHT MODAL ---
export function LogWeightModal({
  visible = false,
  onClose,
  onSaveWeight,
  onDeleteWeight,
  editingEntry = null,
  weightUnit = 'kg'
}) {
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(getTodayDateString(0));
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    if (editingEntry) {
      const displayVal = weightUnit === 'lbs' ? kgToLbs(editingEntry.weightKg) : editingEntry.weightKg;
      setWeightInput(String(displayVal));
      setDateInput(editingEntry.date || getTodayDateString(0));
      setNoteInput(editingEntry.note || '');
    } else {
      setWeightInput('');
      setDateInput(getTodayDateString(0));
      setNoteInput('');
    }
  }, [editingEntry, visible, weightUnit]);

  const handleSave = () => {
    const val = parseFloat(weightInput);
    if (!val || val <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight number.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    const weightKg = weightUnit === 'lbs' ? lbsToKg(val) : Math.round(val * 10) / 10;

    const entry = {
      id: editingEntry ? editingEntry.id : 'w_' + Date.now(),
      date: dateInput.trim() || getTodayDateString(0),
      weightKg,
      note: noteInput.trim()
    };

    if (onSaveWeight) onSaveWeight(entry);
    onClose();
  };

  const handleDelete = () => {
    if (!editingEntry) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    if (onDeleteWeight) onDeleteWeight(editingEntry.id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <CrossIcon size={20} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{editingEntry ? 'Edit Weight Entry' : 'Log Weight'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.contentArea} contentContainerStyle={styles.contentWrap}>
          <Text style={styles.fieldLabel}>WEIGHT ({weightUnit.toUpperCase()})</Text>
          <TextInput
            style={styles.largeInput}
            keyboardType="decimal-pad"
            placeholder={weightUnit === 'lbs' ? '160.0' : '72.5'}
            placeholderTextColor="#858585"
            value={weightInput}
            onChangeText={setWeightInput}
            autoFocus
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>DATE (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#858585"
            value={dateInput}
            onChangeText={setDateInput}
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>NOTE (OPTIONAL)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Morning fasted, post-workout"
            placeholderTextColor="#858585"
            value={noteInput}
            onChangeText={setNoteInput}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Save Weight Entry</Text>
          </TouchableOpacity>

          {editingEntry && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
              <TrashIcon size={16} color="#DC2626" />
              <Text style={styles.deleteButtonText}>Delete This Entry</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// --- 2. LOG MEASUREMENTS MODAL ---
export function LogMeasurementsModal({
  visible = false,
  onClose,
  onSaveMeasurements,
  measurementUnit = 'cm',
  latestValues = {}
}) {
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [leftArm, setLeftArm] = useState('');
  const [rightArm, setRightArm] = useState('');
  const [thighs, setThighs] = useState('');
  const [neck, setNeck] = useState('');
  const [calves, setCalves] = useState('');
  const [date, setDate] = useState(getTodayDateString(0));

  useEffect(() => {
    if (visible) {
      setDate(getTodayDateString(0));
      const cvt = (v) => (v ? String(measurementUnit === 'in' ? cmToIn(v) : v) : '');
      setChest(cvt(latestValues.chest));
      setWaist(cvt(latestValues.waist));
      setHips(cvt(latestValues.hips));
      setLeftArm(cvt(latestValues.leftArm));
      setRightArm(cvt(latestValues.rightArm));
      setThighs(cvt(latestValues.thighs));
      setNeck(cvt(latestValues.neck));
      setCalves(cvt(latestValues.calves));
    }
  }, [visible, latestValues, measurementUnit]);

  const handleSave = () => {
    const parse = (str) => {
      const v = parseFloat(str) || 0;
      if (v <= 0) return 0;
      return measurementUnit === 'in' ? inToCm(v) : Math.round(v * 10) / 10;
    };

    const entry = {
      id: 'm_' + Date.now(),
      date: date.trim() || getTodayDateString(0),
      chest: parse(chest),
      waist: parse(waist),
      hips: parse(hips),
      leftArm: parse(leftArm),
      rightArm: parse(rightArm),
      thighs: parse(thighs),
      neck: parse(neck),
      calves: parse(calves)
    };

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    if (onSaveMeasurements) onSaveMeasurements(entry);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <CrossIcon size={20} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Body Measurements ({measurementUnit.toUpperCase()})</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.contentArea} contentContainerStyle={styles.contentWrap}>
          <Text style={styles.fieldLabel}>DATE</Text>
          <TextInput style={styles.textInput} value={date} onChangeText={setDate} />

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>CHEST</Text>
              <TextInput style={styles.textInput} keyboardType="decimal-pad" value={chest} onChangeText={setChest} placeholder="0.0" placeholderTextColor="#858585" />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>WAIST</Text>
              <TextInput style={styles.textInput} keyboardType="decimal-pad" value={waist} onChangeText={setWaist} placeholder="0.0" placeholderTextColor="#858585" />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>HIPS</Text>
              <TextInput style={styles.textInput} keyboardType="decimal-pad" value={hips} onChangeText={setHips} placeholder="0.0" placeholderTextColor="#858585" />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>NECK</Text>
              <TextInput style={styles.textInput} keyboardType="decimal-pad" value={neck} onChangeText={setNeck} placeholder="0.0" placeholderTextColor="#858585" />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>LEFT ARM</Text>
              <TextInput style={styles.textInput} keyboardType="decimal-pad" value={leftArm} onChangeText={setLeftArm} placeholder="0.0" placeholderTextColor="#858585" />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>RIGHT ARM</Text>
              <TextInput style={styles.textInput} keyboardType="decimal-pad" value={rightArm} onChangeText={setRightArm} placeholder="0.0" placeholderTextColor="#858585" />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>THIGHS</Text>
              <TextInput style={styles.textInput} keyboardType="decimal-pad" value={thighs} onChangeText={setThighs} placeholder="0.0" placeholderTextColor="#858585" />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>CALVES</Text>
              <TextInput style={styles.textInput} keyboardType="decimal-pad" value={calves} onChangeText={setCalves} placeholder="0.0" placeholderTextColor="#858585" />
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Save Measurements</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// --- 3. LOG BODY COMPOSITION MODAL ---
export function LogCompositionModal({
  visible = false,
  onClose,
  onSaveComposition,
  weightUnit = 'kg'
}) {
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [leanMass, setLeanMass] = useState('');
  const [date, setDate] = useState(getTodayDateString(0));

  const handleSave = () => {
    const bf = parseFloat(bodyFat) || 0;
    let mm = parseFloat(muscleMass) || 0;
    let lm = parseFloat(leanMass) || 0;

    if (weightUnit === 'lbs') {
      if (mm > 0) mm = lbsToKg(mm);
      if (lm > 0) lm = lbsToKg(lm);
    }

    const entry = {
      id: 'c_' + Date.now(),
      date: date.trim() || getTodayDateString(0),
      bodyFatPct: Math.round(bf * 10) / 10,
      muscleMassKg: Math.round(mm * 10) / 10,
      leanMassKg: Math.round(lm * 10) / 10
    };

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    if (onSaveComposition) onSaveComposition(entry);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <CrossIcon size={20} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Body Composition</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.contentArea} contentContainerStyle={styles.contentWrap}>
          <Text style={styles.fieldLabel}>DATE</Text>
          <TextInput style={styles.textInput} value={date} onChangeText={setDate} />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>BODY FAT PERCENTAGE (%)</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="decimal-pad"
            placeholder="e.g. 18.5"
            placeholderTextColor="#858585"
            value={bodyFat}
            onChangeText={setBodyFat}
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>MUSCLE MASS ({weightUnit.toUpperCase()}) - OPTIONAL</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="decimal-pad"
            placeholder="From DEXA / smart scale"
            placeholderTextColor="#858585"
            value={muscleMass}
            onChangeText={setMuscleMass}
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>LEAN BODY MASS ({weightUnit.toUpperCase()}) - OPTIONAL</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="decimal-pad"
            placeholder="Lean body mass"
            placeholderTextColor="#858585"
            value={leanMass}
            onChangeText={setLeanMass}
          />

          <Text style={styles.helperNote}>
            Note: Body composition metrics are recorded manually from certified scales or clinical scans.
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Save Composition Entry</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// --- 4. EDIT HEIGHT MODAL ---
export function EditHeightModal({
  visible = false,
  onClose,
  currentHeightCm = 175,
  onSaveHeight
}) {
  const [heightVal, setHeightVal] = useState(String(currentHeightCm));

  useEffect(() => {
    setHeightVal(String(currentHeightCm));
  }, [currentHeightCm, visible]);

  const handleSave = () => {
    const val = parseFloat(heightVal);
    if (!val || val < 50 || val > 260) {
      Alert.alert('Invalid Height', 'Please enter a valid height in cm (50 - 260 cm).');
      return;
    }
    if (onSaveHeight) onSaveHeight(val);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.transparentOverlay}>
        <View style={styles.sheetBox}>
          <Text style={styles.sheetTitle}>Update Height</Text>
          <Text style={styles.sheetDesc}>Height is used for accurate BMI and Mifflin-St Jeor BMR calculation.</Text>

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>HEIGHT (CM)</Text>
          <TextInput
            style={styles.largeInput}
            keyboardType="numeric"
            value={heightVal}
            onChangeText={setHeightVal}
            autoFocus
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Save Height</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
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
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111'
  },
  contentArea: {
    flex: 1
  },
  contentWrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#858585',
    letterSpacing: 1,
    marginBottom: 6
  },
  largeInput: {
    height: 56,
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '800',
    color: '#111111'
  },
  textInput: {
    height: 44,
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#111111'
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  gridCol: {
    flex: 1,
    marginHorizontal: 3
  },
  helperNote: {
    fontSize: 12,
    color: '#858585',
    lineHeight: 18,
    marginTop: 14
  },
  primaryButton: {
    height: 52,
    backgroundColor: '#111111',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6
  },
  transparentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  sheetBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111111'
  },
  sheetDesc: {
    fontSize: 12,
    color: '#858585',
    marginTop: 4
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4
  },
  cancelLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#858585'
  }
});
