# 🥗 NutriTrack AI — Cal AI Monochrome iOS Application

A minimalist, sophisticated nutrition-tracking application inspired by **Cal AI's iconic black and white iOS aesthetic**, built with **React Native** and **Expo SDK 58**. Powered by **Google Gemini 3.5 Flash-Lite Multimodal Vision** for photo plate scanning and compound natural language meal logging.

---

## 🎨 Visual Identity & Design System

- **Palette**: Pure white (`#FFFFFF`) background, almost-black (`#111111`) typography and primary action buttons, elegant grey (`#858585`) secondary labels, very light grey (`#F6F6F6`) card surfaces, and subtle borders (`#EAEAEA`).
- **Calorie Progress Meter**: Large circular indicator with a **thick solid black progress stroke** and large bold numerical remaining focus (`1,450 REMAINING`).
- **Macro Cards**: Protein, Carbs, and Fat in separate minimal light grey cards with thin black progress bars.
- **Central Action**: Solid black circular button (`#111111`) with a white camera icon on the bottom navigation bar.
- **Food Scanner**: Multimodal camera & gallery food scanning with pre-save portion editing and solid black save button.
- **Food Diary**: Minimalist daily view with horizontal day selector strip, daily totals bar, and Breakfast/Lunch/Dinner/Snacks cards.
- **Insights**: 7-day calorie trend bar chart and detailed nutrient breakdown.

---

## 📱 How to Run on iPhone (Windows, No Mac, $0 Budget)

Open PowerShell:
```powershell
$env:Path = "C:\Users\sns00\.gemini\antigravity\scratch\nodejs;" + $env:Path
Set-Location "C:\Users\sns00\.gemini\antigravity\scratch\nutritrack-app"
npx expo start --tunnel
```

Scan the terminal QR code with your iPhone Camera to open in **Expo Go**.
