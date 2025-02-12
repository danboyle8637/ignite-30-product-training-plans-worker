import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { ProgramId, Membership } from "../types";
import type { ErrorLog } from "../types/responses";
import type { Env } from "../types/bindings";

export async function completeTrainingPlan(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramsProgramId = ctx.req.param("program_id") as ProgramId;
	const paramsStatsRecordId = ctx.req.param("stats_record_id");
	const paramsStartDate = ctx.req.param("start_date");
	const paramsTotalDaysInCurrentMonth = ctx.req.param("total_days_in_current_month");
	const paramsMembership = ctx.req.param("membership");
	const env: Env = ctx.env;

	if (
		contentType !== JSON_CONTENT_TYPE ||
		!paramsProgramId ||
		!paramsStatsRecordId ||
		!paramsStartDate ||
		!paramsTotalDaysInCurrentMonth ||
		!paramsMembership
	) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const userId = parseUserAuthorization(authorization);

	if (!userId) {
		const response = new Response("Bad Request", { status: 401 });
		return response;
	}

	const trainingPlan = new TrainingPlans(env);

	try {
		const statsRecordId = Number(paramsStatsRecordId);
		const totalDaysInCurrentMonth = Number(paramsTotalDaysInCurrentMonth);
		const membership = paramsMembership as Membership;

		await trainingPlan.completeTrainingPlan(userId, paramsProgramId, paramsStartDate, statsRecordId, totalDaysInCurrentMonth, membership);

		const response = new Response("success", { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const errorLog: ErrorLog = {
			worker: "training_plan",
			endpoint: `/complete-training-plan/${paramsProgramId}/${paramsStatsRecordId}/${paramsStartDate}/${paramsTotalDaysInCurrentMonth}/${paramsMembership}`,
			function: "completeTrainingPlan",
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
