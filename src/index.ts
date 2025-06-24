import { Hono } from "hono";

// *** Handlers *** //
import { createTrainingPlanStatsRecord } from "./handlers/createTrainingPlanStatsRecord";
import { toggleDayGoal } from "./handlers/toggleDayGoal";
import { getTrainingPlanStats } from "./handlers/getTrainingPlanStats";
import { getTrainingnPlanDayStats } from "./handlers/getTrainingPlanDayStats";
import { getLastDayCompleted } from "./handlers/getLastDayCompleted";
import { getTrainingPlanCompletedDaysArray } from "./handlers/getTrainingPlanCompletedDaysArray";
import { handleMissedDays } from "./handlers/handleMissedDays";
import { updateTrainingPlanMissedDaysStreak } from "./handlers/updateTrainingPlanMissedDaysStreak";
import { getTrainingPlanDetails } from "./handlers/getTrainingPlanDetails";
import { getTrainingPlanDayGoalsDetails } from "./handlers/getTrainingPlanDayGoalsDetails";
import { cancelTrainingPlan } from "./handlers/cancelTrainingPlan";
import { getTrainingPlanReportCard } from "./handlers/getTrainingPlanReportCard";
import { getTrainingPlanReportCardData } from "./handlers/getTrainingPlanReportCardData";
import { getTrainingPlanLeaderboardsData } from "./handlers/getTrainingPlanLeaderboardData";
import { getTrainingPlanStartDate } from "./handlers/getTrainingPlanStartDate";
import { getCompletedAndCancelledTrainingPlans } from "./handlers/getCompletedAndCancelledTrainingPlans";
import { completeTrainingPlan } from "./handlers/completeTrainingPlan";
import { updateTrainingPlanStatsStreaks } from "./handlers/updateTrainingPlanStatsStreaks";
import { badRequest } from "./handlers/badRequest";

import { testHandler } from "./handlers/test";

// *** Helpers *** //
import { corsConfig } from "./helpers/honoConfig";

// *** Types *** //
import type { Env } from "./types/bindings";

const app = new Hono();
const trainingPlan = new Hono<{ Bindings: Env }>();
const admin = new Hono<{ Bindings: Env }>();

app.use("/*", corsConfig);

trainingPlan.all("/test", testHandler);

trainingPlan.get("/get-training-plan-details/:program_id", getTrainingPlanDetails);

trainingPlan.get("/get-training-plan-day-goals-details/:program_id/:training_plan_day", getTrainingPlanDayGoalsDetails);

trainingPlan.get("/get-training-plan-stats/:program_id", getTrainingPlanStats);

trainingPlan.get("/get-training-plan-day-stats/:stats_record_id", getTrainingnPlanDayStats);

trainingPlan.get("/last-day-completed/:program_id/:stats_record_id", getLastDayCompleted);

trainingPlan.get("/get-training-plan-completed-days-array/:program_id/:stats_record_id", getTrainingPlanCompletedDaysArray);

trainingPlan.post("/create-training-plan-stats-record/:program_id", createTrainingPlanStatsRecord);

trainingPlan.patch("/toggle-daily-goal/:goal_type/:program_id", toggleDayGoal);

trainingPlan.get("/get-completed-and-cancelled-training-plans", getCompletedAndCancelledTrainingPlans);

trainingPlan.get("/get-training-plan-user-report-card/:program_id/:stats_record_id/:total_possible_points", getTrainingPlanReportCard);

trainingPlan.get("/get-training-plan-report-card-data/:program_id/:stats_record_id/:max_points", getTrainingPlanReportCardData);

trainingPlan.get("/get-training-plan-leaderboards/:program_id/:status/:start_date?", getTrainingPlanLeaderboardsData);

trainingPlan.get("/get-training-plan-start-date/:program_id/:stats_record_id", getTrainingPlanStartDate);

trainingPlan.patch("/cancel-training-plan/:program_id/:stats_record_id", cancelTrainingPlan);

trainingPlan.patch(`/complete-training-plan/:program_id/:stats_record_id/:start_date/:total_days_in_current_month`, completeTrainingPlan);

trainingPlan.patch("/handle-missed-days", handleMissedDays);

trainingPlan.patch(
	"/update-training-plan-missed-day-streak/:program_id/:stats_record_id/:number_of_missed_days",
	updateTrainingPlanMissedDaysStreak
);

trainingPlan.patch("/update-training-plan-stats-streaks/:program_id/:stats_record_id", updateTrainingPlanStatsStreaks);

app.notFound(badRequest);

app.route("/api/training-plan", trainingPlan);
app.route("/admin", admin);

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return app.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
