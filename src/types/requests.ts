import type { ProgramId, Membership } from "./index";

export interface StartTrainingPlanReqBody {
	startDate: string;
	endDate: string;
}

export interface ToggleDayChallengeReqBody {
	trainingPlanStatsRecordId: number;
	currentTrainingPlanDay: number;
	dayDate: string;
	currentDaysMissed: number;
}

export interface HandleMissedDaysReqBody {
	statsRecordId: number;
	programId: ProgramId;
	startDate: string;
	lastTrainingPlanDayStatsDayRecorded: number;
	lastTrainingPlanDayStatsDayDateRecorded: string;
	numberOfMissedDays: number;
	numberOfMissedDayRecordsToCreate: number;
	totalDaysInCurrentMonth: number;
}

export interface CancelTrainingPlanReqBody {
	membership: Membership;
	shouldCancelMembership: boolean;
}

export interface UpdateTrainingPlanStatsStreaksReqBody {
	primaryGoalStreak: number;
	completeDayStreak: number;
	fitQuickieStreak: number;
}
