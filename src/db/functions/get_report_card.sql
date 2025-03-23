CREATE OR REPLACE FUNCTION training_plans.get_training_plan_report_card_final_points_and_grade(
    IN arg_user_id VARCHAR(255),
    IN arg_program_id training_plans.program_id,
    IN arg_stats_row_id INT,
    IN arg_total_possible_points SMALLINT
)
RETURNS TABLE (
    user_id VARCHAR(255),
    total_points SMALLINT,
    bonus_points SMALLINT,
    earned_points SMALLINT,
    final_grade SMALLINT,
    longest_primary_goal_streak SMALLINT,
    longest_complete_day_streak SMALLINT,
    longest_fit_quickie_streak SMALLINT,
    longest_days_missed_streak SMALLINT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
        WITH total_and_bonus_points AS (
            SELECT
                tps.user_id,
                tps.total_points,
                tps.longest_primary_goal_streak,
                tps.longest_complete_day_streak,
                tps.longest_fit_quickie_streak,
                tps.longest_days_missed_streak,
                CAST(
                    (
                        SELECT count(*) AS bonus_points
                        FROM training_plans.training_plan_day_stats tpds
                        WHERE tpds.user_id = arg_user_id
                          AND tpds.program_id = arg_program_id
                          AND tpds.training_plan_stats_id = arg_stats_row_id
                          AND tpds.is_fitness_challenge_complete = TRUE
                          AND tpds.is_nutrition_challenge_complete = TRUE
                          AND (tpds.is_primary_goal_complete = TRUE OR tpds.is_busy_goal_complete = TRUE)
                    ) AS SMALLINT
                ) AS bonus_points
            FROM training_plans.training_plan_stats tps
            WHERE tps.user_id = arg_user_id
              AND tps.program_id = arg_program_id
              AND tps.status = 'complete'
              AND tps.id = arg_stats_row_id
        )
        SELECT
            points.user_id,
            points.total_points,
            points.bonus_points,
            CAST((points.total_points - points.bonus_points) AS SMALLINT) AS earned_points,
            CAST(FLOOR(CAST(points.total_points AS NUMERIC) / arg_total_possible_points * 100) AS SMALLINT) AS final_grade,
            points.longest_primary_goal_streak,
            points.longest_complete_day_streak,
            points.longest_fit_quickie_streak,
            points.longest_days_missed_streak
        FROM total_and_bonus_points points;
END;
$$;