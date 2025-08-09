import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage, passesRateLimiter, createErrorLog } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { DailyGoalType, ProgramId, HandlerFunction } from "../types";
import type { ToggleDayChallenge } from "../types/neon";
import type { ToggleDayChallengeReqBody } from "../types/requests";
import type { Env } from "../types/bindings";

export async function toggleDayGoal(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const pathname = new URL(req.url).pathname;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramGoalType = ctx.req.param("goal_type") as DailyGoalType;
	const paramProgramId = ctx.req.param("program_id") as ProgramId;
	const env: Env = ctx.env;

	// LOGGING
	const endpoint = `/toggle-daily-goal/${paramGoalType}`;
	const handlerFunction: HandlerFunction = "toggleDayChallenge";

	if (contentType !== JSON_CONTENT_TYPE || !paramGoalType || !paramProgramId) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const userId = parseUserAuthorization(authorization);

	if (!userId) {
		const message = "Unauthorized access with no user_id";
		const errorQueuePromise = createErrorLog(endpoint, handlerFunction, 401, message, env);
		ctx.executionCtx.waitUntil(errorQueuePromise);
		const response = new Response("Unauthorized", { status: 401 });
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

	const body: ToggleDayChallengeReqBody = await req.json();
	const { trainingPlanStatsRecordId, currentTrainingPlanDay, dayDate, currentDaysMissed } = body;

	if (trainingPlanStatsRecordId === undefined || currentTrainingPlanDay === undefined || dayDate === undefined) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const trainingPlans = new TrainingPlans(env);

	try {
		const toggleData: ToggleDayChallenge = {
			userId: userId,
			programId: paramProgramId,
			trainingPlanStatsRecordId: trainingPlanStatsRecordId,
			currentTrainingPlanDay: currentTrainingPlanDay,
			dayDate: dayDate,
			goalType: paramGoalType,
			currentDaysMissed: currentDaysMissed,
		};

		await trainingPlans.toggleDayChallenge(toggleData);

		const response = new Response("Record updated", { status: 200 });
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
