export interface ConvertKitTagList {
	tags: ConvertKitTag[];
}

export interface ConvertKitTag {
	id: number;
	name: string;
	created_at: string;
}

export type ConvertKitTagName =
	| "ignite30ProductMembers"
	| "ignite30ProductCancelled"
	| "ignite30ProductTrials"
	| "ignite30ProductInProgress";

interface ConvertKitSubscriber {
	id: number;
	first_name: string;
	email_address: string;
	state: string;
	created_at: string;
	fields: {};
}

export interface ConvertKitSubscriberList {
	total_subscribers: number;
	page: number;
	total_pages: number;
	subscribers: ConvertKitSubscriber[];
}
