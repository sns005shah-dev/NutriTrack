// Cal AI Minimalist iOS Bottom Navigation Bar
// Pure white background, clean vector icons, and an elevated solid black camera scan trigger.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { HomeIcon, DiaryIcon, CameraIcon, InsightsIcon, ProfileIcon } from './Icons';

export default function BottomNav({
  activeTab = 'home',
  onSelectTab,
  onOpenScan
}) {
  const handleTabPress = (tabKey) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    if (onSelectTab) onSelectTab(tabKey);
  };

  const handleScanPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    if (onOpenScan) onOpenScan();
  };

  return (
    <View style={styles.navBar}>
      {/* Tab 1: Home */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress('home')}
        activeOpacity={0.7}
      >
        <HomeIcon
          size={22}
          color={activeTab === 'home' ? '#111111' : '#858585'}
          strokeWidth={activeTab === 'home' ? 2.2 : 1.6}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'home' ? '#111111' : '#858585', fontWeight: activeTab === 'home' ? '700' : '500' }
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Tab 2: Diary */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress('diary')}
        activeOpacity={0.7}
      >
        <DiaryIcon
          size={22}
          color={activeTab === 'diary' ? '#111111' : '#858585'}
          strokeWidth={activeTab === 'diary' ? 2.2 : 1.6}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'diary' ? '#111111' : '#858585', fontWeight: activeTab === 'diary' ? '700' : '500' }
          ]}
        >
          Diary
        </Text>
      </TouchableOpacity>

      {/* Center Hero: Solid Black Circular Scan Action */}
      <View style={styles.centerScanHolder}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanPress}
          activeOpacity={0.85}
        >
          <CameraIcon size={24} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* Tab 3: Insights */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress('insights')}
        activeOpacity={0.7}
      >
        <InsightsIcon
          size={22}
          color={activeTab === 'insights' ? '#111111' : '#858585'}
          strokeWidth={activeTab === 'insights' ? 2.2 : 1.6}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'insights' ? '#111111' : '#858585', fontWeight: activeTab === 'insights' ? '700' : '500' }
          ]}
        >
          Insights
        </Text>
      </TouchableOpacity>

      {/* Tab 4: Profile */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress('profile')}
        activeOpacity={0.7}
      >
        <ProfileIcon
          size={22}
          color={activeTab === 'profile' ? '#111111' : '#858585'}
          strokeWidth={activeTab === 'profile' ? 2.2 : 1.6}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'profile' ? '#111111' : '#858585', fontWeight: activeTab === 'profile' ? '700' : '500' }
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 80,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'web' ? 'max(20px, calc(env(safe-area-inset-bottom, 20px) + 4px))' : 24,
    paddingHorizontal: 8,
    zIndex: 100
  },
  tabItem: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.2
  },
  centerScanHolder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22
  },
  scanButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6
  }
});
