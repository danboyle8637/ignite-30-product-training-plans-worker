export type ProgramId = "ignite_30_beginner" | "ignite_30_advanced";

export type ProgramTag =
	| "trial"
	| "all_styles"
	| "beginner"
	| "education"
	| "kettlebells"
	| "runners"
	| "arms_core"
	| "legs"
	| "recovery"
	| "intervals"
	| "all";

export type ProgramStyle =
	| "runners_strength"
	| "beginner_strength"
	| "sexy_abs"
	| "sexy_shoulders"
	| "tight_tush"
	| "max_calorie_burn"
	| "education"
	| "kettlebells"
	| "recovery"
	| "trial"
	| "foundation_14"
	| "foundation_workout"
	| "all";

export type WorkoutButtonLabel = "Workout With Us Live!" | "Recommended : 30" | "Recommended : 60" | "Coaching Session" | "Stretch Session";

export type RecommendedWorkoutType =
	| "coaching_workout"
	| "live_workout"
	| "30_minute_workout"
	| "60_minute_workout"
	| "stretch_workout"
	| "foundation_workout"
	| "fit_finisher_workout";

export type DailyGoalType =
	| "primary_goal"
	| "busy_goal"
	| "fit_challenge"
	| "nutrition_challenge"
	| "motivation_challenge"
	| "coaching_class"
	| "step_challenge";

export type LeaderboardType =
	| "total_points_leaderboard"
	| "longest_primary_goal_streak_leaderboard"
	| "longest_complete_day_streak_leaderboard"
	| "longest_fit_quickie_streak_leaderboard";

export type PointsType = DailyGoalType | "complete_day";

export type TrainingPlanStatus = "active" | "complete" | "canceled";

export type Membership =
	| "trial"
	| "monthly" // subscription
	| "3months" // subscription
	| "6months" // subscription
	| "6months_black_friday" // subscription
	| "12months_black_friday" // subscription
	| "3_for_2_special" // monthly subscription after 3 months
	| "summer_shred"
	| "strong_start"
	| "ignite_30_live"
	| "ignite_30_live_training_plan"
	| "kettlebell_clinic"
	| "kettlebell_strong_30"
	| "cancelled_member"
	| "cancelled_trial"
	| "wait_list";

export interface CoverImage {
	imageUrl: string;
	altTag: string;
	titleTag: string;
}

export interface TrainingPlanLogoImage {
	imageUrl: string;
	altTag: string;
	titleTag: string;
	width: string;
	height: string;
	mobileWidth: number;
	aboveMobileWidth: number;
	mobileTranslate: string;
	mobileTranslateHover: string;
	aboveMobileTranslate: string;
	aboveMobileTranslateHover: string;
}

interface WorkoutCoverImage {
	url: string;
	altTag: string;
	titleTag: string;
}

export interface Exercise {
	reps: string;
	exercise: string;
}

export type AssessmentTrackingGoal = "reps" | "time" | "rounds" | "weight_used";

export interface AssessmentGoal {
	type: AssessmentTrackingGoal;
	track: string;
}

export interface AssessmentCircuit {
	id: number;
	directions: string;
	exercises: Exercise[];
}

export interface AssessmentWorkout {
	title: string;
	description: string;
	coachingVideoId: string;
	workoutVideoId: string;
	coachingCover: WorkoutCoverImage;
	workoutCover: WorkoutCoverImage;
	goals: AssessmentGoal[];
	circuits: AssessmentCircuit[];
}

export interface WorkoutLink {
	id: number;
	workoutType: RecommendedWorkoutType;
	label: WorkoutButtonLabel | string;
	url: string;
}

export interface DailyGoal {
	type: DailyGoalType;
	goal: string;
	videoId?: string;
	hasGoalDetailsInSanity?: boolean;
}

export interface TrainingPlanDay {
	dailyGoals: DailyGoal[];
}

export interface TrainingPlanDays {
	[index: string]: TrainingPlanDay;
}

export interface TrainingPlan {
	programId: ProgramId;
	tags: ProgramTag[];
	title: string;
	description: string;
	coverImage: CoverImage;
	logoImage: TrainingPlanLogoImage;
	programOverviewVideoId: string;
	trainingPlanLength: number;
	maxPoints: number;
	isChallengePlan: boolean;
	memberOnly: boolean;
	assessmentWorkout: AssessmentWorkout | null;
	trainingPlanDays: TrainingPlanDays;
}

export interface TrainingPlanDayStatsRecord {
	trainingPlanDay: number;
	dayDate: string;
	dailyPoints: number;
	isPrimaryGoalComplete: boolean;
	isBusyGoalComplete: boolean;
	isFitnessChallengeComplete: boolean;
	isNutritionChallengeComplete: boolean;
	isMotivationChallengeComplete: boolean;
	isCoachingClassComplete: boolean;
	isStepChallengeComplete: boolean;
}

export interface TrainingPlanMissedDaysRecord {
	trainingPlanDay: number;
	dayDate: string;
}

export type HandleFunction =
	| "createTrainingPlanStatsRecord"
	| "toggleDayChallenge"
	| "handleMissedDays"
	| "getReportCardData"
	| "getLastDayCompleted"
	| "getCompletedDaysArray"
	| "getTrainingPlanStats"
	| "getTrainingPlanDayStats"
	| "getTrainingPlanDayGoalsDetails"
	| "getTrainingPlanDetails"
	| "cancelTrainingPlan"
	| "getTrainingPlanUserReportCard"
	| "getTrainingPlanLeaderboardsData"
	| "getTrainingPlanStartDate"
	| "getCompletedTrainingPlans"
	| "completeTrainingPlan"
	| "updateTrainingPlanMissedDaysStreak"
	| "getTrainingPlanReportCardData";

export interface TrainingPlanCardData {
	id: number;
	programId: ProgramId;
	attemptNumber: number;
}

export interface LastTrainingDayRecordedData {
	lastTrainingPlanDayStatsDayRecorded: number;
	lastTrainingPlanDayStatsDayDateRecorded: string;
}

export interface TrainingPlanDaysMissed {
	missedDays: number;
	recordsToCreate: number;
}
