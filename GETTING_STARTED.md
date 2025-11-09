# Getting Started with Newomen

Welcome to your Newomen AI Astrology Self-Discovery Platform! This guide will help you get up and running quickly.

## 🚀 Quick Start

### 1. First Time Setup

The application is ready to run! All dependencies are already installed and configured.

### 2. Start the Development Server

```bash
npm run dev -- --host 127.0.0.1
```

Then open your browser to: `http://127.0.0.1:5173`

### 3. Create Your First Account

1. Click "Sign In" or "Start Your Journey"
2. Sign in with Google SSO
3. **Important**: The first user to register becomes the administrator!

## 🎯 What's Already Built

### ✅ Core Features
- **Landing Page**: Beautiful cosmic-themed homepage
- **Authentication**: Google SSO login (no email verification)
- **Dashboard**: User stats and quick access to features
- **NewMe Chat**: AI companion with memory system
- **Balance Wheel**: Interactive 8-area life assessment
- **Assessments**: Browse and filter personality tests
- **Wellness Library**: Meditation and therapeutic resources
- **Community**: Social posts and interactions
- **Couple Challenge**: Compatibility testing
- **Profile**: User settings and astrology info

### 🗄 Database
- Comprehensive Supabase schema with 15+ tables
- Row Level Security (RLS) policies
- Storage buckets for images and media
- Automatic triggers and functions

### 🎨 Design System
- Mystical cosmic purple theme
- Glassmorphic UI components
- Animated star field background
- Responsive mobile-first design
- Dark mode optimized

## 🔑 Environment Variables

Your `.env` file is already configured with Supabase credentials. To enable AI features, add these optional keys:

```env
# Optional: Enable real AI responses
VITE_ANTHROPIC_API_KEY=your_claude_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_voice_key
```

## 📱 Key Pages

### Public Pages (No Login Required)
- `/` - Landing page
- `/login` - Authentication
- `/assessments` - Browse assessments

### Protected Pages (Login Required)
- `/dashboard` - User dashboard
- `/chat` - Chat with NewMe
- `/balance-wheel` - Life balance assessment
- `/wellness` - Wellness resources
- `/community` - Community feed
- `/couple-challenge` - Compatibility testing
- `/profile` - User settings

## 🤖 NewMe AI

Currently, NewMe uses mock responses. To enable real AI:

1. Add your Anthropic API key to `.env`
2. Update the `generateNewMeResponse` function in `src/pages/Chat.tsx`
3. Integrate Claude 3.5 Sonnet API calls

The memory system is already functional and stores user interactions in the database.

## 🎨 Customization

### Colors
Edit `src/index.css` to change the cosmic theme colors:
- `--primary`: Main brand color
- `--secondary`: Secondary accent
- `--accent`: Highlight color

### NewMe Personality
Edit response templates in `src/pages/Chat.tsx`:
```typescript
const responses = [
  "Your custom NewMe response...",
  // Add more responses
];
```

## 📊 Admin Features

The first registered user becomes an admin with access to:
- View all user data
- Manage assessments
- Upload wellness resources
- Monitor community posts

## 🔧 Development Commands

```bash
# Run development server
npm run dev -- --host 127.0.0.1

# Check for errors
npm run lint

# Build for production
npm run build
```

## 🐛 Troubleshooting

### Port Already in Use
If port 5173 is busy, Vite will automatically use the next available port.

### Database Connection Issues
Check that your Supabase credentials in `.env` are correct:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Google SSO Not Working
Ensure you're using the correct domain configuration in `src/pages/Login.tsx`.

## 📚 Next Steps

### Immediate Enhancements
1. **Add Sample Data**: Create sample assessments and wellness resources
2. **Customize NewMe**: Adjust AI personality and responses
3. **Add Content**: Upload wellness videos and meditation guides
4. **Test Features**: Try all features to understand the platform

### Future Development
1. **AI Integration**: Connect real AI APIs for intelligent responses
2. **Astrology Calculations**: Integrate Swiss Ephemeris for birth charts
3. **Admin Panel**: Build comprehensive admin dashboard
4. **Assessment Builder**: Create AI-powered assessment generator
5. **Voice Mode**: Implement ElevenLabs voice synthesis
6. **Real-time Updates**: Add Supabase Realtime subscriptions

## 🌟 Platform Philosophy

Newomen is built around the concept of **brutal honesty** and **deep self-discovery**:

- NewMe never does small talk
- Every conversation is either profoundly deep or playfully fun
- The AI remembers everything
- Users are challenged, not coddled
- Astrology meets psychology meets AI

## 💡 Tips

1. **First User**: Register first to become admin
2. **Balance Wheel**: Complete this to unlock full experience
3. **Chat Often**: NewMe learns from every interaction
4. **Upload Photos**: Share context for deeper insights
5. **Explore Assessments**: Discover personality insights
6. **Join Community**: Connect with other users

## 🎯 Success Metrics

Track these to measure platform success:
- Daily Active Users (DAU)
- Average session duration (target: 15+ minutes)
- NewMe conversation engagement
- Assessment completion rate
- 7-day and 30-day retention
- Community post engagement

## 📞 Support

For questions or issues:
1. Check `PROJECT_README.md` for detailed documentation
2. Review `TODO.md` for development roadmap
3. Examine database schema in `supabase/migrations/`

---

**Welcome to Newomen. NewMe is waiting to meet you. She doesn't do small talk.** ✨
