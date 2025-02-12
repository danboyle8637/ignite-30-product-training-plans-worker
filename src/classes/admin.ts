import { ignite30Beginner } from "../../data/ignite30Beginner";
import { ignite30Advanced } from "../../data/ignite30Advanced";
import type { TrainingPlan } from "../types/index";
import type { TrainingPlanName } from "../types/admin";
import type { Env } from "../types/bindings";

export class Admin {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	async getAllTrainingPlans(): Promise<TrainingPlan[]> {
		try {
			const plans = await this.env.FWW_LIVE_TRAINING_PLANS.list();

			const keys = plans.keys;
			const trainingPlans: TrainingPlan[] = [];

			for (const key of keys) {
				const planRes = await this.env.FWW_LIVE_TRAINING_PLANS.get(key.name);

				if (!planRes) {
					const message = "Could not get the training plans from KV";
					throw new Error(message);
				}

				const planData = JSON.parse(planRes);
				trainingPlans.push(planData);
			}

			return trainingPlans;
		} catch {
			return [];
		}
	}

	async getTrainingPlan(trainingPlan: TrainingPlanName): Promise<TrainingPlan> {
		const data = await this.env.FWW_LIVE_TRAINING_PLANS.get(trainingPlan);

		if (!data) {
			const message = `Could not get ${trainingPlan} from KV.`;
			throw new Error(message);
		}

		const trainingPlanData = JSON.parse(data);
		return trainingPlanData;
	}

	async saveTrainingPlan(trainingPlan: TrainingPlanName) {
		switch (trainingPlan) {
			case "ignite_30_beginner": {
				const jsonTrainingPlan = JSON.stringify(ignite30Beginner);
				return this.env.FWW_LIVE_TRAINING_PLANS.put(trainingPlan, jsonTrainingPlan);
			}
			case "ignite_30_advanced": {
				const jsonTrainingPlan = JSON.stringify(ignite30Advanced);
				return this.env.FWW_LIVE_TRAINING_PLANS.put(trainingPlan, jsonTrainingPlan);
			}
			default: {
				return;
			}
		}
	}
}
