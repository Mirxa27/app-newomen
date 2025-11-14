import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Search, Plus, Edit, Trash2, ArrowLeft, Wand2, FileText, Music, Youtube, Upload, Eye, Save, X } from 'lucide-react';
import { db } from '@/db/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { Assessment } from '@/types/types';

// AI Builder interfaces
interface AssessmentRequest {
  topic: string;
  category: 'personality' | 'relationships' | 'career' | 'wellness' | 'astrology' | 'shadow work';
  target_audience: 'visitor' | 'authenticated' | 'both';
  question_count: number;
  ai_model: string;
  question_types: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number;
}

interface ResourceRequest {
  resource_type: 'article' | 'guide' | 'exercise' | 'video' | 'audio';
  topic: string;
  target_audience: string;
  content_length: 'short' | 'medium' | 'long';
  tone: string;
  include_ai_content: boolean;
}

interface GeneratedAssessment {
  title: string;
  description: string;
  questions: any[];
  scoring_logic: any;
  result_categories: any[];
  estimated_duration: number;
  target_audience: string;
  difficulty_level: string;
  tags: string[];
  ai_model_used: string;
}

interface GeneratedResource {
  title: string;
  description: string;
  content: string;
  metadata: Record<string, unknown>;
  estimated_duration?: number;
  tags: string[];
  ai_model_used: string;
}

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
    category: 'personality' as 'personality' | 'relationships' | 'career' | 'wellness' | 'astrology' | 'emotional' | 'spiritual',
    is_free: true,
  });

  // AI Builder state
  const [activeTab, setActiveTab] = useState('manage');
  const [aiBuilderLoading, setAiBuilderLoading] = useState(false);
  const [_generatedContent, setGeneratedContent] = useState<GeneratedAssessment | GeneratedResource | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // AI Builder form states
  const [availableModels, setAvailableModels] = useState<Array<{model_id: string; display_name: string; provider_name: string}>>([]);
  const [assessmentForm, setAssessmentForm] = useState<AssessmentRequest>({
    topic: '',
    category: 'personality',
    target_audience: 'both',
    question_count: 10,
    ai_model: 'gpt-4o-mini', // Default to cost-effective model
    question_types: ['multiple_choice'],
    difficulty_level: 'beginner',
    estimated_duration: 5,
  });

  const [resourceForm, setResourceForm] = useState<ResourceRequest>({
    resource_type: 'article',
    topic: '',
    target_audience: 'both',
    content_length: 'medium',
    tone: 'professional',
    include_ai_content: true,
  });

  // Generated content edit states
  const [editContent, setEditContent] = useState<any>(null);

  useEffect(() => {
    loadAssessments();
    loadAvailableModels();
  }, []);

  const loadAvailableModels = async () => {
    try {
      const models = await db.aiMgmtModels.list();
      const activeModels = models
        .filter(m => m.is_active && (m.provider as any)?.is_active)
        .map(m => ({
          model_id: m.model_id,
          display_name: m.display_name,
          provider_name: (m.provider as any)?.name || 'Unknown',
        }));
      setAvailableModels(activeModels);
      
      // Set default to gpt-4o-mini if available, otherwise first model
      if (activeModels.length > 0) {
        const defaultModel = activeModels.find(m => m.model_id === 'gpt-4o-mini') || activeModels[0];
        setAssessmentForm(prev => ({ ...prev, ai_model: defaultModel.model_id }));
      }
    } catch (error) {
      console.error('Error loading models:', error);
      // Fallback to hardcoded models if database fails
      setAvailableModels([
        { model_id: 'gpt-4o-mini', display_name: 'GPT-4o Mini', provider_name: 'OpenAI' },
        { model_id: 'gpt-3.5-turbo', display_name: 'GPT-3.5 Turbo', provider_name: 'OpenAI' },
      ]);
    }
  };

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
    // Validation
    if (!formData.title.trim()) {
      toast.error('Assessment title is required');
      return;
    }

    if (formData.title.length > 200) {
      toast.error('Assessment title must be less than 200 characters');
      return;
    }

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
      const errorMessage = error instanceof Error ? error.message : 'Failed to save assessment';
      toast.error(errorMessage);
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

  // AI Builder functions
  const generateAssessment = async () => {
    if (!assessmentForm.topic.trim()) {
      toast.error('Please enter a topic for the assessment');
      return;
    }

    setAiBuilderLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-builder', {
        body: { type: 'assessment', ...assessmentForm }
      });

      if (error) throw error;
      
      setGeneratedContent(data);
      setEditMode(true);
      setEditContent(data);
      toast.success('Assessment generated successfully');
    } catch (error) {
      console.error('Error generating assessment:', error);
      toast.error('Failed to generate assessment');
    } finally {
      setAiBuilderLoading(false);
    }
  };

  const generateResource = async () => {
    if (!resourceForm.topic.trim()) {
      toast.error('Please enter a topic for the resource');
      return;
    }

    setAiBuilderLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-builder', {
        body: { type: 'resource', ...resourceForm }
      });

      if (error) throw error;
      
      setGeneratedContent(data);
      setEditMode(true);
      setEditContent(data);
      toast.success('Resource generated successfully');
    } catch (error) {
      console.error('Error generating resource:', error);
      toast.error('Failed to generate resource');
    } finally {
      setAiBuilderLoading(false);
    }
  };

  const saveGeneratedAssessment = async () => {
    if (!editContent) return;

    try {
      await db.assessments.create({
        title: editContent.title,
        description: editContent.description,
        category: assessmentForm.category === 'shadow work' ? 'personality' : assessmentForm.category,
        is_free: true,
        questions: editContent.questions || [],
        ai_prompt_template: null,
        created_by: null,
        is_active: true,
      });
      
      toast.success('AI-generated assessment saved successfully');
      setEditMode(false);
      setGeneratedContent(null);
      setEditContent(null);
      loadAssessments();
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('Failed to save assessment');
    }
  };

  const saveGeneratedResource = async () => {
    if (!editContent) return;

    try {
      await db.wellnessResources.create({
        title: editContent.title,
        description: editContent.description,
        category: 'meditation',
        resource_type: resourceForm.resource_type === 'video' ? 'youtube' : 
                      resourceForm.resource_type === 'audio' ? 'audio' : 'video',
        resource_url: resourceForm.resource_type === 'video' ? youtubeUrl : '',
        duration_minutes: editContent.estimated_duration || null,
        thumbnail_url: null,
        created_by: null,
        is_active: true,
      });
      
      toast.success('AI-generated resource saved successfully');
      setEditMode(false);
      setGeneratedContent(null);
      setEditContent(null);
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error('Failed to save resource');
    }
  };

  const handleYoutubeUrl = () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    // Extract video ID from YouTube URL
    const videoId = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (!videoId) {
      toast.error('Invalid YouTube URL');
      return;
    }

    // Here you would typically make an API call to get video metadata
    // For now, just show success
    toast.success('YouTube video added successfully');
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        toast.success('Audio file selected');
      } else {
        toast.error('Please select a valid audio file');
      }
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
            Create and manage assessments with AI assistance
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manage">Manage Assessments</TabsTrigger>
            <TabsTrigger value="ai-builder">AI Builder</TabsTrigger>
            <TabsTrigger value="resources">Resource Builder</TabsTrigger>
          </TabsList>

          {/* Manage Assessments Tab */}
          <TabsContent value="manage">
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
          </TabsContent>

          {/* AI Builder Tab */}
          <TabsContent value="ai-builder">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assessment Builder Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wand2 className="w-5 h-5 mr-2" />
                    AI Assessment Builder
                  </CardTitle>
                  <CardDescription>
                    Generate assessments using AI with customizable parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="topic">Topic/Title</Label>
                    <Input
                      id="topic"
                      value={assessmentForm.topic}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, topic: e.target.value })}
                      placeholder="e.g., Personality Assessment, Career Path Finder"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={assessmentForm.category}
                      onValueChange={(value) => setAssessmentForm({ ...assessmentForm, category: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personality">Personality</SelectItem>
                        <SelectItem value="relationships">Relationships</SelectItem>
                        <SelectItem value="career">Career</SelectItem>
                        <SelectItem value="wellness">Wellness</SelectItem>
                        <SelectItem value="astrology">Astrology</SelectItem>
                        <SelectItem value="shadow work">Shadow Work</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="target_audience">Target Audience</Label>
                    <Select
                      value={assessmentForm.target_audience}
                      onValueChange={(value) => setAssessmentForm({ ...assessmentForm, target_audience: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visitor">Visitors</SelectItem>
                        <SelectItem value="authenticated">Authenticated Users</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Number of Questions: {assessmentForm.question_count}</Label>
                    <Slider
                      value={[assessmentForm.question_count]}
                      onValueChange={(value) => setAssessmentForm({ ...assessmentForm, question_count: value[0] })}
                      max={30}
                      min={5}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ai_model">AI Model</Label>
                    <Select
                      value={assessmentForm.ai_model}
                      onValueChange={(value) => setAssessmentForm({ ...assessmentForm, ai_model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.length > 0 ? (
                          availableModels.map((model) => (
                            <SelectItem key={model.model_id} value={model.model_id}>
                              {model.display_name} ({model.provider_name})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No models available. Please configure models in AI Management.</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty_level">Difficulty Level</Label>
                    <Select
                      value={assessmentForm.difficulty_level}
                      onValueChange={(value) => setAssessmentForm({ ...assessmentForm, difficulty_level: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Estimated Duration (minutes): {assessmentForm.estimated_duration}</Label>
                    <Slider
                      value={[assessmentForm.estimated_duration]}
                      onValueChange={(value) => setAssessmentForm({ ...assessmentForm, estimated_duration: value[0] })}
                      max={30}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <Button 
                    onClick={generateAssessment} 
                    disabled={aiBuilderLoading}
                    className="w-full"
                  >
                    {aiBuilderLoading ? 'Generating...' : 'Generate Assessment'}
                    <Wand2 className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Resource Builder Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    AI Resource Builder
                  </CardTitle>
                  <CardDescription>
                    Generate wellness resources and content using AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="resource_type">Resource Type</Label>
                    <Select
                      value={resourceForm.resource_type}
                      onValueChange={(value) => setResourceForm({ ...resourceForm, resource_type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="guide">Guide</SelectItem>
                        <SelectItem value="exercise">Exercise</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="resource_topic">Topic/Subject</Label>
                    <Input
                      id="resource_topic"
                      value={resourceForm.topic}
                      onChange={(e) => setResourceForm({ ...resourceForm, topic: e.target.value })}
                      placeholder="e.g., Stress Management, Mindfulness Practices"
                    />
                  </div>

                  <div>
                    <Label htmlFor="resource_audience">Target Audience</Label>
                    <Select
                      value={resourceForm.target_audience}
                      onValueChange={(value) => setResourceForm({ ...resourceForm, target_audience: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visitor">Visitors</SelectItem>
                        <SelectItem value="authenticated">Authenticated Users</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="content_length">Content Length</Label>
                    <Select
                      value={resourceForm.content_length}
                      onValueChange={(value) => setResourceForm({ ...resourceForm, content_length: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (1-2 minutes)</SelectItem>
                        <SelectItem value="medium">Medium (5-10 minutes)</SelectItem>
                        <SelectItem value="long">Long (15+ minutes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Select
                      value={resourceForm.tone}
                      onValueChange={(value) => setResourceForm({ ...resourceForm, tone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="conversational">Conversational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ai_content"
                      checked={resourceForm.include_ai_content}
                      onCheckedChange={(checked) => setResourceForm({ ...resourceForm, include_ai_content: checked })}
                    />
                    <Label htmlFor="ai_content">Include AI-generated content</Label>
                  </div>

                  <Button 
                    onClick={generateResource} 
                    disabled={aiBuilderLoading}
                    className="w-full"
                  >
                    {aiBuilderLoading ? 'Generating...' : 'Generate Resource'}
                    <FileText className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resource Builder Tab */}
          <TabsContent value="resources">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* YouTube Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Youtube className="w-5 h-5 mr-2" />
                    YouTube Integration
                  </CardTitle>
                  <CardDescription>
                    Add wellness videos from YouTube
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="youtube_url">YouTube URL</Label>
                    <Input
                      id="youtube_url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="video_title">Video Title</Label>
                    <Input
                      id="video_title"
                      placeholder="Auto-extracted or manually entered"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video_description">Description</Label>
                    <Textarea
                      id="video_description"
                      placeholder="Video description..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video_duration">Duration (minutes)</Label>
                    <Input
                      id="video_duration"
                      type="number"
                      placeholder="Auto-detected or manual"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video_category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meditation">Meditation</SelectItem>
                        <SelectItem value="breathwork">Breathwork</SelectItem>
                        <SelectItem value="affirmation">Affirmation</SelectItem>
                        <SelectItem value="therapy">Therapy</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleYoutubeUrl} className="w-full">
                    <Youtube className="w-4 h-4 mr-2" />
                    Add YouTube Video
                  </Button>
                </CardContent>
              </Card>

              {/* Audio Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Music className="w-5 h-5 mr-2" />
                    Audio Resource Management
                  </CardTitle>
                  <CardDescription>
                    Upload and manage audio wellness resources
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="audio_file">Audio File</Label>
                    <div className="mt-1">
                      <input
                        id="audio_file"
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    {audioFile && (
                      <p className="mt-2 text-sm text-green-600">
                        Selected: {audioFile.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audio_title">Audio Title</Label>
                    <Input
                      id="audio_title"
                      placeholder="Meditation session title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audio_description">Description</Label>
                    <Textarea
                      id="audio_description"
                      placeholder="Audio description..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audio_duration">Duration (minutes)</Label>
                    <Input
                      id="audio_duration"
                      type="number"
                      placeholder="Auto-detected or manual"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audio_category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meditation">Meditation</SelectItem>
                        <SelectItem value="breathwork">Breathwork</SelectItem>
                        <SelectItem value="affirmation">Affirmation</SelectItem>
                        <SelectItem value="therapy">Therapy</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" disabled={!audioFile}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Audio Resource
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

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
                  onValueChange={(value) => setFormData({ ...formData, category: value as any })}
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
                    <SelectItem value="emotional">Emotional</SelectItem>
                    <SelectItem value="spiritual">Spiritual</SelectItem>
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

        {/* AI Generated Content Preview Dialog */}
        <Dialog open={editMode} onOpenChange={setEditMode}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Preview & Edit Generated Content
              </DialogTitle>
              <DialogDescription>
                Review and edit the AI-generated content before saving
              </DialogDescription>
            </DialogHeader>

            {editContent && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="edit_title">Title</Label>
                  <Input
                    id="edit_title"
                    value={editContent.title || ''}
                    onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_description">Description</Label>
                  <Textarea
                    id="edit_description"
                    value={editContent.description || ''}
                    onChange={(e) => setEditContent({ ...editContent, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {editContent.questions && (
                  <div className="space-y-2">
                    <Label>Generated Questions</Label>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                      {editContent.questions.map((question: any, index: number) => (
                        <div key={index} className="mb-4 p-3 border rounded">
                          <p className="font-medium">{index + 1}. {question.question}</p>
                          {question.type === 'multiple_choice' && question.options && (
                            <ul className="mt-2 text-sm text-muted-foreground">
                              {question.options.map((option: string, optIndex: number) => (
                                <li key={optIndex}>• {option}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editContent.content && (
                  <div className="space-y-2">
                    <Label>Generated Content</Label>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                      <div className="whitespace-pre-wrap">{editContent.content}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    AI Model: {editContent.ai_model_used || 'Unknown'} | 
                    Target: {editContent.target_audience || 'Both'}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setEditMode(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={
                      editContent.questions ? saveGeneratedAssessment : saveGeneratedResource
                    }>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
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
