// NutriTrack AI Hydration Tracking Service
// Pure, date-isolated water intake tracking, progress calculation, and historical record helpers.

import { getLocalDateString } from './dateService.js';

export const DEFAULT_HYDRATION_GOAL_ML = 2500;
export const MAX_SINGLE_HYDRATION_ENTRY_ML = 5000;

/**
 * Formats millilitres cleanly, e.g. 750 -> "750 ml", 1250 -> "1,250 ml"
 */
export function formatWaterMl(ml = 0) {
  const val = Math.max(0, Math.round(Number(ml) || 0));
  return `${val.toLocaleString()} ml`;
}

/**
 * Formats millilitres into clean litres string, e.g. 2500 -> "2.5 L", 750 -> "0.75 L", 2000 -> "2 L"
 */
export function formatWaterLiters(ml = 0) {
  const val = Math.max(0, Number(ml) || 0);
  const liters = val / 1000;
  const formatted = Number(liters.toFixed(2)).toString();
  return `${formatted} L`;
}

/**
 * Formats a timestamp ISO string to concise local time, e.g. "2:45 PM"
 */
export function formatHydrationTime(timestampIso) {
  if (!timestampIso) return '';
  const d = new Date(timestampIso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Resolves the local YYYY-MM-DD date string for a hydration entry.
 */
export function resolveEntryDate(entry) {
  if (!entry) return '';
  if (entry.date && typeof entry.date === 'string') {
    return entry.date.slice(0, 10);
  }
  if (entry.timestamp) {
    return getLocalDateString(new Date(entry.timestamp));
  }
  return '';
}

/**
 * Creates a timestamped hydration entry stamped with actual local date and ISO time.
 */
export function createHydrationEntry(amountMl, dateStr, timestampIso) {
  const amount = Math.round(Number(amountMl) || 0);
  if (amount <= 0) {
    throw new Error('Water amount must be greater than 0 ml.');
  }
  if (amount > MAX_SINGLE_HYDRATION_ENTRY_ML) {
    throw new Error(`Single entry cannot exceed ${MAX_SINGLE_HYDRATION_ENTRY_ML} ml.`);
  }

  const nowIso = timestampIso || new Date().toISOString();
  const localDate = dateStr || getLocalDateString(new Date(nowIso));

  return {
    id: `hyd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: localDate,
    timestamp: nowIso,
    amountMl: amount
  };
}

/**
 * Returns chronologically sorted hydration entries strictly matching a local date string (YYYY-MM-DD).
 */
export function getHydrationEntriesForDate(hydrationLogs = [], dateStr) {
  if (!Array.isArray(hydrationLogs) || !dateStr) return [];
  return hydrationLogs
    .filter((entry) => resolveEntryDate(entry) === dateStr && (Number(entry.amountMl) || 0) > 0)
    .slice()
    .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
}

/**
 * Calculates total water consumed (in ml) for a specific local calendar date strictly from saved entries.
 */
export function calculateDailyHydrationMl(hydrationLogs = [], dateStr) {
  const entries = getHydrationEntriesForDate(hydrationLogs, dateStr);
  return entries.reduce((sum, entry) => sum + Math.max(0, Math.round(Number(entry.amountMl) || 0)), 0);
}

/**
 * Computes hydration progress metrics (percent, remaining, clamped bar width, goalReached).
 */
export function calculateHydrationProgress(consumedMl = 0, goalMl = DEFAULT_HYDRATION_GOAL_ML) {
  const safeConsumed = Math.max(0, Math.round(Number(consumedMl) || 0));
  const safeGoal = Number(goalMl) > 0 ? Math.round(Number(goalMl)) : DEFAULT_HYDRATION_GOAL_ML;
  const percent = Math.round((safeConsumed / safeGoal) * 100);
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const remainingMl = Math.max(0, safeGoal - safeConsumed);

  return {
    consumedMl: safeConsumed,
    goalMl: safeGoal,
    percent,
    clampedPercent,
    remainingMl,
    goalReached: safeConsumed >= safeGoal
  };
}

/**
 * Appends a new hydration entry for dateStr.
 */
export function addHydrationEntryToLogs(hydrationLogs = [], amountMl, dateStr, timestampIso) {
  const entry = createHydrationEntry(amountMl, dateStr, timestampIso);
  const nextLogs = [...(Array.isArray(hydrationLogs) ? hydrationLogs : []), entry];
  return { entries: nextLogs, addedEntry: entry };
}

/**
 * Undoes (removes) the most recent hydration entry strictly for dateStr.
 */
export function undoLastHydrationEntryForDate(hydrationLogs = [], dateStr) {
  if (!Array.isArray(hydrationLogs) || !dateStr) {
    return { entries: [], removedEntry: null };
  }
  const todayEntries = getHydrationEntriesForDate(hydrationLogs, dateStr);
  if (todayEntries.length === 0) {
    return { entries: hydrationLogs, removedEntry: null };
  }
  const lastEntry = todayEntries[todayEntries.length - 1];
  const nextLogs = hydrationLogs.filter((e) => e.id !== lastEntry.id);
  return { entries: nextLogs, removedEntry: lastEntry };
}

/**
 * Edits the ml quantity of an existing hydration entry.
 */
export function updateHydrationEntryInLogs(hydrationLogs = [], entryId, newAmountMl) {
  const amount = Math.round(Number(newAmountMl) || 0);
  if (amount <= 0) {
    throw new Error('Water amount must be greater than 0 ml.');
  }
  if (amount > MAX_SINGLE_HYDRATION_ENTRY_ML) {
    throw new Error(`Single entry cannot exceed ${MAX_SINGLE_HYDRATION_ENTRY_ML} ml.`);
  }
  if (!Array.isArray(hydrationLogs)) return [];

  return hydrationLogs.map((entry) =>
    entry.id === entryId
      ? { ...entry, amountMl: amount, updatedAt: new Date().toISOString() }
      : entry
  );
}

/**
 * Deletes an existing hydration entry by ID.
 */
export function deleteHydrationEntryFromLogs(hydrationLogs = [], entryId) {
  if (!Array.isArray(hydrationLogs)) return [];
  return hydrationLogs.filter((entry) => entry.id !== entryId);
}

/**
 * Aggregates historical hydration records grouped by date (newest first).
 */
export function getHydrationHistoryByDate(hydrationLogs = [], excludeDateStr = '') {
  if (!Array.isArray(hydrationLogs)) return [];
  const byDate = {};

  hydrationLogs.forEach((entry) => {
    const d = resolveEntryDate(entry);
    const amount = Math.max(0, Math.round(Number(entry.amountMl) || 0));
    if (!d || amount <= 0 || (excludeDateStr && d === excludeDateStr)) return;

    if (!byDate[d]) {
      byDate[d] = { date: d, totalMl: 0, entries: [] };
    }
    byDate[d].totalMl += amount;
    byDate[d].entries.push(entry);
  });

  return Object.values(byDate)
    .map((day) => ({
      ...day,
      entries: day.entries.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
