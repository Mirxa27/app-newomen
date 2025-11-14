import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ArrowLeft, Award, Eye } from 'lucide-react';
import { db } from '@/db/api';
import { toast } from 'sonner';
import type { Achievement } from '@/types/types';

export default function AchievementManagement() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadAchievements();
  }, []);

  useEffect(() => {
    filterAchievements();
  }, [searchQuery, achievements]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const data = await db.gamification.getAllAchievements();
      setAchievements(data);
      setFilteredAchievements(data);
    } catch (error) {
      console.error('Error loading achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const filterAchievements = () => {
    if (!searchQuery.trim()) {
      setFilteredAchievements(achievements);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = achievements.filter((achievement) =>
      achievement.name.toLowerCase().includes(query) ||
      achievement.description?.toLowerCase().includes(query) ||
      achievement.category?.toLowerCase().includes(query)
    );
    setFilteredAchievements(filtered);
  };

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      <div className="relative container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Achievement Management</h1>
          <p className="text-muted-foreground">
            View all available achievements and their statistics
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Achievements</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search achievements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading achievements...</div>
            ) : filteredAchievements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No achievements found matching your search' : 'No achievements yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Rarity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAchievements.map((achievement) => (
                      <TableRow key={achievement.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-primary" />
                            <span className="font-medium">{achievement.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {achievement.description || 'No description'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{achievement.category || 'general'}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{achievement.points || 0} XP</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              achievement.rarity === 'legendary'
                                ? 'default'
                                : achievement.rarity === 'epic'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {achievement.rarity || 'common'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAchievement(achievement);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievement Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedAchievement?.name || 'Achievement Details'}</DialogTitle>
              <DialogDescription>View full achievement information</DialogDescription>
            </DialogHeader>
            {selectedAchievement && (
              <div className="space-y-4 mt-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedAchievement.description || 'No description'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <Badge variant="secondary">{selectedAchievement.category || 'general'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Points</p>
                    <p className="text-sm font-medium">{selectedAchievement.points || 0} XP</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rarity</p>
                    <Badge
                      variant={
                        selectedAchievement.rarity === 'legendary'
                          ? 'default'
                          : selectedAchievement.rarity === 'epic'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {selectedAchievement.rarity || 'common'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">
                      {selectedAchievement.created_at
                        ? new Date(selectedAchievement.created_at).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

