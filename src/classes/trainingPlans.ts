import { neon } from "@neondatabase/serverless";
import { createClient } from "@sanity/client";
import type { NeonQueryFunction, NeonQueryPromise } from "@neondatabase/serverless";
import type { SanityClient } from "@sanity/client";
import type { Env } from "../types/bindings";

import { Queries } from "../db/queries";
import { programOverviewQuery, dailyGoalsDetailsQuery } from "../db/sanity";
import { getLastDayCompleted, calculateDaysMissed, buildMissedDaysStatsArray } from "../helpers";
import type {
	ProgramId,
	TrainingPlanDayStatsRecord,
	TrainingPlanMissedDaysRecord,
	TrainingPlanStatus,
	TrainingPlan,
	Membership,
} from "../types";
import type {
	CreateTrainigPlanStatsRecordData,
	ToggleDayChallenge,
	LastDayCompletedQueryRow,
	TrainingPlanCompletedDaysArrayQueryResult,
	TrainngPlanStatsQueryResult,
	TrainingPlanDayStatsQueryResult,
	StartTrainingPlanResBody,
	ReportCardUserDataQueryResBody,
	TrainingPlanLeaderboardQueryRow,
	TrainingPlanStartDateResBody,
	GetCompletedAndCancelledTrainingPlansResBody,
} from "../types/neon";

export class TrainingPlans extends Queries {
	private sanityConfig: SanityClient;
	private sql: NeonQueryFunction<any, any>;
	private env: Env;

	constructor(env: Env) {
		const activeUser = env.ENVIRONMENT === "dev" || env.ENVIRONMENT === "staging" ? env.NEON_STAGING_USER : env.NEON_PROD_USER;
		const activePassword = env.ENVIRONMENT === "dev" || env.ENVIRONMENT === "staging" ? env.NEON_STAGING_PASSWORD : env.NEON_PROD_PASSWORD;
		const activeHost = env.ENVIRONMENT === "dev" || env.ENVIRONMENT === "staging" ? env.NEON_STAGING_HOST : env.NEON_PROD_HOST;
		const activeDb = env.ENVIRONMENT === "dev" || env.ENVIRONMENT === "staging" ? env.NEON_STAGING_DB_NAME : env.NEON_PROD_DB_NAME;

		const databaseBranch = `postgres://${activeUser}:${activePassword}@${activeHost}/${activeDb}`;

		const sql = neon(databaseBranch);
		super();
		this.sql = sql;
		this.sanityConfig = createClient({
			projectId: env.SANITY_PROJECT_ID,
			dataset: env.SANITY_DATASET,
			useCdn: true,
			apiVersion: "2024-01-14",
			token: env.SANITY_TOKEN,
		});

		this.env = env;
	}

	async createTrainingPlanStatsRecord(userId: string, programId: ProgramId, data: CreateTrainigPlanStatsRecordData): Promise<number> {
		const queryResult: StartTrainingPlanResBody[] = await super.createTrainingPlanRecordQuery(this.sql, userId, programId, data);

		if (queryResult.length === 0) {
			throw new Error("User does not exist in the database");
		}

		const recordId = queryResult[0].active_training_plan_id;
		return recordId;
	}

	async toggleDayChallenge(data: ToggleDayChallenge): Promise<NeonQueryPromise<any, any>> {
		const { userId, programId, trainingPlanStatsRecordId, currentTrainingPlanDay, dayDate, goalType, currentDaysMissed } = data;
		return super.updateTrainingPlanDayStatsRecordByDayGoalQuery(
			this.sql,
			userId,
			programId,
			trainingPlanStatsRecordId,
			currentTrainingPlanDay,
			dayDate,
			goalType,
			currentDaysMissed
		);
	}

	async updateTrainingPlanStatsStreaks(
		userId: string,
		programId: ProgramId,
		statsRecordId: number,
		primaryGoalStreak: number,
		completeDayStreak: number,
		fitQuickieStreak: number
	) {
		return super.updateTrainingPlanStatsStreaksQuery(
			this.sql,
			userId,
			programId,
			statsRecordId,
			primaryGoalStreak,
			completeDayStreak,
			fitQuickieStreak
		);
	}

	async updateTrainingPlanDayStatsAfterMissedDays(
		userId: string,
		programId: ProgramId,
		trainingPlanStatsRecordId: number,
		numberOfMissedDays: number,
		missedDayRecordsToCreatesArray: TrainingPlanMissedDaysRecord[]
	) {
		return super.updateTrainingPlanDayStatsAfterMissedDaysQuery(
			this.sql,
			userId,
			programId,
			trainingPlanStatsRecordId,
			numberOfMissedDays,
			missedDayRecordsToCreatesArray
		);
	}

	async updateTrainingPlanStatsMissedDaysStreak(
		userId: string,
		programId: ProgramId,
		trainingPlanStatsRecordId: number,
		numberOfMissedDays: number
	) {
		return super.updateTrainingPlanStatsDaysMissedStreakQuery(this.sql, userId, programId, trainingPlanStatsRecordId, numberOfMissedDays);
	}

	async getTrainingPlanCompletedDays(userId: string, programId: ProgramId, trainingPlanStatsRecordId: number) {
		const queryResult: TrainingPlanCompletedDaysArrayQueryResult[] = await super.getTrainingPlanCompletedDaysArrayQuery(
			this.sql,
			userId,
			programId,
			trainingPlanStatsRecordId
		);
		return queryResult;
	}

	async getLastDayCompleted(userId: string, programId: ProgramId, trainingPlanStatsRecordId: number): Promise<number> {
		const queryResult: LastDayCompletedQueryRow[] = await super.getLastDayCompletedQuery(
			this.sql,
			userId,
			programId,
			trainingPlanStatsRecordId
		);

		if (queryResult.length === 0) {
			throw new Error("There is no active training plan or the user did not complete any days yet");
		}

		const lastDayCompleted = queryResult[0].training_plan_day;
		return lastDayCompleted;
	}

	async getTrainingPlanStats(userId: string, programId: ProgramId): Promise<TrainngPlanStatsQueryResult> {
		const queryResult: TrainngPlanStatsQueryResult[] = await super.getTrainingPlanStatsQuery(this.sql, userId, programId);

		if (queryResult.length === 0 || queryResult.length > 1) {
			throw new Error("Training plan stats could not be sent back.");
		}

		const trainingPlanStats = queryResult[0];
		return trainingPlanStats;
	}

	async getTrainingPlanDayStats(userId: string, trainingPlanStatsRecordId: number): Promise<TrainingPlanDayStatsRecord[]> {
		const queryResult: TrainingPlanDayStatsQueryResult[] = await super.getTrainingPlanDayStatsQuery(
			this.sql,
			userId,
			trainingPlanStatsRecordId
		);

		const trainingPlanResultsArray = queryResult.map((r): TrainingPlanDayStatsRecord => {
			return {
				trainingPlanDay: r.training_plan_day,
				dayDate: r.day_date,
				dailyPoints: r.daily_points,
				isPrimaryGoalComplete: r.is_primary_goal_complete,
				isBusyGoalComplete: r.is_busy_goal_complete,
				isFitnessChallengeComplete: r.is_fitness_challenge_complete,
				isNutritionChallengeComplete: r.is_nutrition_challenge_complete,
				isMotivationChallengeComplete: r.is_motivation_challenge_complete,
				isCoachingClassComplete: r.is_coaching_class_complete,
				isStepChallengeComplete: r.is_step_challenge_complete,
			};
		});

		return trainingPlanResultsArray;
	}

	async getCompletedAndCancelledTrainingPlans(userId: string) {
		const queryResult: GetCompletedAndCancelledTrainingPlansResBody[] = await super.getCompletedAndCancelledTrainingPlansQuery(
			this.sql,
			userId
		);
		return queryResult;
	}

	async cancelTrainingPlan(
		userId: string,
		programId: ProgramId,
		trainingPlanStatsRecordId: number,
		shouldCancelMembership: boolean
	): Promise<NeonQueryPromise<any, any>> {
		return super.cancelTrainingPlanQuery(this.sql, userId, trainingPlanStatsRecordId, programId, shouldCancelMembership);
	}

	async getReportCardUserData(userId: string, programId: ProgramId, trainingPlanStatsId: number, totalPossiblePoints: number) {
		const queryResult: ReportCardUserDataQueryResBody[] = await super.getTrainingPlanReportCardUserDataQuery(
			this.sql,
			userId,
			programId,
			trainingPlanStatsId,
			totalPossiblePoints
		);

		if (queryResult.length === 0) {
			const message = "Query came back with zero rows. Need to make sure there is no edge case in the query.";
			throw new Error(message);
		}

		const reportCardData = queryResult[0];
		return reportCardData;
	}

	async getTrainingPlanLeaderboardData(programId: ProgramId, status: TrainingPlanStatus, startDate?: string) {
		const queryResult: TrainingPlanLeaderboardQueryRow[] = await super.getTrainingPlanLeaderBoardDataQuery(
			this.sql,
			programId,
			status,
			startDate
		);
		return queryResult;
	}

	async getTrainingPlanStartDate(userId: string, programId: ProgramId, trainingPlanStatsId: number): Promise<string> {
		const queryResult: TrainingPlanStartDateResBody[] = await super.getTrainingPlanStartDateQuery(
			this.sql,
			userId,
			programId,
			trainingPlanStatsId
		);

		if (queryResult.length === 0 || queryResult.length > 1) {
			const message =
				"No training plans were found with that id or there were more than one. Contact support to help get this figured out.";
			throw new Error(message);
		}

		return queryResult[0].start_date;
	}

	async completeTrainingPlan(
		userId: string,
		programId: ProgramId,
		startDate: string,
		trainingPlanStatsRecordId: number,
		totalDaysInCurrentMonth: number,
		membership: Membership
	): Promise<NeonQueryPromise<any, any>> {
		const trainingPlanData = await this.env.FWW_LIVE_TRAINING_PLANS.get(programId);

		if (!trainingPlanData) {
			const message = "Could not get the trainign plan from the database (KV). Try again.";
			throw new Error(message);
		}

		const trainingPlan: TrainingPlan = JSON.parse(trainingPlanData);
		const trainingPlanLength = trainingPlan.trainingPlanLength;

		const queryResult: TrainingPlanDayStatsQueryResult[] = await super.getTrainingPlanDayStatsQuery(
			this.sql,
			userId,
			trainingPlanStatsRecordId
		);

		const trainingPlanResultsArray = queryResult.map((r): TrainingPlanDayStatsRecord => {
			return {
				trainingPlanDay: r.training_plan_day,
				dayDate: r.day_date,
				dailyPoints: r.daily_points,
				isPrimaryGoalComplete: r.is_primary_goal_complete,
				isBusyGoalComplete: r.is_busy_goal_complete,
				isFitnessChallengeComplete: r.is_fitness_challenge_complete,
				isNutritionChallengeComplete: r.is_nutrition_challenge_complete,
				isMotivationChallengeComplete: r.is_motivation_challenge_complete,
				isCoachingClassComplete: r.is_coaching_class_complete,
				isStepChallengeComplete: r.is_step_challenge_complete,
			};
		});

		const lastDayCompletedData = getLastDayCompleted(trainingPlanResultsArray);

		const { lastTrainingPlanDayStatsDayRecorded, lastTrainingPlanDayStatsDayDateRecorded } = lastDayCompletedData;

		const daysMissed = calculateDaysMissed(trainingPlanResultsArray, trainingPlanLength);

		if (daysMissed.missedDays > 0 && daysMissed.recordsToCreate > 0) {
			const missedDaysArrays = buildMissedDaysStatsArray(
				daysMissed.recordsToCreate,
				lastTrainingPlanDayStatsDayRecorded,
				lastTrainingPlanDayStatsDayDateRecorded,
				totalDaysInCurrentMonth,
				startDate
			);

			const { missedDaysQueryArray } = missedDaysArrays;

			await super.updateTrainingPlanDayStatsAfterMissedDaysQuery(
				this.sql,
				userId,
				programId,
				trainingPlanStatsRecordId,
				daysMissed.missedDays,
				missedDaysQueryArray
			);
		}

		const shouldCancelMembership =
			membership === "strong_start" ||
			membership === "summer_shred" ||
			membership === "ignite_30_live" ||
			membership === "ignite_30_live_training_plan" ||
			membership === "kettlebell_clinic" ||
			membership === "kettlebell_strong_30";

		return super.completeTrainingPlanQuery(this.sql, userId, programId, trainingPlanStatsRecordId, shouldCancelMembership);
	}

	// *********** ADMINISTRATION METHODS *********** //

	async emailKindal() {}

	// *********** SANITY DATA *********** //

	async getTrainingPlanOverviewData(programId: ProgramId) {
		return this.sanityConfig.fetch(programOverviewQuery, {
			programId: programId,
		});
	}

	async getDayGoalDetails(programId: ProgramId, trainingPlanDay: number) {
		return this.sanityConfig.fetch(dailyGoalsDetailsQuery, {
			programId: programId,
			trainingPlanDay: trainingPlanDay,
		});
	}

	// *********** ADMIN QUERY TO CREATE AND BUILD TEST DATA *********** //

	async createTestData() {
		return super.createTestDataQuery(this.sql);
	}

	// async createTestLeaderboardData() {
	// 	return super.createTestLeaderboardQuery(this.sql);
	// }
}
