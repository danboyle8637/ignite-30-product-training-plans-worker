import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { ProgramId, Membership } from "../types";
import type { ErrorLog } from "../types/responses";
import type { Env } from "../types/bindings";

export async function cancelTrainingPlan(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramsProgramId = ctx.req.param("program_id") as ProgramId;
	const paramsStatsRecordId = ctx.req.param("stats_record_id");
	const paramsMembership = ctx.req.param("membership") as Membership;
	const env: Env = ctx.env;

	if (contentType !== JSON_CONTENT_TYPE || !paramsProgramId || !paramsStatsRecordId || !paramsMembership) {
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
		const membership = paramsMembership;
		const shouldCancelMembership =
			membership === "summer_shred" ||
			membership === "strong_start" ||
			membership === "ignite_30_live" ||
			membership === "ignite_30_live_training_plan" ||
			membership === "kettlebell_clinic" ||
			membership === "kettlebell_strong_30";

		await trainingPlans.cancelTrainingPlan(userId, paramsProgramId, statsRecordId, shouldCancelMembership);

		const response = new Response("success", { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const errorLog: ErrorLog = {
			worker: "training_plan",
			endpoint: `/cancel-training-plan/${paramsProgramId}/${paramsStatsRecordId}/${paramsMembership}`,
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
