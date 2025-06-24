import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage } from "../helpers";
import type { ProgramId } from "../types";
import type { CancelTrainingPlanResBody, ErrorLog } from "../types/responses";
import type { Env } from "../types/bindings";

export async function cancelTrainingPlan(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const headers = req.headers;
	const authorization = headers.get("Authorization") || "";
	const paramsProgramId = ctx.req.param("program_id") as ProgramId;
	const paramsStatsRecordId = ctx.req.param("stats_record_id");
	const env: Env = ctx.env;

	if (!paramsProgramId || !paramsStatsRecordId) {
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
		const statsRecordId = Number(paramsStatsRecordId);

		const attemptNumber = await trainingPlans.cancelTrainingPlan(userId, paramsProgramId, statsRecordId);

		const reqBody: CancelTrainingPlanResBody = {
			attemptNumber: attemptNumber,
		};

		const response = new Response(JSON.stringify(reqBody), { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const errorLog: ErrorLog = {
			worker: "training_plan",
			endpoint: `/cancel-training-plan/${paramsProgramId}/${paramsStatsRecordId}`,
			function: "cancelTrainingPlan",
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
