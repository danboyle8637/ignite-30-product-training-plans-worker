import { createClient } from "@sanity/client";
import type { SanityClient } from "@sanity/client";
import type { Env } from "../types/bindings";

import { getRapidRecoveryWeekQuery, getAllRapidRecoveryWeekCardsQuery, getRapidRecoveryWeekSessionData } from "../db/rapidRecovery";

export class RapidRecovery {
	private sanityProgramsConfig: SanityClient;
	private programId: string;

	constructor(env: Env) {
		this.programId = "rapid_recovery";
		this.sanityProgramsConfig = createClient({
			projectId: env.SANITY_PROGRAMS_PROJECT_ID,
			dataset: env.SANITY_PROGRAMS_DATASET,
			useCdn: true,
			apiVersion: "2024-01-14",
			token: env.SANITY_PROGRAMS_TOKEN,
		});
	}

	async getRapidRecoveryWeek() {
		return this.sanityProgramsConfig.fetch(getRapidRecoveryWeekQuery, {
			programId: this.programId,
		});
	}

	async getAllRapidRecoveryWeekCards() {
		return this.sanityProgramsConfig.fetch(getAllRapidRecoveryWeekCardsQuery);
	}

	async getRapidRecoveryWeekSessionData(week: number) {
		return this.sanityProgramsConfig.fetch(getRapidRecoveryWeekSessionData, {
			programId: this.programId,
			order: week,
		});
	}
}
