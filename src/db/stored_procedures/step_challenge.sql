CREATE OR REPLACE PROCEDURE training_plans.toggle_is_step_challenge_complete(
    IN arg_user_id VARCHAR(255),
    IN arg_program_id training_plans.program_id,
    IN arg_training_plan_stats_id INTEGER,
    IN arg_training_plan_day SMALLINT,
    IN arg_day_date VARCHAR(10),
    IN arg_current_days_missed SMALLINT
) LANGUAGE plpgsql AS $$
BEGIN
    WITH update_existing AS (
        UPDATE training_plans.training_plan_day_stats
            SET daily_points = daily_points + CASE
                                                  WHEN is_step_challenge_complete = FALSE THEN 1
                                                  ELSE -1
                END,
                is_step_challenge_complete = NOT is_step_challenge_complete
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
    ), insert_if_not_exists AS (
        INSERT INTO training_plans.training_plan_day_stats
            (user_id, program_id, training_plan_stats_id, training_plan_day, day_date, daily_points, is_step_challenge_complete)
            SELECT arg_user_id, arg_program_id, arg_training_plan_stats_id, arg_training_plan_day, arg_day_date, 1, TRUE
            WHERE NOT EXISTS (SELECT 1 FROM update_existing)
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
            WHERE COALESCE((SELECT is_step_challenge_complete FROM update_existing), (SELECT is_step_challenge_complete FROM insert_if_not_exists)) = TRUE
              AND COALESCE((SELECT is_busy_goal_complete FROM update_existing), (SELECT is_busy_goal_complete FROM insert_if_not_exists)) = FALSE
              AND COALESCE((SELECT is_primary_goal_complete FROM update_existing), (SELECT is_primary_goal_complete FROM insert_if_not_exists)) = FALSE
              AND COALESCE((SELECT is_nutrition_challenge_complete FROM update_existing), (SELECT is_nutrition_challenge_complete FROM insert_if_not_exists)) = FALSE
              AND COALESCE((SELECT is_fitness_challenge_complete FROM update_existing), (SELECT is_fitness_challenge_complete FROM insert_if_not_exists)) = FALSE
              AND COALESCE((SELECT is_coaching_class_complete FROM update_existing), (SELECT is_coaching_class_complete FROM insert_if_not_exists)) = FALSE
              AND COALESCE((SELECT is_motivation_challenge_complete FROM update_existing), (SELECT is_motivation_challenge_complete FROM insert_if_not_exists)) = FALSE
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
            ts.total_points,
            ts.days_missed_streak
        FROM training_plans.training_plan_stats ts
        WHERE (ts.user_id = (SELECT user_id FROM update_existing)
            OR ts.user_id = (SELECT user_id FROM insert_if_not_exists))
          AND (ts.id = (SELECT training_plan_stats_id FROM update_existing)
            OR ts.id = (SELECT training_plan_stats_id FROM insert_if_not_exists))
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
    ), new_training_plan_data AS (
        SELECT CASE
                   WHEN COALESCE((SELECT is_step_challenge_complete FROM insert_if_not_exists),
                                 (SELECT is_step_challenge_complete FROM update_existing)) = TRUE
                       THEN total_points + 1
                   ELSE total_points - 1
                   END AS new_total_points,
               CASE
                   WHEN COALESCE((SELECT is_step_challenge_complete FROM update_existing), (SELECT is_step_challenge_complete FROM insert_if_not_exists)) = TRUE
                       OR (
                                    COALESCE((SELECT is_primary_goal_complete FROM update_existing), (SELECT is_primary_goal_complete FROM insert_if_not_exists)) = TRUE
                                OR  COALESCE((SELECT is_busy_goal_complete FROM update_existing), (SELECT is_busy_goal_complete FROM insert_if_not_exists)) = TRUE
                                OR  COALESCE((SELECT is_nutrition_challenge_complete FROM update_existing), (SELECT is_nutrition_challenge_complete FROM insert_if_not_exists)) = TRUE
                                OR  COALESCE((SELECT is_motivation_challenge_complete FROM update_existing), (SELECT is_motivation_challenge_complete FROM insert_if_not_exists)) = TRUE
                                OR  COALESCE((SELECT is_coaching_class_complete FROM update_existing), (SELECT is_coaching_class_complete FROM insert_if_not_exists)) = TRUE
                                OR  COALESCE((SELECT is_fitness_challenge_complete FROM update_existing), (SELECT is_fitness_challenge_complete FROM insert_if_not_exists)) = TRUE
                            )
                       THEN 0
                   WHEN arg_current_days_missed = 0
                       AND (
                                    days_missed_streak = 0
                                AND COALESCE((SELECT previous_days_missed_streak FROM get_current_missed_days_streak), 0) > 0
                                AND CAST(arg_day_date AS DATE) = CAST((SELECT day_date FROM get_current_missed_days_streak) AS DATE)
                                AND COALESCE((SELECT is_primary_goal_complete FROM update_existing), TRUE) = FALSE
                                AND COALESCE((SELECT is_busy_goal_complete FROM update_existing), TRUE) = FALSE
                                AND COALESCE((SELECT is_fitness_challenge_complete FROM update_existing), TRUE) = FALSE
                                AND COALESCE((SELECT is_nutrition_challenge_complete FROM update_existing), TRUE) = FALSE
                                AND COALESCE((SELECT is_motivation_challenge_complete FROM update_existing), TRUE) = FALSE
                                AND COALESCE((SELECT is_coaching_class_complete FROM update_existing), TRUE) = FALSE
                                AND COALESCE((SELECT is_step_challenge_complete FROM update_existing), TRUE) = FALSE
                            )
                       THEN (SELECT previous_days_missed_streak FROM get_current_missed_days_streak)
                   ELSE arg_current_days_missed
                   END AS new_days_missed_streak
        FROM current_stats
    )
    UPDATE training_plans.training_plan_stats
    SET total_points = GREATEST((SELECT new_total_points FROM new_training_plan_data), 0),
        days_missed_streak = GREATEST((SELECT new_days_missed_streak FROM new_training_plan_data), 0)
    WHERE (user_id = (SELECT user_id FROM update_existing)
        OR user_id = (SELECT user_id FROM insert_if_not_exists))
      AND (id = (SELECT training_plan_stats_id FROM update_existing)
        OR id = (SELECT training_plan_stats_id FROM insert_if_not_exists));
END;
$$;