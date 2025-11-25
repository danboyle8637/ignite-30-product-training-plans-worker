import type { HandlerFunction, DailyGoalType, TrainingPlanDayStatsRecord, ProgramId, LeaderboardType, TrainingPlanStatus } from "../types";
import type { RapidRecoveryWeekCard, RapidRecoveryWeekData } from "../types/rapidRecovery";
import type { PserWeekCard, PserRecipe } from "../types/pser";

export interface ErrorLog {
	environment: string;
	worker: string;
	endpoint: string;
	function: HandlerFunction;
	status: number;
	message: string;
	goalType?: DailyGoalType;
}

export interface GetLastDayCompletedResBody {
	lastDayCompleted: number;
}

export interface GetTrainingPlanStatsResBody {
	startDate: string;
	totalPoints: number;
	primaryGoalStreak: number;
	completeDayStreak: number;
	fitQuickieStreak: number;
	daysMissedStreak: number;
}

export interface GetTrainingPlanDayStatsResBody {
	trainingPlanDayStats: TrainingPlanDayStatsRecord[];
}

export interface GetTrainingPlanOverviewDataResBody {
	overviewData: {
		id: string;
		title: string;
		programId: ProgramId;
		description: [];
	};
}

export interface GetTrainingPlanDayGoalsDetailsResBody {
	workoutData: {
		id: string;
		primaryGoal: {
			goalLink: string | null;
			title: string | null;
			tags: string[] | null;
			isFoudationWorkout: boolean;
			isDrillWorkout: boolean;
			goalDetails: [] | null;
		};
		busyGoal: {
			goalLink: string | null;
			title: string | null;
			tags: string[] | null;
			isFoudationWorkout: boolean;
			isDrillWorkout: boolean;
			goalDetails: [] | null;
		};
		motivationGoal: {
			goalLink: string | null;
			title: string | null;
			goalDetails: [] | null;
		};
		coachingGoal: {
			goalLink: string | null;
			title: string | null;
			goalDetails: [] | null;
		};
	};
}

export interface HandleMissedDaysResBody {
	missedDaysArray: TrainingPlanDayStatsRecord[];
}

export interface ReportCardUserDataResBody {
	userId: string;
	totalPoints: number;
	bonusPoints: number;
	earnedPoints: number;
	finalGrade: number;
	longestPrimaryGoalStreak: number;
	longestCompleteDayStreak: number;
	longestFitQuickieStreak: number;
	longestDaysMissedStreak: number;
}

export interface TrainingPlanLeaderboardRow {
	username: string;
	avatarUrl: string;
	pointsStreak: number;
	leaderboardType: LeaderboardType;
}

export interface TrainingPlanLeaderboardResBody {
	leaderboardArrays: TrainingPlanLeaderboardRow[];
}

export interface GetCompletedTrainingPlanResBody {
	id: number;
	programId: ProgramId;
	attemptNumber: number;
	status: TrainingPlanStatus;
	startDate: string;
	endDate: string;
}

export interface TrainingPlanReportCardDataResBody {
	reportCardData: ReportCardUserDataResBody;
	leaderboardData: TrainingPlanLeaderboardResBody;
	statsData: GetTrainingPlanDayStatsResBody;
}

export interface CancelTrainingPlanResBody {
	attemptNumber: number | null;
}

export interface RapidRecoveryWeekCardsResBody {
	cards: RapidRecoveryWeekCard[];
}

export interface RapidRecoveryWeekSessionResBody {
	weekData: RapidRecoveryWeekData;
}

export interface PserWeekCardsResBody {
	cards: PserWeekCard[];
}

export interface PserWeekRecipesResBody {
	weekData: PserRecipe[];
}
