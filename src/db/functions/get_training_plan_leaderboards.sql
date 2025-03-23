CREATE OR REPLACE FUNCTION training_plans.get_training_plan_leaderboards(
    IN arg_program_id training_plans.program_id,
    IN arg_status training_plans.status,
    IN arg_start_date VARCHAR(10) DEFAULT NULL
)
    RETURNS TABLE (
                      username VARCHAR(40),
                      avatar_url VARCHAR(255),
                      points_streak SMALLINT,
                      leaderboard_type VARCHAR(60)
                  ) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
        SELECT
            COALESCE(u.username, 'undefined') AS username,
            COALESCE(u.avatar_url, 'undefined') AS avatar_url,
            tps.total_points,
            'total_points_leaderboard'::VARCHAR(60) AS leaderboard_type
        FROM users.users u
                 INNER JOIN training_plans.training_plan_stats tps ON u.user_id = tps.user_id
        WHERE tps.program_id = arg_program_id
          AND tps.status = arg_status
          AND (arg_start_date IS NULL OR tps.start_date = arg_start_date)
        ORDER BY
            tps.total_points DESC,
            tps.longest_primary_goal_streak DESC,
            tps.longest_days_missed_streak ASC
        LIMIT 10;

    RETURN QUERY
        SELECT
            COALESCE(u.username, 'undefined') AS username,
            COALESCE(u.avatar_url, 'undefined') AS avatar_url,
            tps.longest_primary_goal_streak,
            'longest_primary_goal_streak_leaderboard'::VARCHAR(60) AS leaderboard_type
        FROM users.users u
                 INNER JOIN training_plans.training_plan_stats tps ON u.user_id = tps.user_id
        WHERE tps.program_id = arg_program_id
          AND tps.status = arg_status
          AND (arg_start_date IS NULL OR tps.start_date = arg_start_date)
        ORDER BY
            tps.longest_primary_goal_streak DESC,
            tps.complete_day_streak DESC,
            tps.longest_days_missed_streak ASC
        LIMIT 10;

    RETURN QUERY
        SELECT
            COALESCE(u.username, 'undefined') AS username,
            COALESCE(u.avatar_url, 'undefined') AS avatar_url,
            tps.longest_complete_day_streak,
            'longest_complete_day_streak_leaderboard'::VARCHAR(60) AS leaderboard_type
        FROM users.users u
                 INNER JOIN training_plans.training_plan_stats tps ON u.user_id = tps.user_id
        WHERE tps.program_id = arg_program_id
          AND tps.status = arg_status
          AND (arg_start_date IS NULL OR tps.start_date = arg_start_date)
        ORDER BY
            tps.longest_complete_day_streak DESC,
            tps.longest_primary_goal_streak DESC,
            tps.longest_days_missed_streak ASC
        LIMIT 10;

    RETURN QUERY
        SELECT
            COALESCE(u.username, 'undefined') AS username,
            COALESCE(u.avatar_url, 'undefined') AS avatar_url,
            tps.longest_fit_quickie_streak,
            'longest_fit_quickie_streak_leaderboard'::VARCHAR(60) AS leaderboard_type
        FROM users.users u
                 INNER JOIN training_plans.training_plan_stats tps ON u.user_id = tps.user_id
        WHERE tps.program_id = arg_program_id
          AND tps.status = arg_status
          AND (arg_start_date IS NULL OR tps.start_date = arg_start_date)
        ORDER BY
            tps.longest_fit_quickie_streak DESC,
            tps.longest_primary_goal_streak DESC,
            tps.longest_days_missed_streak ASC
        LIMIT 10;
END;
$$;