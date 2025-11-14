-- =====================================================
-- Migration 12: Visitor Assessments System
-- =====================================================
-- Purpose: Enable visitor-accessible free assessments
-- Phase: 3 - Visitor-Facing Free Assessments
-- =====================================================

-- 1. Add visitor accessibility columns to assessments table
-- =====================================================
ALTER TABLE assessments 
  ADD COLUMN IF NOT EXISTS is_visitor_accessible BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_auth BOOLEAN DEFAULT true;

-- Create index for faster queries on visitor assessments
CREATE INDEX IF NOT EXISTS idx_assessments_visitor_accessible 
  ON assessments(is_visitor_accessible) 
  WHERE is_visitor_accessible = true;

-- 2. Update RLS policy to allow public read for visitor assessments
-- =====================================================
DROP POLICY IF EXISTS "Public can view visitor assessments" ON assessments;

CREATE POLICY "Public can view visitor assessments"
  ON assessments FOR SELECT
  TO anon
  USING (is_visitor_accessible = true);

-- 3. Insert 5-6 Free Visitor Assessments
-- =====================================================

-- Assessment 1: Quick Personality Type (10 questions)
INSERT INTO assessments (
  title, 
  description, 
  category, 
  duration_minutes, 
  is_visitor_accessible, 
  requires_auth,
  questions
) VALUES (
  'Quick Personality Type',
  'Discover your core personality traits and how you interact with the world. This quick assessment helps you understand your natural tendencies and preferences.',
  'personality',
  10,
  true,
  false,
  jsonb_build_object(
    'questions', jsonb_build_array(
      jsonb_build_object(
        'id', 'q1',
        'text', 'How do you typically recharge your energy?',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'alone', 'label', 'Spending time alone or with close friends', 'score', jsonb_build_object('introvert', 2)),
          jsonb_build_object('value', 'social', 'label', 'Being around lots of people and social events', 'score', jsonb_build_object('extrovert', 2)),
          jsonb_build_object('value', 'mixed', 'label', 'A balance of both depending on mood', 'score', jsonb_build_object('ambivert', 2))
        )
      ),
      jsonb_build_object(
        'id', 'q2',
        'text', 'When making important decisions, you rely more on:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'logic', 'label', 'Logic, facts, and objective analysis', 'score', jsonb_build_object('thinking', 2)),
          jsonb_build_object('value', 'feelings', 'label', 'Feelings, values, and personal impact', 'score', jsonb_build_object('feeling', 2)),
          jsonb_build_object('value', 'both', 'label', 'Both equally depending on the situation', 'score', jsonb_build_object('balanced', 1))
        )
      ),
      jsonb_build_object(
        'id', 'q3',
        'text', 'In your daily life, you prefer:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'structured', 'label', 'Structure, planning, and organization', 'score', jsonb_build_object('judging', 2)),
          jsonb_build_object('value', 'flexible', 'label', 'Flexibility, spontaneity, and adaptability', 'score', jsonb_build_object('perceiving', 2)),
          jsonb_build_object('value', 'adaptive', 'label', 'A mix depending on what the situation requires', 'score', jsonb_build_object('adaptive', 1))
        )
      ),
      jsonb_build_object(
        'id', 'q4',
        'text', 'When learning something new, you prefer:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'concepts', 'label', 'Big picture concepts and abstract ideas', 'score', jsonb_build_object('intuitive', 2)),
          jsonb_build_object('value', 'details', 'label', 'Concrete details and practical applications', 'score', jsonb_build_object('sensing', 2)),
          jsonb_build_object('value', 'both', 'label', 'Both theory and practice together', 'score', jsonb_build_object('balanced', 1))
        )
      ),
      jsonb_build_object(
        'id', 'q5',
        'text', 'In group settings, you typically:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'lead', 'label', 'Take charge and lead discussions', 'score', jsonb_build_object('extrovert', 2)),
          jsonb_build_object('value', 'observe', 'label', 'Observe and contribute thoughtfully', 'score', jsonb_build_object('introvert', 2)),
          jsonb_build_object('value', 'collaborate', 'label', 'Collaborate equally with others', 'score', jsonb_build_object('balanced', 1))
        )
      ),
      jsonb_build_object(
        'id', 'q6',
        'text', 'Your ideal weekend involves:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'planned', 'label', 'Pre-planned activities with clear schedule', 'score', jsonb_build_object('judging', 2)),
          jsonb_build_object('value', 'spontaneous', 'label', 'Going with the flow and being spontaneous', 'score', jsonb_build_object('perceiving', 2)),
          jsonb_build_object('value', 'loose', 'label', 'Loose plans with room for changes', 'score', jsonb_build_object('adaptive', 1))
        )
      ),
      jsonb_build_object(
        'id', 'q7',
        'text', 'When facing problems, you:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'analyze', 'label', 'Analyze systematically to find solutions', 'score', jsonb_build_object('thinking', 2)),
          jsonb_build_object('value', 'empathize', 'label', 'Consider how it affects people emotionally', 'score', jsonb_build_object('feeling', 2)),
          jsonb_build_object('value', 'holistic', 'label', 'Look at both logical and emotional aspects', 'score', jsonb_build_object('balanced', 1))
        )
      ),
      jsonb_build_object(
        'id', 'q8',
        'text', 'You are more interested in:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'present', 'label', 'Present reality and what is happening now', 'score', jsonb_build_object('sensing', 2)),
          jsonb_build_object('value', 'future', 'label', 'Future possibilities and what could be', 'score', jsonb_build_object('intuitive', 2)),
          jsonb_build_object('value', 'connected', 'label', 'Connecting past, present, and future', 'score', jsonb_build_object('balanced', 1))
        )
      ),
      jsonb_build_object(
        'id', 'q9',
        'text', 'After a busy week, you most need:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'solitude', 'label', 'Quiet time alone to recharge', 'score', jsonb_build_object('introvert', 2)),
          jsonb_build_object('value', 'socialization', 'label', 'Social activities to energize you', 'score', jsonb_build_object('extrovert', 2)),
          jsonb_build_object('value', 'variety', 'label', 'A mix of social and alone time', 'score', jsonb_build_object('ambivert', 2))
        )
      ),
      jsonb_build_object(
        'id', 'q10',
        'text', 'Your approach to deadlines is:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'early', 'label', 'Complete tasks well before the deadline', 'score', jsonb_build_object('judging', 2)),
          jsonb_build_object('value', 'pressure', 'label', 'Work best under time pressure', 'score', jsonb_build_object('perceiving', 2)),
          jsonb_build_object('value', 'steady', 'label', 'Steady progress throughout the period', 'score', jsonb_build_object('balanced', 1))
        )
      )
    ),
    'scoring', jsonb_build_object(
      'categories', jsonb_build_array('introvert', 'extrovert', 'ambivert', 'thinking', 'feeling', 'judging', 'perceiving', 'sensing', 'intuitive', 'balanced', 'adaptive'),
      'interpretation', jsonb_build_object(
        'introvert', 'You recharge through solitude and deep reflection',
        'extrovert', 'You gain energy from social interaction and external stimulation',
        'ambivert', 'You balance both introverted and extroverted tendencies',
        'thinking', 'You prioritize logic and objective analysis in decisions',
        'feeling', 'You prioritize personal values and emotional considerations',
        'judging', 'You prefer structure, planning, and organization',
        'perceiving', 'You prefer flexibility, spontaneity, and adaptability',
        'sensing', 'You focus on concrete details and present reality',
        'intuitive', 'You focus on patterns, possibilities, and future potential',
        'balanced', 'You integrate multiple perspectives effectively',
        'adaptive', 'You adjust your approach based on situational needs'
      )
    )
  )
);

-- Assessment 2: Emotional Intelligence Check (12 questions)
INSERT INTO assessments (
  title, 
  description, 
  category, 
  duration_minutes, 
  is_visitor_accessible, 
  requires_auth,
  questions
) VALUES (
  'Emotional Intelligence Check',
  'Evaluate your emotional awareness, empathy, and regulation skills. Understanding your emotional intelligence helps you navigate relationships and personal growth more effectively.',
  'emotional',
  12,
  true,
  false,
  jsonb_build_object(
    'questions', jsonb_build_array(
      jsonb_build_object(
        'id', 'eq1',
        'text', 'When someone close to you is upset, I:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Rarely notice', 'maxLabel', 'Immediately sense and respond'),
        'score_key', 'empathy'
      ),
      jsonb_build_object(
        'id', 'eq2',
        'text', 'I can easily identify and name my own emotions:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Rarely', 'maxLabel', 'Always'),
        'score_key', 'self_awareness'
      ),
      jsonb_build_object(
        'id', 'eq3',
        'text', 'When I''m angry or frustrated, I:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'react', 'label', 'React immediately without thinking', 'score', jsonb_build_object('regulation', 1)),
          jsonb_build_object('value', 'pause', 'label', 'Pause and choose my response', 'score', jsonb_build_object('regulation', 5)),
          jsonb_build_object('value', 'suppress', 'label', 'Suppress my feelings completely', 'score', jsonb_build_object('regulation', 2))
        )
      ),
      jsonb_build_object(
        'id', 'eq4',
        'text', 'I understand how my emotions affect my behavior:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Not at all', 'maxLabel', 'Very well'),
        'score_key', 'self_awareness'
      ),
      jsonb_build_object(
        'id', 'eq5',
        'text', 'I can sense tension or discomfort in a room:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Rarely', 'maxLabel', 'Almost always'),
        'score_key', 'social_awareness'
      ),
      jsonb_build_object(
        'id', 'eq6',
        'text', 'When facing setbacks, I:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'overwhelmed', 'label', 'Feel overwhelmed and stuck', 'score', jsonb_build_object('regulation', 1)),
          jsonb_build_object('value', 'adapt', 'label', 'Adapt and find new approaches', 'score', jsonb_build_object('regulation', 5)),
          jsonb_build_object('value', 'avoid', 'label', 'Avoid thinking about it', 'score', jsonb_build_object('regulation', 2))
        )
      ),
      jsonb_build_object(
        'id', 'eq7',
        'text', 'I can accurately read others'' emotional states:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Rarely', 'maxLabel', 'Very accurately'),
        'score_key', 'empathy'
      ),
      jsonb_build_object(
        'id', 'eq8',
        'text', 'I''m aware of my emotional triggers:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Not aware', 'maxLabel', 'Very aware'),
        'score_key', 'self_awareness'
      ),
      jsonb_build_object(
        'id', 'eq9',
        'text', 'In conflicts, I:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'defensive', 'label', 'Become defensive and reactive', 'score', jsonb_build_object('relationship', 1)),
          jsonb_build_object('value', 'listen', 'label', 'Listen and try to understand all perspectives', 'score', jsonb_build_object('relationship', 5)),
          jsonb_build_object('value', 'withdraw', 'label', 'Withdraw to avoid confrontation', 'score', jsonb_build_object('relationship', 2))
        )
      ),
      jsonb_build_object(
        'id', 'eq10',
        'text', 'I can calm myself down when stressed:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Very difficult', 'maxLabel', 'Very easily'),
        'score_key', 'regulation'
      ),
      jsonb_build_object(
        'id', 'eq11',
        'text', 'I consider how my actions affect others:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Rarely', 'maxLabel', 'Always'),
        'score_key', 'social_awareness'
      ),
      jsonb_build_object(
        'id', 'eq12',
        'text', 'I can motivate myself even when I don''t feel like it:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Rarely', 'maxLabel', 'Consistently'),
        'score_key', 'self_motivation'
      )
    ),
    'scoring', jsonb_build_object(
      'categories', jsonb_build_array('self_awareness', 'empathy', 'regulation', 'social_awareness', 'relationship', 'self_motivation'),
      'max_score', jsonb_build_object(
        'self_awareness', 15,
        'empathy', 10,
        'regulation', 15,
        'social_awareness', 10,
        'relationship', 5,
        'self_motivation', 5
      ),
      'interpretation', jsonb_build_object(
        'self_awareness', 'Your ability to recognize and understand your own emotions',
        'empathy', 'Your capacity to understand and share others'' feelings',
        'regulation', 'Your skill in managing and responding to emotions effectively',
        'social_awareness', 'Your ability to read social situations and group dynamics',
        'relationship', 'Your effectiveness in navigating interpersonal conflicts',
        'self_motivation', 'Your ability to stay driven and focused on goals'
      )
    )
  )
);

-- Assessment 3: Life Balance Snapshot (10 questions)
INSERT INTO assessments (
  title, 
  description, 
  category, 
  duration_minutes, 
  is_visitor_accessible, 
  requires_auth,
  questions
) VALUES (
  'Life Balance Snapshot',
  'Get a quick overview of how balanced your life feels across key areas: work, relationships, health, and personal growth. Identify areas that need more attention.',
  'wellness',
  10,
  true,
  false,
  jsonb_build_object(
    'questions', jsonb_build_array(
      jsonb_build_object(
        'id', 'lb1',
        'text', 'Rate your satisfaction with your career and work life:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 10, 'minLabel', 'Very dissatisfied', 'maxLabel', 'Very satisfied'),
        'score_key', 'career'
      ),
      jsonb_build_object(
        'id', 'lb2',
        'text', 'Rate the quality of your close relationships:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 10, 'minLabel', 'Poor', 'maxLabel', 'Excellent'),
        'score_key', 'relationships'
      ),
      jsonb_build_object(
        'id', 'lb3',
        'text', 'Rate your physical health and fitness:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 10, 'minLabel', 'Poor', 'maxLabel', 'Excellent'),
        'score_key', 'health'
      ),
      jsonb_build_object(
        'id', 'lb4',
        'text', 'Rate your mental and emotional wellbeing:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 10, 'minLabel', 'Poor', 'maxLabel', 'Excellent'),
        'score_key', 'mental_health'
      ),
      jsonb_build_object(
        'id', 'lb5',
        'text', 'Rate your financial security and stability:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 10, 'minLabel', 'Very insecure', 'maxLabel', 'Very secure'),
        'score_key', 'finance'
      ),
      jsonb_build_object(
        'id', 'lb6',
        'text', 'Rate your personal growth and learning:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 10, 'minLabel', 'Stagnant', 'maxLabel', 'Thriving'),
        'score_key', 'growth'
      ),
      jsonb_build_object(
        'id', 'lb7',
        'text', 'Rate your fun, recreation, and leisure time:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 10, 'minLabel', 'Nonexistent', 'maxLabel', 'Abundant'),
        'score_key', 'recreation'
      ),
      jsonb_build_object(
        'id', 'lb8',
        'text', 'Rate your living environment and space:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 10, 'minLabel', 'Unsatisfactory', 'maxLabel', 'Ideal'),
        'score_key', 'environment'
      ),
      jsonb_build_object(
        'id', 'lb9',
        'text', 'Rate your sense of life purpose and meaning:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 10, 'minLabel', 'Lost', 'maxLabel', 'Clear and strong'),
        'score_key', 'purpose'
      ),
      jsonb_build_object(
        'id', 'lb10',
        'text', 'Rate your overall life balance:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 10, 'minLabel', 'Completely unbalanced', 'maxLabel', 'Perfectly balanced'),
        'score_key', 'overall'
      )
    ),
    'scoring', jsonb_build_object(
      'categories', jsonb_build_array('career', 'relationships', 'health', 'mental_health', 'finance', 'growth', 'recreation', 'environment', 'purpose', 'overall'),
      'max_score', 10,
      'interpretation', jsonb_build_object(
        'career', 'Your satisfaction with work and professional life',
        'relationships', 'The quality and depth of your personal connections',
        'health', 'Your physical fitness and body wellbeing',
        'mental_health', 'Your emotional and psychological state',
        'finance', 'Your financial stability and security',
        'growth', 'Your continuous learning and personal development',
        'recreation', 'Your fun, play, and leisure activities',
        'environment', 'Your living space and physical surroundings',
        'purpose', 'Your sense of meaning and direction in life',
        'overall', 'Your holistic life balance perception'
      )
    )
  )
);

-- Assessment 4: Relationship Style (15 questions)
INSERT INTO assessments (
  title, 
  description, 
  category, 
  duration_minutes, 
  is_visitor_accessible, 
  requires_auth,
  questions
) VALUES (
  'Relationship Style',
  'Understand your attachment style, communication patterns, and boundary-setting in relationships. Gain insights into how you connect with others and navigate intimacy.',
  'relationships',
  15,
  true,
  false,
  jsonb_build_object(
    'questions', jsonb_build_array(
      jsonb_build_object(
        'id', 'rs1',
        'text', 'In romantic relationships, I:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'anxious', 'label', 'Often worry about being abandoned or unloved', 'score', jsonb_build_object('anxious', 3)),
          jsonb_build_object('value', 'secure', 'label', 'Feel comfortable with intimacy and independence', 'score', jsonb_build_object('secure', 3)),
          jsonb_build_object('value', 'avoidant', 'label', 'Prefer maintaining distance and independence', 'score', jsonb_build_object('avoidant', 3))
        )
      ),
      jsonb_build_object(
        'id', 'rs2',
        'text', 'When conflicts arise, I typically:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'pursue', 'label', 'Pursue the issue until it''s resolved', 'score', jsonb_build_object('communication', 2, 'anxious', 1)),
          jsonb_build_object('value', 'discuss', 'label', 'Calmly discuss and find compromise', 'score', jsonb_build_object('communication', 3, 'secure', 2)),
          jsonb_build_object('value', 'withdraw', 'label', 'Withdraw and need space first', 'score', jsonb_build_object('avoidant', 2))
        )
      ),
      jsonb_build_object(
        'id', 'rs3',
        'text', 'I set and maintain boundaries:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Very poorly', 'maxLabel', 'Very effectively'),
        'score_key', 'boundaries'
      ),
      jsonb_build_object(
        'id', 'rs4',
        'text', 'When my partner needs space, I:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'anxious_response', 'label', 'Feel anxious and seek reassurance', 'score', jsonb_build_object('anxious', 2)),
          jsonb_build_object('value', 'respect', 'label', 'Respect their need while staying connected', 'score', jsonb_build_object('secure', 3)),
          jsonb_build_object('value', 'relieved', 'label', 'Feel relieved and use the time for myself', 'score', jsonb_build_object('avoidant', 2))
        )
      ),
      jsonb_build_object(
        'id', 'rs5',
        'text', 'I express my needs and feelings in relationships:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Very rarely', 'maxLabel', 'Very openly'),
        'score_key', 'communication'
      ),
      jsonb_build_object(
        'id', 'rs6',
        'text', 'Emotional intimacy feels:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'overwhelming', 'label', 'Overwhelming and I need to pull back', 'score', jsonb_build_object('avoidant', 3)),
          jsonb_build_object('value', 'comfortable', 'label', 'Comfortable and natural', 'score', jsonb_build_object('secure', 3)),
          jsonb_build_object('value', 'craved', 'label', 'Something I constantly crave more of', 'score', jsonb_build_object('anxious', 3))
        )
      ),
      jsonb_build_object(
        'id', 'rs7',
        'text', 'I handle my partner''s emotions:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'uncomfortable', 'label', 'Feel uncomfortable and want to fix or avoid', 'score', jsonb_build_object('avoidant', 2)),
          jsonb_build_object('value', 'supportive', 'label', 'Offer support while maintaining my own stability', 'score', jsonb_build_object('secure', 3)),
          jsonb_build_object('value', 'absorbed', 'label', 'Get deeply absorbed in their emotional state', 'score', jsonb_build_object('anxious', 2))
        )
      ),
      jsonb_build_object(
        'id', 'rs8',
        'text', 'My communication style in relationships is:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Passive or aggressive', 'maxLabel', 'Assertive and clear'),
        'score_key', 'communication'
      ),
      jsonb_build_object(
        'id', 'rs9',
        'text', 'When feeling vulnerable, I:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'share', 'label', 'Share openly with my partner', 'score', jsonb_build_object('secure', 3)),
          jsonb_build_object('value', 'hide', 'label', 'Hide or minimize my feelings', 'score', jsonb_build_object('avoidant', 3)),
          jsonb_build_object('value', 'seek', 'label', 'Seek constant reassurance', 'score', jsonb_build_object('anxious', 3))
        )
      ),
      jsonb_build_object(
        'id', 'rs10',
        'text', 'I respect others'' boundaries:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Rarely', 'maxLabel', 'Always'),
        'score_key', 'boundaries'
      ),
      jsonb_build_object(
        'id', 'rs11',
        'text', 'In relationships, my independence is:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'paramount', 'label', 'Paramount - I guard it carefully', 'score', jsonb_build_object('avoidant', 2)),
          jsonb_build_object('value', 'balanced', 'label', 'Balanced with togetherness', 'score', jsonb_build_object('secure', 3)),
          jsonb_build_object('value', 'secondary', 'label', 'Secondary to being close', 'score', jsonb_build_object('anxious', 2))
        )
      ),
      jsonb_build_object(
        'id', 'rs12',
        'text', 'I listen actively when my partner speaks:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Rarely', 'maxLabel', 'Always'),
        'score_key', 'communication'
      ),
      jsonb_build_object(
        'id', 'rs13',
        'text', 'My typical response to criticism from a partner:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'defensive', 'label', 'Become defensive or shut down', 'score', jsonb_build_object('avoidant', 2)),
          jsonb_build_object('value', 'receptive', 'label', 'Listen and consider it thoughtfully', 'score', jsonb_build_object('secure', 3)),
          jsonb_build_object('value', 'devastated', 'label', 'Feel devastated and seek reassurance', 'score', jsonb_build_object('anxious', 2))
        )
      ),
      jsonb_build_object(
        'id', 'rs14',
        'text', 'I trust my partner:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'With difficulty', 'maxLabel', 'Easily and naturally'),
        'score_key', 'trust'
      ),
      jsonb_build_object(
        'id', 'rs15',
        'text', 'My ideal relationship dynamic is:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'independent', 'label', 'Two independent people who respect space', 'score', jsonb_build_object('avoidant', 2)),
          jsonb_build_object('value', 'interdependent', 'label', 'Interdependent with healthy balance', 'score', jsonb_build_object('secure', 3)),
          jsonb_build_object('value', 'merged', 'label', 'Very close and deeply interconnected', 'score', jsonb_build_object('anxious', 2))
        )
      )
    ),
    'scoring', jsonb_build_object(
      'categories', jsonb_build_array('secure', 'anxious', 'avoidant', 'communication', 'boundaries', 'trust'),
      'interpretation', jsonb_build_object(
        'secure', 'Comfortable with intimacy and independence, healthy relationship patterns',
        'anxious', 'Tendency to seek reassurance and worry about abandonment',
        'avoidant', 'Preference for independence and discomfort with deep intimacy',
        'communication', 'Your ability to express needs and listen effectively',
        'boundaries', 'Your skill in setting and respecting personal limits',
        'trust', 'Your capacity to trust and be trusted in relationships'
      )
    )
  )
);

-- Assessment 5: Career Alignment (12 questions)
INSERT INTO assessments (
  title, 
  description, 
  category, 
  duration_minutes, 
  is_visitor_accessible, 
  requires_auth,
  questions
) VALUES (
  'Career Alignment',
  'Discover how well your current career aligns with your values, skills, and aspirations. Identify areas for growth and potential changes to increase fulfillment.',
  'career',
  12,
  true,
  false,
  jsonb_build_object(
    'questions', jsonb_build_array(
      jsonb_build_object(
        'id', 'ca1',
        'text', 'My work aligns with my core values:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Not at all', 'maxLabel', 'Completely'),
        'score_key', 'values'
      ),
      jsonb_build_object(
        'id', 'ca2',
        'text', 'I use my natural strengths and talents at work:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Rarely', 'maxLabel', 'Daily'),
        'score_key', 'skills'
      ),
      jsonb_build_object(
        'id', 'ca3',
        'text', 'I feel motivated and energized by my work:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Never', 'maxLabel', 'Always'),
        'score_key', 'satisfaction'
      ),
      jsonb_build_object(
        'id', 'ca4',
        'text', 'My career offers opportunities for growth:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'None', 'maxLabel', 'Abundant'),
        'score_key', 'growth'
      ),
      jsonb_build_object(
        'id', 'ca5',
        'text', 'I find meaning and purpose in my work:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'No meaning', 'maxLabel', 'Deep purpose'),
        'score_key', 'purpose'
      ),
      jsonb_build_object(
        'id', 'ca6',
        'text', 'My work-life balance is:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Terrible', 'maxLabel', 'Excellent'),
        'score_key', 'balance'
      ),
      jsonb_build_object(
        'id', 'ca7',
        'text', 'I feel appreciated and recognized at work:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Never', 'maxLabel', 'Consistently'),
        'score_key', 'satisfaction'
      ),
      jsonb_build_object(
        'id', 'ca8',
        'text', 'My compensation reflects my contribution:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Not at all', 'maxLabel', 'Completely'),
        'score_key', 'compensation'
      ),
      jsonb_build_object(
        'id', 'ca9',
        'text', 'I have autonomy in how I do my work:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'None', 'maxLabel', 'Complete'),
        'score_key', 'autonomy'
      ),
      jsonb_build_object(
        'id', 'ca10',
        'text', 'My work environment is:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 10, 'minLabel', 'Toxic', 'maxLabel', 'Thriving'),
        'score_key', 'environment'
      ),
      jsonb_build_object(
        'id', 'ca11',
        'text', 'I see myself in this career 5 years from now:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Definitely not', 'maxLabel', 'Absolutely'),
        'score_key', 'future'
      ),
      jsonb_build_object(
        'id', 'ca12',
        'text', 'Overall, I would rate my career satisfaction as:',
        'type', 'scale',
        'scale', jsonb_build_object('min', 1, 'max', 5, 'minLabel', 'Very dissatisfied', 'maxLabel', 'Very satisfied'),
        'score_key', 'overall'
      )
    ),
    'scoring', jsonb_build_object(
      'categories', jsonb_build_array('values', 'skills', 'satisfaction', 'growth', 'purpose', 'balance', 'compensation', 'autonomy', 'environment', 'future', 'overall'),
      'max_score', 5,
      'interpretation', jsonb_build_object(
        'values', 'Alignment between your work and core values',
        'skills', 'Utilization of your natural talents and abilities',
        'satisfaction', 'Overall fulfillment and motivation from work',
        'growth', 'Opportunities for learning and advancement',
        'purpose', 'Sense of meaning and contribution through work',
        'balance', 'Integration of work with personal life',
        'compensation', 'Fair recognition for your contributions',
        'autonomy', 'Freedom in how you approach your work',
        'environment', 'Quality of workplace culture and relationships',
        'future', 'Long-term career vision and commitment',
        'overall', 'General career satisfaction level'
      )
    )
  )
);

-- Assessment 6: Astrological Personality Match (10 questions)
INSERT INTO assessments (
  title, 
  description, 
  category, 
  duration_minutes, 
  is_visitor_accessible, 
  requires_auth,
  questions
) VALUES (
  'Astrological Personality Match',
  'Explore personality traits through the lens of astrological elements and characteristics. Discover which elemental energies resonate most with your nature.',
  'spiritual',
  10,
  true,
  false,
  jsonb_build_object(
    'questions', jsonb_build_array(
      jsonb_build_object(
        'id', 'ap1',
        'text', 'I feel most alive when:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'creating', 'label', 'Creating, initiating, and taking action', 'score', jsonb_build_object('fire', 3)),
          jsonb_build_object('value', 'building', 'label', 'Building, stabilizing, and being practical', 'score', jsonb_build_object('earth', 3)),
          jsonb_build_object('value', 'connecting', 'label', 'Connecting, communicating, and learning', 'score', jsonb_build_object('air', 3)),
          jsonb_build_object('value', 'feeling', 'label', 'Feeling, nurturing, and being intuitive', 'score', jsonb_build_object('water', 3))
        )
      ),
      jsonb_build_object(
        'id', 'ap2',
        'text', 'My approach to life is primarily:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'passionate', 'label', 'Passionate, bold, and spontaneous', 'score', jsonb_build_object('fire', 2)),
          jsonb_build_object('value', 'methodical', 'label', 'Methodical, reliable, and grounded', 'score', jsonb_build_object('earth', 2)),
          jsonb_build_object('value', 'intellectual', 'label', 'Intellectual, social, and curious', 'score', jsonb_build_object('air', 2)),
          jsonb_build_object('value', 'emotional', 'label', 'Emotional, empathetic, and flowing', 'score', jsonb_build_object('water', 2))
        )
      ),
      jsonb_build_object(
        'id', 'ap3',
        'text', 'When facing challenges, I tend to:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'charge', 'label', 'Charge ahead with confidence', 'score', jsonb_build_object('fire', 2)),
          jsonb_build_object('value', 'plan', 'label', 'Plan carefully and work step by step', 'score', jsonb_build_object('earth', 2)),
          jsonb_build_object('value', 'analyze', 'label', 'Analyze from multiple perspectives', 'score', jsonb_build_object('air', 2)),
          jsonb_build_object('value', 'intuit', 'label', 'Trust my intuition and feelings', 'score', jsonb_build_object('water', 2))
        )
      ),
      jsonb_build_object(
        'id', 'ap4',
        'text', 'In relationships, I value:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'excitement', 'label', 'Excitement, passion, and adventure', 'score', jsonb_build_object('fire', 2)),
          jsonb_build_object('value', 'stability', 'label', 'Stability, loyalty, and commitment', 'score', jsonb_build_object('earth', 2)),
          jsonb_build_object('value', 'mental', 'label', 'Mental connection and communication', 'score', jsonb_build_object('air', 2)),
          jsonb_build_object('value', 'emotional_depth', 'label', 'Emotional depth and intimacy', 'score', jsonb_build_object('water', 2))
        )
      ),
      jsonb_build_object(
        'id', 'ap5',
        'text', 'My energy level is typically:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'high', 'label', 'High and radiating outward', 'score', jsonb_build_object('fire', 2)),
          jsonb_build_object('value', 'steady', 'label', 'Steady and enduring', 'score', jsonb_build_object('earth', 2)),
          jsonb_build_object('value', 'variable', 'label', 'Variable and mentally driven', 'score', jsonb_build_object('air', 2)),
          jsonb_build_object('value', 'ebbing', 'label', 'Ebbing and flowing like tides', 'score', jsonb_build_object('water', 2))
        )
      ),
      jsonb_build_object(
        'id', 'ap6',
        'text', 'I make decisions based on:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'instinct', 'label', 'Instinct and what feels right now', 'score', jsonb_build_object('fire', 2)),
          jsonb_build_object('value', 'practical', 'label', 'Practical considerations and facts', 'score', jsonb_build_object('earth', 2)),
          jsonb_build_object('value', 'logic', 'label', 'Logic and rational analysis', 'score', jsonb_build_object('air', 2)),
          jsonb_build_object('value', 'feelings', 'label', 'Feelings and intuitive knowing', 'score', jsonb_build_object('water', 2))
        )
      ),
      jsonb_build_object(
        'id', 'ap7',
        'text', 'My ideal environment is:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'dynamic', 'label', 'Dynamic, active, and stimulating', 'score', jsonb_build_object('fire', 2)),
          jsonb_build_object('value', 'secure', 'label', 'Secure, comfortable, and organized', 'score', jsonb_build_object('earth', 2)),
          jsonb_build_object('value', 'open', 'label', 'Open, social, and intellectually rich', 'score', jsonb_build_object('air', 2)),
          jsonb_build_object('value', 'calm', 'label', 'Calm, private, and emotionally safe', 'score', jsonb_build_object('water', 2))
        )
      ),
      jsonb_build_object(
        'id', 'ap8',
        'text', 'My communication style is:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'direct', 'label', 'Direct, enthusiastic, and expressive', 'score', jsonb_build_object('fire', 2)),
          jsonb_build_object('value', 'concrete', 'label', 'Concrete, clear, and to the point', 'score', jsonb_build_object('earth', 2)),
          jsonb_build_object('value', 'articulate', 'label', 'Articulate, witty, and idea-focused', 'score', jsonb_build_object('air', 2)),
          jsonb_build_object('value', 'subtle', 'label', 'Subtle, nuanced, and emotionally aware', 'score', jsonb_build_object('water', 2))
        )
      ),
      jsonb_build_object(
        'id', 'ap9',
        'text', 'I handle stress by:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'action', 'label', 'Taking action and burning off energy', 'score', jsonb_build_object('fire', 2)),
          jsonb_build_object('value', 'routine', 'label', 'Maintaining routine and seeking comfort', 'score', jsonb_build_object('earth', 2)),
          jsonb_build_object('value', 'detach', 'label', 'Detaching and analyzing objectively', 'score', jsonb_build_object('air', 2)),
          jsonb_build_object('value', 'retreat', 'label', 'Retreating and processing emotions', 'score', jsonb_build_object('water', 2))
        )
      ),
      jsonb_build_object(
        'id', 'ap10',
        'text', 'My natural temperament is:',
        'type', 'single_choice',
        'options', jsonb_build_array(
          jsonb_build_object('value', 'fiery', 'label', 'Warm, enthusiastic, and quick', 'score', jsonb_build_object('fire', 3)),
          jsonb_build_object('value', 'earthy', 'label', 'Cool, patient, and deliberate', 'score', jsonb_build_object('earth', 3)),
          jsonb_build_object('value', 'airy', 'label', 'Light, adaptable, and cerebral', 'score', jsonb_build_object('air', 3)),
          jsonb_build_object('value', 'watery', 'label', 'Deep, sensitive, and reflective', 'score', jsonb_build_object('water', 3))
        )
      )
    ),
    'scoring', jsonb_build_object(
      'categories', jsonb_build_array('fire', 'earth', 'air', 'water'),
      'interpretation', jsonb_build_object(
        'fire', 'Fire element - Passionate, creative, spontaneous, and action-oriented. Signs: Aries, Leo, Sagittarius',
        'earth', 'Earth element - Practical, grounded, stable, and sensual. Signs: Taurus, Virgo, Capricorn',
        'air', 'Air element - Intellectual, social, communicative, and objective. Signs: Gemini, Libra, Aquarius',
        'water', 'Water element - Emotional, intuitive, empathetic, and flowing. Signs: Cancer, Scorpio, Pisces'
      )
    )
  )
);

-- 4. Update existing assessments to mark them as requiring auth (premium)
-- =====================================================
UPDATE assessments 
SET 
  is_visitor_accessible = false,
  requires_auth = true
WHERE is_visitor_accessible IS NULL 
   OR requires_auth IS NULL;

-- 5. Verify and display summary
-- =====================================================
DO $$
DECLARE
  visitor_count INTEGER;
  premium_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO visitor_count FROM assessments WHERE is_visitor_accessible = true;
  SELECT COUNT(*) INTO premium_count FROM assessments WHERE is_visitor_accessible = false;
  
  RAISE NOTICE 'Migration 12 completed successfully:';
  RAISE NOTICE '  - Visitor-accessible assessments: %', visitor_count;
  RAISE NOTICE '  - Premium assessments: %', premium_count;
  RAISE NOTICE '  - RLS policies updated for public access';
END $$;