// NutriTrack AI — Cal AI Inspired Native iOS Application
// Pure white background, almost-black typography, thick black circular calorie meter, solid black scan action.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StatusBar,
  ActivityIndicator,
  StyleSheet
} from 'react-native';

import { StorageService, getTodayDateString } from './src/services/storageService';
import { computeDailyTotals } from './src/services/nutritionCalculator';

// Navigation & Modals
import BottomNav from './src/components/BottomNav';
import ScanModal from './src/components/ScanModal';
import QuickLogModal from './src/components/QuickLogModal';
import FoodDatabaseModal from './src/components/FoodDatabaseModal';

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

  // Currently selected date for tracking & diary
  const [selectedDate, setSelectedDate] = useState(getTodayDateString(0));

  // Modal visibility states
  const [showScan, setShowScan] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showFoodDb, setShowFoodDb] = useState(false);
  const [targetMealType, setTargetMealType] = useState('lunch');

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

  // Persist state changes
  const persistState = useCallback(async (newState) => {
    setAppState(newState);
    await StorageService.saveAppState(newState);
  }, []);

  const persistAiConfig = useCallback(async (newConfig) => {
    setAiConfig(newConfig);
    await StorageService.saveAiConfig(newConfig);
  }, []);

  // Active day log data
  const currentDayLog = useMemo(() => {
    if (!appState || !appState.logs) {
      return { waterMl: 0, meals: { breakfast: [], lunch: [], dinner: [], snacks: [] } };
    }
    return (
      appState.logs[selectedDate] || {
        waterMl: 0,
        meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }
      }
    );
  }, [appState, selectedDate]);

  // Daily nutrition totals
  const dailyTotals = useMemo(() => {
    return computeDailyTotals(currentDayLog);
  }, [currentDayLog]);

  // Add items to a specific meal (from AI photo scan, natural language log, or database)
  const handleAddItemsToMeal = (mealType, newItems) => {
    if (!appState || !newItems || newItems.length === 0) return;

    const existingMealItems = (currentDayLog.meals && currentDayLog.meals[mealType]) || [];
    const updatedMealItems = [...existingMealItems, ...newItems];

    const updatedState = {
      ...appState,
      logs: {
        ...appState.logs,
        [selectedDate]: {
          ...currentDayLog,
          meals: {
            ...currentDayLog.meals,
            [mealType]: updatedMealItems
          }
        }
      }
    };
    persistState(updatedState);
  };

  // Delete an item from a meal
  const handleDeleteMealItem = (mealType, itemIndex) => {
    if (!appState) return;
    const existing = (currentDayLog.meals && currentDayLog.meals[mealType]) || [];
    const updated = existing.filter((_, idx) => idx !== itemIndex);

    const updatedState = {
      ...appState,
      logs: {
        ...appState.logs,
        [selectedDate]: {
          ...currentDayLog,
          meals: {
            ...currentDayLog.meals,
            [mealType]: updated
          }
        }
      }
    };
    persistState(updatedState);
  };

  // Modal open helpers
  const handleOpenScan = (meal = 'lunch') => {
    setTargetMealType(meal);
    setShowScan(true);
  };

  const handleOpenQuickLog = (meal = 'breakfast') => {
    setTargetMealType(meal);
    setShowQuickLog(true);
  };

  const handleOpenFoodDb = (meal = 'lunch') => {
    setTargetMealType(meal);
    setShowFoodDb(true);
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
    let newProfile = appState.userProfile;
    if (updated.length > 0) {
      const latest = updated[updated.length - 1];
      newProfile = { ...newProfile, weightKg: latest.weightKg };
    }
    persistState({
      ...appState,
      weightLogs: updated,
      userProfile: newProfile
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

  // Onboarding & Lifecycle Handlers
  const handleCompleteOnboarding = (profileData, targets) => {
    const today = getTodayDateString(0);
    const updatedProfile = {
      ...appState.userProfile,
      ...profileData,
      ...(targets || {})
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

    const newState = {
      ...appState,
      onboardingCompleted: true,
      userProfile: updatedProfile,
      weightLogs: initialWeightLogs,
      measurementLogs: [],
      compositionLogs: [],
      logs: {
        ...appState.logs,
        [today]: {
          waterMl: 0,
          meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }
        }
      }
    };

    persistState(newState);
    setActiveTab('home');
  };

  const handleResetApp = async () => {
    const fresh = await StorageService.resetToFreshState();
    setAppState(fresh);
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

  // First-Time User Onboarding Flow: shown when onboardingCompleted is false
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

      {/* Screen Router */}
      <View style={styles.mainContainer}>
        {activeTab === 'home' && (
          <DashboardScreen
            dayLog={currentDayLog}
            userProfile={profile}
            dailyTotals={dailyTotals}
            logs={appState.logs}
            onOpenScan={() => handleOpenScan('lunch')}
            onOpenQuickLog={() => handleOpenQuickLog('breakfast')}
            onOpenFoodDb={() => handleOpenFoodDb('lunch')}
            onNavigateToDiary={() => setActiveTab('diary')}
          />
        )}

        {activeTab === 'diary' && (
          <DiaryScreen
            appState={appState}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onOpenScanForMeal={(m) => handleOpenScan(m)}
            onOpenQuickLogForMeal={(m) => handleOpenQuickLog(m)}
            onOpenFoodDbForMeal={(m) => handleOpenFoodDb(m)}
            onDeleteMealItem={handleDeleteMealItem}
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
        onSelectTab={setActiveTab}
        onOpenScan={() => handleOpenScan('lunch')}
      />

      {/* AI Food Scanner Modal (Camera & Gallery) */}
      <ScanModal
        visible={showScan}
        onClose={() => setShowScan(false)}
        onAddMealItems={handleAddItemsToMeal}
        defaultMealType={targetMealType}
        aiConfig={aiConfig}
      />

      {/* AI Quick Log Modal (Natural Language) */}
      <QuickLogModal
        visible={showQuickLog}
        onClose={() => setShowQuickLog(false)}
        onAddMealItems={handleAddItemsToMeal}
        defaultMealType={targetMealType}
        aiConfig={aiConfig}
      />

      {/* 1,700+ USDA Offline Food Database Modal */}
      <FoodDatabaseModal
        visible={showFoodDb}
        onClose={() => setShowFoodDb(false)}
        onAddFoodItem={handleAddItemsToMeal}
        defaultMealType={targetMealType}
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
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#858585'
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  }
});
