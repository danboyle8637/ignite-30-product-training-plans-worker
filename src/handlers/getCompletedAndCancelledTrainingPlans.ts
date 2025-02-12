import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { GetCompletedTrainingPlanResBody } from "../types/responses";
import type { ErrorLog } from "../types/responses";
import type { Env } from "../types/bindings";

export async function getCompletedAndCancelledTrainingPlans(ctx: Context): Promise<Response> {
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

	const trainingPlans = new TrainingPlans(env);

	try {
		const completedAndCancelledTrainingPlansRes = await trainingPlans.getCompletedAndCancelledTrainingPlans(userId);

		const resBody: GetCompletedTrainingPlanResBody[] = completedAndCancelledTrainingPlansRes.map((d) => ({
			id: d.id,
			programId: d.program_id,
			attemptNumber: d.attempt_number,
			status: d.status,
			startDate: d.start_date,
			endDate: d.end_date,
		}));

		const response = new Response(JSON.stringify(resBody), { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const errorLog: ErrorLog = {
			worker: "training_plan",
			endpoint: `/get-completed-training-plans`,
			function: "getCompletedTrainingPlans",
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
