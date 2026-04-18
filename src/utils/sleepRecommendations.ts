import { differenceInMonths, differenceInWeeks, addMinutes } from 'date-fns';

export interface WakeWindow {
  min: number; // minutes
  max: number; // minutes
}

export const WAKE_WINDOWS_BY_AGE: Record<string, WakeWindow> = {
  '0-4w': { min: 30, max: 60 },
  '1-3m': { min: 60, max: 90 },
  '3-4m': { min: 75, max: 120 },
  '5-7m': { min: 120, max: 180 },
  '7-10m': { min: 150, max: 210 },
  '11-14m': { min: 180, max: 240 },
  '14-24m': { min: 240, max: 360 },
};

export const getWakeWindowKey = (birthDate: Date, referenceDate: Date = new Date()): string => {
  const weeks = differenceInWeeks(referenceDate, birthDate);
  const months = differenceInMonths(referenceDate, birthDate);

  if (weeks <= 4) return '0-4w';
  if (months < 3) return '1-3m';
  if (months < 5) return '3-4m';
  if (months < 8) return '5-7m';
  if (months < 11) return '7-10m';
  if (months < 15) return '11-14m';
  return '14-24m';
};

export const getNextSleepRecommendation = (birthDate: Date, lastWakeUpTime: Date): { min: Date; max: Date } => {
  const key = getWakeWindowKey(birthDate, lastWakeUpTime);
  const window = WAKE_WINDOWS_BY_AGE[key];

  return {
    min: addMinutes(lastWakeUpTime, window.min),
    max: addMinutes(lastWakeUpTime, window.max),
  };
};
