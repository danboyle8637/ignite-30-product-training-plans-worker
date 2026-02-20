import type { Context } from "hono";

import { TrainingPlans } from "../classes/trainingPlans";
import { parseUserAuthorization, getErrorMessage, passesRateLimiter, createErrorLog } from "../helpers";
import { JSON_CONTENT_TYPE } from "../helpers/constants";
import type { ProgramId, HandlerFunction, WorkoutListDayGoalDetails } from "../types";
import type { SanityWorkoutListData } from "../types/sanity";
import type { GetWorkoutListResBody } from "../types/responses";

export async function getTrainingPlanWorkoutList(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const pathname = new URL(req.url).pathname;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const paramProgramId = ctx.req.param("program_id") as ProgramId;
	const env: Env = ctx.env;

	// LOGGING
	const endpoint = `/get-training-plan-workout-list/${paramProgramId}`;
	const handlerFunction: HandlerFunction = "getTrainingPlanWorkoutList";

	if (contentType !== JSON_CONTENT_TYPE || !paramProgramId) {
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

	const trainingPlans = new TrainingPlans(env);

	try {
		const workoutListsData: SanityWorkoutListData = await trainingPlans.getWorkoutListData(paramProgramId);

		const dayGoalDetails: WorkoutListDayGoalDetails[] = workoutListsData.workoutListData.map((d) => {
			return {
				trainingPlanDay: d.trainingPlanDay,
				primaryGoal: d["primaryGoal"] || null,
				busyGoal: d["busyGoal"] || null,
				motivationGoal: d["motivationGoal"] || null,
				coachingGoal: d["coachingGoal"] || null,
			};
		});

		const reqBody: GetWorkoutListResBody = {
			workoutListData: dayGoalDetails,
		};

		const response = new Response(JSON.stringify(reqBody), { status: 200 });
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
