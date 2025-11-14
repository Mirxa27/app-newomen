# Local Development Setup - Newomen

## ✅ Server Status

The development server is now running!

### Access the Application

🌐 **Local URL**: http://localhost:5173
📱 **Network URL**: http://[your-ip]:5173 (accessible from other devices on your network)

## 🔐 Admin Account Setup

### First User Becomes Admin

The first user to register will **automatically become an administrator** with full access to all features.

### Steps to Create Admin Account:

1. **Open the application** in your browser:
   ```
   http://localhost:5173
   ```

2. **Click "Sign In"** or **"Start Your Journey"**

3. **Sign in with Google SSO**
   - Use your Google account
   - No email verification required

4. **Complete Onboarding** (if prompted)
   - Set your nickname
   - Add birth date and location (for astrology features)
   - Complete the balance wheel assessment

5. **You're now an Admin!**
   - The first user automatically gets `role = 'admin'` in the database
   - You'll have access to all admin features

### Verify Admin Status

After logging in, you can verify you're an admin by:
- Checking your profile in the database (should show `role: 'admin'`)
- Accessing admin-only features (if implemented)

## 🔑 Environment Variables

Your `.env` file is configured with:

```env
VITE_SUPABASE_URL=https://ejcuykfircnnqljcemgo.supabase.co
VITE_SUPABASE_ANON_KEY=[configured]
VITE_APP_ID=app-7fi4fbzoge81
VITE_LOGIN_TYPE=gmail
VITE_API_ENV=development
```

### Optional: Enable AI Features

To enable full AI functionality, add these to your `.env` file:

```env
# OpenAI Realtime API (for voice chat)
VITE_OPENAI_API_KEY=sk-...

# Anthropic Claude API (for chat and insights)
VITE_ANTHROPIC_API_KEY=sk-ant-...

# ElevenLabs (for TTS - optional)
VITE_ELEVENLABS_API_KEY=...
```

**Note**: The app works without these keys but will use mock responses. Add them for full AI functionality.

## 🛠 Development Commands

### Start Development Server
```bash
npx vite --host 0.0.0.0 --port 5173
```

Or use the npm script (if modified):
```bash
npm run dev
```

### Stop Server
Press `Ctrl+C` in the terminal where the server is running

### Install Dependencies
```bash
npm install
```

### Run Linter
```bash
npm run lint
```

### Build for Production
```bash
npm run build
```

## 📱 Mobile Testing

The app is optimized for mobile browsers. To test on your phone:

1. Find your computer's IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Or
   ipconfig getifaddr en0
   ```

2. Access from your phone:
   ```
   http://[your-ip]:5173
   ```

3. Make sure your phone and computer are on the same network

## 🗄 Database Status

✅ All migrations have been applied
✅ Tables created and configured
✅ RLS policies enabled
✅ Storage buckets configured

## 🎯 Key Features Available

- ✅ **Authentication**: Google SSO login
- ✅ **NewMe Chat**: AI companion with memory system
- ✅ **Voice Chat**: OpenAI Realtime API integration
- ✅ **Photo Memories**: AI-powered photo analysis
- ✅ **Assessments**: Personality tests and quizzes
- ✅ **Balance Wheel**: Life assessment tool
- ✅ **Community**: Social features
- ✅ **Profile**: User settings and astrology

## 🐛 Troubleshooting

### Server won't start
- Check if port 5173 is already in use
- Try a different port: `npx vite --port 3000`

### Can't connect to Supabase
- Verify `.env` file has correct credentials
- Check Supabase project is active
- Ensure network connectivity

### Authentication issues
- Clear browser cache and cookies
- Check Google OAuth is configured in Supabase Dashboard
- Verify redirect URLs in Supabase Auth settings

### AI features not working
- Add API keys to `.env` file
- Check Edge Functions are deployed
- Verify API keys are valid

## 📞 Support

For issues or questions:
1. Check the console for errors
2. Review Supabase logs in dashboard
3. Check Edge Function logs for AI-related issues

---

**Ready to meet NewMe? Open http://localhost:5173 and start your journey!** 🚀

