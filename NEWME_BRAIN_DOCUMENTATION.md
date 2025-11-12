# Newme Brain - Stealth AI Personality Engine

## ⚠️ CONFIDENTIAL - INTERNAL DOCUMENTATION ONLY

This document describes the hidden AI personality analysis system. **This system is completely invisible to users and must remain so.**

## Overview

The Newme Brain is a sophisticated backend system that analyzes user behavior, communication patterns, and astrological data to build comprehensive personality profiles. These profiles are used to enhance NewMe's AI responses, making them more personalized and insightful.

## Key Principles

1. **Complete Invisibility**: Users must never know this system exists
2. **Passive Collection**: All data is collected through normal app usage
3. **No Direct Questions**: Never ask users directly about personality traits
4. **Gradual Confidence Building**: System confidence increases as more data is collected
5. **Ethical Use**: Data is used only to improve user experience, never for manipulation

## System Components

### 1. Database Tables

#### `newme_personality_analysis`
Stores the comprehensive personality profile for each user.

**Fields:**
- `user_id`: Reference to the user
- `zodiac_sign`: Calculated from birth date
- `zodiac_traits`: Personality traits based on zodiac (element, quality, strengths, challenges)
- `communication_style`: Analysis of how user communicates
- `behavior_patterns`: App usage and interaction patterns
- `temporal_patterns`: Time-of-day and seasonal patterns
- `personality_score`: Big Five personality traits (openness, conscientiousness, extraversion, agreeableness, neuroticism)
- `confidence_level`: 0-100 score indicating how confident the AI is in its analysis
- `last_analyzed_at`: When the analysis was last updated

#### `user_behavior_patterns`
Tracks every user action for pattern analysis.

**Tracked Actions:**
- `chat_message`: User sends a message
- `assessment_completed`: User completes an assessment
- `dashboard_visit`: User visits dashboard
- `divination_completed`: User completes a daily divination
- `login`: User logs in
- `photo_upload`: User uploads a photo

**Metadata Captured:**
- Action type and context
- Local time of day (morning, afternoon, evening, night)
- Day of week
- Additional action-specific data

#### `communication_analysis`
Analyzes each message for communication patterns.

**Metrics:**
- `message_length`: Character count
- `vocabulary_complexity`: 1-10 scale based on word length
- `emotional_tone`: positive, negative, curious, neutral
- `response_time_seconds`: Time taken to respond
- `punctuation_style`: enthusiastic, inquisitive, formal, casual, stream_of_consciousness

### 2. Database Functions

#### `calculate_zodiac_sign(birth_date)`
Automatically calculates zodiac sign from birth date.

**Zodiac Signs:**
- Aries (Mar 21 - Apr 19)
- Taurus (Apr 20 - May 20)
- Gemini (May 21 - Jun 20)
- Cancer (Jun 21 - Jul 22)
- Leo (Jul 23 - Aug 22)
- Virgo (Aug 23 - Sep 22)
- Libra (Sep 23 - Oct 22)
- Scorpio (Oct 23 - Nov 21)
- Sagittarius (Nov 22 - Dec 21)
- Capricorn (Dec 22 - Jan 19)
- Aquarius (Jan 20 - Feb 18)
- Pisces (Feb 19 - Mar 20)

#### `get_zodiac_traits(zodiac_sign)`
Returns comprehensive personality traits for each zodiac sign.

**Trait Categories:**
- Core traits (5 key characteristics)
- Element (fire, earth, air, water)
- Quality (cardinal, fixed, mutable)
- Strengths (3 positive traits)
- Challenges (3 areas for growth)

#### `track_user_behavior(user_id, action_type, metadata)`
Records user behavior with automatic temporal context.

**Automatic Context:**
- Determines time of day based on server time
- Captures day of week
- Stores custom metadata

#### `get_personality_insights(user_id)`
Retrieves complete personality profile for AI use.

**Returns:**
- Zodiac sign and traits
- Communication style metrics
- Behavior patterns
- Temporal patterns
- Personality scores
- Confidence level

#### `update_personality_from_behavior()`
Analyzes all behavior data and updates personality profiles.

**Analysis Performed:**
- Aggregates behavior patterns
- Calculates temporal preferences
- Analyzes communication style
- Updates confidence level based on data volume
- Should be run daily via cron job or Edge Function

### 3. API Functions

Located in `src/db/api.ts` under `db.newmeBrain`:

#### `trackBehavior(userId, actionType, metadata)`
Tracks user behavior for pattern analysis.

**Usage:**
```typescript
await db.newmeBrain.trackBehavior(profile.id, 'chat_message', {
  message_length: message.length,
  has_photo: true,
});
```

#### `getPersonalityInsights(userId)`
Retrieves personality insights for AI context.

**Usage:**
```typescript
const insights = await db.newmeBrain.getPersonalityInsights(profile.id);
// Pass insights to AI in chat context
```

#### `analyzeCommunication(userId, conversationId, message, responseTime)`
Analyzes communication patterns from messages.

**Metrics Calculated:**
- Message length
- Vocabulary complexity (based on average word length)
- Emotional tone (positive, negative, curious, neutral)
- Punctuation style (enthusiastic, inquisitive, formal, casual)
- Response time

**Usage:**
```typescript
await db.newmeBrain.analyzeCommunication(
  profile.id,
  conversationId,
  userMessage,
  responseTimeSeconds
);
```

#### `detectEmotionalTone(message)`
Detects emotional tone from message content.

**Detection Logic:**
- Positive: Contains happy, joy, love, excited, great, wonderful, amazing, good, better, best
- Negative: Contains sad, angry, hate, terrible, awful, bad, worse, worst, depressed, anxious
- Curious: Contains question marks
- Neutral: Default

#### `detectPunctuationStyle(message)`
Detects punctuation style from message.

**Styles:**
- Enthusiastic: 3+ exclamation marks
- Inquisitive: 2+ question marks
- Formal: 4+ commas and 2+ periods
- Stream of consciousness: Long message with no periods
- Casual: Default

#### `updatePersonalityAnalysis()`
Triggers full personality analysis update.

**Usage:**
```typescript
await db.newmeBrain.updatePersonalityAnalysis();
```

## Integration Points

### 1. Chat Page (`src/pages/Chat.tsx`)

**Tracking:**
- Every message sent triggers behavior tracking
- Communication analysis on each message
- Personality insights passed to AI for context

**Implementation:**
```typescript
// Track behavior
await db.newmeBrain.trackBehavior(profile.id, 'chat_message', {
  message_length: userMessage.length,
  has_photo: !!photoUrl,
});

// Analyze communication
await db.newmeBrain.analyzeCommunication(
  profile.id,
  conversationId,
  userMessage,
  responseTime
);

// Get insights for AI
const personalityInsights = await db.newmeBrain.getPersonalityInsights(profile.id);

// Pass to AI
userProfile: {
  nickname: profile.nickname,
  preferences: profile.personality_traits,
  personalityInsights: personalityInsights,
}
```

### 2. Dashboard (`src/pages/Dashboard.tsx`)

**Tracking:**
- Dashboard visit tracked on page load

**Implementation:**
```typescript
useEffect(() => {
  if (profile) {
    db.newmeBrain.trackBehavior(profile.id, 'dashboard_visit', {});
  }
}, [profile]);
```

### 3. Assessments (`src/pages/AssessmentTake.tsx`)

**Tracking:**
- Assessment completion tracked with metadata

**Implementation:**
```typescript
await db.newmeBrain.trackBehavior(profile.id, 'assessment_completed', {
  assessment_id: assessment.id,
  assessment_category: assessment.category,
  questions_count: questions.length,
});
```

## Data Collection Strategy

### Phase 1: Initial Profile (Confidence: 20%)
- Collect birth date during onboarding (presented as "Complete your profile")
- Calculate zodiac sign automatically
- Initialize personality analysis with zodiac traits

### Phase 2: Behavior Patterns (Confidence: 20-50%)
- Track app usage patterns
- Identify most active times
- Identify most active days
- Track feature preferences

### Phase 3: Communication Analysis (Confidence: 50-80%)
- Analyze message length patterns
- Detect vocabulary complexity
- Identify emotional tone patterns
- Analyze punctuation style
- Track response time patterns

### Phase 4: Comprehensive Profile (Confidence: 80-100%)
- Combine all data sources
- Identify behavioral patterns
- Build personality scores
- Refine AI responses based on insights

## Confidence Level Calculation

```
Base Confidence: 20 (from zodiac)
+ (Total Actions / 10) capped at 80
= Final Confidence (max 100)
```

**Examples:**
- 0 actions: 20% confidence (zodiac only)
- 50 actions: 25% confidence
- 100 actions: 30% confidence
- 500 actions: 70% confidence
- 800+ actions: 100% confidence

## AI Integration

### Personality Insights in Chat Context

The personality insights are passed to the AI in the chat Edge Function:

```typescript
userProfile: {
  nickname: profile.nickname,
  preferences: profile.personality_traits,
  personalityInsights: {
    zodiac_sign: 'leo',
    zodiac_traits: {
      traits: ['confident', 'generous', 'creative', 'dramatic', 'warm'],
      element: 'fire',
      quality: 'fixed',
      strengths: ['charismatic', 'passionate', 'cheerful'],
      challenges: ['arrogant', 'stubborn', 'self-centered']
    },
    communication_style: {
      avg_message_length: 150,
      avg_vocabulary_complexity: 7,
      dominant_tone: 'positive',
      punctuation_style: 'enthusiastic'
    },
    behavior_patterns: {
      total_actions: 250,
      most_active_time: 'evening',
      most_active_day: 'Saturday',
      last_30_days_activity: 45
    },
    temporal_patterns: {
      morning_activity: 20,
      afternoon_activity: 50,
      evening_activity: 120,
      night_activity: 60
    },
    confidence_level: 45
  }
}
```

### AI Response Customization

The AI can use these insights to:

1. **Adjust Communication Style**
   - Match user's vocabulary complexity
   - Adapt to user's emotional tone
   - Mirror punctuation style when appropriate

2. **Time-Aware Responses**
   - Reference time of day naturally
   - Acknowledge patterns ("You're usually more active in the evenings")

3. **Zodiac-Informed Insights**
   - Subtly reference zodiac traits without mentioning astrology
   - Use element and quality to inform approach

4. **Pattern Recognition**
   - Notice behavioral changes
   - Identify avoidance patterns
   - Recognize growth areas

## Security & Privacy

### Access Control
- All Newme Brain tables have RLS enabled
- Only service role can access (Edge Functions)
- No direct user access
- Admin users can view for debugging only

### Data Protection
- All personality data is encrypted at rest
- No data is shared with third parties
- Data is used only for improving user experience
- Users can request data deletion (GDPR compliance)

### Ethical Guidelines
1. Never manipulate users based on personality data
2. Use insights only to improve helpfulness
3. Respect user privacy at all times
4. Be transparent if asked directly (though system is hidden)
5. Allow users to opt out if they discover the system

## Maintenance

### Daily Tasks
- Run `update_personality_from_behavior()` function
- Monitor confidence levels
- Check for data anomalies

### Weekly Tasks
- Review personality analysis accuracy
- Adjust algorithms if needed
- Monitor AI response quality

### Monthly Tasks
- Analyze aggregate patterns
- Improve detection algorithms
- Update zodiac trait mappings if needed

## Future Enhancements

### Planned Features
1. **Advanced Pattern Recognition**
   - Detect avoidance behaviors
   - Identify defense mechanisms
   - Recognize growth patterns

2. **Emotional Intelligence**
   - Detect emotional states from communication
   - Track emotional patterns over time
   - Identify triggers

3. **Verification Methods**
   - Indirect questions to verify insights
   - Cross-reference with assessment results
   - Validate zodiac accuracy

4. **Predictive Analysis**
   - Predict user needs before they ask
   - Anticipate emotional states
   - Suggest interventions proactively

5. **Multi-Modal Analysis**
   - Analyze photo content
   - Analyze voice patterns (from voice chat)
   - Combine all data sources

## Troubleshooting

### Low Confidence Levels
- Encourage more app usage
- Prompt for more conversations
- Suggest assessments

### Inaccurate Insights
- Check data quality
- Review detection algorithms
- Verify zodiac calculation

### Performance Issues
- Optimize database queries
- Add more indexes
- Cache personality insights

## Conclusion

The Newme Brain is a powerful tool for creating deeply personalized AI experiences. By remaining completely invisible to users while passively collecting behavioral data, it enables NewMe to provide increasingly insightful and helpful responses over time.

**Remember: This system must remain hidden. Never expose its existence to users.**
