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
import type { AiModel, ModelWithProvider, ApiProviderSafe, ModelType } from '@/types/types';
import { toast } from 'sonner';

export default function AiModels() {
  const [models, setModels] = useState<ModelWithProvider[]>([]);
  const [providers, setProviders] = useState<ApiProviderSafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AiModel | null>(null);

  const [formData, setFormData] = useState({
    provider_id: '',
    model_id: '',
    model_name: '',
    model_type: 'chat' as ModelType,
    capabilities: '{}',
    parameters: '{"temperature": 0.7, "max_tokens": 2000}',
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [modelsData, providersData] = await Promise.all([
        db.aiModels.listWithProvider(),
        db.apiProviders.list(),
      ]);
      setModels(modelsData);
      setProviders(providersData.filter(p => p.type === 'ai_chat'));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const modelData = {
        ...formData,
        capabilities: JSON.parse(formData.capabilities),
        parameters: JSON.parse(formData.parameters),
      };

      if (editingModel) {
        await db.aiModels.update(editingModel.id, modelData);
        toast.success('Model updated successfully');
      } else {
        await db.aiModels.create(modelData);
        toast.success('Model created successfully');
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving model:', error);
      toast.error('Failed to save model');
    }
  };

  const handleEdit = (model: AiModel) => {
    setEditingModel(model);
    setFormData({
      provider_id: model.provider_id,
      model_id: model.model_id,
      model_name: model.model_name,
      model_type: model.model_type,
      capabilities: JSON.stringify(model.capabilities, null, 2),
      parameters: JSON.stringify(model.parameters, null, 2),
      is_active: model.is_active,
      is_default: model.is_default,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model?')) {
      return;
    }

    try {
      await db.aiModels.delete(id);
      toast.success('Model deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting model:', error);
      toast.error('Failed to delete model');
    }
  };

  const handleSetDefault = async (id: string, modelType: string) => {
    try {
      await db.aiModels.setDefault(id, modelType);
      toast.success('Default model updated');
      loadData();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default model');
    }
  };

  const resetForm = () => {
    setFormData({
      provider_id: '',
      model_id: '',
      model_name: '',
      model_type: 'chat',
      capabilities: '{}',
      parameters: '{"temperature": 0.7, "max_tokens": 2000}',
      is_active: true,
      is_default: false,
    });
    setEditingModel(null);
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
          <h1 className="text-3xl font-bold">AI Models</h1>
          <p className="text-muted-foreground">Manage available AI models</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingModel ? 'Edit Model' : 'Add New Model'}</DialogTitle>
              <DialogDescription>
                Configure AI model settings and parameters
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider_id">Provider</Label>
                  <Select
                    value={formData.provider_id}
                    onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model_type">Model Type</Label>
                  <Select
                    value={formData.model_type}
                    onValueChange={(value) => setFormData({ ...formData, model_type: value as ModelType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="completion">Completion</SelectItem>
                      <SelectItem value="embedding">Embedding</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model_id">Model ID</Label>
                  <Input
                    id="model_id"
                    value={formData.model_id}
                    onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                    placeholder="e.g., gpt-4"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model_name">Display Name</Label>
                  <Input
                    id="model_name"
                    value={formData.model_name}
                    onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                    placeholder="e.g., GPT-4"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capabilities">Capabilities (JSON)</Label>
                <Textarea
                  id="capabilities"
                  value={formData.capabilities}
                  onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
                  placeholder='{"streaming": true, "functions": true}'
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parameters">Default Parameters (JSON)</Label>
                <Textarea
                  id="parameters"
                  value={formData.parameters}
                  onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
                  placeholder='{"temperature": 0.7, "max_tokens": 2000}'
                  rows={4}
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
                  <Label htmlFor="is_default">Default for this type</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingModel ? 'Update' : 'Create'} Model
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
          <CardDescription>
            {models.length} model{models.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No models configured yet
                  </TableCell>
                </TableRow>
              ) : (
                models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{model.model_name}</div>
                        <div className="text-sm text-muted-foreground">{model.model_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{model.provider?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge>{model.model_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {model.is_active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {model.is_default ? (
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetDefault(model.id, model.model_type)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(model)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(model.id)}
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
        </CardContent>
      </Card>
    </div>
  );
}
