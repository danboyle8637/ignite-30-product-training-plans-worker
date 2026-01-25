import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage, passesRateLimiter, createErrorLog } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { ProgramId, HandlerFunction } from "../types";
import type {
	ReportCardUserDataResBody,
	TrainingPlanLeaderboardRow,
	TrainingPlanLeaderboardResBody,
	GetTrainingPlanDayStatsResBody,
	TrainingPlanReportCardDataResBody,
} from "../types/responses";

export async function getTrainingPlanReportCardData(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const pathname = new URL(req.url).pathname;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramsProgramId = ctx.req.param("program_id") as ProgramId;
	const paramsTrainingPlanStatsId = ctx.req.param("stats_record_id");
	const paramsTrainingPlanMaxPoints = ctx.req.param("max_points");
	const env: Env = ctx.env;

	// LOGGING
	const endpoint = `/get-training-plan-report-card-data/${paramsProgramId}/${paramsTrainingPlanStatsId}/${paramsTrainingPlanMaxPoints}`;
	const handlerFunction: HandlerFunction = "getTrainingPlanReportCardData";

	if (contentType !== JSON_CONTENT_TYPE || !paramsProgramId || !paramsTrainingPlanStatsId || !paramsTrainingPlanMaxPoints) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const totalPossiblePoints = Number(paramsTrainingPlanMaxPoints);

	if (totalPossiblePoints === 0) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const userId = parseUserAuthorization(authorization);

	if (!userId) {
		const message = "Unauthorized access with no user_id";
		const errorQueuePromise = createErrorLog(endpoint, handlerFunction, 401, message, env);
		ctx.executionCtx.waitUntil(errorQueuePromise);
		const response = new Response("Bad Request", { status: 401 });
		return response;
	}

	if (env.ENVIRONMENT === "staging" || env.ENVIRONMENT === "production") {
		const passRateLimit = await passesRateLimiter(pathname, userId, env);

		if (passRateLimit === false) {
			const errorMessage = `Rate limit error based on this user_id: ${userId}`;
			const errorQueuePromise = createErrorLog(endpoint, handlerFunction, 401, errorMessage, env);
			ctx.executionCtx.waitUntil(errorQueuePromise);
			const message = "Failured Due To Frequency";
			const response = new Response(message, { status: 429 });
			return response;
		}
	}

	const trainingPlan = new TrainingPlans(env);

	try {
		// Report Card Data
		const trainingPlanStatsId = Number(paramsTrainingPlanStatsId);
		const reportCardData = await trainingPlan.getReportCardUserData(userId, paramsProgramId, trainingPlanStatsId, totalPossiblePoints);

		const reportCardDataResBody: ReportCardUserDataResBody = {
			userId: reportCardData.user_id,
			attemptNumber: reportCardData.attempt_number,
			totalPoints: reportCardData.total_points,
			bonusPoints: reportCardData.bonus_points,
			earnedPoints: reportCardData.earned_points,
			finalGrade: reportCardData.final_grade,
			longestPrimaryGoalStreak: reportCardData.longest_primary_goal_streak,
			longestCompleteDayStreak: reportCardData.longest_complete_day_streak,
			longestFitQuickieStreak: reportCardData.longest_fit_quickie_streak,
			longestDaysMissedStreak: reportCardData.longest_days_missed_streak,
		};

		// Leaderboard Data
		const leaderboards = await trainingPlan.getTrainingPlanLeaderboardData(paramsProgramId, "complete");

		const formattedLeaderboards: TrainingPlanLeaderboardRow[] = leaderboards.map((l) => ({
			username: l.username,
			avatarUrl: l.avatar_url,
			pointsStreak: l.points_streak,
			leaderboardType: l.leaderboard_type,
		}));

		const leaderboardResBody: TrainingPlanLeaderboardResBody = {
			leaderboardArrays: formattedLeaderboards,
		};

		// Get The Final Day Stats
		const statsRecordId = Number(paramsTrainingPlanStatsId);
		const trainingPlanDayStats = await trainingPlan.getTrainingPlanDayStats(userId, statsRecordId);

		const statsResBody: GetTrainingPlanDayStatsResBody = {
			trainingPlanDayStats: trainingPlanDayStats,
		};

		const resBody: TrainingPlanReportCardDataResBody = {
			reportCardData: reportCardDataResBody,
			leaderboardData: leaderboardResBody,
			statsData: statsResBody,
		};

		const response = new Response(JSON.stringify(resBody), { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const errorQueuePromise = createErrorLog(endpoint, handlerFunction, 401, message, env);
		ctx.executionCtx.waitUntil(errorQueuePromise);

		if (env.ENVIRONMENT === "staging" || env.ENVIRONMENT === "production") {
			ctx.executionCtx.waitUntil(errorQueuePromise);
		}

		const response = new Response(getErrorMessage(error), { status: 500 });
		return response;
	}
}
