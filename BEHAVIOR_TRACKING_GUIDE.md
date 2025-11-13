# Newme Brain Behavior Tracking Guide

## Overview
The Newme Brain system tracks user behavior across the application to build comprehensive personality profiles and provide personalized insights.

## How to Track Behaviors

### Basic Usage
```typescript
import { db } from '@/db/api';

// Track a behavior
await db.newmeBrain.trackBehavior(
  userId,           // User's UUID
  'behavior_type',  // Type of behavior
  { /* metadata */ } // Additional context
);
```

### Example
```typescript
// Track when a user sends a chat message
await db.newmeBrain.trackBehavior(
  profile.id,
  'chat_message_sent',
  {
    conversation_id: conversationId,
    message_length: message.length,
    has_attachments: false,
  }
);
```

## Tracked Behaviors Reference

### Dashboard
| Behavior Type | Metadata | Description |
|--------------|----------|-------------|
| `dashboard_visit` | `{}` | User visits their dashboard |

### Chat
| Behavior Type | Metadata | Description |
|--------------|----------|-------------|
| `chat_message_sent` | `conversation_id`, `message_length` | User sends a text message |
| `voice_message_sent` | `conversation_id`, `duration_seconds` | User sends a voice message |
| `photo_uploaded` | `conversation_id` | User uploads a photo in chat |
| `realtime_voice_started` | `conversation_id` | User starts a realtime voice session |

### Assessments
| Behavior Type | Metadata | Description |
|--------------|----------|-------------|
| `assessment_started` | `assessment_id`, `assessment_category`, `assessment_title` | User starts an assessment |
| `assessment_completed` | `assessment_id`, `assessment_category`, `questions_count` | User completes an assessment |

### Shadow Work
| Behavior Type | Metadata | Description |
|--------------|----------|-------------|
| `shadow_work_started` | `journey_id`, `theme` | User starts a shadow work journey |
| `shadow_work_question_answered` | `journey_id`, `question_id`, `answer_length` | User answers a shadow work question |
| `shadow_work_completed` | `journey_id`, `total_questions` | User completes a shadow work journey |

### Profile
| Behavior Type | Metadata | Description |
|--------------|----------|-------------|
| `profile_updated` | `fields_updated` (array) | User updates their profile |

### Wellness
| Behavior Type | Metadata | Description |
|--------------|----------|-------------|
| `wellness_visit` | `{}` | User visits the wellness page |
| `wellness_resource_played` | `resource_id`, `resource_category`, `resource_type` | User plays a wellness resource |

### Community
| Behavior Type | Metadata | Description |
|--------------|----------|-------------|
| `community_visit` | `{}` | User visits the community page |
| `community_post_created` | `post_id`, `content_length` | User creates a community post |

## Adding New Behaviors

### Step 1: Identify the Behavior
Determine what user action you want to track and what metadata would be useful for analysis.

### Step 2: Add Tracking Code
Add the tracking call in the appropriate component:

```typescript
// Example: Tracking when a user completes a challenge
const handleCompleteChallenge = async (challengeId: string) => {
  // ... existing logic ...
  
  // Track the behavior
  if (profile) {
    await db.newmeBrain.trackBehavior(
      profile.id,
      'challenge_completed',
      {
        challenge_id: challengeId,
        completion_time_seconds: timeSpent,
        difficulty: challenge.difficulty,
      }
    );
  }
  
  // ... rest of logic ...
};
```

### Step 3: Document the Behavior
Add the new behavior to this guide and update the admin dashboard if needed.

## Best Practices

### 1. Always Check for Profile
```typescript
if (profile) {
  await db.newmeBrain.trackBehavior(...);
}
```

### 2. Use Descriptive Behavior Types
- ✅ Good: `assessment_completed`, `chat_message_sent`
- ❌ Bad: `action`, `event`, `thing_happened`

### 3. Include Relevant Metadata
Include data that helps understand the context:
- IDs of related entities
- Quantitative measures (length, duration, count)
- Categorical data (type, category, difficulty)

### 4. Don't Track Sensitive Data
Never include:
- Passwords or authentication tokens
- Full message content (use length instead)
- Personal identifying information beyond user_id
- Financial information

### 5. Handle Errors Gracefully
```typescript
try {
  await db.newmeBrain.trackBehavior(...);
} catch (error) {
  // Log error but don't block user action
  console.error('Failed to track behavior:', error);
}
```

## Viewing Behavior Data

### Admin Dashboard
Admins can view behavior patterns in the Newme Brain section of the admin panel:
1. Navigate to Admin Panel
2. Click on "Newme Brain"
3. Select a user to view their behavior history
4. Click "Generate Insights" to get AI-powered personality analysis

### Database Query
```sql
-- View all behaviors for a user
SELECT * FROM user_behaviors
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;

-- Count behaviors by type
SELECT behavior_type, COUNT(*) as count
FROM user_behaviors
WHERE user_id = 'user-uuid'
GROUP BY behavior_type
ORDER BY count DESC;

-- View recent behaviors across all users
SELECT ub.*, p.nickname
FROM user_behaviors ub
JOIN profiles p ON p.id = ub.user_id
ORDER BY ub.created_at DESC
LIMIT 100;
```

## Privacy Considerations

### Data Retention
- Behavior data is stored indefinitely by default
- Users can request data deletion through their profile settings
- Admins can manually delete behavior data if needed

### Data Access
- Users can view their own behavior history
- Admins can view all behavior data
- Behavior data is protected by Row Level Security (RLS)

### Data Usage
- Behavior data is used to generate personality insights
- Data is never shared with third parties
- AI analysis is performed securely via Edge Functions

## Troubleshooting

### Behavior Not Being Tracked
1. Check if user is authenticated (`profile` exists)
2. Verify the tracking code is being called
3. Check browser console for errors
4. Verify database connection

### Metadata Not Saving
1. Ensure metadata is a valid JSON object
2. Check that all values are serializable
3. Verify no circular references in metadata

### Performance Issues
1. Avoid tracking in tight loops
2. Use async/await properly
3. Consider batching if tracking many behaviors at once

## Examples

### Complete Example: Tracking Assessment Flow
```typescript
// When assessment starts
useEffect(() => {
  if (assessment && profile) {
    db.newmeBrain.trackBehavior(
      profile.id,
      'assessment_started',
      {
        assessment_id: assessment.id,
        assessment_category: assessment.category,
        assessment_title: assessment.title,
      }
    );
  }
}, [assessment, profile]);

// When assessment completes
const handleSubmit = async () => {
  // ... save assessment results ...
  
  // Track completion
  await db.newmeBrain.trackBehavior(
    profile.id,
    'assessment_completed',
    {
      assessment_id: assessment.id,
      assessment_category: assessment.category,
      questions_count: questions.length,
    }
  );
  
  // ... navigate to results ...
};
```

### Complete Example: Tracking Chat Interactions
```typescript
const handleSendMessage = async () => {
  // ... send message logic ...
  
  // Track message sent
  if (profile) {
    db.newmeBrain.trackBehavior(
      profile.id,
      'chat_message_sent',
      {
        conversation_id: currentConversation.id,
        message_length: message.length,
        has_attachments: attachments.length > 0,
      }
    );
  }
  
  // ... rest of logic ...
};

const handleVoiceMessage = async (audioBlob: Blob) => {
  // ... process voice message ...
  
  // Track voice message
  if (profile) {
    db.newmeBrain.trackBehavior(
      profile.id,
      'voice_message_sent',
      {
        conversation_id: currentConversation.id,
        duration_seconds: audioDuration,
      }
    );
  }
  
  // ... rest of logic ...
};
```

## Integration with AI Insights

The behavior data is used by the AI to generate personality insights:

1. **Data Collection**: Behaviors are tracked and stored in `user_behaviors` table
2. **Pattern Analysis**: Admin triggers insight generation
3. **AI Processing**: Edge Function sends behavior data to Claude API
4. **Insight Generation**: AI analyzes patterns and generates insights
5. **Storage**: Insights are stored in `personality_insights` table
6. **Display**: Insights are shown in admin dashboard and user profile

## Conclusion

The Newme Brain behavior tracking system provides a comprehensive way to understand user interactions and generate personalized insights. By following this guide, you can effectively track behaviors and leverage the data for AI-powered personality analysis.
