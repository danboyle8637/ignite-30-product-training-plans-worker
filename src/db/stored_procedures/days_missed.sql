CREATE OR REPLACE PROCEDURE training_plans.update_training_plan_stats_after_days_missed(
    IN arg_user_id VARCHAR(255),
    IN arg_training_plan_stats_id SMALLINT,
    IN arg_number_of_days_missed SMALLINT
) LANGUAGE plpgsql
AS $$
BEGIN
    WITH current_streaks AS (
        SELECT
            total_points,
            primary_goal_streak,
            complete_day_streak,
            fit_quickie_streak
        FROM training_plans.training_plan_stats
        WHERE user_id = arg_user_id
          AND id = arg_training_plan_stats_id
    )
    UPDATE training_plans.training_plan_stats
    SET longest_primary_goal_streak = GREATEST((SELECT primary_goal_streak FROM current_streaks), longest_primary_goal_streak, 0),
        longest_complete_day_streak = GREATEST((SELECT complete_day_streak FROM current_streaks), longest_complete_day_streak, 0),
        longest_fit_quickie_streak = GREATEST((SELECT fit_quickie_streak FROM current_streaks), longest_fit_quickie_streak, 0),
        primary_goal_streak = 0,
        complete_day_streak = 0,
        fit_quickie_streak = 0,
        days_missed_streak = arg_number_of_days_missed,
        total_points = GREATEST(total_points - arg_number_of_days_missed, 0),
        longest_days_missed_streak = GREATEST(longest_days_missed_streak, arg_number_of_days_missed)
    WHERE user_id = arg_user_id
      AND id = arg_training_plan_stats_id;
END;
$$;