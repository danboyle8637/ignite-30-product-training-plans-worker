import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage, buildMissedDaysStatsArray } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { HandleMissedDaysReqBody } from "../types/requests";
import type { Env } from "../types/bindings";
import type { HandleMissedDaysResBody, ErrorLog } from "../types/responses";

export async function handleMissedDays(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const env: Env = ctx.env;

	if (contentType !== JSON_CONTENT_TYPE) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const userId = parseUserAuthorization(authorization);

	if (!userId) {
		const response = new Response("Bad Request", { status: 401 });
		return response;
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
		!lastTrainingPlanDayStatsDayRecorded ||
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
		const errorLog: ErrorLog = {
			worker: "training_plan",
			endpoint: `/handle-missed-days`,
			function: "handleMissedDays",
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
