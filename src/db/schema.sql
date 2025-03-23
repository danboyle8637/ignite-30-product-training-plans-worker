CREATE SCHEMA training_plans;

-- Show all database schemas
SELECT schema_name FROM information_schema.schemata;

-- Create the enum type for program_id
CREATE TYPE training_plans.program_id AS ENUM (
  'ignite_reset', 
  'ignite_30_beginner',
  'ignite_30_advanced',
  );

CREATE TYPE training_plans.status AS ENUM ('active', 'canceled', 'complete');

-- Create the training_plan_stats table
CREATE TABLE IF NOT EXISTS training_plans.training_plan_stats (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255) NOT NULL,
    status training_plans.status NOT NULL DEFAULT 'active',
    program_id training_plans.program_id NOT NULL,
    start_date VARCHAR(10) NOT NULL,
    end_date VARCHAR(10) NOT NULL,
    attempt_number SMALLINT NOT NULL DEFAULT 1,
    total_points SMALLINT NOT NULL DEFAULT 0,
    primary_goal_streak SMALLINT NOT NULL DEFAULT 0,
    longest_primary_goal_streak SMALLINT NOT NULL DEFAULT 0,
    complete_day_streak SMALLINT NOT NULL DEFAULT 0,
    longest_complete_day_streak SMALLINT NOT NULL DEFAULT 0,
    fit_quickie_streak SMALLINT NOT NULL DEFAULT 0,
    longest_fit_quickie_streak SMALLINT NOT NULL DEFAULT 0,
    days_missed_streak SMALLINT NOT NULL DEFAULT 0,
    longest_days_missed_streak SMALLINT NOT NULL DEFAULT 0
);

-- Create the training_plan_day_stats table
CREATE TABLE IF NOT EXISTS training_plans.training_plan_day_stats (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255) NOT NULL,
    program_id training_plans.program_id NOT NULL,
    training_plan_stats_id INTEGER NOT NULL,
    training_plan_day SMALLINT NOT NULL,
    day_date VARCHAR(10) NOT NULL,
    daily_points SMALLINT NOT NULL DEFAULT 0,
    is_primary_goal_complete BOOLEAN NOT NULL DEFAULT FALSE,
    is_busy_goal_complete BOOLEAN NOT NULL DEFAULT FALSE,
    is_fitness_challenge_complete BOOLEAN NOT NULL DEFAULT FALSE,
    is_nutrition_challenge_complete BOOLEAN NOT NULL DEFAULT FALSE,
    is_motivation_challenge_complete BOOLEAN NOT NULL DEFAULT FALSE,
    is_coaching_class_complete BOOLEAN NOT NULL DEFAULT FALSE,
    is_step_challenge_complete BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_training_plan_stats_training_plan_day_stats_id
        FOREIGN KEY (training_plan_stats_id)
            REFERENCES training_plans.training_plan_stats(id)
);

-- I think we can delete these... not sure yet
CREATE TABLE IF NOT EXISTS training_plans.previous_primary_goal_streak (
   id SERIAL PRIMARY KEY,
   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   user_id VARCHAR(255) NOT NULL,
   program_id training_plans.program_id NOT NULL,
   training_plan_stats_id SMALLINT NOT NULL,
   day_date VARCHAR(10) NOT NULL,
   previous_primary_goal_streak SMALLINT NOT NULL DEFAULT 0,
   CONSTRAINT fk_tps_day_stats_id
       FOREIGN KEY (training_plan_stats_id)
           REFERENCES training_plans.training_plan_stats(id)
);

-- I think we can delete these... not sure yet
CREATE TABLE IF NOT EXISTS training_plans.previous_days_missed_streak (
   id SERIAL PRIMARY KEY,
   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   user_id VARCHAR(255) NOT NULL,
   program_id training_plans.program_id NOT NULL,
   training_plan_stats_id SMALLINT NOT NULL,
   day_date VARCHAR(10) NOT NULL,
   previous_days_missed_streak SMALLINT NOT NULL DEFAULT 0,
   CONSTRAINT fk_tps_day_stats_id
       FOREIGN KEY (training_plan_stats_id)
           REFERENCES training_plans.training_plan_stats(id)
);

-- CREATE TRIGGER TO UPDATE UPDATE_AT COLUMN --
CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_updated_at_training_plan_stats_trigger
    BEFORE UPDATE ON training_plans.training_plan_stats
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_updated_at_training_plan_day_stats_trigger
    BEFORE UPDATE ON training_plans.training_plan_day_stats
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_updated_at_previous_primary_goal_streak_trigger
    BEFORE UPDATE ON training_plans.previous_primary_goal_streak
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_updated_at_previous_days_missed_streak_trigger
    BEFORE UPDATE ON training_plans.previous_days_missed_streak
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();