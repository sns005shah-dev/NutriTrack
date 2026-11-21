// NutriTrack AI Central Date Handling Service
// Ensures consistent local calendar date keys (YYYY-MM-DD), safe timezone handling,
// and unambiguous date assignment across Home, Diary, Food Logging, and Insights.

/**
 * Returns a local calendar date string in YYYY-MM-DD format.
 * Avoids UTC shifting by using local year, month, and day.
 * @param {number|Date} dateOrOffsetDays - Optional offset in days (number) or a Date object
 * @returns {string} e.g. "2026-11-21"
 */
export function getLocalDateString(dateOrOffsetDays = 0) {
  let d;
  if (typeof dateOrOffsetDays === 'number') {
    d = new Date();
    if (dateOrOffsetDays !== 0) {
      d.setDate(d.getDate() + dateOrOffsetDays);
    }
  } else if (dateOrOffsetDays instanceof Date) {
    d = dateOrOffsetDays;
  } else if (typeof dateOrOffsetDays === 'string') {
    return dateOrOffsetDays.slice(0, 10);
  } else {
    d = new Date();
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date object set to 12:00:00 local time
 * to prevent timezone-related date shifts around midnight.
 * @param {string} dateStr - e.g. "2026-11-20"
 * @returns {Date}
 */
export function parseLocalDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length !== 3) return new Date();
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 12, 0, 0);
}

/**
 * Returns user-friendly label for a date string:
 * "Today", "Yesterday", or formatted like "Thu, Nov 20"
 * @param {string} dateStr - e.g. "2026-11-20"
 * @returns {string}
 */
export function formatDateHuman(dateStr) {
  if (!dateStr) return '';
  const today = getLocalDateString(0);
  const yesterday = getLocalDateString(-1);
  const tomorrow = getLocalDateString(1);

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  if (dateStr === tomorrow) return 'Tomorrow';

  const d = parseLocalDateString(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Returns a short day name (e.g. "Wed") and day number (e.g. 20)
 * @param {string} dateStr 
 */
export function getDayNameAndNum(dateStr) {
  const d = parseLocalDateString(dateStr);
  return {
    dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNum: d.getDate()
  };
}
