import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage, buildMissedDaysStatsArray, passesRateLimiter, createErrorLog } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { HandlerFunction } from "../types";
import type { HandleMissedDaysReqBody } from "../types/requests";
import type { Env } from "../types/bindings";
import type { HandleMissedDaysResBody } from "../types/responses";

export async function handleMissedDays(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const pathname = new URL(req.url).pathname;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const env: Env = ctx.env;

	// LOGGING
	const endpoint = `/handle-missed-days`;
	const handlerFunction: HandlerFunction = "handleMissedDays";

	if (contentType !== JSON_CONTENT_TYPE) {
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

	const body: HandleMissedDaysReqBody = await req.json();
	const {
		statsRecordId,
		programId,
		startDate,
		lastTrainingPlanDayStatsDayRecorded,
		lastTrainingPlanDayStatsDayDateRecorded,
		numberOfMissedDays,
		numberOfMissedDayRecordsToCreate,
		totalDaysInCurrentMonth,
	} = body;

	if (
		!statsRecordId ||
		!programId ||
		startDate === undefined ||
		numberOfMissedDays === undefined ||
		numberOfMissedDayRecordsToCreate === undefined ||
		lastTrainingPlanDayStatsDayRecorded === undefined ||
		lastTrainingPlanDayStatsDayDateRecorded === undefined ||
		!totalDaysInCurrentMonth
	) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const trainingPlans = new TrainingPlans(env);

	try {
		const missedDaysArrays = buildMissedDaysStatsArray(
			numberOfMissedDayRecordsToCreate,
			lastTrainingPlanDayStatsDayRecorded,
			lastTrainingPlanDayStatsDayDateRecorded,
			totalDaysInCurrentMonth,
			startDate
		);

		const { missedDaysQueryArray, missedDaysArray } = missedDaysArrays;

		await trainingPlans.updateTrainingPlanDayStatsAfterMissedDays(
			userId,
			programId,
			statsRecordId,
			numberOfMissedDays,
			missedDaysQueryArray
		);

		const resBody: HandleMissedDaysResBody = {
			missedDaysArray: missedDaysArray,
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
