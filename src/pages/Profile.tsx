import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Upload, Save, Brain, Sparkles } from 'lucide-react';
import { db } from '@/db/api';
import { toast } from 'sonner';
import MemoryTimeline from '@/components/memory/MemoryTimeline';
import { calculateAstrologyChart, formatZodiacSign, getZodiacElementEmoji, getZodiacTraits } from '@/lib/astrology';

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [birthDate, setBirthDate] = useState(profile?.birth_date || '');
  const [birthLocation, setBirthLocation] = useState(profile?.birth_location || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!profile) return;

    // Validation
    if (!nickname.trim()) {
      toast.error('Nickname is required');
      return;
    }

    if (nickname.length > 50) {
      toast.error('Nickname must be less than 50 characters');
      return;
    }

    if (birthDate) {
      const birthDateObj = new Date(birthDate);
      const today = new Date();
      if (birthDateObj > today) {
        toast.error('Birth date cannot be in the future');
        return;
      }
      if (birthDateObj < new Date('1900-01-01')) {
        toast.error('Birth date must be after 1900');
        return;
      }
    }

    try {
      setSaving(true);
      
      const updates: Record<string, unknown> = {
        nickname: nickname.trim(),
        birth_date: birthDate || null,
        birth_location: birthLocation?.trim() || null,
      };

      // Calculate zodiac signs if birth date is provided
      if (birthDate) {
        try {
          const astrologyChart = calculateAstrologyChart({
            birthDate,
            birthTime: profile.birth_time || undefined,
            birthLocation: birthLocation || undefined,
          });

          updates.sun_sign = astrologyChart.sunSign;
          updates.moon_sign = astrologyChart.moonSign;
          updates.rising_sign = astrologyChart.risingSign;
        } catch (error) {
          console.error('Error calculating astrology chart:', error);
          // Don't fail the entire save if astrology calculation fails
        }
      }

      await db.profiles.update(profile.id, updates);
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      setUploading(true);
      const avatarUrl = await db.storage.uploadAvatar(profile.id, file);
      await db.profiles.update(profile.id, { avatar_url: avatarUrl });
      await refreshProfile();
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Signed out successfully');
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Profile & Settings</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-4xl">
                    {profile.nickname?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="avatar-upload"
                  onChange={handleAvatarUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Change Avatar'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card xl:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="How should NewMe call you?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth-date">Birth Date</Label>
                <Input
                  id="birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth-location">Birth Location</Label>
                <Input
                  id="birth-location"
                  value={birthLocation}
                  onChange={(e) => setBirthLocation(e.target.value)}
                  placeholder="City, Country"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full cosmic-gradient"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle>Astrology Profile</CardTitle>
            </div>
            <CardDescription>
              Your cosmic blueprint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Sun Sign</p>
                <p className="text-lg font-semibold">
                  {profile.sun_sign ? formatZodiacSign(profile.sun_sign) : 'Not set'}
                </p>
                {profile.sun_sign && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {getZodiacElementEmoji(getZodiacTraits(profile.sun_sign).element)} {getZodiacTraits(profile.sun_sign).element}
                  </p>
                )}
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Moon Sign</p>
                <p className="text-lg font-semibold">
                  {profile.moon_sign ? formatZodiacSign(profile.moon_sign) : 'Not set'}
                </p>
                {profile.moon_sign && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {getZodiacElementEmoji(getZodiacTraits(profile.moon_sign).element)} {getZodiacTraits(profile.moon_sign).element}
                  </p>
                )}
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Rising Sign</p>
                <p className="text-lg font-semibold">
                  {profile.rising_sign ? formatZodiacSign(profile.rising_sign) : 'Not set'}
                </p>
                {profile.rising_sign && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {getZodiacElementEmoji(getZodiacTraits(profile.rising_sign).element)} {getZodiacTraits(profile.rising_sign).element}
                  </p>
                )}
              </div>
            </div>
            {profile.sun_sign && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                <p className="text-sm font-medium mb-2">Your Sun Sign Traits</p>
                <div className="flex flex-wrap gap-1">
                  {getZodiacTraits(profile.sun_sign).traits.slice(0, 4).map((trait, index) => (
                    <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              {profile.birth_date 
                ? 'Your astrology chart is calculated based on your birth information'
                : 'Complete your birth information to calculate your full astrology chart'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <CardTitle>Memory Timeline</CardTitle>
            </div>
            <CardDescription>
              Your journey of self-discovery captured over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="all">All Memories</TabsTrigger>
              </TabsList>
              <TabsContent value="recent" className="mt-6">
                <MemoryTimeline userId={profile.id} limit={10} />
              </TabsContent>
              <TabsContent value="all" className="mt-6">
                <MemoryTimeline userId={profile.id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="glass-card mt-6 border-destructive/50">
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
