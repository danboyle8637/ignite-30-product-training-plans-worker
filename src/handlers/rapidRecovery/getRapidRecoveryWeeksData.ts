import type { Context } from "hono";

import { RapidRecovery } from "../../classes/RapidRecovery";
import { getErrorMessage, parseUserAuthorization, passesRateLimiter } from "../../helpers";
import { JSON_CONTENT_TYPE } from "../../helpers/constants";
import { ErrorLog } from "../../types/responses";
import type { Env } from "../../types/bindings";

export async function getRapidRecoveryWeeksData(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const pathname = new URL(req.url).pathname;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const env: Env = ctx.env;

	if (contentType !== JSON_CONTENT_TYPE) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const userId = parseUserAuthorization(authorization);

	if (!userId) {
		const response = new Response("Unauthorized", { status: 401 });
		return response;
	}

	if (env.ENVIRONMENT === "staging" || env.ENVIRONMENT === "production") {
		const passRateLimit = await passesRateLimiter(pathname, userId, env);

		if (passRateLimit === false) {
			const message = "Failured Due To Frequency";
			const response = new Response(message, { status: 429 });
			return response;
		}
	}

	const rapidRecovery = new RapidRecovery(env);

	try {
		const rapidRecoveryData = await rapidRecovery.getRapidRecoveryWeek();
		const response = new Response(JSON.stringify(rapidRecoveryData), { status: 200 });
		return response;
	} catch (error) {
		const message = getErrorMessage(error);
		const errorLog: ErrorLog = {
			worker: "training_plan",
			endpoint: `/get-rapid-recovery-weeks-data`,
			function: "getRapidRecoveryWeeksData",
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
