import type { RapidRecoveryWeekCard, RapidRecoveryWeekData } from "./rapidRecovery";
import type { PserWeekCard, PserRecipe, CoachingClass } from "./pser";

export type ProductId = "rapid_recovery" | "pser";

export type RecipeType = "breakfast" | "lunch" | "dinner" | "dessert" | "snake" | "shake";

type VideoType =
	| "workout"
	| "stretch"
	| "mobility"
	| "stretch_mobility"
	| "trigger_ball"
	| "recipe_ingredients"
	| "recipe_directions"
	| "coaching";

// ******* Rapid Recovery ******* //

export interface GetAllRapidRecoveryWeekCardsData {
	rapidRecoveryWeekCardsData: RapidRecoveryWeekCard[];
}

export interface GetRapidRecoveryWeekSessionData {
	rapidRecoveryWeekData: RapidRecoveryWeekData;
}

// ******* Plan Smart Eat Real ******* //

export interface GetPserWeekCardsData {
	pserWeekCardsData: PserWeekCard[];
}

export interface GetPserWeekRecipesData {
	pserWeekRecipesData: { recipes: PserRecipe[] };
}

export interface SanityImage {
	_ref: string;
	_type: string;
}

export interface GetPserCoachingClassesData {
	pserCoachingClassesData: { videos: CoachingClass[] };
}
