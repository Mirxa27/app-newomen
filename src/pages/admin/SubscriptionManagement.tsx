import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, ArrowLeft, Edit, DollarSign } from 'lucide-react';
import { db } from '@/db/api';
import { toast } from 'sonner';
import type { Profile, SubscriptionTier, SubscriptionStatus } from '@/types/types';

export default function SubscriptionManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    tier: 'free' as SubscriptionTier,
    status: 'active' as SubscriptionStatus,
    endDate: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const data = await db.profiles.listAll();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(
      (user) =>
        user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.subscription_tier.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredUsers(filtered);
  };

  const handleEdit = (user: Profile) => {
    setEditingUser(user);
    setFormData({
      tier: user.subscription_tier,
      status: user.subscription_status,
      endDate: user.subscription_end_date || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      await db.subscriptions.updateSubscription(
        editingUser.id,
        formData.tier,
        formData.status,
        formData.endDate || undefined
      );
      toast.success('Subscription updated successfully');
      setShowDialog(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  const getTierBadgeVariant = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free':
        return 'secondary';
      case 'discovery':
        return 'default';
      case 'growth':
        return 'default';
      case 'transformation':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trial':
        return 'secondary';
      case 'canceled':
        return 'outline';
      case 'expired':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const stats = {
    total: users.length,
    free: users.filter((u) => u.subscription_tier === 'free').length,
    discovery: users.filter((u) => u.subscription_tier === 'discovery').length,
    growth: users.filter((u) => u.subscription_tier === 'growth').length,
    transformation: users.filter((u) => u.subscription_tier === 'transformation').length,
    active: users.filter((u) => u.subscription_status === 'active').length,
    trial: users.filter((u) => u.subscription_status === 'trial').length,
  };

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      <div className="relative container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Subscription Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage user subscriptions and billing
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Free
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.free}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Discovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.discovery}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.growth}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Transform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.transformation}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trial}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Subscriptions</CardTitle>
            <CardDescription>
              View and manage user subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or tier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="text-center py-8">Loading subscriptions...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="font-medium">
                              {user.nickname || 'Anonymous'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {user.email || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTierBadgeVariant(user.subscription_tier)}>
                              {user.subscription_tier}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(user.subscription_status)}>
                              {user.subscription_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.subscription_start_date
                              ? new Date(user.subscription_start_date).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {user.subscription_end_date
                              ? new Date(user.subscription_end_date).toLocaleDateString()
                              : user.trial_end_date
                              ? `Trial: ${new Date(user.trial_end_date).toLocaleDateString()}`
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subscription</DialogTitle>
              <DialogDescription>
                Update subscription details for {editingUser?.nickname || 'user'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="tier">Subscription Tier</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value) => setFormData({ ...formData, tier: value as SubscriptionTier })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="discovery">Discovery</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="transformation">Transformation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as SubscriptionStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
