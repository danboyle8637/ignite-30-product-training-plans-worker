import type { NeonQueryFunction, NeonQueryPromise } from "@neondatabase/serverless";
import type { ProgramId, DailyGoalType, TrainingPlanMissedDaysRecord, TrainingPlanStatus } from "../types";
import type { CreateTrainigPlanStatsRecordData } from "../types/neon";

export class Queries {
	createTrainingPlanRecordQuery(
		sql: NeonQueryFunction<any, any>,
		userId: string,
		programId: ProgramId,
		data: CreateTrainigPlanStatsRecordData
	): NeonQueryPromise<any, any> {
		return sql`
      WITH att_number AS (
				SELECT COALESCE(MAX(attempt_number), 0) as current_attempt_number
				FROM training_plans.training_plan_stats
				WHERE user_id = ${userId}
					AND program_id = ${programId}
			), training_plan_id AS (
					INSERT INTO training_plans.training_plan_stats
					(user_id, program_id, start_date, end_date, attempt_number)
					VALUES (
						${userId},
						${programId},
						${data.startDate},
						${data.endDate},
						(SELECT current_attempt_number + 1 FROM att_number)
				)
					RETURNING training_plan_stats.id as training_plan_id
			) UPDATE users.users
					SET active_training_plan_id = (SELECT training_plan_id FROM training_plan_id),
					training_plan = ${programId},
        	training_plan_start_date = ${data.startDate},
        	training_plan_end_date = ${data.endDate}
					WHERE user_id = ${userId}
						RETURNING active_training_plan_id;
    `;
	}

	updateTrainingPlanDayStatsRecordByDayGoalQuery(
		sql: NeonQueryFunction<any, any>,
		userId: string,
		programId: ProgramId,
		trainingPlanStatsRecordId: number,
		currentTrainingPlanDay: number,
		dayDate: string,
		goalType: DailyGoalType,
		currentDaysMissed: number
	) {
		switch (goalType) {
			case "primary_goal": {
				return sql`
					CALL training_plans.toggle_is_primary_goal_complete(
						${userId}::VARCHAR(255),
						${programId}::training_plans.program_id,
						${trainingPlanStatsRecordId}::SMALLINT,
						${currentTrainingPlanDay}::SMALLINT,
						${dayDate}::VARCHAR(10),
						${currentDaysMissed}::SMALLINT
						);
				`;
			}
			case "busy_goal": {
				return sql`
					CALL training_plans.toggle_is_busy_goal_complete(
						${userId}::VARCHAR(255),
						${programId}::training_plans.program_id,
						${trainingPlanStatsRecordId}::SMALLINT,
						${currentTrainingPlanDay}::SMALLINT,
						${dayDate}::VARCHAR(10),
						${currentDaysMissed}::SMALLINT
						);
				`;
			}
			case "fit_challenge": {
				return sql`
					CALL training_plans.toggle_is_fitness_challenge_complete(
						${userId}::VARCHAR(255),
						${programId}::training_plans.program_id,
						${trainingPlanStatsRecordId}::SMALLINT,
						${currentTrainingPlanDay}::SMALLINT,
						${dayDate}::VARCHAR(10),
						${currentDaysMissed}::SMALLINT
						);
				`;
			}
			case "nutrition_challenge": {
				return sql`
					CALL training_plans.toggle_is_nutrition_challenge_complete(
						${userId}::VARCHAR(255),
						${programId}::training_plans.program_id,
						${trainingPlanStatsRecordId}::SMALLINT,
						${currentTrainingPlanDay}::SMALLINT,
						${dayDate}::VARCHAR(10),
						${currentDaysMissed}::SMALLINT
						);
				`;
			}
			case "motivation_challenge": {
				return sql`
					CALL training_plans.toggle_is_motivation_challenge_complete(
						${userId}::VARCHAR(255),
						${programId}::training_plans.program_id,
						${trainingPlanStatsRecordId}::SMALLINT,
						${currentTrainingPlanDay}::SMALLINT,
						${dayDate}::VARCHAR(10),
						${currentDaysMissed}::SMALLINT
						);
				`;
			}
			case "coaching_class": {
				return sql`
					CALL training_plans.toggle_is_coaching_class_complete(
						${userId}::VARCHAR(255),
						${programId}::training_plans.program_id,
						${trainingPlanStatsRecordId}::SMALLINT,
						${currentTrainingPlanDay}::SMALLINT,
						${dayDate}::VARCHAR(10),
						${currentDaysMissed}::SMALLINT
						);
				`;
			}
			case "step_challenge": {
				return sql`
					CALL training_plans.toggle_is_step_challenge_complete(
						${userId}::VARCHAR(255),
						${programId}::training_plans.program_id,
						${trainingPlanStatsRecordId}::SMALLINT,
						${currentTrainingPlanDay}::SMALLINT,
						${dayDate}::VARCHAR(10),
						${currentDaysMissed}::SMALLINT
						);
				`;
			}
			default: {
				return;
			}
		}
	}

	// This is only run when you look at the github graphs
	getTrainingPlanCompletedDaysArrayQuery(
		sql: NeonQueryFunction<any, any>,
		userId: string,
		programId: ProgramId,
		trainingPlanStatsRecordId: number
	): NeonQueryPromise<any, any> {
		return sql`
			SELECT training_plan_day, day_date
			FROM training_plans.training_plan_day_stats
			WHERE user_id = ${userId}
			AND program_id = ${programId}
			AND training_plan_stats_id = ${trainingPlanStatsRecordId}
			ORDER BY training_plan_day ASC;
		`;
	}

	updateTrainingPlanDayStatsAfterMissedDaysQuery(
		sql: NeonQueryFunction<any, any>,
		userId: string,
		programId: ProgramId,
		trainingPlanStatsRecordId: number,
		numberOfMissedDays: number,
		missedDayRecordsToCreatesArray: TrainingPlanMissedDaysRecord[]
	) {
		const queryArray = missedDayRecordsToCreatesArray.map((d) => {
			return sql`
				INSERT INTO training_plans.training_plan_day_stats
					(
						user_id,
						program_id,
						training_plan_stats_id,
						training_plan_day,
						day_date,
						daily_points,
						is_primary_goal_complete,
						is_busy_goal_complete,
						is_fitness_challenge_complete,
						is_nutrition_challenge_complete,
						is_motivation_challenge_complete,
						is_coaching_class_complete,
						is_step_challenge_complete
					)
				VALUES (
						${userId},
						${programId},
						${trainingPlanStatsRecordId},
						${d.trainingPlanDay},
						${d.dayDate},
						0,
						false,
						false,
						false,
						false,
						false,
						false,
						false
					);
			`;
		});

		const updateTrainingPlanStatsQuery = sql`
			CALL training_plans.update_training_plan_stats_after_days_missed(
				${userId}::VARCHAR(255),
				${trainingPlanStatsRecordId}::SMALLINT,
				${numberOfMissedDays}::SMALLINT
				);
		`;

		queryArray.push(updateTrainingPlanStatsQuery);

		return sql.transaction(queryArray, { isolationLevel: "RepeatableRead" });
	}

	// If the user logs into the app... does not complete any goals
	// The app creates the record in the db for the day... but it's all zeroed out
	// The user could potentialy have a zero in
	updateTrainingPlanStatsDaysMissedStreakQuery(
		sql: NeonQueryFunction<any, any>,
		userId: string,
		programId: ProgramId,
		trainingPlanStatsRecordId: number,
		numberOfMissedDays: number
	) {
		return sql`
			UPDATE training_plans.training_plan_stats
					SET days_missed_streak = ${numberOfMissedDays}
			WHERE id = ${trainingPlanStatsRecordId}
			AND user_id = ${userId}
			AND program_id = ${programId}
			AND status = 'active';
		`;
	}

	// This is run when you first load the calendar
	getLastDayCompletedQuery(
		sql: NeonQueryFunction<any, any>,
		userId: string,
		programId: ProgramId,
		trainingPlanStatsRecordId: number
	): NeonQueryPromise<any, any> {
		return sql`
			SELECT
					training_plan_day,
					BOOL_OR(
											tpd.is_primary_goal_complete
											OR tpd.is_busy_goal_complete
											OR tpd.is_fitness_challenge_complete
											OR tpd.is_nutrition_challenge_complete
											OR tpd.is_motivation_challenge_complete
											OR tpd.is_coaching_class_complete
											OR tpd.is_step_challenge_complete
							) AS day_is_completed
			FROM training_plans.training_plan_day_stats tpd
			WHERE training_plan_day = (SELECT MAX(training_plan_day) FROM training_plans.training_plan_day_stats)
			AND user_id = ${userId}
			AND program_id = ${programId}
			AND training_plan_stats_id = ${trainingPlanStatsRecordId}
			GROUP BY training_plan_day
			HAVING BOOL_OR(
												tpd.is_primary_goal_complete
												OR tpd.is_busy_goal_complete
												OR tpd.is_fitness_challenge_complete
												OR tpd.is_nutrition_challenge_complete
												OR tpd.is_motivation_challenge_complete
												OR tpd.is_coaching_class_complete
												OR tpd.is_step_challenge_complete
								) = TRUE;
		`;
	}

	getTrainingPlanStatsQuery(sql: NeonQueryFunction<any, any>, userId: string, programId: ProgramId): NeonQueryPromise<any, any> {
		return sql`
			SELECT
					start_date,
					total_points,
					primary_goal_streak,
					complete_day_streak,
					fit_quickie_streak,
					days_missed_streak
			FROM training_plans.training_plan_stats
			WHERE user_id = ${userId}
			AND program_id = ${programId}
			AND status = 'active'
			AND attempt_number = (SELECT
															MAX(attempt_number)
														FROM training_plans.training_plan_stats
														WHERE user_id = ${userId}
														AND program_id = ${programId}
														AND status = 'active');
		`;
	}

	getTrainingPlanDayStatsQuery(
		sql: NeonQueryFunction<any, any>,
		userId: string,
		trainingPlanStatsRecordId: number
	): NeonQueryPromise<any, any> {
		return sql`
			SELECT
					training_plan_day,
					day_date,
					daily_points,
					is_primary_goal_complete,
					is_busy_goal_complete,
					is_fitness_challenge_complete,
					is_nutrition_challenge_complete,
					is_motivation_challenge_complete,
					is_coaching_class_complete,
					is_step_challenge_complete
			FROM training_plans.training_plan_day_stats
			WHERE user_id = ${userId}
				AND training_plan_stats_id = ${trainingPlanStatsRecordId}
				ORDER BY training_plan_day ASC;
		`;
	}

	getCompletedAndCancelledTrainingPlansQuery(sql: NeonQueryFunction<any, any>, userId: string): NeonQueryPromise<any, any> {
		return sql`
			SELECT 
				id, 
				program_id, 
				attempt_number, 
				status, 
				start_date,
				end_date
			FROM training_plans.training_plan_stats
			WHERE user_id = ${userId}
				AND status = 'complete'
				OR status = 'canceled'
				ORDER BY end_date DESC;
		`;
	}

	getCancelledTrainingPlansQuery(sql: NeonQueryFunction<any, any>, userId: string): NeonQueryPromise<any, any> {
		return sql`
			SELECT id, program_id, attempt_number
			FROM training_plans.training_plan_stats
			WHERE user_id = ${userId}
			AND status = 'canceled';
		`;
	}

	getTrainingPlanReportCardUserDataQuery(
		sql: NeonQueryFunction<any, any>,
		userId: string,
		programId: ProgramId,
		trainingPlanStatsRecordId: number,
		totalPossiblePoints: number
	): NeonQueryPromise<any, any> {
		return sql`
			SELECT * FROM training_plans.get_training_plan_report_card_final_points_and_grade(
				${userId}::VARCHAR(255),
				${programId}::training_plans.program_id,
				${trainingPlanStatsRecordId}::INT,
				${totalPossiblePoints}::SMALLINT
			);
		`;
	}

	getTrainingPlanLeaderBoardDataQuery(
		sql: NeonQueryFunction<any, any>,
		programId: ProgramId,
		status: TrainingPlanStatus,
		startDate?: string
	): NeonQueryPromise<any, any> {
		if (startDate) {
			return sql`
				SELECT * FROM training_plans.get_training_plan_leaderboards(${programId}, ${status}, ${startDate});
			`;
		}

		return sql`
			SELECT * FROM training_plans.get_training_plan_leaderboards(${programId}, ${status}, NULL);
		`;
	}

	cancelTrainingPlanQuery(
		sql: NeonQueryFunction<any, any>,
		userId: string,
		trainingPlanStatsRecordId: number,
		programId: ProgramId,
		shouldCancelMembership: boolean
	) {
		const cancelUserMembershipQuery = sql`
			UPDATE users.users
			SET membership_plan = 'cancelled_member',
					active_training_plan_id = NULL,
					training_plan = NULL,
					training_plan_start_date = NULL,
					training_plan_end_date = NULL,
					membership_end_date = NULL
			WHERE user_id = ${userId};
		`;

		const cancelUserTrainingPlanQuery = sql`
			UPDATE users.users
			SET training_plan = NULL,
					active_training_plan_id = NULL,
					training_plan_start_date = NULL,
					training_plan_end_date = NULL,
					membership_end_date = NULL
			WHERE user_id = ${userId};
		`;

		const cancelUserMembershipAccountQuery = sql`
			UPDATE users.user_accounts
			SET membership_plan = 'cancelled_member'
			WHERE user_id = ${userId};
		`;

		const updateTrainingPlanStatsQuery = sql`
			UPDATE training_plans.training_plan_stats
			SET status = 'canceled'
			WHERE user_id = ${userId}
			AND id = ${trainingPlanStatsRecordId}
			AND program_id = ${programId}
			AND status = 'active';
		`;

		const deleteTrainingPlanDayStatsQuery = sql`
			DELETE FROM training_plans.training_plan_day_stats
			WHERE training_plan_stats_id = ${trainingPlanStatsRecordId}
			AND user_id = ${userId}
			AND program_id = ${programId};
		`;

		const activeQueryArray = shouldCancelMembership
			? [cancelUserMembershipQuery, cancelUserMembershipAccountQuery, updateTrainingPlanStatsQuery, deleteTrainingPlanDayStatsQuery]
			: [cancelUserTrainingPlanQuery, updateTrainingPlanStatsQuery, deleteTrainingPlanDayStatsQuery];

		return sql.transaction(activeQueryArray, { isolationLevel: "RepeatableRead" });
	}

	getTrainingPlanStartDateQuery(
		sql: NeonQueryFunction<any, any>,
		userId: string,
		programId: ProgramId,
		trainingPlanStatsRecordId: number
	): NeonQueryPromise<any, any> {
		return sql`
			SELECT start_date
				FROM training_plans.training_plan_stats
				WHERE user_id = ${userId}
				AND program_id = ${programId}
				AND id = ${trainingPlanStatsRecordId};
		`;
	}

	completeTrainingPlanQuery(
		sql: NeonQueryFunction<any, any>,
		userId: string,
		programId: ProgramId,
		trainingPlanStatsRecordId: number,
		shouldCancelMembership: boolean
	) {
		const completeUserMembershipQuery = sql`
			UPDATE users.users
			SET membership_plan = 'cancelled_member',
					active_training_plan_id = NULL,
					training_plan = NULL,
					training_plan_start_date = NULL,
					training_plan_end_date = NULL,
					membership_end_date = NULL
			WHERE user_id = ${userId};
	`;

		const completeUserTrainingPlanQuery = sql`
			UPDATE users.users
			SET training_plan = NULL,
					active_training_plan_id = NULL,
					training_plan_start_date = NULL,
					training_plan_end_date = NULL,
					membership_end_date = NULL
			WHERE user_id = ${userId};
	`;

		const completeUserMembershipAccountQuery = sql`
			UPDATE users.user_accounts
			SET membership_plan = 'cancelled_member'
			WHERE user_id = ${userId};
	`;

		const updateTrainingPlanStatsQuery = sql`
			UPDATE training_plans.training_plan_stats
			SET status = 'canceled'
			WHERE user_id = ${userId}
			AND id = ${trainingPlanStatsRecordId}
			AND program_id = ${programId}
			AND status = 'active';
	`;

		const activeQueryArray = shouldCancelMembership
			? [completeUserMembershipQuery, completeUserMembershipAccountQuery, updateTrainingPlanStatsQuery]
			: [completeUserTrainingPlanQuery, updateTrainingPlanStatsQuery];

		return sql.transaction(activeQueryArray, { isolationLevel: "RepeatableRead" });
	}

	createTestDataQuery(sql: NeonQueryFunction<any, any>) {
		const day0 = sql`
		INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        0, '2024-11-18', 5, 
        FALSE, TRUE, 
        FALSE, TRUE, 
        TRUE, TRUE
    );
		`;

		const day1 = sql`
		INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        1, '2024-11-19', 3, 
        FALSE, FALSE, 
        FALSE, TRUE, 
        TRUE, TRUE
    );
		`;

		const day2 = sql`
		INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        2, '2024-11-20', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day3 = sql`
		INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        3, '2024-11-21', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day4 = sql`
		INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        4, '2024-11-22', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day5 = sql`
		INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        5, '2024-11-23', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day6 = sql`
		INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        6, '2024-11-24', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day7 = sql`
		INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        7, '2024-11-25', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day8 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        8, '2024-11-26', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day9 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        9, '2024-11-27', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day10 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        10, '2024-11-28', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day11 = sql`
		INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        11, '2024-11-29', 5, 
        FALSE, TRUE, 
        TRUE, TRUE, 
        FALSE, TRUE
    );
		`;

		const day12 = sql`
		INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        12, '2024-11-30', 2, 
        FALSE, FALSE, 
        TRUE, FALSE, 
        TRUE, FALSE
    );
		`;

		const day13 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        13, '2024-12-01', 9, 
        TRUE, TRUE, 
        TRUE, TRUE, 
        TRUE, TRUE
    );
		`;

		const day14 = sql`
		INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        14, '2024-12-02', 7, 
        TRUE, TRUE, 
        TRUE, TRUE, 
        FALSE, FALSE
    );
		`;

		const day15 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        15, '2024-12-03', 8, 
        TRUE, TRUE, 
        TRUE, TRUE, 
        TRUE, FALSE
    );
		`;

		const day16 = sql`
		INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        16, '2024-12-04', 4, 
        FALSE, TRUE, 
        FALSE, TRUE, 
        FALSE, TRUE
    );
		`;

		const day17 = sql`
		INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        17, '2024-12-05', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day18 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        18, '2024-12-06', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day19 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        19, '2024-12-07', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day20 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        20, '2024-12-08', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day21 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        21, '2024-12-09', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day22 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        22, '2024-12-10', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day23 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        23, '2024-12-11', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day24 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        24, '2024-12-12', 8, 
        TRUE, TRUE, 
        TRUE, TRUE, 
        FALSE, TRUE
    );
		`;

		const day25 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        25, '2024-12-13', 4, 
        FALSE, TRUE, 
        FALSE, TRUE, 
        FALSE, TRUE
    );
		`;

		const day26 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        26, '2024-12-14', 8, 
        TRUE, TRUE, 
        TRUE, TRUE, 
        FALSE, TRUE
    );
		`;

		const day27 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        27, '2024-12-15', 9, 
        TRUE, TRUE, 
        TRUE, TRUE, 
        TRUE, TRUE
    );
		`;

		const day28 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        28, '2024-12-16', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day29 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        29, '2024-12-17', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const day30 = sql`
		 INSERT INTO training_plans.training_plan_day_stats (
        user_id, program_id, training_plan_stats_id, training_plan_day, 
        day_date, daily_points, is_primary_goal_complete, is_busy_goal_complete, 
        is_fitness_challenge_complete, is_nutrition_challenge_complete, 
        is_motivation_challenge_complete, is_coaching_class_complete
    ) VALUES (
        'user-test-92413406-6264-4c20-9c8e-e662da1ad53d', 'ignite_30_beginner', 22, 
        30, '2024-12-18', 0, 
        FALSE, FALSE, 
        FALSE, FALSE, 
        FALSE, FALSE
    );
		`;

		const queryArray = [
			day0,
			day1,
			day2,
			day3,
			day4,
			day5,
			day6,
			day7,
			day8,
			day9,
			day10,
			day11,
			day12,
			day13,
			day14,
			day15,
			day16,
			day17,
			day18,
			day19,
			day20,
			day21,
			day22,
			day23,
			day24,
			day25,
			day26,
			day27,
			day28,
			day29,
			day30,
		];

		return sql.transaction(queryArray, { isolationLevel: "RepeatableRead" });
	}

	// createTestLeaderboardQuery(sql: NeonQueryFunction<any, any>) {
	// 	const insertArray = trainingPlanStats.map((d) => {
	// 		return sql`
	// 			INSERT INTO training_plans.training_plan_stats
	// 				(
	// 					user_id,
	// 					status,
	// 					program_id,
	// 					start_date,
	// 					end_date,
	// 					total_points,
	// 					primary_goal_streak,
	// 					longest_primary_goal_streak,
	// 					complete_day_streak,
	// 					longest_complete_day_streak,
	// 					fit_quickie_streak,
	// 					longest_fit_quickie_streak,
	// 					days_missed_streak,
	// 					longest_days_missed_streak
	// 				)
	// 				VALUES (
	// 						${d.user_id},
	// 						${d.status},
	// 						${d.program_id},
	// 						${d.start_date},
	// 						${d.end_date},
	// 						${d.total_points},
	// 						${d.primary_goal_streak},
	// 						${d.longest_primary_goal_streak},
	// 						${d.complete_day_streak},
	// 						${d.longest_complete_day_streak},
	// 						${d.fit_quickie_streak},
	// 						${d.longest_fit_quickie_streak},
	// 						${d.days_missed_streak},
	// 						${d.longest_days_missed_streak}
	// 				);
	// 		`;
	// 	});

	// 	return sql.transaction(insertArray, { isolationLevel: "RepeatableRead" });
	// }
}
