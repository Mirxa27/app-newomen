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
import { Search, Plus, Edit, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import { db } from '@/db/api';
import { toast } from 'sonner';
import type { DivinationQuestion } from '@/types/types';

export default function DivinationManagement() {
  const [questions, setQuestions] = useState<DivinationQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<DivinationQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<DivinationQuestion | null>(null);
  const [formData, setFormData] = useState({
    question_text: '',
    description: '',
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [searchQuery, questions]);

  const loadQuestions = async () => {
    try {
      const data = await db.divinations.listQuestions();
      setQuestions(data);
      setFilteredQuestions(data);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load divination questions');
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = () => {
    if (!searchQuery) {
      setFilteredQuestions(questions);
      return;
    }

    const filtered = questions.filter(
      (question) =>
        question.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredQuestions(filtered);
  };

  const handleCreate = () => {
    setEditingQuestion(null);
    setFormData({
      question_text: '',
      description: '',
    });
    setShowDialog(true);
  };

  const handleEdit = (question: DivinationQuestion) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      description: question.category || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }

    try {
      if (editingQuestion) {
        await db.divinations.updateQuestion(editingQuestion.id, { question: formData.question_text, description: formData.description });
        toast.success('Question updated successfully');
      } else {
        await db.divinations.createQuestion({ question: formData.question_text, description: formData.description });
        toast.success('Question created successfully');
      }
      setShowDialog(false);
      loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await db.divinations.deleteQuestion(id);
      toast.success('Question deleted successfully');
      loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
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
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Divination Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage daily divination questions for users
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Questions</CardTitle>
                <CardDescription>
                  Create and manage divination questions
                </CardDescription>
              </div>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Question
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Questions Table */}
            {loading ? (
              <div className="text-center py-8">Loading questions...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No questions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQuestions.map((question) => (
                        <TableRow key={question.id}>
                          <TableCell>
                            <div className="font-medium max-w-md">
                              {question.question_text}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground max-w-xs line-clamp-2">
                              {question.category || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={question.is_active ? 'default' : 'secondary'}>
                              {question.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(question.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(question)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(question.id)}
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

            {/* Stats */}
            <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {filteredQuestions.length} of {questions.length} questions
              </div>
              <div className="flex gap-4">
                <div>
                  Active:{' '}
                  <span className="font-medium text-foreground">
                    {questions.filter((q) => q.is_active).length}
                  </span>
                </div>
                <div>
                  Inactive:{' '}
                  <span className="font-medium text-foreground">
                    {questions.filter((q) => !q.is_active).length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'Edit Question' : 'Create Question'}
              </DialogTitle>
              <DialogDescription>
                {editingQuestion
                  ? 'Update divination question details'
                  : 'Create a new divination question'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Enter the divination question"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="description">Category (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Question category or context"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingQuestion ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
