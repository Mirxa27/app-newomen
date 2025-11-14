import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, Star } from 'lucide-react';
import { db } from '@/db/api';
import type { AiBehavior, BehaviorWithModel, AiModel } from '@/types/types';
import { toast } from 'sonner';

export default function AiBehaviors() {
  const [behaviors, setBehaviors] = useState<BehaviorWithModel[]>([]);
  const [models, setModels] = useState<AiModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBehavior, setEditingBehavior] = useState<AiBehavior | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    personality_traits: '{"empathy": 0.8, "curiosity": 0.7}',
    response_style: '{"tone": "warm", "formality": "casual"}',
    model_id: '',
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [behaviorsData, modelsData] = await Promise.all([
        db.aiBehaviors.listWithModel(),
        db.aiModels.list(),
      ]);
      setBehaviors(behaviorsData);
      setModels(modelsData.filter(m => m.is_active));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load behaviors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Behavior name is required');
      return;
    }

    if (!formData.system_prompt.trim()) {
      toast.error('System prompt is required');
      return;
    }

    try {
      // Validate JSON fields
      let personalityTraits: Record<string, unknown>;
      let responseStyle: Record<string, unknown>;
      
      try {
        personalityTraits = JSON.parse(formData.personality_traits);
      } catch (error) {
        toast.error('Invalid JSON in personality traits');
        return;
      }

      try {
        responseStyle = JSON.parse(formData.response_style);
      } catch (error) {
        toast.error('Invalid JSON in response style');
        return;
      }

      const behaviorData = {
        ...formData,
        personality_traits: personalityTraits,
        response_style: responseStyle,
        model_id: formData.model_id || null,
      };

      if (editingBehavior) {
        await db.aiBehaviors.update(editingBehavior.id, behaviorData);
        toast.success('Behavior updated successfully');
      } else {
        await db.aiBehaviors.create(behaviorData);
        toast.success('Behavior created successfully');
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving behavior:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save behavior';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (behavior: AiBehavior) => {
    setEditingBehavior(behavior);
    setFormData({
      name: behavior.name,
      description: behavior.description || '',
      system_prompt: behavior.system_prompt,
      personality_traits: JSON.stringify(behavior.personality_traits, null, 2),
      response_style: JSON.stringify(behavior.response_style, null, 2),
      model_id: behavior.model_id || '',
      is_active: behavior.is_active,
      is_default: behavior.is_default,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this behavior?')) {
      return;
    }

    try {
      await db.aiBehaviors.delete(id);
      toast.success('Behavior deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting behavior:', error);
      toast.error('Failed to delete behavior');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await db.aiBehaviors.setDefault(id);
      toast.success('Default behavior updated');
      loadData();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default behavior');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      system_prompt: '',
      personality_traits: '{"empathy": 0.8, "curiosity": 0.7}',
      response_style: '{"tone": "warm", "formality": "casual"}',
      model_id: '',
      is_active: true,
      is_default: false,
    });
    setEditingBehavior(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Behaviors</h1>
          <p className="text-muted-foreground">Manage AI personalities and behaviors</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Behavior
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBehavior ? 'Edit Behavior' : 'Add New Behavior'}</DialogTitle>
              <DialogDescription>
                Configure AI personality and response style
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Behavior Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Empathetic Coach"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model_id">Preferred Model (Optional)</Label>
                  <Select
                    value={formData.model_id}
                    onValueChange={(value) => setFormData({ ...formData, model_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.model_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this behavior"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="You are an empathetic AI companion..."
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This prompt defines the AI's personality and behavior
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personality_traits">Personality Traits (JSON)</Label>
                <Textarea
                  id="personality_traits"
                  value={formData.personality_traits}
                  onChange={(e) => setFormData({ ...formData, personality_traits: e.target.value })}
                  placeholder='{"empathy": 0.8, "curiosity": 0.7, "supportiveness": 0.9}'
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Values from 0 to 1 representing personality dimensions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="response_style">Response Style (JSON)</Label>
                <Textarea
                  id="response_style"
                  value={formData.response_style}
                  onChange={(e) => setFormData({ ...formData, response_style: e.target.value })}
                  placeholder='{"tone": "warm", "formality": "casual", "verbosity": "moderate"}'
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_default">Default behavior</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBehavior ? 'Update' : 'Create'} Behavior
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Behaviors</CardTitle>
          <CardDescription>
            {behaviors.length} behavior{behaviors.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {behaviors.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No behaviors configured yet
              </div>
            ) : (
              behaviors.map((behavior) => (
                <Card key={behavior.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{behavior.name}</CardTitle>
                          {behavior.is_default && (
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          )}
                          {behavior.is_active ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        {behavior.description && (
                          <CardDescription>{behavior.description}</CardDescription>
                        )}
                        {behavior.model && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Model: {behavior.model.model_name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!behavior.is_default && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSetDefault(behavior.id)}
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(behavior)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(behavior.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">System Prompt</Label>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {behavior.system_prompt}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Personality Traits</Label>
                          <pre className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded">
                            {JSON.stringify(behavior.personality_traits, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Response Style</Label>
                          <pre className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded">
                            {JSON.stringify(behavior.response_style, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
