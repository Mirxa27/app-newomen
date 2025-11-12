/*
# Add Subscription System

## Overview
This migration adds subscription management capabilities to the platform, enabling tiered access to features.

## Changes

### 1. New Types
- `subscription_tier`: Enum for subscription levels (free, discovery, growth, transformation)
- `subscription_status`: Enum for subscription states (active, canceled, expired, trial)

### 2. Table Modifications
- Add subscription fields to `profiles` table:
  - `subscription_tier`: Current subscription level
  - `subscription_status`: Current subscription state
  - `subscription_start_date`: When subscription started
  - `subscription_end_date`: When subscription expires
  - `trial_end_date`: When trial period ends

### 3. New Tables
- `subscription_history`: Track all subscription changes
  - Records tier changes, cancellations, renewals
  - Maintains audit trail for billing

### 4. Security
- Users can view their own subscription details
- Admins can view and modify all subscriptions
- Subscription history is read-only for users

## Notes
- Free tier is the default for all users
- Trial period is 7 days for premium tiers
- Subscription dates use timestamptz for timezone support
*/

-- Create subscription tier enum
CREATE TYPE subscription_tier AS ENUM ('free', 'discovery', 'growth', 'transformation');

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'trial', 'canceled', 'expired');

-- Add subscription fields to profiles table
ALTER TABLE profiles
ADD COLUMN subscription_tier subscription_tier DEFAULT 'free'::subscription_tier NOT NULL,
ADD COLUMN subscription_status subscription_status DEFAULT 'active'::subscription_status NOT NULL,
ADD COLUMN subscription_start_date timestamptz DEFAULT now(),
ADD COLUMN subscription_end_date timestamptz,
ADD COLUMN trial_end_date timestamptz;

-- Create subscription history table
CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  previous_tier subscription_tier,
  new_tier subscription_tier NOT NULL,
  previous_status subscription_status,
  new_status subscription_status NOT NULL,
  change_reason text,
  changed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_created_at ON subscription_history(created_at DESC);

-- Enable RLS on subscription_history
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscription history
CREATE POLICY "Users can view own subscription history" ON subscription_history
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can view all subscription history
CREATE POLICY "Admins can view all subscription history" ON subscription_history
  FOR SELECT USING (is_admin(auth.uid()));

-- Policy: System can insert subscription history (via triggers or admin actions)
CREATE POLICY "Admins can insert subscription history" ON subscription_history
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(uid uuid, required_tier subscription_tier)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid
    AND p.subscription_status IN ('active', 'trial')
    AND (
      p.subscription_end_date IS NULL 
      OR p.subscription_end_date > now()
      OR p.trial_end_date > now()
    )
    AND (
      CASE required_tier
        WHEN 'free' THEN TRUE
        WHEN 'discovery' THEN p.subscription_tier IN ('discovery', 'growth', 'transformation')
        WHEN 'growth' THEN p.subscription_tier IN ('growth', 'transformation')
        WHEN 'transformation' THEN p.subscription_tier = 'transformation'
      END
    )
  );
$$;

-- Function to log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND (
    OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier OR
    OLD.subscription_status IS DISTINCT FROM NEW.subscription_status
  )) THEN
    INSERT INTO subscription_history (
      user_id,
      previous_tier,
      new_tier,
      previous_status,
      new_status,
      change_reason,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.subscription_tier,
      NEW.subscription_tier,
      OLD.subscription_status,
      NEW.subscription_status,
      'Subscription updated',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for subscription changes
CREATE TRIGGER on_subscription_change
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_change();

-- Insert initial subscription history for existing users
INSERT INTO subscription_history (user_id, new_tier, new_status, change_reason)
SELECT id, 'free'::subscription_tier, 'active'::subscription_status, 'Initial subscription'
FROM profiles
WHERE id NOT IN (SELECT user_id FROM subscription_history);
