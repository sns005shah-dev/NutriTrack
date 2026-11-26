// Minimalist iOS Vector Icons for Cal AI Monochrome Design
// Clean geometric vector paths using react-native-svg.

import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

export function HomeIcon({ size = 22, color = '#111111', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10L12 3L21 10V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DiaryIcon({ size = 22, color = '#111111', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="3" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M8 8H16M8 12H16M8 16H12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CameraIcon({ size = 22, color = '#FFFFFF', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function InsightsIcon({ size = 22, color = '#111111', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 20V10M12 20V4M6 20V14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ProfileIcon({ size = 22, color = '#111111', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M20 21C20 17.134 16.4183 14 12 14C7.58172 14 4 17.134 4 21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ScaleIcon({ size = 20, color = '#111111', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="4" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M12 4V8M9 8H15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx="12" cy="14" r="3" stroke={color} strokeWidth={strokeWidth} />
      <Line x1="12" y1="14" x2="13.5" y2="12.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function RulerIcon({ size = 20, color = '#111111', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 17L17 2L22 7L7 22L2 17Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M6 13L8.5 15.5M10 9L12.5 11.5M14 5L16.5 7.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ActivityIcon({ size = 20, color = '#111111', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 12H18L15 21L9 3L6 12H2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EditIcon({ size = 16, color = '#858585', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3L21 7L7 21H3V17L17 3Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchIcon({ size = 18, color = '#858585', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M20 20L16 16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 18, color = '#111111', strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 20, color = '#111111', strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 18, color = '#858585', strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CrossIcon({ size = 20, color = '#111111', strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 18, color = '#111111', strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TrashIcon({ size = 16, color = '#858585', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6H21M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function FlameIcon({ size = 16, color = '#111111', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.5 6 6 9.5 6 14C6 17.3137 8.68629 20 12 20C15.3137 20 18 17.3137 18 14C18 9.5 15.5 6 12 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 11C10.5 13 9.5 14.5 9.5 16C9.5 17.38 10.62 18.5 12 18.5C13.38 18.5 14.5 17.38 14.5 16C14.5 14.5 13.5 13 12 11Z"
        fill={color}
      />
    </Svg>
  );
}

export function SparkleIcon({ size = 18, color = '#7C3AED', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L14.4 8.3L21 9.3L16.2 14.1L17.5 21L12 17.8L6.5 21L7.8 14.1L3 9.3L9.6 8.3L12 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ScanReticleIcon({ size = 48, color = '#111111', strokeWidth = 2.4 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path d="M4 14V8C4 5.8 5.8 4 8 4H14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M34 4H40C42.2 4 44 5.8 44 8V14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M4 34V40C4 42.2 5.8 44 8 44H14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M34 44H40C42.2 44 44 42.2 44 40V34" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function NutriTrackLogo({ size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="102 96 318 320" fill="none">
      <Path
        d="M118 114 C118 109.582 121.582 106 126 106 C130.418 106 134 109.582 134 114 V176 C134 178.761 136.239 181 139 181 C141.761 181 144 178.761 144 176 V114 C144 109.582 147.582 106 152 106 C156.418 106 160 109.582 160 114 V176 C160 178.761 162.239 181 165 181 C167.761 181 170 178.761 170 176 V114 C170 109.582 173.582 106 178 106 C182.418 106 186 109.582 186 114 V142 L330 306 V248 L394 194 V392 C394 399.732 387.732 406 380 406 H330 L186 241 V392 C186 399.732 179.732 406 172 406 H132 C124.268 406 118 399.732 118 392 V114 Z"
        fill="#111111"
      />
      <Path
        d="M332 224 C322 162 348 118 396 106 C404 156 382 194 332 224 Z"
        fill="#22C55E"
      />
      <Path
        d="M346 200 C354 184 364 162 376 144"
        stroke="#FFFFFF"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function WaterDropIcon({ size = 18, color = '#0EA5E9', strokeWidth = 1.9 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69L17.66 8.35C20.78 11.47 20.78 16.53 17.66 19.65C14.54 22.77 9.46 22.77 6.34 19.65C3.22 16.53 3.22 11.47 6.34 8.35L12 2.69Z"
        fill="#E0F2FE"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 14.5C8.5 16.433 10.067 18 12 18"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function UndoIcon({ size = 14, color = '#858585', strokeWidth = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 14L4 9L9 4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 9H14.5C17.5376 9 20 11.4624 20 14.5C20 17.5376 17.5376 20 14.5 20H11"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default {
  HomeIcon,
  DiaryIcon,
  CameraIcon,
  InsightsIcon,
  ProfileIcon,
  ScaleIcon,
  RulerIcon,
  ActivityIcon,
  EditIcon,
  SearchIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CrossIcon,
  CheckIcon,
  TrashIcon,
  FlameIcon,
  SparkleIcon,
  ScanReticleIcon,
  NutriTrackLogo,
  WaterDropIcon,
  UndoIcon
};
