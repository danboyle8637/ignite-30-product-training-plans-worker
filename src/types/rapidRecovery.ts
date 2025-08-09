export type ExerciseType = "mobility" | "stretch" | "trigger_ball";

export type VideoSessionType = "trigger_ball" | "stretch_mobility";

export interface RapidRecoveryWeeksData {
	cardData: {
		id: string;
		slug: string;
		cardImageUrl: string;
		cardImageAltTag: string;
		cardImageTitleTag: string;
		cardTitle: string;
		cardDescription: string;
	};
	videoSession: {
		id: string;
		videoType: string;
		videoHost: string;
		videoTitle: string;
		videoId: string;
		sessionWorkoutDetails: string;
	};
	exercises: {
		id: string;
		type: string;
		title: string;
		description: string;
		cardImageUrl: string;
		cardImageAltTag: string;
		cardImageTitleTag: string;
		cardImageWidth: string;
		cardImageHeight: string;
		breakdown: string;
	};
}

export interface RapidRecoveryWeekCard {
	id: string;
	cardImage: string;
	cardImageAltTag: string;
	cardImageTitleTag: string;
	cardTitle: string;
	cardDescripiton: string;
	sessionSlug: string;
}

export interface RapidRecoveryWeekData {
	videoSessions: RapidRecoveryVideoSession[];
	exercises: RapidRecoveryExercise[];
}

export interface RapidRecoveryExercise {
	id: string;
	type: ExerciseType;
	title: string;
	description: string;
	cardImageUrl: string;
	cardImageAltTag: string;
	cardImageTitleTag: string;
	cardImageWidth: string;
	cardImageHeight: string;
	breakdown: string;
}

export interface RapidRecoveryVideoSession {
	id: string;
	order: number;
	videoType: VideoSessionType;
	videoHost: string;
	videoTitle: string;
	videoId: string;
	sessionWoroutDetails: [];
}
