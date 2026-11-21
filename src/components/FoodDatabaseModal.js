// Cal AI Minimalist USDA Food Database Modal
// 1,700+ verified foods with category pills, instant search, serving configuration, and solid black save button.

import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { DEFAULT_FOOD_DATABASE } from '../data/foods';
import { SearchIcon, CrossIcon } from './Icons';

const CATEGORIES = [
  'All',
  'Meat & Poultry',
  'Fish & Seafood',
  'Eggs & Dairy',
  'Grains & Breads',
  'Vegetables',
  'Fruits',
  'Nuts & Seeds',
  'Legumes & Beans'
];

export default function FoodDatabaseModal({
  visible = false,
  onClose,
  onAddFoodItem,
  defaultMealType = 'breakfast',
  customFoods = []
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMealType, setSelectedMealType] = useState(defaultMealType);
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedServingIdx, setSelectedServingIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { key: 'lunch', label: 'Lunch', icon: '🥗' },
    { key: 'dinner', label: 'Dinner', icon: '🥩' },
    { key: 'snacks', label: 'Snacks', icon: '🍎' }
  ];

  const allFoods = useMemo(() => {
    return [...customFoods, ...DEFAULT_FOOD_DATABASE];
  }, [customFoods]);

  const filteredFoods = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allFoods
      .filter((f) => {
        const matchCat = selectedCategory === 'All' || f.category === selectedCategory;
        const matchText = !q || f.name.toLowerCase().includes(q) || (f.category && f.category.toLowerCase().includes(q));
        return matchCat && matchText;
      })
      .slice(0, 50);
  }, [allFoods, search, selectedCategory]);

  const handleSelectFood = (food) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setSelectedFood(food);
    setSelectedServingIdx(0);
  };

  const handleConfirmAdd = () => {
    if (isSubmitting || !selectedFood) return;
    setIsSubmitting(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    const serving = (selectedFood.servings && selectedFood.servings[selectedServingIdx]) || {
      label: `${selectedFood.servingSize || 100}g`,
      grams: selectedFood.servingSize || 100
    };

    const multiplier = (serving.grams || 100) / 100;
    const p100 = selectedFood.per100g || {};

    const itemToAdd = {
      id: 'db_' + Date.now(),
      foodId: selectedFood.id,
      name: selectedFood.name,
      portion: serving.label,
      grams: serving.grams,
      calories: Math.round((p100.calories || 0) * multiplier),
      protein: Math.round((p100.protein || 0) * multiplier * 10) / 10,
      carbs: Math.round((p100.carbs || 0) * multiplier * 10) / 10,
      fat: Math.round((p100.fat || 0) * multiplier * 10) / 10,
      fiber: Math.round((p100.fiber || 0) * multiplier * 10) / 10,
      sugar: Math.round((p100.sugar || 0) * multiplier * 10) / 10,
      saturatedFat: Math.round((p100.saturatedFat || 0) * multiplier * 10) / 10,
      icon: selectedFood.icon || '🍽️'
    };

    if (onAddFoodItem) {
      onAddFoodItem(selectedMealType, [itemToAdd]);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      handleClose();
    }, 200);
  };

  const handleClose = () => {
    setSelectedFood(null);
    setSearch('');
    setSelectedServingIdx(0);
    setIsSubmitting(false);
    if (onClose) onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <CrossIcon size={20} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Search Foods</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.contentWrap}>
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

          {/* Search Box */}
          <View style={styles.searchBox}>
            <SearchIcon size={18} color="#858585" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search chicken breast, eggs, brown rice..."
              placeholderTextColor="#858585"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <CrossIcon size={16} color="#858585" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Horizontal Pills */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item}
            style={styles.categoryScroll}
            contentContainerStyle={{ paddingVertical: 2 }}
            renderItem={({ item }) => {
              const active = selectedCategory === item;
              return (
                <TouchableOpacity
                  style={[
                    styles.categoryPill,
                    active && styles.categoryPillActive
                  ]}
                  onPress={() => setSelectedCategory(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      active && styles.categoryPillTextActive
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Food Search Results */}
          {!selectedFood ? (
            <FlatList
              data={filteredFoods}
              keyExtractor={(item) => item.id}
              style={styles.foodList}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const p100 = item.per100g || {};
                return (
                  <TouchableOpacity
                    style={styles.foodRow}
                    onPress={() => handleSelectFood(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.foodIcon}>{item.icon || '🍽️'}</Text>
                    <View style={styles.foodDetails}>
                      <Text style={styles.foodName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.foodCategory}>
                        {item.servingDesc || '100g base'} • {item.category}
                      </Text>
                    </View>
                    <View style={styles.foodCaloriesCol}>
                      <Text style={styles.foodCalories}>
                        {p100.calories || 0} kcal
                      </Text>
                      <Text style={styles.foodMacros}>
                        {p100.protein}p • {p100.carbs}c • {p100.fat}f
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            /* Selected Food Serving Configuration */
            <View style={styles.portionCard}>
              <View style={styles.portionTopRow}>
                <Text style={styles.selectedFoodIcon}>{selectedFood.icon || '🍽️'}</Text>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.selectedFoodTitle}>{selectedFood.name}</Text>
                  <Text style={styles.selectedFoodSub}>{selectedFood.category}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFood(null)}>
                  <Text style={styles.changeLink}>Change</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
                SELECT PORTION SIZE:
              </Text>

              <View style={styles.servingsList}>
                {(selectedFood.servings || [{ label: '100 grams', grams: 100 }]).map((serv, idx) => {
                  const active = selectedServingIdx === idx;
                  const mult = (serv.grams || 100) / 100;
                  const p100 = selectedFood.per100g || {};
                  const cals = Math.round((p100.calories || 0) * mult);

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.servingRow,
                        active && styles.servingRowActive
                      ]}
                      onPress={() => setSelectedServingIdx(idx)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.servingLabelText, active && { fontWeight: '800' }]}>
                        {serv.label}
                      </Text>
                      <Text style={[styles.servingCalText, active && { color: '#111111' }]}>
                        {cals} kcal
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Solid Black Save Button with Double-Tap Protection */}
              <TouchableOpacity
                style={[styles.confirmAddBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleConfirmAdd}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmAddText}>
                  Save to {mealTypes.find(m => m.key === selectedMealType)?.label || 'Diary'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  contentWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16
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
    marginBottom: 14
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#111111',
    marginLeft: 8
  },
  categoryScroll: {
    maxHeight: 38,
    marginBottom: 14
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginRight: 8
  },
  categoryPillActive: {
    backgroundColor: '#111111',
    borderColor: '#111111'
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111111'
  },
  categoryPillTextActive: {
    color: '#FFFFFF'
  },
  foodList: {
    flex: 1
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginBottom: 8
  },
  foodIcon: {
    fontSize: 22,
    marginRight: 10
  },
  foodDetails: {
    flex: 1,
    marginRight: 8
  },
  foodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111'
  },
  foodCategory: {
    fontSize: 11,
    color: '#858585',
    marginTop: 2
  },
  foodCaloriesCol: {
    alignItems: 'flex-end'
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111'
  },
  foodMacros: {
    fontSize: 10,
    color: '#858585',
    marginTop: 2
  },
  portionCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 16,
    marginTop: 4
  },
  portionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  selectedFoodIcon: {
    fontSize: 30,
    marginRight: 10
  },
  selectedFoodTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111111'
  },
  selectedFoodSub: {
    fontSize: 12,
    color: '#858585',
    marginTop: 1
  },
  changeLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111'
  },
  servingsList: {
    marginVertical: 10
  },
  servingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginBottom: 8
  },
  servingRowActive: {
    borderColor: '#111111',
    borderWidth: 1.5
  },
  servingLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111'
  },
  servingCalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#858585'
  },
  confirmAddBtn: {
    height: 52,
    backgroundColor: '#111111',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  confirmAddText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  }
});
