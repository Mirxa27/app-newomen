# Admin Setup & Testing Guide

## ✅ Completed Actions

### 1. Admin User Created
- **Email**: `admin@newomen.me`
- **Role**: `admin`
- **User ID**: `299707ac-8c2e-4ea0-8286-774887257ec4`
- **Status**: Active with admin privileges

### 2. Edge Functions Deployed
- ✅ **newme-chat** - Text chat with NewMe AI (Version 2)
- ✅ **realtime-voice-session** - Voice-to-voice chat with OpenAI Realtime API (Version 3)

### 3. Logo Updated
- ✅ All pages now use `/images/newomen-logo.png` (NEWOMEN text logo)
- ✅ App icon uses `/images/newomen-icon.png`

## 🔐 Admin Login Instructions

### Option 1: Email/Password Login
1. Go to http://localhost:5173/login
2. Enter email: `admin@newomen.me`
3. Enter password: **You need to set a password first** (see below)

### Option 2: Google OAuth
1. Go to http://localhost:5173/login
2. Click "Continue with Google"
3. Use the Google account associated with `admin@newomen.me`

### Setting Password for Admin User

If you need to set a password for the admin user, you can:

**Option A: Use Supabase Dashboard**
1. Go to Supabase Dashboard → Authentication → Users
2. Find `admin@newomen.me`
3. Click "Reset Password" or "Send Password Reset Email"

**Option B: Use Supabase SQL**
```sql
-- This will send a password reset email
SELECT auth.users.email, auth.users.id 
FROM auth.users 
WHERE email = 'admin@newomen.me';
-- Then use Supabase Dashboard to reset password
```

**Option C: Create New Admin Account**
1. Sign up with a new email at http://localhost:5173/login
2. The first user automatically becomes admin
3. Or manually update role in database:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

## 🎤 Voice-to-Voice Chat Configuration

### Current Status
- ✅ Edge Function deployed: `realtime-voice-session`
- ✅ Voice chat UI component: `RealtimeVoiceChat.tsx`
- ✅ Integrated in Chat page with tab switching

### How to Use Voice Chat
1. Log in to the application
2. Navigate to `/chat`
3. Click on the **"Voice Chat"** tab
4. Click the **"Start Voice Chat"** button
5. Grant microphone permissions when prompted
6. Start speaking - NewMe will respond in real-time

### Requirements
- **OpenAI API Key**: Required for real-time voice chat
  - Add `OPENAI_API_KEY` to Supabase Edge Function secrets
  - Without it, voice chat will show a mock session message

### Voice Chat Features
- ✅ Real-time bidirectional voice conversation
- ✅ Memory-driven conversations (uses same NewMe personality)
- ✅ Audio visualization during conversation
- ✅ Mute/unmute controls
- ✅ Speaker mute controls
- ✅ Automatic transcript saving
- ✅ Memory extraction from voice conversations

## 🐛 Chat Page Troubleshooting

### Issue: Chat page redirects to login
**Solution**: This is expected behavior - the chat page requires authentication. Log in first.

### Issue: Chat page shows loading forever
**Possible causes**:
1. Edge Function not responding
2. Missing API keys (will use mock responses)
3. Network connectivity issues

**Check**:
- Open browser console (F12) for errors
- Check Supabase Edge Function logs
- Verify `newme-chat` function is deployed

### Issue: Voice chat not connecting
**Possible causes**:
1. Missing `OPENAI_API_KEY` in Edge Function secrets
2. WebSocket connection blocked
3. Microphone permissions not granted

**Check**:
- Verify `OPENAI_API_KEY` is set in Supabase Dashboard → Edge Functions → Secrets
- Check browser console for WebSocket errors
- Ensure microphone permissions are granted

## 📋 Admin Access Checklist

- [x] Admin profile created in database
- [x] Admin role assigned
- [x] Edge Functions deployed
- [ ] Admin user can log in (test required)
- [ ] Admin dashboard accessible (test required)
- [ ] All admin features working (test required)

## 🔧 Testing Admin Features

Once logged in as admin, you should have access to:

1. **Admin Dashboard** (`/admin`)
   - User management
   - Assessment management
   - Divination management
   - Subscription management
   - Analytics
   - AI configuration (providers, models, voices, behaviors)
   - Supervisor dashboard
   - AI interaction logs

2. **All User Features**
   - Chat with NewMe (text & voice)
   - Assessments
   - Balance Wheel
   - Daily Divinations
   - Shadow Work Journeys
   - Community features
   - Profile management

## 🚀 Next Steps

1. **Log in as admin** using one of the methods above
2. **Test chat functionality**:
   - Text chat should work (with or without API keys - uses mock if missing)
   - Voice chat requires `OPENAI_API_KEY` in Edge Function secrets
3. **Test admin features**:
   - Navigate to `/admin` to access admin dashboard
   - Verify all admin pages are accessible
4. **Configure API Keys** (optional):
   - Add `OPENAI_API_KEY` to Supabase Edge Function secrets for voice chat
   - Add `ANTHROPIC_API_KEY` for enhanced text chat
   - Add `ELEVENLABS_API_KEY` for TTS (optional)

## 📝 Admin Credentials Summary

- **Email**: admin@newomen.me
- **Role**: admin
- **Status**: Active
- **Password**: Set via Supabase Dashboard or password reset email

---

**Note**: The chat page requires authentication. If you're seeing the login page when accessing `/chat`, this is correct behavior. Simply log in first, then navigate to `/chat`.

