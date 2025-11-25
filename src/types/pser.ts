import type { RecipeType } from "./sanity";

export interface PserWeekCard {
	id: string;
	order: number;
	cardImage: string;
	cardImageAltTag: string;
	cardImageTitleTag: string;
	cardTitle: string;
	cardDescription: string;
	weekSlug: string;
}

export interface PserRecipe {
	id: string;
	type: RecipeType;
	title: string;
	cardImageUrl: string;
	cardImageAltTag: string;
	cardImageTitleTag: string;
	cardImageWidth: number;
	cardImageHeight: number;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	directions: [];
	ingredients: [];
	recipeNotes: [];
}
