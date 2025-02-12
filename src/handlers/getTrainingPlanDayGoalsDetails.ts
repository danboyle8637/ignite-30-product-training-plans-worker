import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { ProgramId } from "../types";
import type { Env } from "../types/bindings";
import type { GetTrainingPlanDayGoalsDetailsResBody, ErrorLog } from "../types/responses";

export async function getTrainingPlanDayGoalsDetails(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramsProgramId = ctx.req.param("program_id") as ProgramId;
	const paramsTrainingPlanDay = ctx.req.param("training_plan_day");
	const env: Env = ctx.env;

	if (contentType !== JSON_CONTENT_TYPE || !paramsProgramId || !paramsTrainingPlanDay) {
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
		const trainingPlanDay = Number(paramsTrainingPlanDay);
		const trainingPlanDayGoalsDetails = await trainingPlans.getDayGoalDetails(paramsProgramId, trainingPlanDay);

		const resBody: GetTrainingPlanDayGoalsDetailsResBody = {
			...trainingPlanDayGoalsDetails,
		};

		const response = new Response(JSON.stringify(resBody), { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const errorLog: ErrorLog = {
			worker: "training_plan",
			endpoint: `/get-training-plan-day-goals-details/${paramsProgramId}/${paramsTrainingPlanDay}`,
			function: "getTrainingPlanDayGoalsDetails",
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
