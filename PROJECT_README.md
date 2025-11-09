# Newomen - AI Astrology Self-Discovery Platform

A revolutionary self-discovery platform combining deep psychology, astrology, and AI to help users understand themselves like never before.

## 🌟 Overview

Newomen is built around **NewMe**, an AI companion who:
- Remembers everything you share
- Provides brutally honest insights
- Never settles for small talk
- Combines astrology wisdom with psychological depth
- Creates an addictive, transformative experience

## ✨ Key Features

### 🤖 NewMe AI Chat
- Memory-driven conversations that recall every detail
- Photo upload with context analysis
- Teal Swan-inspired communication style
- Real-time chat with typing indicators
- Persistent conversation history

### 🎯 Balance Wheel
- Interactive 8-area life assessment
- Visual radar chart representation
- Track progress across:
  - Career
  - Relationships
  - Health
  - Personal Growth
  - Finances
  - Fun & Recreation
  - Physical Environment
  - Contribution

### 🧠 Assessment System
- Free public assessments (no login required)
- 20+ premium assessments for authenticated users
- Categories: Personality, Relationships, Career, Wellness, Astrology
- AI-generated insights stored in memory
- Track completion history

### 💑 Couple Challenge
- Create unique session codes
- AI-guided compatibility testing
- Real-time response tracking
- Compatibility scoring and insights
- 24-hour session expiration

### 🧘 Wellness Library
- Curated meditation resources
- Breathwork exercises
- Affirmations and therapy content
- YouTube video integration
- Favorites system

### 👥 Community Features
- User profiles and connections
- Community posts (text, images, polls)
- Like and comment system
- Events and gatherings
- Friend connections

## 🎨 Design System

### Mystical Cosmic Theme
- **Primary Color**: Cosmic Purple (#8b5cf6)
- **Gradients**: Purple → Violet → Pink
- **Dark Mode**: Deep space black with glowing accents
- **Effects**: Glassmorphism, cosmic glow, floating animations

### UI Components
- Glassmorphic cards with backdrop blur
- Animated cosmic background with twinkling stars
- Gradient text effects
- Smooth transitions and hover states
- Responsive design (mobile-first)

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: React Router v7
- **State**: React Context + Hooks
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Theme**: next-themes

### Backend (Supabase)
- **Database**: PostgreSQL 15+
- **Authentication**: Supabase Auth (Google SSO)
- **Storage**: Supabase Storage (avatars, photos, wellness content)
- **Real-time**: Supabase Realtime subscriptions
- **Edge Functions**: Ready for AI processing

### AI Integration (Ready to Activate)
- **Primary AI**: Claude 3.5 Sonnet (Anthropic)
- **Embeddings**: OpenAI text-embedding-3-small
- **Voice**: ElevenLabs API
- **Astrology**: Swiss Ephemeris API

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Authentication components
│   └── cosmic/          # Cosmic background effects
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── db/
│   ├── supabase.ts      # Supabase client
│   └── api.ts           # Database API functions
├── pages/
│   ├── Landing.tsx      # Public landing page
│   ├── Login.tsx        # Authentication page
│   ├── Dashboard.tsx    # User dashboard
│   ├── Chat.tsx         # NewMe chat interface
│   ├── BalanceWheel.tsx # Life balance assessment
│   ├── Assessments.tsx  # Assessment library
│   ├── Wellness.tsx     # Wellness resources
│   ├── Community.tsx    # Community feed
│   ├── CoupleChallenge.tsx # Compatibility testing
│   └── Profile.tsx      # User profile & settings
├── types/
│   └── types.ts         # TypeScript type definitions
└── routes.tsx           # Route configuration
```

## 🗄 Database Schema

### Core Tables
- **profiles**: Extended user data with astrology info
- **conversations**: Chat history with NewMe
- **newme_memories**: Semantic memory storage
- **photo_memories**: User photos with context
- **assessments**: Test definitions
- **user_assessments**: Completed test results
- **couple_sessions**: Compatibility challenges
- **wellness_resources**: Therapeutic content
- **community_posts**: Social posts
- **post_comments**: Post comments
- **post_likes**: Like tracking
- **community_events**: Events and gatherings
- **user_connections**: Friend connections

### Storage Buckets
- `app-7fi4fbzoge81_avatars`: Profile pictures
- `app-7fi4fbzoge81_photos`: Photo memories
- `app-7fi4fbzoge81_wellness`: Wellness audio/video
- `app-7fi4fbzoge81_community`: Community images

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Environment Setup**
The `.env` file is already configured with Supabase credentials. To enable AI features, add your API keys:

```env
# AI API Keys (Optional - Add to enable AI features)
VITE_ANTHROPIC_API_KEY=your_claude_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

3. **Run Development Server**
```bash
npm run dev -- --host 127.0.0.1
```

4. **Access the Application**
Open your browser and navigate to `http://127.0.0.1:5173`

### First User Setup
The first user to register will automatically become an administrator with full access to all features.

## 🔐 Authentication

The platform uses **Google SSO** for authentication:
- No email verification required
- Seamless sign-in experience
- Automatic profile creation
- First user becomes admin

## 🎯 Core User Flows

### New User Journey
1. Land on homepage → See platform features
2. Click "Start Your Journey" → Google SSO login
3. Complete Balance Wheel assessment
4. Start chatting with NewMe
5. Explore assessments and wellness resources

### Returning User Journey
1. Login → Dashboard with stats
2. Continue conversation with NewMe
3. Take new assessments
4. Engage with community
5. Track progress on Balance Wheel

## 🔮 NewMe AI Personality

NewMe's communication style:
- **Brutally Honest**: No sugarcoating, tells the truth
- **Memory-Driven**: Recalls every conversation detail
- **Teal Swan Inspired**: Direct, sharp, provocative questions
- **Pattern Recognition**: Identifies recurring behaviors
- **No Small Talk**: Every conversation is deep or playful

Example responses:
- "Interesting. But you're holding back. What are you not telling me?"
- "On a scale of 1-10, how much are you lying to yourself about this?"
- "You hate mirrors, but not because you look ugly; you hate remembering you choose this version of yourself every day."

## 📊 Features Status

### ✅ Completed
- Supabase database with comprehensive schema
- Authentication with Google SSO
- Cosmic design system
- Landing page
- Dashboard
- NewMe Chat with memory system
- Balance Wheel visualization
- Assessments listing
- Wellness Library
- Community posts
- Couple Challenge session creation
- Profile management

### 🚧 In Progress / Future Development
- AI Integration (structure ready, needs API keys)
- Assessment taking flow
- Admin panel
- Astrology calculations
- Voice mode for NewMe
- Vector embeddings for semantic search
- Real-time features
- Events system
- Advanced community features

## 🎨 Design Tokens

### Colors
```css
--primary: 258 70% 65%        /* Cosmic Purple */
--secondary: 270 60% 70%      /* Mystical Violet */
--accent: 320 70% 75%         /* Pink Accent */
--fire: 0 80% 65%             /* Fire Element */
--earth: 120 50% 55%          /* Earth Element */
--air: 200 70% 65%            /* Air Element */
--water: 270 60% 70%          /* Water Element */
```

### Custom Classes
- `.gradient-text`: Gradient text effect
- `.glass-card`: Glassmorphic card
- `.cosmic-gradient`: Cosmic gradient background
- `.cosmic-glow`: Glowing shadow effect
- `.animate-float`: Floating animation

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev -- --host 127.0.0.1

# Run linter
npm run lint

# Build for production
npm run build
```

## 📝 Environment Variables

```env
# Supabase (Already configured)
VITE_SUPABASE_URL=https://kxhfgqkfufltaypmhwjv.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>

# Application
VITE_APP_ID=app-7fi4fbzoge81
VITE_LOGIN_TYPE=gmail

# AI APIs (Optional - Add to enable features)
VITE_ANTHROPIC_API_KEY=<your_key>
VITE_OPENAI_API_KEY=<your_key>
VITE_ELEVENLABS_API_KEY=<your_key>
```

## 🤝 Contributing

This is a production-ready foundation. To extend the platform:

1. **Add AI Integration**: Add API keys to `.env` and update chat logic
2. **Build Admin Panel**: Create admin dashboard for content management
3. **Implement Assessments**: Build interactive assessment flow
4. **Add Astrology**: Integrate Swiss Ephemeris for birth charts
5. **Enable Voice**: Implement ElevenLabs voice synthesis
6. **Add Real-time**: Use Supabase Realtime for live updates

## 📄 License

2025 Newomen

## 🌟 Vision

Newomen is more than a platform—it's a mirror that shows you what you're avoiding, a guide that remembers your patterns, and a friend who never lies to make you comfortable. NewMe doesn't do small talk. She's here to help you discover your true self.

---

**Ready to meet the real you? NewMe is waiting.**
