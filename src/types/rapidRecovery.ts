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
}

export interface RapidRecoveryWeekData {
	videoSession: {
		id: string;
		videoType: string;
		videoHost: string;
		videoTitle: string;
		videoId: string;
		sessionWorkoutDetails: [];
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

export interface RapidRecoveryExerciseCardsData {
	exercises: {
		id: string;
		type: string;
		title: string;
		description: string;
		cardImage: string;
		cardImageAltTag: string;
		cardImageTitleTag: string;
		cardImageWidth: string;
		cardImageHeight: string;
	};
}

export interface RapidRecoveryVideoAndWorkoutData {
	videoSession: {
		id: string;
		videoType: string;
		videoHost: string;
		videoTitle: string;
		videoId: string;
		sessionWoroutDetails: [];
	};
}
