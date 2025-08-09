import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage, passesRateLimiter, createErrorLog } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { Env } from "../types/bindings";
import type { ProgramId, HandlerFunction } from "../types";
import type { GetTrainingPlanStatsResBody } from "../types/responses";

export async function getTrainingPlanStats(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const pathname = new URL(req.url).pathname;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramProgramId = ctx.req.param("program_id") as ProgramId;
	const env: Env = ctx.env;

	// LOGGING
	const endpoint = `/get-training-plan-stats/${paramProgramId}`;
	const handlerFunction: HandlerFunction = "getTrainingPlanStats";

	if (contentType !== JSON_CONTENT_TYPE || !paramProgramId) {
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

	const trainingPlans = new TrainingPlans(env);

	try {
		const trainingPlanStats = await trainingPlans.getTrainingPlanStats(userId, paramProgramId);
		const { start_date, total_points, primary_goal_streak, complete_day_streak, fit_quickie_streak, days_missed_streak } =
			trainingPlanStats;

		const resBody: GetTrainingPlanStatsResBody = {
			startDate: start_date,
			totalPoints: total_points,
			primaryGoalStreak: primary_goal_streak,
			completeDayStreak: complete_day_streak,
			fitQuickieStreak: fit_quickie_streak,
			daysMissedStreak: days_missed_streak,
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
