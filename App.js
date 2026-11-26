// NutriTrack AI — Cal AI Inspired Native iOS & PWA Application
// Pure white background, almost-black typography, thick black circular calorie meter, solid black scan action.

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  AppState,
  Platform
} from 'react-native';

import { StorageService } from './src/services/storageService';
import { getLocalDateString, formatDateHuman } from './src/services/dateService';
import { computeDailyTotals } from './src/services/nutritionCalculator';
import {
  getHydrationEntriesForDate,
  calculateDailyHydrationMl,
  addHydrationEntryToLogs,
  undoLastHydrationEntryForDate,
  updateHydrationEntryInLogs,
  deleteHydrationEntryFromLogs
} from './src/services/hydrationService';

// Navigation & Modals
import BottomNav from './src/components/BottomNav';
import ScanModal from './src/components/ScanModal';
import QuickLogModal from './src/components/QuickLogModal';
import FoodDatabaseModal from './src/components/FoodDatabaseModal';
import OfflineBanner from './src/components/OfflineBanner';

// 4 Primary Dedicated Screens
import DashboardScreen from './src/screens/DashboardScreen';
import DiaryScreen from './src/screens/DiaryScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);

  // Active navigation tab: 'home' | 'diary' | 'insights' | 'profile'
  const [activeTab, setActiveTab] = useState('home');

  // Today's local calendar date (automatically updates when calendar day rolls over)
  const [todayDateStr, setTodayDateStr] = useState(() => getLocalDateString(0));

  // Active date for the Diary screen (user can select yesterday, etc.)
  const [diaryDate, setDiaryDate] = useState(() => getLocalDateString(0));

  // Target date for the currently open logging modal
  const [targetLoggingDate, setTargetLoggingDate] = useState(() => getLocalDateString(0));
  const [targetMealType, setTargetMealType] = useState('lunch');

  // Double-tap / concurrency guard ref for hydration actions
  const lastHydrationTapRef = useRef(0);

  // Modal visibility states
  const [showScan, setShowScan] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showFoodDb, setShowFoodDb] = useState(false);

  // Sync local calendar date on foreground resume & midnight rollover
  useEffect(() => {
    const syncCalendarDate = () => {
      const current = getLocalDateString(0);
      setTodayDateStr((prev) => {
        if (prev !== current) {
          setDiaryDate((dPrev) => (dPrev === prev ? current : dPrev));
          setTargetLoggingDate((tPrev) => (tPrev === prev ? current : tPrev));
          return current;
        }
        return prev;
      });
    };

    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        syncCalendarDate();
      }
    });

    let webCleanup = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      const onVis = () => {
        if (document.visibilityState === 'visible') syncCalendarDate();
      };
      window.addEventListener('focus', syncCalendarDate);
      document.addEventListener('visibilitychange', onVis);
      webCleanup = () => {
        window.removeEventListener('focus', syncCalendarDate);
        document.removeEventListener('visibilitychange', onVis);
      };
    }

    const timer = setInterval(syncCalendarDate, 30000);

    return () => {
      if (appStateSub && appStateSub.remove) appStateSub.remove();
      if (webCleanup) webCleanup();
      clearInterval(timer);
    };
  }, []);

  // Load persisted app state on launch
  useEffect(() => {
    async function loadInitialData() {
      try {
        const state = await StorageService.loadAppState();
        const ai = await StorageService.loadAiConfig();
        setAppState(state);
        setAiConfig(ai);
      } catch (err) {
        console.error('Error loading initial app state:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Persist state changes to storage
  const persistState = useCallback(async (newState) => {
    setAppState(newState);
    await StorageService.saveAppState(newState);
  }, []);

  const persistAiConfig = useCallback(async (newConfig) => {
    setAiConfig(newConfig);
    await StorageService.saveAiConfig(newConfig);
  }, []);

  // Today's log strictly for Home Dashboard
  const todayDayLog = useMemo(() => {
    if (!appState || !appState.logs) {
      return { waterMl: 0, meals: { breakfast: [], lunch: [], dinner: [], snacks: [] } };
    }
    return (
      appState.logs[todayDateStr] || {
        waterMl: 0,
        meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }
      }
    );
  }, [appState, todayDateStr]);

  const todayDailyTotals = useMemo(() => {
    return computeDailyTotals(todayDayLog);
  }, [todayDayLog]);

  // Today's Hydration Entries & Total (strictly filtered to today's local date)
  const todayHydrationEntries = useMemo(() => {
    return getHydrationEntriesForDate(appState?.hydrationLogs || [], todayDateStr);
  }, [appState?.hydrationLogs, todayDateStr]);

  const todayWaterMl = useMemo(() => {
    return calculateDailyHydrationMl(appState?.hydrationLogs || [], todayDateStr);
  }, [appState?.hydrationLogs, todayDateStr]);

  // Modal open helpers with explicit target date
  const handleOpenScan = (meal = 'lunch', forDate) => {
    setTargetMealType(meal);
    setTargetLoggingDate(forDate || (activeTab === 'diary' ? diaryDate : todayDateStr));
    setShowScan(true);
  };

  const handleOpenQuickLog = (meal = 'breakfast', forDate) => {
    setTargetMealType(meal);
    setTargetLoggingDate(forDate || (activeTab === 'diary' ? diaryDate : todayDateStr));
    setShowQuickLog(true);
  };

  const handleOpenFoodDb = (meal = 'lunch', forDate) => {
    setTargetMealType(meal);
    setTargetLoggingDate(forDate || (activeTab === 'diary' ? diaryDate : todayDateStr));
    setShowFoodDb(true);
  };

  // Add items to a specific meal with strict date stamping and persistence
  const handleAddItemsToMeal = (mealType, newItems, overrideDate) => {
    if (!appState || !newItems || newItems.length === 0) return;

    const resolvedDate = overrideDate || targetLoggingDate || (activeTab === 'diary' ? diaryDate : todayDateStr);

    const stampedItems = newItems.map((item, index) => ({
      id: item.id || `food_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
      name: item.name || 'Food item',
      portion: item.portion || `${item.grams || 100}g`,
      grams: Number(item.grams) || 100,
      calories: Math.round(Number(item.calories) || 0),
      protein: Math.round((Number(item.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(item.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(item.fat) || 0) * 10) / 10,
      fiber: Math.round((Number(item.fiber) || 0) * 10) / 10,
      sugar: Math.round((Number(item.sugar) || 0) * 10) / 10,
      saturatedFat: Math.round((Number(item.saturatedFat) || 0) * 10) / 10,
      mealCategory: mealType,
      diaryDate: resolvedDate,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: item.icon || '🍽️'
    }));

    const existingDayLog = (appState.logs && appState.logs[resolvedDate]) || {
      waterMl: 0,
      meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }
    };
    const existingMeals = existingDayLog.meals || { breakfast: [], lunch: [], dinner: [], snacks: [] };
    const currentMealList = existingMeals[mealType] || [];

    const updatedMealList = [...currentMealList, ...stampedItems];

    const updatedState = {
      ...appState,
      logs: {
        ...appState.logs,
        [resolvedDate]: {
          ...existingDayLog,
          meals: {
            ...existingMeals,
            [mealType]: updatedMealList
          }
        }
      }
    };
    persistState(updatedState);
  };

  // Delete an item from a specific meal on a specific date
  const handleDeleteMealItem = (mealType, itemIndex, targetDate) => {
    if (!appState) return;
    const resolvedDate = targetDate || diaryDate || todayDateStr;

    const existingDayLog = appState.logs && appState.logs[resolvedDate];
    if (!existingDayLog || !existingDayLog.meals) return;

    const currentMealList = existingDayLog.meals[mealType] || [];
    const updatedMealList = currentMealList.filter((_, idx) => idx !== itemIndex);

    const updatedState = {
      ...appState,
      logs: {
        ...appState.logs,
        [resolvedDate]: {
          ...existingDayLog,
          meals: {
            ...existingDayLog.meals,
            [mealType]: updatedMealList
          }
        }
      }
    };
    persistState(updatedState);
  };

  // Weight, Measurement & Body Composition Handlers
  const handleSaveWeight = (entry) => {
    if (!appState) return;
    const existing = appState.weightLogs || [];
    const idx = existing.findIndex((w) => w.id === entry.id);
    let updated;
    if (idx >= 0) {
      updated = [...existing];
      updated[idx] = entry;
    } else {
      updated = [...existing, entry];
    }
    updated.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const latest = updated[updated.length - 1];
    const newProfile = { ...appState.userProfile, weightKg: latest.weightKg };

    persistState({
      ...appState,
      weightLogs: updated,
      userProfile: newProfile
    });
  };

  const handleDeleteWeight = (entryId) => {
    if (!appState) return;
    const existing = appState.weightLogs || [];
    const updated = existing.filter((w) => w.id !== entryId);
    persistState({
      ...appState,
      weightLogs: updated
    });
  };

  const handleSaveMeasurements = (entry) => {
    if (!appState) return;
    const existing = appState.measurementLogs || [];
    const idx = existing.findIndex((m) => m.id === entry.id);
    let updated;
    if (idx >= 0) {
      updated = [...existing];
      updated[idx] = entry;
    } else {
      updated = [...existing, entry];
    }
    updated.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    persistState({
      ...appState,
      measurementLogs: updated
    });
  };

  const handleSaveComposition = (entry) => {
    if (!appState) return;
    const existing = appState.compositionLogs || [];
    const idx = existing.findIndex((c) => c.id === entry.id);
    let updated;
    if (idx >= 0) {
      updated = [...existing];
      updated[idx] = entry;
    } else {
      updated = [...existing, entry];
    }
    updated.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    persistState({
      ...appState,
      compositionLogs: updated
    });
  };

  const handleUpdateProfile = (profileFields) => {
    if (!appState) return;
    persistState({
      ...appState,
      userProfile: {
        ...appState.userProfile,
        ...profileFields
      }
    });
  };

  // Hydration Tracking Handlers (strictly isolated from food diary meals & double-tap guarded)
  const applyHydrationUpdate = useCallback((updaterFn) => {
    const activeDate = getLocalDateString(0);
    setTodayDateStr((prevDate) => (prevDate !== activeDate ? activeDate : prevDate));

    setAppState((prevState) => {
      if (!prevState) return prevState;
      const nextHydrationLogs = updaterFn(prevState.hydrationLogs || [], activeDate);
      const nextTodayWaterMl = calculateDailyHydrationMl(nextHydrationLogs, activeDate);
      const existingDayLog = (prevState.logs && prevState.logs[activeDate]) || {
        waterMl: 0,
        meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }
      };

      const nextState = {
        ...prevState,
        hydrationLogs: nextHydrationLogs,
        logs: {
          ...(prevState.logs || {}),
          [activeDate]: {
            ...existingDayLog,
            waterMl: nextTodayWaterMl
          }
        }
      };

      StorageService.saveAppState(nextState);
      return nextState;
    });
  }, []);

  const handleAddWater = useCallback((amountMl) => {
    const now = Date.now();
    if (now - lastHydrationTapRef.current < 350) return;
    lastHydrationTapRef.current = now;

    applyHydrationUpdate((logs, activeDate) => {
      const { entries } = addHydrationEntryToLogs(logs, amountMl, activeDate);
      return entries;
    });
  }, [applyHydrationUpdate]);

  const handleUndoWater = useCallback(() => {
    const now = Date.now();
    if (now - lastHydrationTapRef.current < 350) return;
    lastHydrationTapRef.current = now;

    applyHydrationUpdate((logs, activeDate) => {
      const { entries } = undoLastHydrationEntryForDate(logs, activeDate);
      return entries;
    });
  }, [applyHydrationUpdate]);

  const handleEditWaterEntry = useCallback((entryId, newAmountMl) => {
    applyHydrationUpdate((logs) => updateHydrationEntryInLogs(logs, entryId, newAmountMl));
  }, [applyHydrationUpdate]);

  const handleDeleteWaterEntry = useCallback((entryId) => {
    applyHydrationUpdate((logs) => deleteHydrationEntryFromLogs(logs, entryId));
  }, [applyHydrationUpdate]);

  // Onboarding & Lifecycle Handlers
  const handleCompleteOnboarding = (profileData, targets) => {
    const today = getLocalDateString(0);
    const updatedProfile = {
      ...appState.userProfile,
      ...profileData,
      ...(targets || {}),
      waterTargetMl: appState.userProfile?.waterTargetMl > 0 ? appState.userProfile.waterTargetMl : 2500
    };

    const initialWeightLogs = profileData.weightKg
      ? [
          {
            id: 'w_init_' + Date.now(),
            date: today,
            weightKg: profileData.weightKg,
            note: 'Starting weigh-in'
          }
        ]
      : [];

    const existingTodayLog = (appState.logs && appState.logs[today]) || {
      waterMl: 0,
      meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }
    };

    const newState = {
      ...appState,
      onboardingCompleted: true,
      userProfile: updatedProfile,
      weightLogs: appState.weightLogs && appState.weightLogs.length > 0 ? appState.weightLogs : initialWeightLogs,
      measurementLogs: appState.measurementLogs || [],
      compositionLogs: appState.compositionLogs || [],
      hydrationLogs: appState.hydrationLogs || [],
      logs: {
        ...appState.logs,
        [today]: existingTodayLog
      }
    };

    persistState(newState);
    setActiveTab('home');
  };

  const handleResetApp = async () => {
    const fresh = await StorageService.resetToFreshState();
    setAppState(fresh);
    setDiaryDate(getLocalDateString(0));
    setTargetLoggingDate(getLocalDateString(0));
    setActiveTab('home');
  };

  const handleRerunOnboarding = () => {
    persistState({
      ...appState,
      onboardingCompleted: false
    });
  };

  const handleImportData = (importedState) => {
    if (importedState) {
      persistState(importedState);
    }
  };

  if (loading || !appState) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111111" />
        <Text style={styles.loadingLabel}>Loading NutriTrack AI...</Text>
      </View>
    );
  }

  // First-Time User Onboarding Flow
  if (!appState.onboardingCompleted) {
    return (
      <OnboardingScreen
        initialProfile={appState.userProfile}
        onComplete={handleCompleteOnboarding}
      />
    );
  }

  const profile = appState.userProfile;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <OfflineBanner />

      {/* Screen Router */}
      <View style={styles.mainContainer}>
        {activeTab === 'home' && (
          <DashboardScreen
            dayLog={todayDayLog}
            userProfile={profile}
            dailyTotals={todayDailyTotals}
            logs={appState.logs}
            todayDateStr={todayDateStr}
            hydrationLogs={appState.hydrationLogs || []}
            todayHydrationEntries={todayHydrationEntries}
            todayWaterMl={todayWaterMl}
            onAddWater={handleAddWater}
            onUndoWater={handleUndoWater}
            onEditWaterEntry={handleEditWaterEntry}
            onDeleteWaterEntry={handleDeleteWaterEntry}
            onOpenScan={() => handleOpenScan('lunch', todayDateStr)}
            onOpenQuickLog={() => handleOpenQuickLog('breakfast', todayDateStr)}
            onOpenFoodDb={() => handleOpenFoodDb('lunch', todayDateStr)}
            onNavigateToDiary={() => {
              setDiaryDate(todayDateStr);
              setActiveTab('diary');
            }}
          />
        )}

        {activeTab === 'diary' && (
          <DiaryScreen
            appState={appState}
            selectedDate={diaryDate}
            onSelectDate={(newDate) => {
              setDiaryDate(newDate);
              setTargetLoggingDate(newDate);
            }}
            onOpenScanForMeal={(m, d) => handleOpenScan(m, d || diaryDate)}
            onOpenQuickLogForMeal={(m, d) => handleOpenQuickLog(m, d || diaryDate)}
            onOpenFoodDbForMeal={(m, d) => handleOpenFoodDb(m, d || diaryDate)}
            onDeleteMealItem={(m, idx, d) => handleDeleteMealItem(m, idx, d || diaryDate)}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsScreen
            appState={appState}
            onSaveWeight={handleSaveWeight}
            onDeleteWeight={handleDeleteWeight}
            onSaveMeasurements={handleSaveMeasurements}
            onSaveComposition={handleSaveComposition}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            appState={appState}
            onSaveProfile={(up) => persistState({ ...appState, userProfile: up })}
            aiConfig={aiConfig}
            onSaveAiConfig={persistAiConfig}
            onResetApp={handleResetApp}
            onRerunOnboarding={handleRerunOnboarding}
            onImportData={handleImportData}
          />
        )}
      </View>

      {/* Cal AI iOS Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'diary') {
            // Keep user's active diary date or initialize to today if unset
            setDiaryDate((prev) => prev || todayDateStr);
          }
          setActiveTab(tab);
        }}
        onOpenScan={() => handleOpenScan('lunch', activeTab === 'diary' ? diaryDate : todayDateStr)}
      />

      {/* AI Food Scanner Modal (Camera & Gallery) */}
      <ScanModal
        visible={showScan}
        onClose={() => setShowScan(false)}
        onAddMealItems={handleAddItemsToMeal}
        defaultMealType={targetMealType}
        targetDate={targetLoggingDate}
        aiConfig={aiConfig}
      />

      {/* AI Quick Log Modal (Natural Language) */}
      <QuickLogModal
        visible={showQuickLog}
        onClose={() => setShowQuickLog(false)}
        onAddMealItems={handleAddItemsToMeal}
        defaultMealType={targetMealType}
        targetDate={targetLoggingDate}
        aiConfig={aiConfig}
      />

      {/* 1,700+ USDA Offline Food Database Modal */}
      <FoodDatabaseModal
        visible={showFoodDb}
        onClose={() => setShowFoodDb(false)}
        onAddFoodItem={handleAddItemsToMeal}
        defaultMealType={targetMealType}
        targetDate={targetLoggingDate}
        customFoods={appState.customFoods || []}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#858585'
  },
  mainContainer: {
    flex: 1
  }
});
