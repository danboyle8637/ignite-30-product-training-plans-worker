import type { Context } from "hono";

export async function testHandler(ctx: Context): Promise<Response> {
	const req = ctx.req;
	const url = req.url;
	const pathname = new URL(url).pathname;

	console.log(pathname);

	const response = new Response("success", { status: 200 });
	return response;
}
