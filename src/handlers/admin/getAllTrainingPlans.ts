import type { Context } from "hono";

import { Admin } from "../../classes/admin";
import { parseAdminAuthorization, getErrorMessage } from "../../helpers";
import { JSON_CONTENT_TYPE } from "../../helpers/constants";
import type { Env } from "../../types/bindings";

export async function getAllTrainingPlans(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const env: Env = ctx.env;

	if (contentType !== JSON_CONTENT_TYPE) {
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
		const trainingPlans = await admin.getAllTrainingPlans();
		const response = new Response(JSON.stringify(trainingPlans), { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const resposne = new Response(message, { status: 500 });
		return resposne;
	}
}
