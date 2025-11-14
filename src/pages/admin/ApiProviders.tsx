import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Loader2, RefreshCw, Download } from 'lucide-react';
import { db } from '@/db/api';
import type { ApiProvider, ApiProviderSafe, ProviderType } from '@/types/types';
import { toast } from 'sonner';

// Helper function to check if provider supports voice fetching
const supportsVoiceFetching = (providerName: string): boolean => {
  const nameLower = providerName.toLowerCase();
  return nameLower.includes('openai') || 
         nameLower.includes('google') || 
         nameLower.includes('elevenlabs');
};

export default function ApiProviders() {
  const [providers, setProviders] = useState<ApiProviderSafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ApiProvider | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [fetchingModelsId, setFetchingModelsId] = useState<string | null>(null);
  const [fetchingVoicesId, setFetchingVoicesId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'ai_chat' as ProviderType,
    api_key: '',
    api_url: '',
    is_active: true,
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await db.apiProviders.list();
      setProviders(data);
    } catch (error) {
      console.error('Error loading providers:', error);
      toast.error('Failed to load API providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Provider name is required');
      return;
    }

    if (formData.api_url && !formData.api_url.startsWith('http://') && !formData.api_url.startsWith('https://')) {
      toast.error('API URL must start with http:// or https://');
      return;
    }

    if (!formData.api_key && formData.type !== 'other') {
      toast.error('API key is required for this provider type');
      return;
    }

    try {
      if (editingProvider) {
        await db.apiProviders.update(editingProvider.id, formData);
        toast.success('Provider updated successfully', {
          description: 'Edge function cache will refresh within 5 seconds. If voice chat still shows an error, wait 5-10 seconds and try again.',
          duration: 8000,
        });
        
        // If this is OpenAI and it's being activated, show helpful message
        if (formData.name.toLowerCase() === 'openai' && formData.is_active && formData.api_key) {
          toast.info('OpenAI provider is now active', {
            description: 'Voice chat should work after cache refresh (5-10 seconds). Make sure the provider name is exactly "OpenAI" (case-insensitive).',
            duration: 10000,
          });
        }
      } else {
        await db.apiProviders.create(formData);
        toast.success('Provider created successfully', {
          description: 'Edge function cache will refresh within 5 seconds.',
          duration: 8000,
        });
        
        // If this is OpenAI, show helpful message
        if (formData.name.toLowerCase() === 'openai' && formData.is_active && formData.api_key) {
          toast.info('OpenAI provider created', {
            description: 'Voice chat should work after cache refresh (5-10 seconds). Make sure the provider name is exactly "OpenAI" (case-insensitive).',
            duration: 10000,
          });
        }
      }

      setDialogOpen(false);
      resetForm();
      loadProviders();
      
      // Note: Edge function cache will refresh within 5 seconds
      // If voice chat still shows error, wait a few seconds and try again
    } catch (error: unknown) {
      console.error('Error saving provider:', error);
      
      // Handle duplicate key error (provider name already exists)
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint') || (error as { code?: string })?.code === '23505') {
        toast.error(`A provider with the name "${formData.name}" already exists. Please use a different name.`);
      } else if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error('Failed to save provider');
      }
    }
  };

  const handleEdit = async (provider: ApiProviderSafe) => {
    try {
      // Fetch full provider data including API key
      const fullProvider = await db.apiProviders.getById(provider.id);
      if (fullProvider) {
        setEditingProvider(fullProvider);
        setFormData({
          name: fullProvider.name,
          type: fullProvider.type,
          api_key: fullProvider.api_key || '',
          api_url: fullProvider.api_url || '',
          is_active: fullProvider.is_active,
        });
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading provider:', error);
      toast.error('Failed to load provider details');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider? This will also delete all associated models and voices.')) {
      return;
    }

    try {
      await db.apiProviders.delete(id);
      toast.success('Provider deleted successfully');
      loadProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast.error('Failed to delete provider');
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const result = await db.apiProviders.testConnection(id);
      if (result.success) {
        toast.success(result.message || 'Connection successful');
      } else {
        toast.error(result.message || 'Connection failed');
      }
      loadProviders();
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Failed to test connection');
    } finally {
      setTestingId(null);
    }
  };

  const handleFetchModels = async (id: string) => {
    setFetchingModelsId(id);
    try {
      const models = await db.apiProviders.fetchModels(id);
      toast.success(`Fetched ${models.length} models successfully`);
      loadProviders(); // Refresh the list
    } catch (error) {
      console.error('Error fetching models:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch models';
      toast.error(errorMessage);
    } finally {
      setFetchingModelsId(null);
    }
  };

  const handleFetchVoices = async (id: string) => {
    setFetchingVoicesId(id);
    try {
      const voices = await db.apiProviders.fetchVoices(id);
      toast.success(`Fetched ${voices.length} voices successfully`);
      loadProviders(); // Refresh the list
    } catch (error) {
      console.error('Error fetching voices:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch voices';
      toast.error(errorMessage);
    } finally {
      setFetchingVoicesId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'ai_chat',
      api_key: '',
      api_url: '',
      is_active: true,
    });
    setEditingProvider(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Testing</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  const getTypeBadge = (type: ProviderType) => {
    const colors: Record<ProviderType, string> = {
      ai_chat: 'bg-blue-500',
      ai_image: 'bg-purple-500',
      tts: 'bg-green-500',
      stt: 'bg-yellow-500',
      other: 'bg-gray-500',
    };

    return <Badge className={colors[type]}>{type.replace('_', ' ').toUpperCase()}</Badge>;
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
          <h1 className="text-3xl font-bold">API Providers</h1>
          <p className="text-muted-foreground">Manage third-party API integrations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProvider ? 'Edit Provider' : 'Add New Provider'}</DialogTitle>
              <DialogDescription>
                Configure API provider settings and credentials
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Provider Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., OpenAI"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Provider Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as ProviderType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai_chat">AI Chat</SelectItem>
                      <SelectItem value="ai_image">AI Image</SelectItem>
                      <SelectItem value="tts">Text-to-Speech</SelectItem>
                      <SelectItem value="stt">Speech-to-Text</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_url">API URL</Label>
                <Input
                  id="api_url"
                  value={formData.api_url}
                  onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                  placeholder="https://api.example.com/v1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Enter API key"
                />
                <p className="text-xs text-muted-foreground">
                  API keys are encrypted and stored securely
                </p>
              </div>

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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProvider ? 'Update' : 'Create'} Provider
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Providers</CardTitle>
          <CardDescription>
            {providers.length} provider{providers.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Last Tested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No providers configured yet
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell>{getTypeBadge(provider.type)}</TableCell>
                    <TableCell>{getStatusBadge(provider.test_status)}</TableCell>
                    <TableCell>
                      {provider.has_api_key ? (
                        <Badge variant="outline">Configured</Badge>
                      ) : (
                        <Badge variant="secondary">Not Set</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {provider.last_tested_at
                        ? new Date(provider.last_tested_at).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestConnection(provider.id)}
                          disabled={testingId === provider.id || !provider.has_api_key}
                        >
                          {testingId === provider.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                        {provider.type === 'ai_chat' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFetchModels(provider.id)}
                            disabled={fetchingModelsId === provider.id || !provider.has_api_key}
                            title="Fetch Models"
                          >
                            {fetchingModelsId === provider.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        {provider.type === 'tts' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFetchVoices(provider.id)}
                            disabled={fetchingVoicesId === provider.id || (!provider.has_api_key && !supportsVoiceFetching(provider.name))}
                            title={
                              !supportsVoiceFetching(provider.name)
                                ? `"${provider.name}" does not support automatic voice fetching. Supported: OpenAI, Google, ElevenLabs`
                                : "Fetch Voices"
                            }
                          >
                            {fetchingVoicesId === provider.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(provider)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(provider.id)}
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
