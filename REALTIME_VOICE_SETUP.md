# Real-Time Voice Chat Setup Guide

## Overview

The Newomen platform now features **real-time voice conversations** with NewMe using advanced speech-to-speech AI technology. This enables natural, low-latency interactions without intermediate text transcription.

## Features Implemented

### ✅ Core Voice Chat Features
- **Native Speech-to-Speech**: Audio input directly to audio output via real-time AI
- **Real-time Audio Streaming**: Low-latency bidirectional WebSocket communication
- **Voice Activity Detection (VAD)**: Automatic turn-taking with server-side detection
- **Audio Visualization**: Real-time waveform display during conversations
- **Transcript Recording**: Automatic transcription and storage of conversations
- **Memory Extraction**: AI-powered extraction of insights from voice conversations
- **Session Management**: Persistent voice session tracking in database

### ✅ UI Components
- **RealtimeVoiceChat Component**: Full-featured voice chat interface
- **Tab-based Interface**: Switch between text and voice chat modes
- **Audio Controls**: Mute microphone, mute speaker, hang up
- **Status Indicators**: Visual feedback for listening, speaking, and processing states
- **Transcript Display**: Real-time display of conversation text

### ✅ Backend Infrastructure
- **Supabase Edge Function**: `realtime-voice-session` for WebSocket proxy
- **Database Table**: `voice_sessions` for session tracking
- **Memory Integration**: Automatic saving of conversation insights
- **Function Calling**: Tools for retrieving user memories and saving insights

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Browser   │ ◄─────► │ Supabase Edge    │ ◄─────► │  Real-Time AI   │
│  (Frontend) │  HTTPS  │    Function      │ WebSocket│     Service     │
└─────────────┘         └──────────────────┘         └─────────────────┘
      │                          │
      │                          │
      ▼                          ▼
┌─────────────┐         ┌──────────────────┐
│  Web Audio  │         │    Supabase      │
│     API     │         │    Database      │
└─────────────┘         └──────────────────┘
```

## Setup Instructions

### 1. Get AI API Key

1. Obtain your AI service API key from your provider dashboard
2. Copy the key securely

### 2. Add API Key to Supabase

The AI API key must be added as a Supabase secret (not in `.env` file):

```bash
# Via Supabase CLI (if installed)
supabase secrets set AI_API_KEY=your_api_key_here

# Or via Supabase Dashboard:
# 1. Go to Project Settings > Edge Functions
# 2. Add secret: AI_API_KEY = your_key_here
```

### 3. Verify Edge Function Deployment

The `realtime-voice-session` Edge Function should already be deployed. Verify:

```bash
# Check function status in Supabase Dashboard
# Project > Edge Functions > realtime-voice-session
```

### 4. Test Voice Chat

1. Navigate to the Chat page
2. Click the "Voice Chat" tab
3. Click the phone icon to start a voice conversation
4. Allow microphone access when prompted
5. Start speaking naturally with NewMe

## Technical Details

### Real-Time AI Configuration

```typescript
{
  model: 'advanced-realtime-model',
  voice: 'alloy', // Options: alloy, echo, shimmer
  input_audio_format: 'pcm16',
  output_audio_format: 'pcm16',
  turn_detection: {
    type: 'server_vad',
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 500,
  },
  temperature: 0.8,
  max_response_output_tokens: 4096,
}
```

### Audio Processing

- **Sample Rate**: 24kHz
- **Format**: PCM16 (16-bit linear PCM)
- **Channels**: Mono
- **Encoding**: Base64 for WebSocket transmission
- **Buffering**: Queue-based playback for smooth audio

### NewMe Personality in Voice

The voice mode uses the same brutally honest, Teal Swan-inspired personality:

- Direct and provocative questioning
- No small talk - every conversation is deep
- Natural conversational flow with pauses
- Challenges inconsistencies immediately
- Warm but never fake

### Function Calling

NewMe can call these functions during voice conversations:

1. **get_user_memories**: Retrieve past conversations and insights
2. **save_insight**: Save important observations about the user

### Memory Extraction

After each voice conversation:
1. Transcript is saved to `voice_sessions` table
2. AI extracts 3-5 key insights automatically
3. Insights are saved to `newme_memories` table
4. Categories: personality, fear, desire, pattern, shadow

## Database Schema

### voice_sessions Table

```sql
CREATE TABLE voice_sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  session_id text UNIQUE NOT NULL,
  status text DEFAULT 'active',
  transcript text,
  metadata jsonb,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

## Cost Considerations

### Real-Time Voice API Pricing

Voice conversations consume AI service credits based on duration and usage.

**Example**: A 10-minute voice conversation may consume significant credits depending on your service plan.

### Cost Optimization Tips

1. **Session Limits**: Implement max conversation duration
2. **User Quotas**: Limit voice minutes per user per day
3. **Fallback to Text**: Offer text chat as primary mode
4. **Caching**: Cache common responses (not implemented yet)

## Browser Compatibility

### Supported Browsers

- ✅ Chrome 89+
- ✅ Edge 89+
- ✅ Safari 14.1+
- ✅ Firefox 88+

### Required APIs

- Web Audio API
- MediaDevices API (getUserMedia)
- WebSocket API
- AudioContext

## Troubleshooting

### Issue: "Failed to access microphone"

**Solution**: Ensure HTTPS connection and grant microphone permissions

### Issue: "Using mock session"

**Solution**: Add OPENAI_API_KEY to Supabase secrets

### Issue: Audio cutting out

**Solution**: Check internet connection stability, reduce background noise

### Issue: High latency

**Solution**: 
- Check network connection
- Reduce audio quality if needed
- Consider geographic proximity to AI service servers

## Future Enhancements

### Planned Features

- [ ] Voice emotion detection
- [ ] Background noise suppression
- [ ] Adaptive audio quality
- [ ] Conversation summaries
- [ ] Voice cloning for personalized NewMe voice
- [ ] Multi-language support
- [ ] Offline mode with local speech processing

### Advanced Features

- [ ] Group voice conversations
- [ ] Voice journaling
- [ ] Guided meditation with voice
- [ ] Voice-activated assessments
- [ ] Real-time translation

## Security Considerations

### API Key Security

- ✅ API keys stored in Supabase secrets (server-side)
- ✅ Never exposed to client-side code
- ✅ Edge Function acts as secure proxy

### Audio Privacy

- Audio is streamed directly to AI service
- Not stored on Supabase servers
- Only transcripts are saved
- Users can delete their voice sessions

### WebSocket Security

- WSS (WebSocket Secure) protocol
- Session-based authentication
- Automatic session expiration

## Resources

- Web Audio API Documentation
- Supabase Edge Functions Guide
- Real-Time Voice Chat Best Practices

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify API key is set correctly
3. Test with text chat first to isolate voice-specific issues
4. Check Supabase Edge Function logs

---

**Note**: The voice chat feature requires an active AI service API key. Without the key, the system will display a mock session message.
