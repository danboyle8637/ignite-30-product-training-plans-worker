import type { ConvertKitTagList, ConvertKitTag } from "../types/convertKit";

export class Marketing {
	private env: Env;
	private convertKitBaseUrl: string;

	constructor(env: Env) {
		this.env = env;
		this.convertKitBaseUrl = "https://api.convertkit.com/v3";
	}

	async addSubscripberToConvertKitWithTag(emailAddress: string, tagName: string) {
		const listTagsUrl = `${this.convertKitBaseUrl}/tags?api_key=${this.env.CONVERTKIT_KEY}`;

		const tagsRes = await fetch(listTagsUrl, {
			method: "GET",
		});

		if (tagsRes.status !== 200) {
			const message = await tagsRes.text();
			throw new Error(message);
		}

		const tagList = (await tagsRes.json()) as ConvertKitTagList;
		const tag: ConvertKitTag[] = tagList.tags.filter((tag) => tag.name === tagName);

		if (tag.length > 1) {
			// Dumplicate tags and this needs to be cleaned up
			throw new Error("Duplicate ConvertKit Tags");
		}

		const tagId = tag[0].id;

		const addSubscriberUrl = `${this.convertKitBaseUrl}/tags/${tagId}/subscribe`;

		const subscriberBody = {
			api_key: this.env.CONVERTKIT_KEY,
			email: emailAddress,
		};

		const convertKitParams: RequestInit = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(subscriberBody),
		};

		return await fetch(addSubscriberUrl, convertKitParams);
	}
}
