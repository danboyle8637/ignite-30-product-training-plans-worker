import type { Context } from "hono";

import { Programs } from "../../classes/Programs";
import { getErrorMessage, parseUserAuthorization, passesRateLimiter, createErrorLog } from "../../helpers";
import { JSON_CONTENT_TYPE } from "../../helpers/constants";
import type { HandlerFunction } from "../../types";
import type { PserWeekCard } from "../../types/pser";
import type { GetPserWeekCardsData } from "../../types/sanity";
import type { PserWeekCardsResBody } from "../../types/responses";

export async function getPserWeekCards(ctx: Context): Promise<Response> {
	const req = ctx.req.raw;
	const pathname = new URL(req.url).pathname;
	const headers = req.headers;
	const contentType = headers.get("Content-Type");
	const authorization = headers.get("Authorization") || "";
	const env: Env = ctx.env;

	// LOGGING
	const endpoint = `/get-pser-week-cards-data`;
	const handlerFunction: HandlerFunction = "getPserWeekCards";

	if (contentType !== JSON_CONTENT_TYPE) {
		const response = new Response("Bad Request", { status: 400 });
		return response;
	}

	const userId = parseUserAuthorization(authorization);

	if (!userId) {
		const message = "Unauthorized access with no user_id";
		const errorQueuePromise = createErrorLog(endpoint, handlerFunction, 401, message, env);
		ctx.executionCtx.waitUntil(errorQueuePromise);
		const response = new Response("Unauthorized", { status: 401 });
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

	const programs = new Programs(env, "pser");

	try {
		const pserWeekData: GetPserWeekCardsData = await programs.getPserWeekCards();
		const { pserWeekCardsData } = pserWeekData;

		const cards: PserWeekCard[] = pserWeekCardsData.map((c) => {
			const slug: string | undefined = c.weekSlug.split("-").pop();

			if (!slug) {
				const message = "Malformed pser week cards data";
				throw new Error(message);
			}

			return {
				id: c.id,
				order: c.order,
				cardImage: c.cardImage,
				cardImageAltTag: c.cardImageAltTag,
				cardImageTitleTag: c.cardImageTitleTag,
				cardTitle: c.cardTitle,
				cardDescription: c.cardDescription,
				weekSlug: slug,
			};
		});

		const resBody: PserWeekCardsResBody = {
			cards: cards,
		};

		const response = new Response(JSON.stringify(resBody), { status: 200 });
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
