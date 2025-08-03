import type { Context } from "hono";

import { getErrorMessage, parseUserAuthorization } from "../../helpers";
import { JSON_CONTENT_TYPE } from "../../helpers/constants";
import { getRapidRecoveryWeekQuery } from "../../db/rapidRecovery";

export async function getRapidRecoveryData(ctx: Context): Promise<Response> {
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
}
