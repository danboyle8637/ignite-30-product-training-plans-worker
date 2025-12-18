import { createClient } from "@sanity/client";
import type { SanityClient } from "@sanity/client";
import type { ProductId } from "../types/sanity";

import { getAllRapidRecoveryWeekCardsQuery, getRapidRecoveryWeekSessionDataQuery } from "../db/rapidRecovery";
import { getPserWeekCardsQuery, getPserWeekRecipesDataQuery, getPserCoachingClassesQuery } from "../db/pser";

export class Programs {
	private sanityProgramsConfig: SanityClient;
	private programId: ProductId;

	constructor(env: Env, programId: ProductId) {
		this.programId = programId;
		this.sanityProgramsConfig = createClient({
			projectId: env.SANITY_PROGRAMS_PROJECT_ID,
			dataset: env.SANITY_PROGRAMS_DATASET,
			useCdn: true,
			apiVersion: "2024-01-14",
			token: env.SANITY_PROGRAMS_TOKEN,
		});
	}

	async getAllRapidRecoveryWeekCards() {
		return this.sanityProgramsConfig.fetch(getAllRapidRecoveryWeekCardsQuery);
	}

	async getRapidRecoveryWeekSessionData(week: number) {
		return this.sanityProgramsConfig.fetch(getRapidRecoveryWeekSessionDataQuery, {
			programId: this.programId,
			order: week,
		});
	}

	async getPserWeekCards() {
		return this.sanityProgramsConfig.fetch(getPserWeekCardsQuery);
	}

	async getPserWeekRecipesData(week: number) {
		return this.sanityProgramsConfig.fetch(getPserWeekRecipesDataQuery, {
			programId: this.programId,
			order: week,
		});
	}

	async getPserCoachingClassesData(order: number) {
		return this.sanityProgramsConfig.fetch(getPserCoachingClassesQuery, {
			programId: this.programId,
			order: order,
		});
	}
}
