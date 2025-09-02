export type Environment = "dev" | "staging" | "production";

export type Env = {
	ENVIRONMENT: Environment;
	NEON_STAGING_USER: string;
	NEON_STAGING_PASSWORD: string;
	NEON_STAGING_HOST: string;
	NEON_STAGING_DB_NAME: string;
	NEON_PROD_USER: string;
	NEON_PROD_PASSWORD: string;
	NEON_PROD_HOST: string;
	NEON_PROD_DB_NAME: string;
	SANITY_PROJECT_ID: string;
	SANITY_DATASET: string;
	SANITY_TOKEN: string;
	SANITY_PROGRAMS_PROJECT_ID: string;
	SANITY_PROGRAMS_DATASET: string;
	SANITY_PROGRAMS_TOKEN: string;
	KINDAL_EMAIL: string;
	ADMIN_ENDPOINT_PASSWORD: string;
	TODOIST_TOKEN: string;
	IGNITE_30_PLANS_RATE_LIMITER: any;
	IGNITE_30_LOGGING_QUEUE: Queue<string>;
};
