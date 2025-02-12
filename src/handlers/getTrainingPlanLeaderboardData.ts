import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { ProgramId, TrainingPlanStatus } from "../types";
import type { Env } from "../types/bindings";
import type { TrainingPlanLeaderboardRow, TrainingPlanLeaderboardResBody, ErrorLog } from "../types/responses";

export async function getTrainingPlanLeaderboardsData(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramsProgramId = ctx.req.param("program_id") as ProgramId;
	const paramsStatus = ctx.req.param("status") as TrainingPlanStatus;
	const paramsStartDate = ctx.req.param("start_date");
	const env: Env = ctx.env;

	if (contentType !== JSON_CONTENT_TYPE || !paramsProgramId || !paramsStatus) {
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
		const leaderboards = await trainingPlan.getTrainingPlanLeaderboardData(paramsProgramId, paramsStatus, paramsStartDate);

		const formattedLeaderboards: TrainingPlanLeaderboardRow[] = leaderboards.map((l) => ({
			username: l.username,
			avatarUrl: l.avatar_url,
			pointsStreak: l.points_streak,
			leaderboardType: l.leaderboard_type,
		}));

		const resBody: TrainingPlanLeaderboardResBody = {
			leaderboardArrays: formattedLeaderboards,
		};

		const response = new Response(JSON.stringify(resBody), { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const errorLog: ErrorLog = {
			worker: "training_plan",
			endpoint: `/get-training-plan-leaderboards/${paramsProgramId}/${paramsStartDate}`,
			function: "getTrainingPlanLeaderboardsData",
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
