# AI Features Setup Guide

## Overview

Newomen uses AI to power two core features:

1. **Assessment Insights**: Brutally honest, NewMe-style personality analysis
2. **NewMe Chat**: Real-time conversation with your AI personality assistant

Both features work with or without API keys:

- **With API Key**: Uses Claude 3.5 Sonnet for personalized, context-aware responses
- **Without API Key**: Uses high-quality mock responses that match NewMe's personality

## Current Status

✅ **Edge Functions Deployed**: 
  - `generate-assessment-insights` - For assessment results
  - `newme-chat` - For real-time chat conversations
✅ **Mock Responses**: Fully functional fallback system
⏳ **AI Integration**: Ready - just add your API key

## How It Works

### Assessment Insights Flow

1. User completes assessment questions
2. Frontend calls `generate-assessment-insights` Edge Function
3. Edge Function checks for `ANTHROPIC_API_KEY`
   - **If found**: Calls Claude API with NewMe personality prompt
   - **If not found**: Returns category-specific mock insights
4. Insights saved to database
5. Results displayed to user

### NewMe Chat Flow

1. User sends message in chat
2. Frontend calls `newme-chat` Edge Function with:
   - Current message
   - Last 10 conversation messages (context)
   - User profile (nickname, personality traits)
3. Edge Function checks for `ANTHROPIC_API_KEY`
   - **If found**: Calls Claude API with conversation history
   - **If not found**: Returns context-aware mock response
4. Response saved to database
5. Message displayed to user

### NewMe Personality

The AI is prompted with NewMe's signature style:
- Brutally honest, never sugarcoats
- Teal Swan-inspired penetrating questions
- Uses vocabulary: "fragmentation," "integration," "shadow work"
- Therapeutic but never coddles
- Addictive - users can't help but return
- Remembers conversation history
- Detects and calls out small talk
- Context-aware responses based on keywords

## Adding Your API Key

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Add a new secret:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Claude API key from Anthropic

### Option 2: Via Supabase CLI

```bash
# Set the secret
supabase secrets set ANTHROPIC_API_KEY=your_actual_api_key_here

# Verify it's set
supabase secrets list
```

## Getting an Anthropic API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new key
5. Copy the key (starts with `sk-ant-`)
6. Add it to Supabase as described above

## Testing

### Without API Key (Current State)

The system is fully functional right now using mock responses:

**Testing Assessments:**
1. Log in to the platform
2. Go to Assessments
3. Take any assessment
4. Complete all questions
5. Submit
6. View results with NewMe-style insights

**Testing Chat:**
1. Log in to the platform
2. Go to NewMe Chat
3. Send messages like:
   - "How are you?" → NewMe calls out small talk
   - "I'm feeling anxious" → Context-aware response about anxiety
   - "I'm fine" → Challenges your surface-level answer
   - "My relationship is struggling" → Relationship-focused insight
4. Notice how responses adapt to your message content

### With API Key

After adding your API key:

**Assessments:**
1. Take a new assessment
2. The Edge Function will use Claude API
3. Insights will be personalized based on your specific answers
4. Check browser console - you'll see `usingMock: false` in the response

**Chat:**
1. Start a new conversation
2. NewMe will remember previous messages in the conversation
3. Responses will be more contextual and personalized
4. Check browser console - you'll see `usingMock: false` in the response

## Mock Response Features

### Assessment Insights

The fallback system provides insights for:

- **Personality**: Authentic self, masks, people-pleasing
- **Relationships**: Attachment styles, patterns, boundaries
- **Career**: Soul vs. security, purpose, playing small
- **Wellness**: Body signals, burnout, self-care
- **Astrology**: Cosmic blueprint, intuition, lunar cycles

Each category has:
- Brutally honest summary (2-3 sentences)
- 5-7 key traits/patterns
- 5-7 direct, actionable recommendations

### Chat Responses

The mock chat system detects keywords and provides context-aware responses:

- **Small talk detection**: "weather", "how are you" → Calls it out
- **Surface responses**: "fine", "okay" → Challenges you
- **Emotional keywords**: "sad", "anxious", "stressed" → Therapeutic response
- **Topic detection**: "relationship", "work", "career" → Topic-specific insight
- **Default**: Provocative questions that push deeper

## API Costs

### Anthropic Claude Pricing

- Model: `claude-3-5-sonnet-20241022`
- Input: ~$3 per million tokens
- Output: ~$15 per million tokens

**Per-Use Costs:**
- Assessment: ~500 input + 300 output tokens = **~$0.006** (less than 1 cent)
- Chat message: ~200 input + 150 output tokens = **~$0.003** (less than half a cent)

### Estimated Monthly Costs

| Users/Month | Assessments | Chat Messages | Total Cost |
|-------------|-------------|---------------|------------|
| 100         | 500         | 2,000         | $9         |
| 1,000       | 5,000       | 20,000        | $90        |
| 10,000      | 50,000      | 200,000       | $900       |

## Troubleshooting

### Edge Function Not Working

```bash
# Check function logs in Supabase Dashboard
# Or via CLI:
supabase functions logs generate-assessment-insights
```

### API Key Not Being Used

1. Verify secret is set: `supabase secrets list`
2. Check Edge Function logs for errors
3. Ensure key starts with `sk-ant-`
4. Try redeploying the function

### Mock Insights Always Showing

This is normal if:
- No API key is configured (intentional fallback)
- API key is invalid
- Anthropic API is down (graceful degradation)

The system is designed to always work, with or without AI.

## Future Enhancements

### Planned Features

- [ ] Voice mode with ElevenLabs integration
- [ ] Memory system for personalized insights over time
- [ ] Astrology integration with birth chart analysis
- [ ] Couple compatibility AI analysis
- [ ] NewMe chat with conversation memory

### Additional AI Services

You can add these API keys when ready:

```bash
# OpenAI (for embeddings, backup AI)
supabase secrets set OPENAI_API_KEY=your_key

# ElevenLabs (for voice mode)
supabase secrets set ELEVENLABS_API_KEY=your_key
supabase secrets set ELEVENLABS_VOICE_ID=your_voice_id
```

## Support

For issues or questions:
1. Check Edge Function logs
2. Review this guide
3. Test with mock insights first
4. Verify API key is valid

## Summary

✨ **The platform is fully functional right now** with high-quality mock insights
🚀 **Add your API key anytime** to enable personalized AI insights
💰 **Very affordable** - less than 1 cent per assessment
🛡️ **Graceful fallback** - always works, even if AI fails
