import type { Context } from "hono";

import { Admin } from "../../classes/admin";
import { parseAdminAuthorization, getErrorMessage } from "../../helpers";
import { JSON_CONTENT_TYPE } from "../../helpers/constants";
import type { TrainingPlanName } from "../../types/admin";
import type { Env } from "../../types/bindings";

export async function getTrainingPlan(ctx: Context) {
	const req = ctx.req.raw;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const param = ctx.req.param("training_plan_name") as TrainingPlanName;
	const env: Env = ctx.env;

	if (contentType !== JSON_CONTENT_TYPE || !param) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const isAuthenticated = parseAdminAuthorization(authorization, env);

	if (!isAuthenticated) {
		const response = new Response("Bad Request", { status: 401 });
		return response;
	}

	const admin = new Admin(env);

	try {
		const trainingPlan = await admin.getTrainingPlan(param);

		const response = new Response(JSON.stringify(trainingPlan), { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const response = new Response(message, { status: 500 });
		return response;
	}
}
