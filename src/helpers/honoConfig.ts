import { cors } from "hono/cors";

export const corsConfig = cors({
	origin: [
		"http://localhost:3000",
		"http://localhost:4000",
		"http://127.0.0.1:8788/",
		"https://ignite30.app",
		"https://staging.ignite30.app",
		"https://fitwomensweekly.com",
	],
	allowHeaders: ["Content-Type", "Authorization"],
	allowMethods: ["GET", "POST", "DELETE", "OPTIONS", "HEAD", "PATCH"],
	maxAge: 86400,
	credentials: true,
});
