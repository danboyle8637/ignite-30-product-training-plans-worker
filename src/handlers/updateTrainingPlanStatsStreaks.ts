import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { getErrorMessage, parseUserAuthorization } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { Env } from "../types/bindings";
import type { UpdateTrainingPlanStatsStreaksReqBody } from "../types/requests";
import type { ErrorLog } from "../types/responses";
import type { ProgramId } from "../types";

export async function updateTrainingPlanStatsStreaks(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramProgramId = ctx.req.param("program_id") as ProgramId;
	const paramStatsRecordId = ctx.req.param("stats_record_id");
	const env: Env = ctx.env;

	if (contentType !== JSON_CONTENT_TYPE || !paramProgramId || paramStatsRecordId === undefined) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const userId = parseUserAuthorization(authorization);

	if (!userId) {
		const response = new Response("Bad Request", { status: 401 });
		return response;
	}

	const body: UpdateTrainingPlanStatsStreaksReqBody = await req.json();
	const { primaryGoalStreak, completeDayStreak, fitQuickieStreak } = body;

	if (primaryGoalStreak === undefined || completeDayStreak === undefined || fitQuickieStreak === undefined) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const trainingPlan = new TrainingPlans(env);

	try {
		const statsRecordId = Number(paramStatsRecordId);
		await trainingPlan.updateTrainingPlanStatsStreaks(
			userId,
			paramProgramId,
			statsRecordId,
			primaryGoalStreak,
			completeDayStreak,
			fitQuickieStreak
		);

		const response = new Response("success", { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const errorLog: ErrorLog = {
			worker: "training_plan",
			endpoint: `/update-training-plan-stats-streaks/${paramProgramId}/${paramStatsRecordId}`,
			function: "updateTrainingPlanMissedDaysStreak",
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
