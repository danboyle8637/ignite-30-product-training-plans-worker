import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { Marketing } from "../classes/Marketing";
import { parseUserAuthorization, getErrorMessage, passesRateLimiter, createErrorLog } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { ProgramId, HandlerFunction } from "../types";
import type { StartTrainingPlanReqBody } from "../types/requests";

export async function createTrainingPlanStatsRecord(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const pathname = new URL(req.url).pathname;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramProgramId = ctx.req.param("program_id") as ProgramId;
	const env: Env = ctx.env;

	// LOGGING
	const endpoint = `/create-training-plan-stats-record/${paramProgramId}`;
	const handlerFunction: HandlerFunction = "createTrainingPlanStatsRecord";

	if (contentType !== JSON_CONTENT_TYPE || !paramProgramId) {
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

	const body: StartTrainingPlanReqBody = await req.json();
	const { startDate, endDate, emailAddress } = body;

	if (!startDate || !endDate || !emailAddress) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const trainingPlans = new TrainingPlans(env);
	const marketing = new Marketing(env);

	try {
		const recordId = await trainingPlans.createTrainingPlanStatsRecord(userId, paramProgramId, body);

		const tagName = "ignite30ProductInProgress";
		const addConvertKitTagRes = await marketing.addSubscripberToConvertKitWithTag(emailAddress, tagName);

		const addConvertKitTagStatus = addConvertKitTagRes.status;
		if (addConvertKitTagStatus !== 200) {
			const message = await addConvertKitTagRes.text();
			throw new Error(message);
		}

		const reqBody = {
			recordId: recordId,
		};

		const response = new Response(JSON.stringify(reqBody), { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const errorQueuePromise = createErrorLog(endpoint, handlerFunction, 401, message, env);
		ctx.executionCtx.waitUntil(errorQueuePromise);

		if (env.ENVIRONMENT === "staging" || env.ENVIRONMENT === "production") {
			ctx.executionCtx.waitUntil(errorQueuePromise);
		}

		const response = new Response(message, { status: 500 });
		return response;
	}
}
