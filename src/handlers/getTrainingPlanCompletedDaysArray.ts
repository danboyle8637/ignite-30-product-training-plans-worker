import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage, passesRateLimiter } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { ProgramId } from "../types";
import type { Env } from "../types/bindings";
import type { ErrorLog } from "../types/responses";

export async function getTrainingPlanCompletedDaysArray(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const pathname = new URL(req.url).pathname;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramProgramId = ctx.req.param("program_id") as ProgramId;
	const paramStatsRecordId = ctx.req.param("stats_record_id");
	const env: Env = ctx.env;

	if (contentType !== JSON_CONTENT_TYPE || !paramProgramId || !paramStatsRecordId) {
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

	const trainingPlans = new TrainingPlans(env);

	try {
		const statsRecordId = Number(paramStatsRecordId);
		const completedDaysArray = await trainingPlans.getTrainingPlanCompletedDays(userId, paramProgramId, statsRecordId);

		const response = new Response(JSON.stringify(completedDaysArray), { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const errorLog: ErrorLog = {
			worker: "training_plan",
			endpoint: `/get-training-plan-completed-days-array/${paramProgramId}/${paramStatsRecordId}`,
			function: "getCompletedDaysArray",
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
