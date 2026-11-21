// Cal AI Monochrome Design System
// Pure white background, almost-black typography, light grey card surfaces, solid black buttons.

export const theme = {
  // Core Surfaces
  background: '#FFFFFF',        // Pure white background
  card: '#F6F6F6',              // Very light grey card surface
  cardElevated: '#FFFFFF',      // White surface for nested elements
  cardHover: '#EDEDED',
  
  // Borders & Dividers
  border: '#EAEAEA',            // Subtle grey border
  borderLight: '#F0F0F0',
  divider: '#EBEBEB',
  
  // Typography
  textPrimary: '#111111',       // Almost black
  textSecondary: '#858585',     // Elegant grey
  textMuted: '#9E9E9E',         // Subtle timestamp / unit grey
  
  // Action & Buttons
  buttonPrimary: '#111111',     // Solid black primary button
  buttonPrimaryText: '#FFFFFF', // Pure white text
  buttonSecondary: '#F0F0F0',   // Light grey pill
  buttonSecondaryText: '#111111',
  
  // Minimal Nutrition Trackers (Cal AI Monochrome Standard)
  calorieProgress: '#111111',   // Solid black progress stroke
  calorieTrack: '#EBEBEB',      // Crisp light grey track

  // Five Signature Nutrition Colors (Cal AI Consistent Palette)
  protein: '#3B82F6',           // Blue
  carbs: '#F59E0B',             // Orange
  fat: '#22C55E',               // Green
  fiber: '#A78BFA',             // Purple
  sugar: '#EC4899',             // Pink
  saturatedFat: '#EF4444',      // Red
  
  // Restrained Macro Accents (Pure monochrome base with subtle tints only where helpful)
  macroBarFill: '#111111',
  macroBarTrack: '#E5E5E5',
  
  // Essential subtle status
  success: '#111111',
  danger: '#DC2626',
  
  // Bottom Navigation
  tabBar: '#FFFFFF',
  tabBarBorder: '#EAEAEA',
  tabBarActive: '#111111',
  tabBarInactive: '#8E8E93'
};

export default theme;
