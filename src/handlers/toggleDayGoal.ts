import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { DailyGoalType, ProgramId } from "../types";
import type { ToggleDayChallenge } from "../types/neon";
import type { ToggleDayChallengeReqBody } from "../types/requests";
import type { ErrorLog } from "../types/responses";
import type { Env } from "../types/bindings";

export async function toggleDayGoal(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramGoalType = ctx.req.param("goal_type") as DailyGoalType;
	const paramProgramId = ctx.req.param("program_id") as ProgramId;
	const env: Env = ctx.env;

	if (contentType !== JSON_CONTENT_TYPE || !paramGoalType || !paramProgramId) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const userId = parseUserAuthorization(authorization);

	if (!userId) {
		const response = new Response("Unauthorized", { status: 401 });
		return response;
	}

	const body: ToggleDayChallengeReqBody = await req.json();
	const { trainingPlanStatsRecordId, currentTrainingPlanDay, dayDate, currentDaysMissed } = body;

	if (trainingPlanStatsRecordId === undefined || currentTrainingPlanDay === undefined || dayDate === undefined) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const trainingPlans = new TrainingPlans(env);

	try {
		const toggleData: ToggleDayChallenge = {
			userId: userId,
			programId: paramProgramId,
			trainingPlanStatsRecordId: trainingPlanStatsRecordId,
			currentTrainingPlanDay: currentTrainingPlanDay,
			dayDate: dayDate,
			goalType: paramGoalType,
			currentDaysMissed: currentDaysMissed,
		};

		console.log("GOAL DATA: ", toggleData);

		await trainingPlans.toggleDayChallenge(toggleData);

		const response = new Response("Record updated", { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const errorLog: ErrorLog = {
			worker: "training_plan",
			endpoint: `/toggle-daily-goal/${paramGoalType}`,
			function: "toggleDayChallenge",
			status: 500,
			message: message,
			goalType: paramGoalType,
		};

		console.log("ERROR LOG: ", errorLog);

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
