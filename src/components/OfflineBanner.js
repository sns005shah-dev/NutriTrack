// Cal AI Minimalist Offline Indicator Banner
// Informs user when device is offline without disrupting local diary or database access.

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        setIsOffline(false);
        setDismissed(false);
      };
      const handleOffline = () => {
        setIsOffline(true);
        setDismissed(false);
      };

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setIsOffline(true);
      }

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.dot} />
      <Text style={styles.text}>
        Offline Mode • Local diary & search active. AI requires internet.
      </Text>
      <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.dismiss}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1E1E1E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333'
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F59E0B',
    marginRight: 8
  },
  text: {
    flex: 1,
    fontSize: 11,
    color: '#E0E0E0',
    fontWeight: '600'
  },
  dismiss: {
    fontSize: 12,
    color: '#858585',
    fontWeight: '700',
    paddingLeft: 8
  }
});
