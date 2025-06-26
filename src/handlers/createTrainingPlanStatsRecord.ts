import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage, passesRateLimiter } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { ProgramId } from "../types";
import type { StartTrainingPlanReqBody } from "../types/requests";
import type { Env } from "../types/bindings";

export async function createTrainingPlanStatsRecord(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const pathname = new URL(req.url).pathname;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramProgramId = ctx.req.param("program_id") as ProgramId;
	const env: Env = ctx.env;

	if (contentType !== JSON_CONTENT_TYPE || !paramProgramId) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const userId = parseUserAuthorization(authorization);

	if (!userId) {
		const response = new Response("Unauthorized", { status: 401 });
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

	const body: StartTrainingPlanReqBody = await req.json();
	const { startDate, endDate } = body;

	if (!startDate || !endDate) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const trainingPlans = new TrainingPlans(env);

	try {
		const recordId = await trainingPlans.createTrainingPlanStatsRecord(userId, paramProgramId, body);

		const reqBody = {
			recordId: recordId,
		};

		const response = new Response(JSON.stringify(reqBody), { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const response = new Response(message, { status: 500 });
		return response;
	}
}
