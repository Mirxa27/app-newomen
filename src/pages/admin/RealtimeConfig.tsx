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
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, CheckCircle, Circle, Loader2, Settings } from 'lucide-react';
import { db } from '@/db/api';
import type { RealtimeConfig, RealtimeConfigCreate, ApiProviderSafe } from '@/types/types';
import { toast } from 'sonner';
import { Link } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

const AVAILABLE_VOICES = [
  'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
];

// Realtime-specific models (these are OpenAI Realtime API models, not regular chat models)
const REALTIME_MODELS = [
  'gpt-realtime', // Most cost-effective realtime model
  'gpt-4o-mini-realtime-preview', // Cost-effective mini realtime model
  'gpt-4o-realtime-preview-2024-12-17', // Full model (more expensive)
];

export default function RealtimeConfig() {
  const [configs, setConfigs] = useState<RealtimeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<RealtimeConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'realtime' | 'transcription'>('realtime');
  const [openaiProvider, setOpenaiProvider] = useState<ApiProviderSafe | null>(null);
  const [checkingApiKey, setCheckingApiKey] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [availableModels, setAvailableModels] = useState<Array<{model_id: string; display_name: string; provider_name: string}>>([]);

  const [formData, setFormData] = useState<RealtimeConfigCreate>({
    config_name: '',
    config_type: 'realtime',
    is_active: false,
    model: 'gpt-realtime', // Using gpt-realtime as default (most cost-effective)
    instructions: '',
    audio_config: {
      input: {
        format: 'pcm16',
        sample_rate: 24000,
      },
      output: {
        format: 'pcm16',
        sample_rate: 24000,
        voice: 'alloy',
      },
    },
    transcription_config: {
      model: 'whisper-1',
      language: null,
      prompt: null,
    },
    turn_detection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500,
    },
    temperature: 0.8,
    max_response_output_tokens: 4096,
    tools: [],
    webhook_url: null,
    webhook_events_filter: [],
    enable_moderation: true,
    enable_audio_compression: true,
    description: null,
    metadata: {},
  });

  useEffect(() => {
    loadConfigs();
    checkOpenAIApiKey();
    loadAvailableModels();
  }, [activeTab]);

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
    } catch (error) {
      console.error('Error loading models:', error);
      // Keep realtime models as fallback
    }
  };

  const checkOpenAIApiKey = async () => {
    try {
      setCheckingApiKey(true);
      const providers = await db.apiProviders.list();
      const openai = providers.find(p => p.name.toLowerCase() === 'openai');
      setOpenaiProvider(openai || null);
    } catch (error) {
      console.error('Error checking OpenAI API key:', error);
    } finally {
      setCheckingApiKey(false);
    }
  };

  const loadConfigs = async () => {
    try {
      const allConfigs = await db.realtimeConfig.list();
      setConfigs(allConfigs.filter(c => c.config_type === activeTab));
    } catch (error: any) {
      console.error('Error loading configs:', error);
      // Handle case where table doesn't exist yet (migration not applied)
      if (error?.code === 'PGRST205' || error?.message?.includes('realtime_config')) {
        console.warn('realtime_config table not found. Please run migration 13_create_realtime_config.sql');
        setConfigs([]);
        setTableMissing(true);
        toast.warning('Realtime config table not found. Please apply database migrations.');
      } else {
        setTableMissing(false);
        toast.error('Failed to load configurations');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (config?: RealtimeConfig) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        config_name: config.config_name,
        config_type: config.config_type,
        is_active: config.is_active,
        model: config.model,
        instructions: config.instructions || '',
        audio_config: config.audio_config,
        transcription_config: config.transcription_config,
        turn_detection: config.turn_detection,
        temperature: config.temperature,
        max_response_output_tokens: config.max_response_output_tokens,
        tools: config.tools,
        webhook_url: config.webhook_url,
        webhook_events_filter: config.webhook_events_filter,
        enable_moderation: config.enable_moderation,
        enable_audio_compression: config.enable_audio_compression,
        description: config.description,
        metadata: config.metadata,
      });
    } else {
      setEditingConfig(null);
      setFormData({
        ...formData,
        config_name: '',
        config_type: activeTab,
        is_active: false,
        instructions: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.config_name.trim()) {
      toast.error('Configuration name is required');
      return;
    }

    if (!formData.model.trim()) {
      toast.error('Model is required');
      return;
    }

    if (formData.temperature < 0 || formData.temperature > 2) {
      toast.error('Temperature must be between 0 and 2');
      return;
    }

    if (formData.max_response_output_tokens < 100 || formData.max_response_output_tokens > 32000) {
      toast.error('Max response tokens must be between 100 and 32000');
      return;
    }

    try {
      if (editingConfig) {
        await db.realtimeConfig.update(editingConfig.id, formData);
        toast.success('Configuration updated successfully');
      } else {
        await db.realtimeConfig.create(formData);
        toast.success('Configuration created successfully');
      }

      setDialogOpen(false);
      loadConfigs();
    } catch (error) {
      console.error('Error saving config:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration';
      toast.error(errorMessage);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await db.realtimeConfig.setActive(id, activeTab);
      toast.success('Active configuration updated');
      loadConfigs();
    } catch (error) {
      console.error('Error setting active config:', error);
      toast.error('Failed to update active configuration');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      await db.realtimeConfig.delete(id);
      toast.success('Configuration deleted successfully');
      loadConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Failed to delete configuration');
    }
  };

  const updateFormData = (path: string[], value: unknown) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
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
          <h1 className="text-3xl font-bold">OpenAI Realtime & Transcription Config</h1>
          <p className="text-muted-foreground mt-2">
            Configure OpenAI Realtime API and Transcription API settings
          </p>
        </div>
      </div>

      {/* Table Missing Alert */}
      {tableMissing && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Table Missing</AlertTitle>
          <AlertDescription>
            The <code className="text-xs bg-muted px-1 py-0.5 rounded">realtime_config</code> table does not exist. 
            Please run the database migration <code className="text-xs bg-muted px-1 py-0.5 rounded">13_create_realtime_config.sql</code> to create this table.
          </AlertDescription>
        </Alert>
      )}

      {/* API Key Status Alert */}
      {!checkingApiKey && !tableMissing && (
        <Alert variant={openaiProvider?.has_api_key ? 'default' : 'destructive'}>
          {openaiProvider?.has_api_key ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>OpenAI API Key Configured</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>Your OpenAI API key is configured and ready to use.</span>
                <Link to="/admin/api-providers" className="text-primary hover:underline flex items-center gap-1">
                  Manage API Key <ExternalLink className="w-3 h-3" />
                </Link>
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>OpenAI API Key Required</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>You need to configure your OpenAI API key to use Realtime Voice Chat and Transcription features.</span>
                <Link to="/admin/api-providers" className="text-primary hover:underline flex items-center gap-1">
                  Configure Now <ExternalLink className="w-3 h-3" />
                </Link>
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'realtime' | 'transcription')}>
        <TabsList>
          <TabsTrigger value="realtime">Realtime Voice Chat</TabsTrigger>
          <TabsTrigger value="transcription">Transcription</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Realtime Voice Chat Configurations</CardTitle>
                  <CardDescription>
                    Configure speech-to-speech realtime conversations
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Configuration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Voice</TableHead>
                    <TableHead>Temperature</TableHead>
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
                            onClick={() => handleSetActive(config.id)}
                          >
                            {config.is_active ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{config.config_name}</TableCell>
                        <TableCell>{config.model}</TableCell>
                        <TableCell>
                          {config.audio_config?.output?.voice || 'N/A'}
                        </TableCell>
                        <TableCell>{config.temperature}</TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcription" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transcription Configurations</CardTitle>
                  <CardDescription>
                    Configure real-time audio transcription settings
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Configuration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Transcription Model</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
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
                            onClick={() => handleSetActive(config.id)}
                          >
                            {config.is_active ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{config.config_name}</TableCell>
                        <TableCell>{config.model}</TableCell>
                        <TableCell>
                          {config.transcription_config?.model || 'N/A'}
                        </TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit Configuration' : 'Add Configuration'}
            </DialogTitle>
            <DialogDescription>
              Configure OpenAI {activeTab === 'realtime' ? 'Realtime' : 'Transcription'} API settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="config_name">Configuration Name</Label>
                <Input
                  id="config_name"
                  value={formData.config_name}
                  onChange={(e) => setFormData({ ...formData, config_name: e.target.value })}
                  placeholder="e.g., Default Realtime Chat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => setFormData({ ...formData, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Realtime-specific models (OpenAI Realtime API) */}
                    {REALTIME_MODELS.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model} (Realtime)
                      </SelectItem>
                    ))}
                    {/* All configured models from database */}
                    {availableModels.map((model) => (
                      <SelectItem key={model.model_id} value={model.model_id}>
                        {model.display_name} ({model.provider_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions / System Prompt</Label>
              <Textarea
                id="instructions"
                value={formData.instructions || ''}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={6}
                placeholder="Enter system instructions for the AI..."
              />
            </div>

            {activeTab === 'realtime' && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Audio Configuration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="input_format">Input Format</Label>
                      <Select
                        value={formData.audio_config?.input?.format || 'pcm16'}
                        onValueChange={(value) => updateFormData(['audio_config', 'input', 'format'], value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcm16">PCM16</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="input_sample_rate">Input Sample Rate</Label>
                      <Input
                        id="input_sample_rate"
                        type="number"
                        value={formData.audio_config?.input?.sample_rate || 24000}
                        onChange={(e) => updateFormData(['audio_config', 'input', 'sample_rate'], parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="output_format">Output Format</Label>
                      <Select
                        value={formData.audio_config?.output?.format || 'pcm16'}
                        onValueChange={(value) => updateFormData(['audio_config', 'output', 'format'], value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcm16">PCM16</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="output_voice">Output Voice</Label>
                      <Select
                        value={formData.audio_config?.output?.voice || 'alloy'}
                        onValueChange={(value) => updateFormData(['audio_config', 'output', 'voice'], value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_VOICES.map((voice) => (
                            <SelectItem key={voice} value={voice}>
                              {voice}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Turn Detection</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="turn_detection_type">Type</Label>
                      <Select
                        value={formData.turn_detection?.type || 'server_vad'}
                        onValueChange={(value) => updateFormData(['turn_detection', 'type'], value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="server_vad">Server VAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="threshold">Threshold</Label>
                      <Input
                        id="threshold"
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={formData.turn_detection?.threshold || 0.5}
                        onChange={(e) => updateFormData(['turn_detection', 'threshold'], parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prefix_padding_ms">Prefix Padding (ms)</Label>
                      <Input
                        id="prefix_padding_ms"
                        type="number"
                        value={formData.turn_detection?.prefix_padding_ms || 300}
                        onChange={(e) => updateFormData(['turn_detection', 'prefix_padding_ms'], parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="silence_duration_ms">Silence Duration (ms)</Label>
                      <Input
                        id="silence_duration_ms"
                        type="number"
                        value={formData.turn_detection?.silence_duration_ms || 500}
                        onChange={(e) => updateFormData(['turn_detection', 'silence_duration_ms'], parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'transcription' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Transcription Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transcription_model">Transcription Model</Label>
                    <Select
                      value={formData.transcription_config?.model || 'whisper-1'}
                      onValueChange={(value) => updateFormData(['transcription_config', 'model'], value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whisper-1">Whisper-1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transcription_language">Language (optional)</Label>
                    <Input
                      id="transcription_language"
                      value={formData.transcription_config?.language || ''}
                      onChange={(e) => updateFormData(['transcription_config', 'language'], e.target.value || null)}
                      placeholder="e.g., en, es, fr"
                    />
                  </div>
                </div>
              </div>
            )}

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
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_tokens">Max Response Tokens</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  min="100"
                  max="32000"
                  value={formData.max_response_output_tokens}
                  onChange={(e) => setFormData({ ...formData, max_response_output_tokens: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook_url">Webhook URL (optional)</Label>
              <Input
                id="webhook_url"
                type="url"
                value={formData.webhook_url || ''}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value || null })}
                placeholder="https://your-server.com/webhook"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable_moderation">Enable Moderation</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable content moderation for safety
                  </p>
                </div>
                <Switch
                  id="enable_moderation"
                  checked={formData.enable_moderation}
                  onCheckedChange={(checked) => setFormData({ ...formData, enable_moderation: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable_audio_compression">Enable Audio Compression</Label>
                  <p className="text-xs text-muted-foreground">
                    Compress audio to reduce bandwidth
                  </p>
                </div>
                <Switch
                  id="enable_audio_compression"
                  checked={formData.enable_audio_compression}
                  onCheckedChange={(checked) => setFormData({ ...formData, enable_audio_compression: checked })}
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

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                rows={2}
                placeholder="Brief description of this configuration..."
              />
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

