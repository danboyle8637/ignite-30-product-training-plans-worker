import type { Context } from "hono";

import { createErrorLog } from "../helpers";
import type { HandlerFunction } from "../types";
import type { Env } from "../types/bindings";

export async function badRequest(ctx: Context) {
	const env: Env = ctx.env;

	// LOGGING
	const endpoint = `/bad-request-endpoint`;
	const handlerFunction: HandlerFunction = "badRequest";

	const message = "Bad route and the bad request catchall endpoint was hit";
	const errorQueuePromise = createErrorLog(endpoint, handlerFunction, 401, message, env);
	ctx.executionCtx.waitUntil(errorQueuePromise);

	const response = new Response("Bad Request", { status: 500 });
	return response;
}
