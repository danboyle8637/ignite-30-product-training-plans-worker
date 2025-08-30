import type {
	PointsType,
	TrainingPlanDayStatsRecord,
	TrainingPlanMissedDaysRecord,
	LastTrainingDayRecordedData,
	TrainingPlanDaysMissed,
	HandlerFunction,
} from "../types";
import type { ErrorLog } from "../types/responses";
import type { ActiveMonth, MissedDaysArrays } from "../types/utils";
import type { Env } from "../types/bindings";

export function getErrorMessage(error: unknown) {
	if (error instanceof Error) return error.message;
	return String(error);
}

export function parseUserAuthorization(authData: string): string | undefined {
	const token = authData.split(" ")[1];

	if (!token) {
		return undefined;
	}

	const decodedUserId = atob(token);
	const userId = decodedUserId.substring(0, decodedUserId.length - 1);
	return userId;
}

export function parseAdminAuthorization(authData: string, env: Env): boolean {
	const token = authData.split(" ")[1];

	if (!token) {
		return false;
	}

	const decodedPassword = atob(token);
	const password = decodedPassword.substring(0, decodedPassword.length - 1);
	return password === env.ADMIN_ENDPOINT_PASSWORD;
}

export const useCorrectPoints = (type: PointsType): number => {
	switch (type) {
		case "primary_goal": {
			return 3;
		}
		case "busy_goal": {
			return 2;
		}
		case "fit_challenge": {
			return 1;
		}
		case "nutrition_challenge": {
			return 1;
		}
		case "coaching_class": {
			return 1;
		}
		case "motivation_challenge": {
			return 1;
		}
		case "complete_day": {
			return 2;
		}
		default: {
			return 0;
		}
	}
};

// *********** MISSED DAYS FUNCTIONS *********** //

const shouldAddZero = (day: number) => (day < 10 ? `0${day}` : `${day}`);

const buildNextMissedDayDateDate = (dayDate: string, totalDaysInCurrentMonth: number) => {
	const dayDateArray = dayDate.split("-");

	const year = Number(dayDateArray[0]);
	const month = Number(dayDateArray[1]) as ActiveMonth;
	const day = Number(dayDateArray[2]);

	// Year change
	if (month === 12 && day === totalDaysInCurrentMonth) {
		const newYear = year + 1;
		const newMonth = shouldAddZero(1);
		const newDay = shouldAddZero(1);
		const date = `${newYear}-${newMonth}-${newDay}`;
		return date;
	}

	// Month change
	if (day === totalDaysInCurrentMonth && month !== 12) {
		const newMonth = shouldAddZero(month + 1);
		const newDay = shouldAddZero(1);
		const date = `${year}-${newMonth}-${newDay}`;
		return date;
	}

	const newMonth = shouldAddZero(month);
	const newDay = shouldAddZero(day + 1);
	const date = `${year}-${newMonth}-${newDay}`;
	return date;
};

export const buildMissedDaysStatsArray = (
	numberOfMissedDayRecordsToCreate: number,
	lastTrainingPlanDayStatsDayRecorded: number,
	lastTrainingPlanDayStatsDayDateRecorded: string,
	totalDaysInCurrentMonth: number,
	startDate: string
): MissedDaysArrays => {
	let missedDaysQueryArray: TrainingPlanMissedDaysRecord[] = [];
	let missedDaysArray: TrainingPlanDayStatsRecord[] = [];
	let dayDate =
		lastTrainingPlanDayStatsDayRecorded === 99 && lastTrainingPlanDayStatsDayDateRecorded === ""
			? startDate
			: lastTrainingPlanDayStatsDayDateRecorded;
	let trainingPlanDay = lastTrainingPlanDayStatsDayRecorded;

	for (let i = 0; i < numberOfMissedDayRecordsToCreate; i++) {
		const newDayDate = trainingPlanDay === 99 ? startDate : buildNextMissedDayDateDate(dayDate, totalDaysInCurrentMonth);
		const nextTrainingPlanDay = trainingPlanDay === 99 ? 0 : trainingPlanDay + i + 1;

		const newMissedDaysQueryRecord: TrainingPlanMissedDaysRecord = {
			trainingPlanDay: nextTrainingPlanDay,
			dayDate: newDayDate,
		};

		const newMissedDaysArrayRecord: TrainingPlanDayStatsRecord = {
			trainingPlanDay: nextTrainingPlanDay,
			dayDate: newDayDate,
			dailyPoints: 0,
			isPrimaryGoalComplete: false,
			isBusyGoalComplete: false,
			isFitnessChallengeComplete: false,
			isNutritionChallengeComplete: false,
			isMotivationChallengeComplete: false,
			isCoachingClassComplete: false,
			isStepChallengeComplete: false,
		};

		missedDaysQueryArray.push(newMissedDaysQueryRecord);
		missedDaysArray.push(newMissedDaysArrayRecord);

		if (trainingPlanDay === 99) {
			trainingPlanDay = -1;
		}

		dayDate = newDayDate;
	}

	return {
		missedDaysQueryArray: missedDaysQueryArray,
		missedDaysArray: missedDaysArray,
	};
};

export const getLastDayCompleted = (dayStatsArray: TrainingPlanDayStatsRecord[]): LastTrainingDayRecordedData => {
	const lastRecord = dayStatsArray[dayStatsArray.length - 1];
	if (lastRecord) {
		return {
			lastTrainingPlanDayStatsDayRecorded: lastRecord.trainingPlanDay,
			lastTrainingPlanDayStatsDayDateRecorded: lastRecord.dayDate,
		};
	}

	return {
		lastTrainingPlanDayStatsDayRecorded: 99,
		lastTrainingPlanDayStatsDayDateRecorded: "",
	};
};

export const calculateDaysMissed = (
	dayStatsArray: TrainingPlanDayStatsRecord[],
	currentTrainingPlanDay: number
): TrainingPlanDaysMissed => {
	// Subtract 1 for today... the current training plan day
	// const noRecordMissedDays = currentTrainingPlanDay - dayStatsArray.length - 1;
	if (dayStatsArray.length === 0) {
		return {
			missedDays: currentTrainingPlanDay,
			recordsToCreate: currentTrainingPlanDay,
		};
	}

	const currentRecordedDayStats = dayStatsArray.length;
	const missedDaysSinceLastRecordedDayStat = currentTrainingPlanDay - currentRecordedDayStats;

	const missedDaysFromDatabase = dayStatsArray.reduce((acc: number, cv: TrainingPlanDayStatsRecord): number => {
		if (cv.dailyPoints === 0) {
			acc += 1;
			return acc;
		}

		if (acc > 0) {
			acc = 0;
		}

		return acc;
	}, 0);

	const totalMissedDays = missedDaysSinceLastRecordedDayStat + missedDaysFromDatabase;

	// const recordsToCreate =
	//   missedDaysSinceLastRecordedDayStat > 0
	//     ? missedDaysSinceLastRecordedDayStat
	//     : noRecordMissedDays < 0
	//     ? 0
	//     : noRecordMissedDays;

	const recordsToCreate = missedDaysSinceLastRecordedDayStat > 0 ? missedDaysSinceLastRecordedDayStat : 0;

	return {
		missedDays: totalMissedDays,
		recordsToCreate: recordsToCreate,
	};
};

export const passesRateLimiter = async (pathname: string, userId: string, env: Env): Promise<boolean> => {
	const rateLimitKey = `${pathname}_${userId}`;
	const { success } = await env.IGNITE_30_PLANS_RATE_LIMITER.limit({ key: rateLimitKey });
	return success as boolean;
};

export function createErrorLog(
	endpoint: string,
	handlerFunction: HandlerFunction,
	status: number,
	message: string,
	env: Env
): Promise<void> {
	const error: ErrorLog = {
		environment: env.ENVIRONMENT,
		worker: "ignite_30_plans_worker",
		endpoint: endpoint,
		function: handlerFunction,
		status: status,
		message: message,
	};

	if (env.ENVIRONMENT !== "dev") {
		const queuePromise = env.IGNITE_30_LOGGING_QUEUE.send(JSON.stringify(error));
		return queuePromise;
	}

	return new Promise(() => {});
}
