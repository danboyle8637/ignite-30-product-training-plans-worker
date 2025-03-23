CREATE OR REPLACE PROCEDURE training_plans.toggle_is_primary_goal_complete(
    IN arg_user_id VARCHAR(255),
    IN arg_program_id training_plans.program_id,
    IN arg_training_plan_stats_id INTEGER,
    IN arg_training_plan_day SMALLINT,
    IN arg_day_date VARCHAR(10),
    IN arg_current_days_missed SMALLINT
) LANGUAGE plpgsql
AS $$
BEGIN
    WITH updated_daily_points AS (
        SELECT
                daily_points + CASE
                                   WHEN is_primary_goal_complete = FALSE AND is_busy_goal_complete = FALSE THEN 3
                                   WHEN is_primary_goal_complete = FALSE AND is_busy_goal_complete = TRUE THEN 1
                                   WHEN is_primary_goal_complete = TRUE AND is_busy_goal_complete = FALSE THEN -3
                                   ELSE 0
                END AS new_daily_points,
                CASE
                    WHEN is_primary_goal_complete = FALSE AND is_busy_goal_complete = FALSE THEN 3
                    WHEN is_primary_goal_complete = FALSE AND is_busy_goal_complete = TRUE THEN 1
                    WHEN is_primary_goal_complete = TRUE AND is_busy_goal_complete = FALSE THEN -3
                    ELSE 0
                    END AS points_diff,
                is_busy_goal_complete as initial_busy_goal_state
        FROM training_plans.training_plan_day_stats
        WHERE user_id = arg_user_id
          AND training_plan_stats_id = arg_training_plan_stats_id
          AND training_plan_day = arg_training_plan_day
    ), toggle_primary_goal AS (
        SELECT
            NOT is_primary_goal_complete AS new_is_primary_goal_complete
        FROM training_plans.training_plan_day_stats
        WHERE user_id = arg_user_id
          AND training_plan_stats_id = arg_training_plan_stats_id
          AND training_plan_day = arg_training_plan_day
    ), update_existing_day_stats AS (
        UPDATE training_plans.training_plan_day_stats
            SET
                daily_points = (SELECT new_daily_points FROM updated_daily_points),
                is_primary_goal_complete = (SELECT new_is_primary_goal_complete FROM toggle_primary_goal),
                is_busy_goal_complete = FALSE
            WHERE user_id = arg_user_id
                AND training_plan_stats_id = arg_training_plan_stats_id
                AND training_plan_day = arg_training_plan_day
            RETURNING
                user_id,
                training_plan_stats_id,
                is_primary_goal_complete,
                is_busy_goal_complete,
                is_fitness_challenge_complete,
                is_nutrition_challenge_complete,
                is_motivation_challenge_complete,
                is_coaching_class_complete,
                is_step_challenge_complete
    ), insert_if_not_exists_day_stats AS (
        INSERT INTO training_plans.training_plan_day_stats
            (user_id, program_id, training_plan_stats_id, training_plan_day, day_date, daily_points, is_primary_goal_complete)
            SELECT arg_user_id, arg_program_id, arg_training_plan_stats_id, arg_training_plan_day, arg_day_date, 3, TRUE
            WHERE NOT EXISTS (SELECT 1 FROM update_existing_day_stats)
            RETURNING
                user_id,
                training_plan_stats_id,
                is_primary_goal_complete,
                is_busy_goal_complete,
                is_fitness_challenge_complete,
                is_nutrition_challenge_complete,
                is_motivation_challenge_complete,
                is_coaching_class_complete,
                is_step_challenge_complete
    ), save_current_missed_days_streak AS (
        INSERT INTO training_plans.previous_days_missed_streak
            (user_id, program_id, training_plan_stats_id, day_date, previous_days_missed_streak)
            SELECT
                arg_user_id,
                arg_program_id,
                arg_training_plan_stats_id,
                arg_day_date,
                arg_current_days_missed
            WHERE COALESCE((SELECT is_primary_goal_complete FROM update_existing_day_stats), (SELECT is_primary_goal_complete FROM insert_if_not_exists_day_stats)) = TRUE
              AND COALESCE((SELECT is_busy_goal_complete FROM update_existing_day_stats), (SELECT is_busy_goal_complete FROM insert_if_not_exists_day_stats)) = FALSE
              AND COALESCE((SELECT is_fitness_challenge_complete FROM update_existing_day_stats), (SELECT is_fitness_challenge_complete FROM insert_if_not_exists_day_stats)) = FALSE
              AND COALESCE((SELECT is_nutrition_challenge_complete FROM update_existing_day_stats), (SELECT is_nutrition_challenge_complete FROM insert_if_not_exists_day_stats)) = FALSE
              AND COALESCE((SELECT is_motivation_challenge_complete FROM update_existing_day_stats), (SELECT is_motivation_challenge_complete FROM insert_if_not_exists_day_stats)) = FALSE
              AND COALESCE((SELECT is_coaching_class_complete FROM update_existing_day_stats), (SELECT is_coaching_class_complete FROM insert_if_not_exists_day_stats)) = FALSE
              AND COALESCE((SELECT is_step_challenge_complete FROM update_existing_day_stats), (SELECT is_step_challenge_complete FROM insert_if_not_exists_day_stats)) = FALSE
              AND arg_current_days_missed > 0
              AND NOT EXISTS (
                    SELECT 1
                    FROM training_plans.previous_days_missed_streak
                    WHERE user_id = arg_user_id
                      AND program_id = arg_program_id
                      AND training_plan_stats_id = arg_training_plan_stats_id
                      AND day_date = arg_day_date
                )
    ), current_stats AS (
        SELECT
            ts.primary_goal_streak,
            ppgs.previous_primary_goal_streak,
            ts.complete_day_streak,
            ts.days_missed_streak,
            ts.total_points,
            tpd.training_plan_day,
            (COALESCE(tpd.is_fitness_challenge_complete AND tpd.is_nutrition_challenge_complete, FALSE)) AS is_complete_day
        FROM training_plans.training_plan_stats ts
                 LEFT JOIN training_plans.training_plan_day_stats tpd
                           ON ts.user_id = tpd.user_id
                               AND ts.id = tpd.training_plan_stats_id
                               AND tpd.training_plan_day = arg_training_plan_day
                 LEFT JOIN training_plans.previous_primary_goal_streak ppgs
                           ON ts.user_id = ppgs.user_id
                               AND ts.program_id = ppgs.program_id
                               AND ts.id = ppgs.training_plan_stats_id
                               AND ppgs.day_date = arg_day_date
        WHERE (ts.user_id = (SELECT user_id FROM update_existing_day_stats)
            OR ts.user_id = (SELECT user_id FROM insert_if_not_exists_day_stats))
          AND (ts.id = (SELECT training_plan_stats_id FROM update_existing_day_stats)
            OR ts.id = (SELECT training_plan_stats_id FROM insert_if_not_exists_day_stats))
    ), get_current_missed_days_streak AS (
        SELECT
            pdms.previous_days_missed_streak,
            day_date
        FROM training_plans.previous_days_missed_streak AS pdms
        WHERE (SELECT days_missed_streak FROM current_stats) = 0
          AND arg_current_days_missed = 0
          AND user_id = arg_user_id
          AND program_id = arg_program_id
          AND training_plan_stats_id = arg_training_plan_stats_id
          AND day_date = arg_day_date
    ), new_training_plan_stats_data AS (
        SELECT
            CASE
                WHEN COALESCE((SELECT previous_primary_goal_streak FROM current_stats), 0) > 0
                    THEN COALESCE((SELECT previous_primary_goal_streak FROM current_stats), 0)
                WHEN COALESCE((SELECT is_primary_goal_complete FROM update_existing_day_stats), (SELECT is_primary_goal_complete FROM insert_if_not_exists_day_stats)) = TRUE
                    THEN primary_goal_streak + 1
                ELSE primary_goal_streak - 1
                END AS new_primary_goal_streak,
            CASE
                WHEN COALESCE((SELECT is_primary_goal_complete FROM update_existing_day_stats), (SELECT is_primary_goal_complete FROM insert_if_not_exists_day_stats)) = TRUE
                    OR (
                                 COALESCE((SELECT is_busy_goal_complete FROM update_existing_day_stats), (SELECT is_busy_goal_complete FROM insert_if_not_exists_day_stats)) = TRUE
                             OR  COALESCE((SELECT is_fitness_challenge_complete FROM update_existing_day_stats), (SELECT is_fitness_challenge_complete FROM insert_if_not_exists_day_stats)) = TRUE
                             OR  COALESCE((SELECT is_nutrition_challenge_complete FROM update_existing_day_stats), (SELECT is_nutrition_challenge_complete FROM insert_if_not_exists_day_stats)) = TRUE
                             OR  COALESCE((SELECT is_motivation_challenge_complete FROM update_existing_day_stats), (SELECT is_motivation_challenge_complete FROM insert_if_not_exists_day_stats)) = TRUE
                             OR  COALESCE((SELECT is_coaching_class_complete FROM update_existing_day_stats), (SELECT is_coaching_class_complete FROM insert_if_not_exists_day_stats)) = TRUE
                             OR  COALESCE((SELECT is_step_challenge_complete FROM update_existing_day_stats), (SELECT is_step_challenge_complete FROM insert_if_not_exists_day_stats)) = TRUE
                         )
                    THEN 0
                WHEN arg_current_days_missed = 0
                    AND (
                                 days_missed_streak = 0
                             AND COALESCE((SELECT previous_days_missed_streak FROM get_current_missed_days_streak), 0) > 0
                             AND CAST(arg_day_date AS DATE) = CAST((SELECT day_date FROM get_current_missed_days_streak) AS DATE)
                             AND COALESCE((SELECT is_primary_goal_complete FROM update_existing_day_stats), TRUE) = FALSE
                             AND COALESCE((SELECT is_busy_goal_complete FROM update_existing_day_stats), TRUE) = FALSE
                             AND COALESCE((SELECT is_fitness_challenge_complete FROM update_existing_day_stats), TRUE) = FALSE
                             AND COALESCE((SELECT is_nutrition_challenge_complete FROM update_existing_day_stats), TRUE) = FALSE
                             AND COALESCE((SELECT is_motivation_challenge_complete FROM update_existing_day_stats), TRUE) = FALSE
                             AND COALESCE((SELECT is_coaching_class_complete FROM update_existing_day_stats), TRUE) = FALSE
                             AND COALESCE((SELECT is_step_challenge_complete FROM update_existing_day_stats), TRUE) = FALSE
                         )
                    THEN (SELECT previous_days_missed_streak FROM get_current_missed_days_streak)
                ELSE arg_current_days_missed
                END AS new_days_missed_streak,
            CASE
                WHEN (SELECT is_complete_day FROM current_stats) = TRUE
                    AND COALESCE((SELECT is_primary_goal_complete FROM update_existing_day_stats), (SELECT is_primary_goal_complete FROM insert_if_not_exists_day_stats)) = TRUE
                    AND (SELECT initial_busy_goal_state FROM updated_daily_points) = FALSE
                    THEN complete_day_streak + 1
                ELSE CASE
                         WHEN (SELECT is_complete_day FROM current_stats) = TRUE
                             AND COALESCE((SELECT is_primary_goal_complete FROM update_existing_day_stats), (SELECT is_primary_goal_complete FROM insert_if_not_exists_day_stats)) = FALSE
                             THEN complete_day_streak - 1
                         ELSE complete_day_streak
                    END
                END AS new_complete_day_streak,
            CASE
                WHEN COALESCE((SELECT is_primary_goal_complete FROM update_existing_day_stats), (SELECT is_primary_goal_complete FROM insert_if_not_exists_day_stats)) = TRUE
                    THEN CASE
                             WHEN (SELECT is_complete_day FROM current_stats) = TRUE AND (SELECT initial_busy_goal_state FROM updated_daily_points) = FALSE
                                 THEN total_points + COALESCE((SELECT points_diff FROM updated_daily_points), 3) + 2
                             ELSE total_points + COALESCE((SELECT points_diff FROM updated_daily_points), 3)
                    END
                ELSE CASE
                         WHEN (SELECT is_complete_day FROM current_stats) = TRUE
                             THEN total_points - 5
                         ELSE total_points - 3
                    END
                END AS new_total_points
        FROM current_stats
    )
    UPDATE training_plans.training_plan_stats
    SET total_points = GREATEST((SELECT new_total_points FROM new_training_plan_stats_data), 0),
        primary_goal_streak = GREATEST((SELECT new_primary_goal_streak FROM new_training_plan_stats_data), 0),
        complete_day_streak = GREATEST((SELECT new_complete_day_streak FROM new_training_plan_stats_data), 0),
        days_missed_streak = GREATEST((SELECT new_days_missed_streak FROM new_training_plan_stats_data), 0)
    WHERE (user_id = (SELECT user_id FROM update_existing_day_stats)
        OR user_id = (SELECT user_id FROM insert_if_not_exists_day_stats))
      AND (id = (SELECT training_plan_stats_id FROM update_existing_day_stats)
        OR id = (SELECT training_plan_stats_id FROM insert_if_not_exists_day_stats));

    DELETE FROM training_plans.previous_primary_goal_streak
    WHERE user_id = arg_user_id
      AND program_id = arg_program_id
      AND training_plan_stats_id = arg_training_plan_stats_id;
END;
$$;