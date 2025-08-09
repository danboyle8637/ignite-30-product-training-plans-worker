import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { getErrorMessage, parseUserAuthorization, passesRateLimiter, createErrorLog } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { Env } from "../types/bindings";
import type { ProgramId, HandlerFunction } from "../types";
import type { UpdateTrainingPlanStatsStreaksReqBody } from "../types/requests";

export async function updateTrainingPlanStatsStreaks(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const pathname = new URL(req.url).pathname;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramProgramId = ctx.req.param("program_id") as ProgramId;
	const paramStatsRecordId = ctx.req.param("stats_record_id");
	const env: Env = ctx.env;

	// LOGGING
	const endpoint = `/update-training-plan-stats-streaks/${paramProgramId}/${paramStatsRecordId}`;
	const handlerFunction: HandlerFunction = "updateTrainingPlanMissedDaysStreak";

	if (contentType !== JSON_CONTENT_TYPE || !paramProgramId || paramStatsRecordId === undefined) {
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

	const body: UpdateTrainingPlanStatsStreaksReqBody = await req.json();
	const { primaryGoalStreak, completeDayStreak, fitQuickieStreak } = body;

	if (primaryGoalStreak === undefined || completeDayStreak === undefined || fitQuickieStreak === undefined) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const trainingPlan = new TrainingPlans(env);

	try {
		const statsRecordId = Number(paramStatsRecordId);
		await trainingPlan.updateTrainingPlanStatsStreaks(
			userId,
			paramProgramId,
			statsRecordId,
			primaryGoalStreak,
			completeDayStreak,
			fitQuickieStreak
		);

		const response = new Response("success", { status: 200 });
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
