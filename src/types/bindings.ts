export type Env = {
	ENVIRONMENT: 'dev' | 'staging' | 'production';
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
	FWW_LIVE_TRAINING_PLANS: KVNamespace;
	KINDAL_EMAIL: string;
	ADMIN_ENDPOINT_PASSWORD: string;
	TODOIST_TOKEN: string;
	FWW_LIVE_QUEUE: Queue<string>;
	FWW_LIVE_STAGING_QUEUE: Queue<string>;
	RATE_LIMITER: any;
};
