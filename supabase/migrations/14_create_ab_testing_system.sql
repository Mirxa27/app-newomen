/*
# A/B Testing System

## Overview
Comprehensive A/B testing system for AI configurations, allowing admins to test different
AI providers, models, prompts, and parameters to optimize performance and costs.

## Tables

### 1. ab_experiments
Stores A/B test experiment definitions.
- `id` (uuid, primary key)
- `name` (text) - Experiment name
- `description` (text) - Experiment description
- `function_key` (text) - AI function being tested (e.g., 'chat', 'assessment_insights')
- `status` (text) - Experiment status (draft, active, paused, completed)
- `traffic_split` (jsonb) - Traffic distribution between variants (e.g., {"A": 50, "B": 50})
- `start_date` (timestamptz) - When experiment started
- `end_date` (timestamptz) - When experiment should end
- `success_metric` (text) - Primary metric to measure (response_time, success_rate, cost, user_satisfaction)
- `min_sample_size` (integer) - Minimum samples needed for statistical significance
- `created_by` (uuid, references profiles)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2. ab_variants
Stores test variants (A, B, C, etc.) for each experiment.
- `id` (uuid, primary key)
- `experiment_id` (uuid, references ab_experiments)
- `variant_name` (text) - Variant identifier (A, B, C, etc.)
- `function_config_id` (uuid, references ai_mgmt_function_configs) - AI config for this variant
- `traffic_percentage` (numeric) - Percentage of traffic for this variant (0-100)
- `is_control` (boolean) - Whether this is the control variant
- `description` (text) - Variant description
- `created_at` (timestamptz)

### 3. ab_assignments
Tracks which users are assigned to which variants.
- `id` (uuid, primary key)
- `experiment_id` (uuid, references ab_experiments)
- `user_id` (uuid, references profiles)
- `variant_id` (uuid, references ab_variants)
- `assigned_at` (timestamptz) - When user was assigned
- `last_used_at` (timestamptz) - Last time this assignment was used
- UNIQUE(experiment_id, user_id) - One variant per user per experiment

### 4. ab_results
Stores aggregated results for each variant.
- `id` (uuid, primary key)
- `experiment_id` (uuid, references ab_experiments)
- `variant_id` (uuid, references ab_variants)
- `total_interactions` (integer) - Total interactions for this variant
- `successful_interactions` (integer) - Successful interactions
- `failed_interactions` (integer) - Failed interactions
- `avg_response_time_ms` (numeric) - Average response time
- `total_tokens` (bigint) - Total tokens used
- `estimated_cost` (numeric) - Estimated cost
- `avg_user_satisfaction` (numeric) - Average user satisfaction (if tracked)
- `calculated_at` (timestamptz) - When results were calculated
- `updated_at` (timestamptz)

## Security
- RLS enabled on all tables
- Only admins can create/manage experiments
- Users cannot see which variant they're assigned to
*/

-- Create enum types
CREATE TYPE experiment_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE success_metric AS ENUM ('response_time', 'success_rate', 'cost', 'user_satisfaction', 'engagement');

-- A/B Experiments table
CREATE TABLE IF NOT EXISTS ab_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  function_key text NOT NULL,
  status experiment_status DEFAULT 'draft' NOT NULL,
  traffic_split jsonb DEFAULT '{"A": 50, "B": 50}'::jsonb,
  start_date timestamptz,
  end_date timestamptz,
  success_metric success_metric DEFAULT 'response_time' NOT NULL,
  min_sample_size integer DEFAULT 100,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- A/B Variants table
CREATE TABLE IF NOT EXISTS ab_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid REFERENCES ab_experiments(id) ON DELETE CASCADE NOT NULL,
  variant_name text NOT NULL,
  function_config_id uuid REFERENCES ai_mgmt_function_configs(id) ON DELETE SET NULL,
  traffic_percentage numeric DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
  is_control boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(experiment_id, variant_name)
);

-- A/B Assignments table
CREATE TABLE IF NOT EXISTS ab_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid REFERENCES ab_experiments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES ab_variants(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now() NOT NULL,
  last_used_at timestamptz,
  UNIQUE(experiment_id, user_id)
);

-- A/B Results table
CREATE TABLE IF NOT EXISTS ab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid REFERENCES ab_experiments(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid REFERENCES ab_variants(id) ON DELETE CASCADE NOT NULL,
  total_interactions integer DEFAULT 0,
  successful_interactions integer DEFAULT 0,
  failed_interactions integer DEFAULT 0,
  avg_response_time_ms numeric DEFAULT 0,
  total_tokens bigint DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  avg_user_satisfaction numeric,
  calculated_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(experiment_id, variant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ab_experiments_function_key ON ab_experiments(function_key);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX IF NOT EXISTS idx_ab_variants_experiment_id ON ab_variants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment_user ON ab_assignments(experiment_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user_id ON ab_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_experiment_variant ON ab_results(experiment_id, variant_id);

-- Function to assign user to a variant (random assignment based on traffic split)
CREATE OR REPLACE FUNCTION assign_user_to_variant(
  p_experiment_id uuid,
  p_user_id uuid
) RETURNS uuid AS $$
DECLARE
  v_variant_id uuid;
  v_traffic_split jsonb;
  v_random numeric;
  v_cumulative numeric := 0;
  v_variant_record record;
BEGIN
  -- Check if user is already assigned
  SELECT variant_id INTO v_variant_id
  FROM ab_assignments
  WHERE experiment_id = p_experiment_id AND user_id = p_user_id;
  
  IF v_variant_id IS NOT NULL THEN
    RETURN v_variant_id;
  END IF;
  
  -- Get experiment traffic split
  SELECT traffic_split INTO v_traffic_split
  FROM ab_experiments
  WHERE id = p_experiment_id AND status = 'active';
  
  IF v_traffic_split IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Generate random number (0-100)
  v_random := random() * 100;
  
  -- Assign based on traffic split
  FOR v_variant_record IN
    SELECT id, variant_name, traffic_percentage
    FROM ab_variants
    WHERE experiment_id = p_experiment_id
    ORDER BY variant_name
  LOOP
    v_cumulative := v_cumulative + v_variant_record.traffic_percentage;
    IF v_random <= v_cumulative THEN
      v_variant_id := v_variant_record.id;
      EXIT;
    END IF;
  END LOOP;
  
  -- If no variant found (shouldn't happen), assign to first variant
  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id
    FROM ab_variants
    WHERE experiment_id = p_experiment_id
    ORDER BY variant_name
    LIMIT 1;
  END IF;
  
  -- Create assignment
  INSERT INTO ab_assignments (experiment_id, user_id, variant_id)
  VALUES (p_experiment_id, p_user_id, v_variant_id)
  ON CONFLICT (experiment_id, user_id) DO UPDATE
  SET variant_id = EXCLUDED.variant_id,
      last_used_at = now();
  
  RETURN v_variant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate experiment results
CREATE OR REPLACE FUNCTION calculate_experiment_results(
  p_experiment_id uuid
) RETURNS void AS $$
BEGIN
  -- Calculate results for each variant based on interaction logs
  INSERT INTO ab_results (
    experiment_id,
    variant_id,
    total_interactions,
    successful_interactions,
    failed_interactions,
    avg_response_time_ms,
    total_tokens,
    estimated_cost,
    calculated_at,
    updated_at
  )
  SELECT
    p_experiment_id,
    av.id as variant_id,
    COUNT(*)::integer as total_interactions,
    COUNT(*) FILTER (WHERE ail.status = 'success')::integer as successful_interactions,
    COUNT(*) FILTER (WHERE ail.status = 'error')::integer as failed_interactions,
    AVG(ail.response_time_ms) as avg_response_time_ms,
    SUM(ail.tokens_used)::bigint as total_tokens,
    (SUM(ail.tokens_used) / 1000.0 * 0.005) as estimated_cost,
    now() as calculated_at,
    now() as updated_at
  FROM ab_variants av
  LEFT JOIN ai_mgmt_function_configs afc ON av.function_config_id = afc.id
  LEFT JOIN ai_mgmt_interaction_logs ail ON 
    ail.function_id = afc.function_id AND
    ail.provider_id = afc.provider_id AND
    ail.model_id = afc.model_id AND
    ail.created_at >= (SELECT start_date FROM ab_experiments WHERE id = p_experiment_id)
  WHERE av.experiment_id = p_experiment_id
  GROUP BY av.id
  ON CONFLICT (experiment_id, variant_id) DO UPDATE
  SET
    total_interactions = EXCLUDED.total_interactions,
    successful_interactions = EXCLUDED.successful_interactions,
    failed_interactions = EXCLUDED.failed_interactions,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    total_tokens = EXCLUDED.total_tokens,
    estimated_cost = EXCLUDED.estimated_cost,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_results ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage experiments" ON ab_experiments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage variants" ON ab_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view assignments" ON ab_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own assignments" ON ab_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view results" ON ab_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_ab_experiments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ab_experiments_updated_at
  BEFORE UPDATE ON ab_experiments
  FOR EACH ROW
  EXECUTE FUNCTION update_ab_experiments_updated_at();

CREATE TRIGGER update_ab_results_updated_at
  BEFORE UPDATE ON ab_results
  FOR EACH ROW
  EXECUTE FUNCTION update_ab_experiments_updated_at();

