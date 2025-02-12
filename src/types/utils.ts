import type { TrainingPlanDayStatsRecord, TrainingPlanMissedDaysRecord } from './index';

export type ActiveMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 99;

export interface ImportantDate {
	month: ActiveMonth;
	day: number;
	year: number;
}

export interface MissedDaysArrays {
	missedDaysQueryArray: TrainingPlanMissedDaysRecord[];
	missedDaysArray: TrainingPlanDayStatsRecord[];
}
