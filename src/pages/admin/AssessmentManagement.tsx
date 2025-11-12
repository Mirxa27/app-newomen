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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { db } from '@/db/api';
import { toast } from 'sonner';
import type { Assessment } from '@/types/types';

export default function AssessmentManagement() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personality' as 'personality' | 'relationships' | 'career' | 'wellness' | 'astrology',
    is_free: true,
  });

  useEffect(() => {
    loadAssessments();
  }, []);

  useEffect(() => {
    filterAssessments();
  }, [searchQuery, assessments]);

  const loadAssessments = async () => {
    try {
      const data = await db.assessments.list();
      setAssessments(data);
      setFilteredAssessments(data);
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const filterAssessments = () => {
    if (!searchQuery) {
      setFilteredAssessments(assessments);
      return;
    }

    const filtered = assessments.filter(
      (assessment) =>
        assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredAssessments(filtered);
  };

  const handleCreate = () => {
    setEditingAssessment(null);
    setFormData({
      title: '',
      description: '',
      category: 'personality',
      is_free: true,
    });
    setShowDialog(true);
  };

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setFormData({
      title: assessment.title,
      description: assessment.description || '',
      category: assessment.category,
      is_free: assessment.is_free,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingAssessment) {
        await db.assessments.update(editingAssessment.id, formData);
        toast.success('Assessment updated successfully');
      } else {
        await db.assessments.create({
          ...formData,
          questions: [],
          ai_prompt_template: null,
          created_by: null,
          is_active: true,
        });
        toast.success('Assessment created successfully');
      }
      setShowDialog(false);
      loadAssessments();
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('Failed to save assessment');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
      await db.assessments.delete(id);
      toast.success('Assessment deleted successfully');
      loadAssessments();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast.error('Failed to delete assessment');
    }
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
          <h1 className="text-4xl font-bold mb-2">Assessment Management</h1>
          <p className="text-muted-foreground">
            Create and manage assessments
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Assessments</CardTitle>
                <CardDescription>
                  Manage assessment content and settings
                </CardDescription>
              </div>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Assessments Table */}
            {loading ? (
              <div className="text-center py-8">Loading assessments...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No assessments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAssessments.map((assessment) => (
                        <TableRow key={assessment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{assessment.title}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {assessment.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{assessment.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={assessment.is_free ? 'default' : 'outline'}>
                              {assessment.is_free ? 'Free' : 'Premium'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(assessment.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(assessment)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(assessment.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAssessment ? 'Edit Assessment' : 'Create Assessment'}
              </DialogTitle>
              <DialogDescription>
                {editingAssessment
                  ? 'Update assessment details'
                  : 'Create a new assessment'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Assessment title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Assessment description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as 'personality' | 'relationships' | 'career' | 'wellness' | 'astrology' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personality">Personality</SelectItem>
                    <SelectItem value="wellness">Wellness</SelectItem>
                    <SelectItem value="relationships">Relationships</SelectItem>
                    <SelectItem value="career">Career</SelectItem>
                    <SelectItem value="astrology">Astrology</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_free"
                  checked={formData.is_free}
                  onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_free">Free Access</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingAssessment ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
