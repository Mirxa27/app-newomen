import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Settings, CheckCircle, Circle, Loader2, Trash2 } from 'lucide-react';
import { db } from '@/db/api';
import type { AiFunction, AiProvider, AiModelConfig, AiFunctionConfigWithRelations } from '@/types/types';
import { toast } from 'sonner';

export default function AiFunctionConfig() {
  const [functions, setFunctions] = useState<AiFunction[]>([]);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [models, setModels] = useState<AiModelConfig[]>([]);
  const [configs, setConfigs] = useState<AiFunctionConfigWithRelations[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<AiFunction | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AiFunctionConfigWithRelations | null>(null);

  const [formData, setFormData] = useState({
    function_id: '',
    provider_id: '',
    model_id: '',
    system_prompt: '',
    temperature: 0.7,
    max_tokens: 2000,
    additional_config: '{}',
    is_active: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedFunction) {
      loadConfigs(selectedFunction.id);
    }
  }, [selectedFunction]);

  useEffect(() => {
    if (formData.provider_id) {
      loadModelsByProvider(formData.provider_id);
    }
  }, [formData.provider_id]);

  const loadData = async () => {
    try {
      const [functionsData, providersData] = await Promise.all([
        db.aiMgmtFunctions.list(),
        db.aiMgmtProviders.list(),
      ]);
      setFunctions(functionsData);
      setProviders(providersData.filter(p => p.is_active));
      
      if (functionsData.length > 0) {
        setSelectedFunction(functionsData[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load AI functions');
    } finally {
      setLoading(false);
    }
  };

  const loadConfigs = async (functionId: string) => {
    try {
      const data = await db.aiMgmtFunctionConfigs.listByFunction(functionId);
      setConfigs(data);
    } catch (error) {
      console.error('Error loading configs:', error);
      toast.error('Failed to load configurations');
    }
  };

  const loadModelsByProvider = async (providerId: string) => {
    try {
      const data = await db.aiMgmtModels.listByProvider(providerId);
      setModels(data.filter(m => m.is_active));
    } catch (error) {
      console.error('Error loading models:', error);
      toast.error('Failed to load models');
    }
  };

  const handleOpenDialog = (config?: AiFunctionConfigWithRelations) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        function_id: config.function_id,
        provider_id: config.provider_id,
        model_id: config.model_id,
        system_prompt: config.system_prompt,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        additional_config: JSON.stringify(config.additional_config, null, 2),
        is_active: config.is_active,
      });
      loadModelsByProvider(config.provider_id);
    } else {
      setEditingConfig(null);
      setFormData({
        function_id: selectedFunction?.id || '',
        provider_id: '',
        model_id: '',
        system_prompt: '',
        temperature: 0.7,
        max_tokens: 2000,
        additional_config: '{}',
        is_active: false,
      });
      setModels([]);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.function_id) {
      toast.error('Function is required');
      return;
    }

    if (!formData.provider_id) {
      toast.error('Provider is required');
      return;
    }

    if (!formData.model_id) {
      toast.error('Model is required');
      return;
    }

    if (!formData.system_prompt.trim()) {
      toast.error('System prompt is required');
      return;
    }

    if (formData.temperature < 0 || formData.temperature > 2) {
      toast.error('Temperature must be between 0 and 2');
      return;
    }

    if (formData.max_tokens < 100 || formData.max_tokens > 32000) {
      toast.error('Max tokens must be between 100 and 32000');
      return;
    }

    try {
      let additionalConfig: Record<string, unknown> = {};
      try {
        additionalConfig = JSON.parse(formData.additional_config);
        if (typeof additionalConfig !== 'object' || Array.isArray(additionalConfig)) {
          toast.error('Additional config must be a JSON object');
          return;
        }
      } catch {
        toast.error('Invalid JSON in additional config');
        return;
      }

      const configData = {
        function_id: formData.function_id,
        provider_id: formData.provider_id,
        model_id: formData.model_id,
        system_prompt: formData.system_prompt,
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
        additional_config: additionalConfig,
        is_active: formData.is_active,
      };

      if (editingConfig) {
        await db.aiMgmtFunctionConfigs.update(editingConfig.id, configData);
        toast.success('Configuration updated successfully');
      } else {
        await db.aiMgmtFunctionConfigs.create(configData);
        toast.success('Configuration created successfully');
      }

      setDialogOpen(false);
      if (selectedFunction) {
        loadConfigs(selectedFunction.id);
      }
    } catch (error) {
      console.error('Error saving config:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration';
      toast.error(errorMessage);
    }
  };

  const handleSetActive = async (configId: string, functionId: string) => {
    try {
      await db.aiMgmtFunctionConfigs.setActive(configId, functionId);
      toast.success('Active configuration updated');
      loadConfigs(functionId);
    } catch (error) {
      console.error('Error setting active config:', error);
      toast.error('Failed to update active configuration');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      await db.aiMgmtFunctionConfigs.delete(id);
      toast.success('Configuration deleted successfully');
      if (selectedFunction) {
        loadConfigs(selectedFunction.id);
      }
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Failed to delete configuration');
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Function Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configure AI providers, models, and prompts for each function
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Function List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>AI Functions</CardTitle>
            <CardDescription>Select a function to configure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {functions.map((func) => (
              <Button
                key={func.id}
                variant={selectedFunction?.id === func.id ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setSelectedFunction(func)}
              >
                <Settings className="w-4 h-4 mr-2" />
                {func.display_name}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Configuration List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedFunction?.display_name || 'Select a Function'}</CardTitle>
                <CardDescription>{selectedFunction?.description}</CardDescription>
              </div>
              {selectedFunction && (
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Configuration
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedFunction ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Max Tokens</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No configurations found. Add one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    configs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetActive(config.id, config.function_id)}
                          >
                            {config.is_active ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{config.provider.name}</Badge>
                        </TableCell>
                        <TableCell>{config.model.display_name}</TableCell>
                        <TableCell>{config.temperature}</TableCell>
                        <TableCell>{config.max_tokens}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(config)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(config.id)}
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
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Select a function from the left to view and manage its configurations
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit Configuration' : 'Add Configuration'}
            </DialogTitle>
            <DialogDescription>
              Configure the AI provider, model, and behavior for this function
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">AI Provider</Label>
                <Select
                  value={formData.provider_id}
                  onValueChange={(value) => setFormData({ ...formData, provider_id: value, model_id: '' })}
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
                <Label htmlFor="model">Model</Label>
                <Select
                  value={formData.model_id}
                  onValueChange={(value) => setFormData({ ...formData, model_id: value })}
                  disabled={!formData.provider_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="system_prompt">System Prompt</Label>
              <Textarea
                id="system_prompt"
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                rows={6}
                placeholder="Enter the system prompt that defines the AI's behavior..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Controls randomness (0 = focused, 2 = creative)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_tokens">Max Tokens</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  min="100"
                  max="32000"
                  step="100"
                  value={formData.max_tokens}
                  onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum response length
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_config">Additional Configuration (JSON)</Label>
              <Textarea
                id="additional_config"
                value={formData.additional_config}
                onChange={(e) => setFormData({ ...formData, additional_config: e.target.value })}
                rows={4}
                placeholder='{"top_p": 1.0, "frequency_penalty": 0}'
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">Set as active configuration</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingConfig ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
