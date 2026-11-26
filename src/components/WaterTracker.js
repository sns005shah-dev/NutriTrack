// NutriTrack AI — Minimalist Home Hydration Tracker Card & Management Modal
// Clean black-and-white Cal AI surface with subtle blue hydration accent (#0EA5E9).
// Supports +150ml, +250ml, +500ml, custom ml, double-tap protection, undo, edit/delete, and history.

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';

import {
  WaterDropIcon,
  UndoIcon,
  EditIcon,
  TrashIcon,
  CrossIcon,
  CheckIcon
} from './Icons';
import {
  DEFAULT_HYDRATION_GOAL_ML,
  MAX_SINGLE_HYDRATION_ENTRY_ML,
  calculateHydrationProgress,
  formatWaterMl,
  formatWaterLiters,
  formatHydrationTime,
  getHydrationHistoryByDate
} from '../services/hydrationService';
import { formatDateHuman } from '../services/dateService';

const QUICK_AMOUNTS = [150, 250, 500];
const CUSTOM_PRESETS = [100, 200, 330, 750, 1000];
const TAP_DEBOUNCE_MS = 400;

export default function WaterTracker({
  todayDateStr,
  todayEntries = [],
  allHydrationLogs = [],
  consumedMl = 0,
  goalMl = DEFAULT_HYDRATION_GOAL_ML,
  onAddWater,
  onUndoLast,
  onEditEntry,
  onDeleteEntry
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [editError, setEditError] = useState('');

  // Double-tap guard ref for quick-add & undo buttons
  const lastActionTimeRef = useRef(0);

  const safeGoal = Number(goalMl) > 0 ? Math.round(Number(goalMl)) : DEFAULT_HYDRATION_GOAL_ML;
  const progress = calculateHydrationProgress(consumedMl, safeGoal);

  const canRunGuardedAction = () => {
    const now = Date.now();
    if (now - lastActionTimeRef.current < TAP_DEBOUNCE_MS) {
      return false;
    }
    lastActionTimeRef.current = now;
    return true;
  };

  const handleQuickAdd = (amount) => {
    if (!canRunGuardedAction()) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    if (onAddWater) onAddWater(amount);
  };

  const handleUndo = () => {
    if (todayEntries.length === 0) return;
    if (!canRunGuardedAction()) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    if (onUndoLast) onUndoLast();
  };

  const handleOpenModal = (focusCustom = false) => {
    setCustomError('');
    setEditError('');
    setEditingId(null);
    if (focusCustom) {
      setCustomInput('');
    }
    setModalVisible(true);
  };

  const handleAddCustom = (presetMl) => {
    const val = presetMl !== undefined ? presetMl : parseInt(customInput.trim(), 10);
    if (!val || isNaN(val) || val <= 0) {
      setCustomError('Enter a valid amount greater than 0 ml.');
      return;
    }
    if (val > MAX_SINGLE_HYDRATION_ENTRY_ML) {
      setCustomError(`Please enter ${MAX_SINGLE_HYDRATION_ENTRY_ML.toLocaleString()} ml or less per entry.`);
      return;
    }
    if (!canRunGuardedAction()) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    if (onAddWater) onAddWater(val);
    setCustomInput('');
    setCustomError('');
  };

  const handleStartEdit = (entry) => {
    setEditingId(entry.id);
    setEditingAmount(String(entry.amountMl));
    setEditError('');
  };

  const handleSaveEdit = (entryId) => {
    const val = parseInt(editingAmount.trim(), 10);
    if (!val || isNaN(val) || val <= 0) {
      setEditError('Amount must be > 0 ml.');
      return;
    }
    if (val > MAX_SINGLE_HYDRATION_ENTRY_ML) {
      setEditError(`Max ${MAX_SINGLE_HYDRATION_ENTRY_ML.toLocaleString()} ml.`);
      return;
    }
    if (onEditEntry) onEditEntry(entryId, val);
    setEditingId(null);
    setEditingAmount('');
    setEditError('');
  };

  const handleDelete = (entryId) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    if (editingId === entryId) {
      setEditingId(null);
    }
    if (onDeleteEntry) onDeleteEntry(entryId);
  };

  const historyDays = getHydrationHistoryByDate(allHydrationLogs, todayDateStr);
  const newestFirstToday = [...todayEntries].reverse();

  return (
    <View style={styles.card}>
      {/* Top Header Row: Water Icon + Heading + Amount + Percentage */}
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <View style={styles.iconBadge}>
            <WaterDropIcon size={18} color="#0EA5E9" />
          </View>
          <View>
            <Text style={styles.heading}>Hydration</Text>
            <View style={styles.amountLine}>
              <Text style={styles.amountPrimary}>{formatWaterMl(progress.consumedMl)}</Text>
              <Text style={styles.amountTarget}> / {formatWaterLiters(safeGoal)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.percentPill}>
          <Text style={styles.percentText}>{progress.percent}%</Text>
        </View>
      </View>

      {/* Subtle Blue Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress.clampedPercent}%` }
          ]}
        />
      </View>

      {/* Secondary Status + Undo / Entries Actions */}
      <View style={styles.metaRow}>
        <Text style={styles.metaSubtext}>
          {progress.goalReached
            ? `Goal reached • ${formatWaterLiters(progress.consumedMl)} total`
            : `${formatWaterLiters(progress.consumedMl)} • ${formatWaterMl(progress.remainingMl)} left`}
        </Text>

        <View style={styles.metaActions}>
          {todayEntries.length > 0 && (
            <TouchableOpacity
              onPress={handleUndo}
              style={styles.metaActionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              activeOpacity={0.65}
              accessibilityLabel="Undo last water entry"
            >
              <UndoIcon size={12} color="#858585" />
              <Text style={styles.metaActionText}>Undo</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => handleOpenModal(false)}
            style={styles.metaActionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            activeOpacity={0.65}
            accessibilityLabel="View and edit hydration entries"
          >
            <Text style={styles.metaLinkBlue}>
              {todayEntries.length > 0 ? `Entries (${todayEntries.length})` : 'Log & History'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick-Add Buttons Row */}
      <View style={styles.quickRow}>
        {QUICK_AMOUNTS.map((amt) => (
          <TouchableOpacity
            key={amt}
            style={styles.quickBtn}
            onPress={() => handleQuickAdd(amt)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickBtnText}>+{amt} ml</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.customBtn}
          onPress={() => handleOpenModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.customBtnText}>+ Custom</Text>
        </TouchableOpacity>
      </View>

      {/* =================================================================== */}
      {/* HYDRATION CUSTOM INPUT, TODAY ENTRIES & HISTORY MODAL               */}
      {/* =================================================================== */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Safe-Area Modal Header */}
          <View style={styles.modalHeaderWrapper}>
            <View style={styles.modalHeaderBar}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close Hydration Log"
              >
                <CrossIcon size={20} color="#111111" strokeWidth={2.4} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Hydration Log</Text>
              <View style={styles.headerRightSpacer} />
            </View>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Today's Progress Summary Card */}
            <View style={styles.modalSummaryCard}>
              <View style={styles.modalSummaryTop}>
                <View style={styles.titleRow}>
                  <View style={styles.iconBadge}>
                    <WaterDropIcon size={18} color="#0EA5E9" />
                  </View>
                  <View>
                    <Text style={styles.modalSummaryLabel}>TODAY'S INTAKE</Text>
                    <Text style={styles.modalSummaryNumber}>
                      {formatWaterMl(progress.consumedMl)}{' '}
                      <Text style={styles.modalSummaryTarget}>/ {formatWaterLiters(safeGoal)}</Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.percentPill}>
                  <Text style={styles.percentText}>{progress.percent}%</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress.clampedPercent}%` }]} />
              </View>

              <Text style={styles.modalSummaryFoot}>
                {formatWaterLiters(progress.consumedMl)} consumed of {formatWaterMl(safeGoal)} daily goal
              </Text>
            </View>

            {/* Custom Water Quantity Input */}
            <Text style={styles.sectionLabel}>ADD CUSTOM WATER QUANTITY</Text>
            <View style={styles.customInputCard}>
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customTextInput}
                  keyboardType="numeric"
                  placeholder="Enter amount (e.g. 330)"
                  placeholderTextColor="#858585"
                  value={customInput}
                  onChangeText={(t) => {
                    setCustomInput(t.replace(/[^0-9]/g, ''));
                    if (customError) setCustomError('');
                  }}
                  returnKeyType="done"
                  onSubmitEditing={() => handleAddCustom()}
                />
                <Text style={styles.mlUnitLabel}>ml</Text>
                <TouchableOpacity
                  style={styles.addCustomSubmitBtn}
                  onPress={() => handleAddCustom()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.addCustomSubmitText}>Add</Text>
                </TouchableOpacity>
              </View>

              {customError ? (
                <Text style={styles.errorText}>{customError}</Text>
              ) : null}

              <View style={styles.presetsWrap}>
                {CUSTOM_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={styles.presetChip}
                    onPress={() => handleAddCustom(p)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.presetChipText}>+{p} ml</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Today's Entries List (Edit / Delete / Undo) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>TODAY'S ENTRIES ({newestFirstToday.length})</Text>
              {newestFirstToday.length > 0 && (
                <TouchableOpacity onPress={handleUndo} style={styles.undoLinkBtn} activeOpacity={0.7}>
                  <UndoIcon size={12} color="#111111" />
                  <Text style={styles.undoLinkText}>Undo Last</Text>
                </TouchableOpacity>
              )}
            </View>

            {newestFirstToday.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No water logged today yet.</Text>
              </View>
            ) : (
              <View style={styles.entriesCard}>
                {newestFirstToday.map((entry, idx) => {
                  const isEditing = editingId === entry.id;
                  return (
                    <View
                      key={entry.id}
                      style={[
                        styles.entryRow,
                        idx > 0 && styles.entryRowBorder
                      ]}
                    >
                      {isEditing ? (
                        <View style={styles.editInlineWrap}>
                          <View style={styles.editInputRow}>
                            <TextInput
                              style={styles.editInlineInput}
                              keyboardType="numeric"
                              value={editingAmount}
                              onChangeText={(t) => {
                                setEditingAmount(t.replace(/[^0-9]/g, ''));
                                if (editError) setEditError('');
                              }}
                              autoFocus
                            />
                            <Text style={styles.editMlSuffix}>ml</Text>
                            <TouchableOpacity
                              style={styles.saveEditBtn}
                              onPress={() => handleSaveEdit(entry.id)}
                            >
                              <CheckIcon size={14} color="#FFFFFF" />
                              <Text style={styles.saveEditText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.cancelEditBtn}
                              onPress={() => setEditingId(null)}
                            >
                              <Text style={styles.cancelEditText}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                          {editError ? <Text style={styles.errorText}>{editError}</Text> : null}
                        </View>
                      ) : (
                        <>
                          <View style={styles.entryInfo}>
                            <Text style={styles.entryAmount}>{formatWaterMl(entry.amountMl)}</Text>
                            <Text style={styles.entryTime}>
                              {formatHydrationTime(entry.timestamp) || 'Logged today'} • {formatWaterLiters(entry.amountMl)}
                            </Text>
                          </View>

                          <View style={styles.entryActions}>
                            <TouchableOpacity
                              style={styles.entryIconBtn}
                              onPress={() => handleStartEdit(entry)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              accessibilityLabel="Edit entry"
                            >
                              <EditIcon size={15} color="#111111" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.entryIconBtn}
                              onPress={() => handleDelete(entry.id)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              accessibilityLabel="Delete entry"
                            >
                              <TrashIcon size={15} color="#DC2626" />
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Historical Hydration Records */}
            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>
              HISTORICAL HYDRATION RECORDS
            </Text>

            {historyDays.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Previous days' hydration totals will appear here automatically.
                </Text>
              </View>
            ) : (
              <View style={styles.entriesCard}>
                {historyDays.slice(0, 14).map((day, idx) => {
                  const dayProg = calculateHydrationProgress(day.totalMl, safeGoal);
                  return (
                    <View
                      key={day.date}
                      style={[
                        styles.historyRow,
                        idx > 0 && styles.entryRowBorder
                      ]}
                    >
                      <View>
                        <Text style={styles.historyDate}>{formatDateHuman(day.date)}</Text>
                        <Text style={styles.historyCount}>
                          {day.entries.length} {day.entries.length === 1 ? 'entry' : 'entries'}
                        </Text>
                      </View>

                      <View style={styles.historyRight}>
                        <Text style={styles.historyTotal}>
                          {formatWaterMl(day.totalMl)} ({formatWaterLiters(day.totalMl)})
                        </Text>
                        <Text style={styles.historyPct}>{dayProg.percent}% of goal</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={styles.disclaimerNote}>
              Daily tracking goal: {formatWaterLiters(safeGoal)} ({formatWaterMl(safeGoal)}). Customize anytime in Profile & Settings. This is a personal tracking target, not medical advice.
            </Text>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    marginBottom: 20
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  heading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.2
  },
  amountLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 1
  },
  amountPrimary: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111111'
  },
  amountTarget: {
    fontSize: 12,
    fontWeight: '600',
    color: '#858585'
  },
  percentPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  percentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7'
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#EAEAEA',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0EA5E9',
    borderRadius: 4
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12
  },
  metaSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: '#858585'
  },
  metaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  metaActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metaActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#858585'
  },
  metaLinkBlue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7'
  },
  quickRow: {
    flexDirection: 'row',
    gap: 6
  },
  quickBtn: {
    flex: 1,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center'
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111'
  },
  customBtn: {
    flex: 1,
    height: 36,
    backgroundColor: '#F0F9FF',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center'
  },
  customBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7'
  },

  // Modal Styles (iPhone 14 Safe-Area Standardized)
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center'
  },
  modalHeaderWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    paddingTop: Platform.OS === 'web' ? 'max(14px, env(safe-area-inset-top, 16px))' : 14,
    paddingHorizontal: 16
  },
  modalHeaderBar: {
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
  modalScroll: {
    flex: 1
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  modalSummaryCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    marginBottom: 18
  },
  modalSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalSummaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#858585',
    letterSpacing: 0.8
  },
  modalSummaryNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111111',
    marginTop: 2
  },
  modalSummaryTarget: {
    fontSize: 14,
    fontWeight: '600',
    color: '#858585'
  },
  modalSummaryFoot: {
    fontSize: 11,
    color: '#858585',
    marginTop: 8
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#858585',
    letterSpacing: 1,
    marginBottom: 8
  },
  undoLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8
  },
  undoLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111'
  },
  customInputCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 14,
    marginBottom: 18
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  customTextInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#111111'
  },
  mlUnitLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#858585'
  },
  addCustomSubmitBtn: {
    height: 44,
    paddingHorizontal: 18,
    backgroundColor: '#111111',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addCustomSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111'
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6
  },
  emptyCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 12,
    color: '#858585',
    textAlign: 'center'
  },
  entriesCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 14
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12
  },
  entryRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA'
  },
  entryInfo: {
    flex: 1
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111'
  },
  entryTime: {
    fontSize: 11,
    color: '#858585',
    marginTop: 2
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  entryIconBtn: {
    padding: 4
  },
  editInlineWrap: {
    flex: 1
  },
  editInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  editInlineInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#111111',
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#111111'
  },
  editMlSuffix: {
    fontSize: 12,
    fontWeight: '600',
    color: '#858585'
  },
  saveEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10
  },
  saveEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  cancelEditBtn: {
    paddingHorizontal: 8,
    height: 36,
    justifyContent: 'center'
  },
  cancelEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#858585'
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111'
  },
  historyCount: {
    fontSize: 11,
    color: '#858585',
    marginTop: 2
  },
  historyRight: {
    alignItems: 'flex-end'
  },
  historyTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111'
  },
  historyPct: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
    marginTop: 2
  },
  disclaimerNote: {
    fontSize: 11,
    color: '#858585',
    lineHeight: 16,
    marginTop: 16,
    textAlign: 'center'
  }
});
