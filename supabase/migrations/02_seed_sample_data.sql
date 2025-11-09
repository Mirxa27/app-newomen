/*
# Seed Data for Newomen Platform

This migration adds initial sample data to the platform:

1. **Assessments** (5 free + 15 premium = 20 total)
   - Personality assessments
   - Relationship assessments
   - Career assessments
   - Wellness assessments
   - Astrology assessments

2. **Wellness Resources** (15 resources)
   - Meditation guides
   - Breathwork exercises
   - Affirmations
   - Therapy content
   - Music for wellness

Note: This is sample data for demonstration purposes.
Users can take assessments and explore wellness resources immediately.
*/

-- Insert Free Assessments (5)
INSERT INTO assessments (title, description, category, is_free, questions, is_active) VALUES
(
  'Core Personality Discovery',
  'Discover your fundamental personality traits and how they shape your interactions with the world.',
  'personality',
  true,
  '[]'::jsonb,
  true
),
(
  'Relationship Patterns Assessment',
  'Understand your attachment style and relationship patterns to build healthier connections.',
  'relationships',
  true,
  '[]'::jsonb,
  true
),
(
  'Career Alignment Check',
  'Evaluate if your current career path aligns with your values and aspirations.',
  'career',
  true,
  '[]'::jsonb,
  true
),
(
  'Wellness Balance Snapshot',
  'Quick assessment of your current wellness state across mind, body, and spirit.',
  'wellness',
  true,
  '[]'::jsonb,
  true
),
(
  'Cosmic Connection Quiz',
  'Explore your relationship with astrology and universal energies.',
  'astrology',
  true,
  '[]'::jsonb,
  true
);

-- Insert Premium Assessments (15)
INSERT INTO assessments (title, description, category, is_free, questions, is_active) VALUES
(
  'Deep Personality Analysis',
  'Comprehensive personality assessment with detailed insights into your cognitive patterns, emotional responses, and behavioral tendencies.',
  'personality',
  false,
  '[]'::jsonb,
  true
),
(
  'Shadow Work Explorer',
  'Dive deep into your shadow self to uncover hidden patterns and unconscious behaviors.',
  'personality',
  false,
  '[]'::jsonb,
  true
),
(
  'Love Language & Attachment Style',
  'Discover how you give and receive love, and understand your attachment patterns in relationships.',
  'relationships',
  false,
  '[]'::jsonb,
  true
),
(
  'Relationship Compatibility Matrix',
  'Analyze compatibility factors across emotional, intellectual, physical, and spiritual dimensions.',
  'relationships',
  false,
  '[]'::jsonb,
  true
),
(
  'Career Purpose Finder',
  'Identify your unique career purpose and the path that aligns with your soul mission.',
  'career',
  false,
  '[]'::jsonb,
  true
),
(
  'Professional Strengths Profile',
  'Comprehensive analysis of your professional strengths, work style, and leadership potential.',
  'career',
  false,
  '[]'::jsonb,
  true
),
(
  'Holistic Wellness Assessment',
  'Complete evaluation of your physical, mental, emotional, and spiritual wellness.',
  'wellness',
  false,
  '[]'::jsonb,
  true
),
(
  'Stress & Burnout Analysis',
  'Identify stress triggers, burnout risk factors, and personalized recovery strategies.',
  'wellness',
  false,
  '[]'::jsonb,
  true
),
(
  'Birth Chart Personality Insights',
  'Detailed personality analysis based on your astrological birth chart placements.',
  'astrology',
  false,
  '[]'::jsonb,
  true
),
(
  'Lunar Cycle Alignment',
  'Understand how lunar phases affect your energy, emotions, and manifestation power.',
  'astrology',
  false,
  '[]'::jsonb,
  true
),
(
  'Elemental Balance Assessment',
  'Discover your elemental composition (Fire, Earth, Air, Water) and how to achieve balance.',
  'astrology',
  false,
  '[]'::jsonb,
  true
),
(
  'Inner Child Healing Journey',
  'Explore childhood patterns and wounds that shape your adult relationships and behaviors.',
  'personality',
  false,
  '[]'::jsonb,
  true
),
(
  'Communication Style Analysis',
  'Understand your unique communication patterns and how to improve connection with others.',
  'relationships',
  false,
  '[]'::jsonb,
  true
),
(
  'Work-Life Integration Blueprint',
  'Create a personalized plan for integrating work and personal life in harmony.',
  'career',
  false,
  '[]'::jsonb,
  true
),
(
  'Emotional Intelligence Assessment',
  'Measure and develop your emotional intelligence across self-awareness, empathy, and regulation.',
  'wellness',
  false,
  '[]'::jsonb,
  true
),
(
  'Cosmic Timing & Manifestation',
  'Learn to work with astrological timing for manifestation and major life decisions.',
  'astrology',
  false,
  '[]'::jsonb,
  true
);

-- Insert Wellness Resources (15)
INSERT INTO wellness_resources (title, description, category, resource_type, resource_url, duration_minutes, is_active) VALUES
(
  'Morning Mindfulness Meditation',
  'Start your day with clarity and intention through this guided 10-minute meditation practice.',
  'meditation',
  'youtube',
  'https://www.youtube.com/watch?v=inpok4MKVLM',
  10,
  true
),
(
  'Deep Sleep Meditation',
  'Drift into peaceful sleep with this calming guided meditation designed to quiet the mind.',
  'meditation',
  'youtube',
  'https://www.youtube.com/watch?v=aEqlQvczMJQ',
  30,
  true
),
(
  'Box Breathing for Stress Relief',
  'Learn the powerful box breathing technique used by Navy SEALs to manage stress and anxiety.',
  'breathwork',
  'youtube',
  'https://www.youtube.com/watch?v=tEmt1Znux58',
  5,
  true
),
(
  'Wim Hof Breathing Method',
  'Experience the transformative Wim Hof breathing technique for energy and mental clarity.',
  'breathwork',
  'youtube',
  'https://www.youtube.com/watch?v=tybOi4hjZFQ',
  11,
  true
),
(
  'Morning Affirmations for Confidence',
  'Powerful affirmations to boost self-confidence and start your day with positive energy.',
  'affirmation',
  'youtube',
  'https://www.youtube.com/watch?v=KxwB4s9dUWQ',
  10,
  true
),
(
  'Self-Love Affirmations',
  'Cultivate deep self-love and acceptance with these healing affirmations.',
  'affirmation',
  'youtube',
  'https://www.youtube.com/watch?v=7pF7kzHs7Hs',
  15,
  true
),
(
  'Healing Trauma Through Somatic Therapy',
  'Understanding how somatic therapy helps release trauma stored in the body.',
  'therapy',
  'youtube',
  'https://www.youtube.com/watch?v=FeUioDuJjFI',
  20,
  true
),
(
  'Shadow Work: Integrating Your Dark Side',
  'Learn how to embrace and integrate your shadow self for wholeness and healing.',
  'therapy',
  'youtube',
  'https://www.youtube.com/watch?v=L5JKP1T3gmU',
  25,
  true
),
(
  '528Hz Healing Frequency Music',
  'DNA repair and transformation through the miracle tone of 528Hz.',
  'music',
  'youtube',
  'https://www.youtube.com/watch?v=9E0b2gp3d9k',
  60,
  true
),
(
  'Chakra Balancing Music',
  'Align and balance all seven chakras with this healing frequency music.',
  'music',
  'youtube',
  'https://www.youtube.com/watch?v=ARoih8HTPGk',
  45,
  true
),
(
  'Yoga Nidra for Deep Relaxation',
  'Experience profound relaxation and healing through this guided Yoga Nidra practice.',
  'meditation',
  'youtube',
  'https://www.youtube.com/watch?v=M0u9GST_j3s',
  30,
  true
),
(
  'Breathwork for Emotional Release',
  'Release stuck emotions and trauma through conscious connected breathwork.',
  'breathwork',
  'youtube',
  'https://www.youtube.com/watch?v=4Lb5L-VEm34',
  20,
  true
),
(
  'Abundance Affirmations',
  'Attract prosperity and abundance into your life with these powerful affirmations.',
  'affirmation',
  'youtube',
  'https://www.youtube.com/watch?v=Yz_l0nSp5Mg',
  20,
  true
),
(
  'Inner Child Healing Meditation',
  'Connect with and heal your inner child through this gentle guided meditation.',
  'therapy',
  'youtube',
  'https://www.youtube.com/watch?v=bJY8dMQXLOE',
  25,
  true
),
(
  'Binaural Beats for Focus',
  'Enhance concentration and mental clarity with alpha wave binaural beats.',
  'music',
  'youtube',
  'https://www.youtube.com/watch?v=WPni755-Krg',
  60,
  true
);
