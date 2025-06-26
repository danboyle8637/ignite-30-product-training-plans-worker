import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage, passesRateLimiter } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { ProgramId } from "../types";
import type { Env } from "../types/bindings";
import type { ReportCardUserDataResBody, ErrorLog } from "../types/responses";

export async function getTrainingPlanReportCard(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const pathname = new URL(req.url).pathname;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramsProgramId = ctx.req.param("program_id") as ProgramId;
	const paramsTrainingPlanStatsId = ctx.req.param("stats_record_id");
	const paramsTrainingPlanTotalPossiblePoints = ctx.req.param("total_possible_points");
	const env: Env = ctx.env;

	if (contentType !== JSON_CONTENT_TYPE || !paramsProgramId || !paramsTrainingPlanStatsId || !paramsTrainingPlanTotalPossiblePoints) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const totalPossiblePoints = Number(paramsTrainingPlanTotalPossiblePoints);

	if (totalPossiblePoints === 0) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const userId = parseUserAuthorization(authorization);

	if (!userId) {
		const response = new Response("Bad Request", { status: 401 });
		return response;
	}

	if (env.ENVIRONMENT === "staging" || env.ENVIRONMENT === "production") {
		const passRateLimit = await passesRateLimiter(pathname, userId, env);

		if (passRateLimit === false) {
			const message = "Failured Due To Frequency";
			const response = new Response(message, { status: 429 });
			return response;
		}
	}

	const trainingPlan = new TrainingPlans(env);

	try {
		const trainingPlanStatsId = Number(paramsTrainingPlanStatsId);
		const reportCardData = await trainingPlan.getReportCardUserData(userId, paramsProgramId, trainingPlanStatsId, totalPossiblePoints);

		const resBody: ReportCardUserDataResBody = {
			userId: reportCardData.user_id,
			totalPoints: reportCardData.total_points,
			bonusPoints: reportCardData.bonus_points,
			earnedPoints: reportCardData.earned_points,
			finalGrade: reportCardData.final_grade,
			longestPrimaryGoalStreak: reportCardData.longest_primary_goal_streak,
			longestCompleteDayStreak: reportCardData.longest_complete_day_streak,
			longestFitQuickieStreak: reportCardData.longest_fit_quickie_streak,
			longestDaysMissedStreak: reportCardData.longest_days_missed_streak,
		};

		const response = new Response(JSON.stringify(resBody), { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const errorLog: ErrorLog = {
			worker: "training_plan",
			endpoint: `/get-training-plan-user-report-card/${paramsProgramId}/${paramsTrainingPlanStatsId}`,
			function: "getTrainingPlanUserReportCard",
			status: 500,
			message: message,
		};

		if (env.ENVIRONMENT === "staging") {
			ctx.executionCtx.waitUntil(env.FWW_LIVE_STAGING_QUEUE.send(JSON.stringify(errorLog)));
		}

		if (env.ENVIRONMENT === "production") {
			ctx.executionCtx.waitUntil(env.FWW_LIVE_QUEUE.send(JSON.stringify(errorLog)));
		}

		const response = new Response(getErrorMessage(error), { status: 500 });
		return response;
	}
}
