import type { RapidRecoveryWeekCard, RapidRecoveryWeekData } from "./rapidRecovery";

type ExerciseType = "strength" | "stretch" | "mobility" | "trigger_ball" | "running";

type VideoHost = "youtube" | "cloudflare";

type VideoType =
	| "workout"
	| "stretch"
	| "mobility"
	| "stretch_mobility"
	| "trigger_ball"
	| "recipe_ingredients"
	| "recipe_directions"
	| "coaching";

export interface Exercise {
	id: string;
	type: ExerciseType;
	title: string;
	description: string;
	cardImageUrl: string;
	cardAltTag: string;
	cardTitleTag: string;
	cardImageWidth: number;
	cardImageHeight: number;
	breakdown: [];
}

export interface VideoWorkoutSession {
	id: string;
	videoType: VideoType;
	videoHost: VideoHost;
	videoTitle: string;
	videoId: string;
	workoutDetails: [];
}

export interface CardData {
	id: string;
	slug: string;
	cardImageUrl: string;
	cardImageAltTag: string;
	cardImageTitleTag: string;
	cardTitle: string;
	cardDescription: string;
}

// Rapid Recovery

export interface GetAllRapidRecoveryWeekCardsData {
	rapidRecoveryWeekCardsData: RapidRecoveryWeekCard[];
}

export interface GetRapidRecoveryWeekSessionData {
	rapidRecoveryWeekData: RapidRecoveryWeekData;
}
