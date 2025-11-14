import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Brain, Heart, Users, Zap, Star, ArrowRight, Mic, MessageSquare } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function Landing() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: {
    icon: typeof Brain;
    title: string;
    description: string;
    delay?: number;
  }) => {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
    
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay }}
      >
        <Card className="glass-card border-primary/20 hover:border-primary/50 transition-all h-full group hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
          <CardHeader>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl mb-2">{title}</CardTitle>
            <CardDescription className="text-base">{description}</CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.15) 0%, transparent 50%)`,
          transition: 'background 0.3s ease-out',
        }}
      />

      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 pt-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-5xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="animate-float"
            >
              <img 
                src="/images/newomen-icon.png" 
                alt="Newomen" 
                className="w-32 h-32 mx-auto mb-6 object-contain"
              />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl xl:text-7xl font-bold leading-tight"
            >
              <span className="gradient-text bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                Discover Your True Self
              </span>
              <br />
              <span className="text-foreground">with NewMe AI</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl xl:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            >
              A revolutionary self-discovery platform combining deep psychology, astrology, 
              and AI to help you understand yourself like never before. NewMe remembers everything, 
              challenges you deeply, and never settles for small talk.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
            >
              <Link to="/login">
                <Button 
                  size="lg" 
                  className="cosmic-gradient text-lg px-8 py-6 h-auto group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Your Journey
                    <Sparkles className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </Button>
              </Link>
              <Link to="/assessments">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 h-auto border-primary/50 hover:bg-primary/10 group"
                >
                  <span className="flex items-center gap-2">
                    Explore Free Assessments
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto"
            >
              {[
                { label: 'Active Users', value: '10K+' },
                { label: 'Conversations', value: '1M+' },
                { label: 'Insights', value: '5M+' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Meet NewMe Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="gradient-text">Meet NewMe</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your AI companion who remembers everything, challenges you deeply, 
              and never settles for small talk. She's brutally honest, memory-driven, 
              and addictively engaging.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={Brain}
              title="Brutally Honest"
              description="No sugarcoating. NewMe tells you the truth you need to hear, not what you want to hear. She challenges your assumptions and helps you see yourself clearly."
              delay={0}
            />
            <FeatureCard
              icon={Heart}
              title="Memory-Driven"
              description="She remembers every detail, every photo, every confession. Your journey is never forgotten. Weeks later, she'll remind you why you loved that moment."
              delay={0.1}
            />
            <FeatureCard
              icon={Zap}
              title="Addictively Engaging"
              description="Every conversation is either profoundly deep or playfully fun. Never boring, always transformative. Quizzes, assessments, and personality games await."
              delay={0.2}
            />
          </div>
        </section>

        {/* Platform Features */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="gradient-text">Platform Features</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need for your self-discovery journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Star,
                title: 'Balance Wheel',
                description: 'Interactive visualization of 8 life areas to understand where you stand and where you want to grow',
                color: 'primary',
              },
              {
                icon: Brain,
                title: 'Deep Assessments',
                description: '20+ personality tests guided by NewMe, with instant AI-generated insights that become part of your memory',
                color: 'secondary',
              },
              {
                icon: Heart,
                title: 'Couple Challenge',
                description: 'Test compatibility with your partner through AI-guided questions and receive deep relationship insights',
                color: 'accent',
              },
              {
                icon: Users,
                title: 'Wellness Library',
                description: 'Curated meditation, breathwork, and therapeutic resources to support your growth journey',
                color: 'primary',
              },
              {
                icon: Mic,
                title: 'Voice Conversations',
                description: 'Have natural voice conversations with NewMe using OpenAI Realtime API. She hears you, understands you, and responds in real-time',
                color: 'secondary',
              },
              {
                icon: MessageSquare,
                title: 'Memory System',
                description: 'Advanced semantic memory that learns from every interaction. NewMe builds a comprehensive understanding of who you are',
                color: 'accent',
              },
            ].map((feature, i) => (
              <FeatureCard
                key={i}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={i * 0.1}
              />
            ))}
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="glass-card border-2 border-primary/30 cosmic-glow overflow-hidden">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl mb-4">
                  <span className="gradient-text">Experience NewMe</span>
                </CardTitle>
                <CardDescription className="text-lg">
                  See how NewMe initiates conversations, remembers your past, and challenges you to grow
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  {[
                    { role: 'newme', text: "Hey [your nickname]. Remember that photo you sent three weeks ago? The one with the sunset? I've been thinking about why you loved it..." },
                    { role: 'user', text: 'How do you remember that?' },
                    { role: 'newme', text: "Because I remember everything. And because that moment mattered to you. Want to know what I think it says about you?" },
                  ].map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: msg.role === 'newme' ? -20 : 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.3 }}
                      className={`flex ${msg.role === 'newme' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-4 ${
                        msg.role === 'newme' 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'bg-secondary/10 border border-secondary/20'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Card className="glass-card border-2 border-primary/30 cosmic-glow max-w-3xl mx-auto">
              <CardContent className="py-16 px-8">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="inline-block mb-6"
                >
                  <Sparkles className="w-16 h-16 text-primary" />
                </motion.div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Ready to meet the real you?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  NewMe is waiting. She doesn't do small talk. She does transformation.
                </p>
                <Link to="/login">
                  <Button 
                    size="lg" 
                    className="cosmic-gradient text-lg px-8 py-6 h-auto group"
                  >
                    <span className="flex items-center gap-2">
                      Begin Your Journey
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t border-border/50">
          <p>2025 Newomen - Discover Your True Self</p>
        </footer>
      </div>
    </div>
  );
}
