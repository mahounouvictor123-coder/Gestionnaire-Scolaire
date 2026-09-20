import { Grade } from '../types';

/**
 * Règle stricte : Les notes sont modifiables par le professeur pendant 3 jours seulement (72 heures).
 * Passé 72 heures, la note est définitivement verrouillée.
 */
export const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 72 hours in milliseconds

export const getGradeCreationTimestamp = (grade: Grade): number => {
  if (grade.createdAt) {
    const t = new Date(grade.createdAt).getTime();
    if (!isNaN(t)) return t;
  }
  if (grade.date) {
    const t = new Date(grade.date).getTime();
    if (!isNaN(t)) return t;
  }
  return Date.now();
};

export const isGradeModifiable = (grade: Grade): boolean => {
  if (grade.isLockedByDeadline) return false;
  const createdTimestamp = getGradeCreationTimestamp(grade);
  const elapsed = Date.now() - createdTimestamp;
  return elapsed <= THREE_DAYS_MS;
};

export const getGradeDeadlineInfo = (grade: Grade): {
  isExpired: boolean;
  hoursRemaining: number;
  minutesRemaining: number;
  daysRemaining: number;
  text: string;
  deadlineDate: Date;
} => {
  const createdTimestamp = getGradeCreationTimestamp(grade);
  const deadlineTimestamp = createdTimestamp + THREE_DAYS_MS;
  const deadlineDate = new Date(deadlineTimestamp);
  const diff = deadlineTimestamp - Date.now();

  if (diff <= 0 || grade.isLockedByDeadline) {
    return {
      isExpired: true,
      hoursRemaining: 0,
      minutesRemaining: 0,
      daysRemaining: 0,
      text: "🔒 Verrouillé définitivement (délai de 3 jours écoulé)",
      deadlineDate
    };
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const remainingMinutes = totalMinutes % 60;

  let text = "";
  if (days > 0) {
    text = `⏳ Modifiable pendant encore ${days}j ${remainingHours}h`;
  } else if (remainingHours > 0) {
    text = `⏳ Modifiable pendant encore ${remainingHours}h ${remainingMinutes}min`;
  } else {
    text = `⏳ Attention ! Plus que ${remainingMinutes} minutes modifiables`;
  }

  return {
    isExpired: false,
    hoursRemaining: totalHours,
    minutesRemaining: totalMinutes,
    daysRemaining: days,
    text,
    deadlineDate
  };
};
