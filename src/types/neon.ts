import type { ProgramId, DailyGoalType, LeaderboardType, TrainingPlanStatus } from './index';

export interface CreateTrainigPlanStatsRecordData {
	startDate: string;
	endDate: string;
}

export interface ToggleDayChallenge {
	userId: string;
	programId: ProgramId;
	trainingPlanStatsRecordId: number;
	currentTrainingPlanDay: number;
	dayDate: string;
	goalType: DailyGoalType;
	currentDaysMissed: number;
}

// *********** NEON QUERY RESULTS *********** //

export interface LastDayCompletedQueryRow {
	training_plan_day: number;
	day_is_completed: boolean;
}

export interface TrainingPlanCompletedDaysArrayQueryResult {
	training_plan_day: number;
	day_date: string;
}

export interface TrainngPlanStatsQueryResult {
	start_date: string;
	total_points: number;
	primary_goal_streak: number;
	complete_day_streak: number;
	fit_quickie_streak: number;
	days_missed_streak: number;
}

export interface TrainingPlanDayStatsQueryResult {
	training_plan_day: number;
	day_date: string;
	daily_points: number;
	is_primary_goal_complete: boolean;
	is_busy_goal_complete: boolean;
	is_fitness_challenge_complete: boolean;
	is_nutrition_challenge_complete: boolean;
	is_motivation_challenge_complete: boolean;
	is_coaching_class_complete: boolean;
	is_step_challenge_complete: boolean;
}

export interface StartTrainingPlanResBody {
	active_training_plan_id: number;
}

export interface GetCompletedAndCancelledTrainingPlansResBody {
	id: number;
	program_id: ProgramId;
	attempt_number: number;
	status: TrainingPlanStatus;
	start_date: string;
	end_date: string;
}

export interface ReportCardUserDataQueryResBody {
	user_id: string;
	total_points: number;
	bonus_points: number;
	earned_points: number;
	final_grade: number;
	longest_primary_goal_streak: number;
	longest_complete_day_streak: number;
	longest_fit_quickie_streak: number;
	longest_days_missed_streak: number;
}

export interface TrainingPlanLeaderboardQueryRow {
	username: string;
	avatar_url: string;
	points_streak: number;
	leaderboard_type: LeaderboardType;
}

export interface TrainingPlanStartDateResBody {
	start_date: string;
}
