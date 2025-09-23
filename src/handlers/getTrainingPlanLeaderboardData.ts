import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage, passesRateLimiter, createErrorLog } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { ProgramId, TrainingPlanStatus, HandlerFunction } from "../types";
import type { TrainingPlanLeaderboardRow, TrainingPlanLeaderboardResBody } from "../types/responses";

export async function getTrainingPlanLeaderboardsData(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const pathname = new URL(req.url).pathname;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramsProgramId = ctx.req.param("program_id") as ProgramId;
	const paramsStatus = ctx.req.param("status") as TrainingPlanStatus;
	const env: Env = ctx.env;

	// LOGGING
	const endpoint = `/get-training-plan-leaderboards/${paramsProgramId}`;
	const handlerFunction: HandlerFunction = "getTrainingPlanLeaderboardsData";

	if (contentType !== JSON_CONTENT_TYPE || !paramsProgramId || !paramsStatus) {
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
		const leaderboards = await trainingPlan.getTrainingPlanLeaderboardData(paramsProgramId, paramsStatus);

		const formattedLeaderboards: TrainingPlanLeaderboardRow[] = leaderboards.map((l) => ({
			username: l.username,
			avatarUrl: l.avatar_url,
			pointsStreak: l.points_streak,
			leaderboardType: l.leaderboard_type,
		}));

		const resBody: TrainingPlanLeaderboardResBody = {
			leaderboardArrays: formattedLeaderboards,
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
