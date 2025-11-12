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
import { Plus, Edit, Trash2, Loader2, Star, Volume2 } from 'lucide-react';
import { db } from '@/db/api';
import type { AiVoice, VoiceWithProvider, ApiProviderSafe } from '@/types/types';
import { toast } from 'sonner';

export default function AiVoices() {
  const [voices, setVoices] = useState<VoiceWithProvider[]>([]);
  const [providers, setProviders] = useState<ApiProviderSafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoice, setEditingVoice] = useState<AiVoice | null>(null);

  const [formData, setFormData] = useState({
    provider_id: '',
    voice_id: '',
    voice_name: '',
    language: 'en-US',
    gender: '',
    accent: '',
    sample_url: '',
    parameters: '{"speed": 1.0}',
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [voicesData, providersData] = await Promise.all([
        db.aiVoices.listWithProvider(),
        db.apiProviders.list(),
      ]);
      setVoices(voicesData);
      setProviders(providersData.filter(p => p.type === 'tts'));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load voices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const voiceData = {
        ...formData,
        parameters: JSON.parse(formData.parameters),
        gender: formData.gender || null,
        accent: formData.accent || null,
        sample_url: formData.sample_url || null,
      };

      if (editingVoice) {
        await db.aiVoices.update(editingVoice.id, voiceData);
        toast.success('Voice updated successfully');
      } else {
        await db.aiVoices.create(voiceData);
        toast.success('Voice created successfully');
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving voice:', error);
      toast.error('Failed to save voice');
    }
  };

  const handleEdit = (voice: AiVoice) => {
    setEditingVoice(voice);
    setFormData({
      provider_id: voice.provider_id,
      voice_id: voice.voice_id,
      voice_name: voice.voice_name,
      language: voice.language,
      gender: voice.gender || '',
      accent: voice.accent || '',
      sample_url: voice.sample_url || '',
      parameters: JSON.stringify(voice.parameters, null, 2),
      is_active: voice.is_active,
      is_default: voice.is_default,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voice?')) {
      return;
    }

    try {
      await db.aiVoices.delete(id);
      toast.success('Voice deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting voice:', error);
      toast.error('Failed to delete voice');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await db.aiVoices.setDefault(id);
      toast.success('Default voice updated');
      loadData();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default voice');
    }
  };

  const resetForm = () => {
    setFormData({
      provider_id: '',
      voice_id: '',
      voice_name: '',
      language: 'en-US',
      gender: '',
      accent: '',
      sample_url: '',
      parameters: '{"speed": 1.0}',
      is_active: true,
      is_default: false,
    });
    setEditingVoice(null);
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
          <h1 className="text-3xl font-bold">AI Voices</h1>
          <p className="text-muted-foreground">Manage available text-to-speech voices</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Voice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVoice ? 'Edit Voice' : 'Add New Voice'}</DialogTitle>
              <DialogDescription>
                Configure text-to-speech voice settings
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
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    placeholder="e.g., en-US"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voice_id">Voice ID</Label>
                  <Input
                    id="voice_id"
                    value={formData.voice_id}
                    onChange={(e) => setFormData({ ...formData, voice_id: e.target.value })}
                    placeholder="e.g., alloy"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voice_name">Display Name</Label>
                  <Input
                    id="voice_name"
                    value={formData.voice_name}
                    onChange={(e) => setFormData({ ...formData, voice_name: e.target.value })}
                    placeholder="e.g., Alloy"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender (Optional)</Label>
                  <Select
                    value={formData.gender || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, gender: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent">Accent (Optional)</Label>
                  <Input
                    id="accent"
                    value={formData.accent}
                    onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
                    placeholder="e.g., US, UK"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sample_url">Sample URL (Optional)</Label>
                <Input
                  id="sample_url"
                  value={formData.sample_url}
                  onChange={(e) => setFormData({ ...formData, sample_url: e.target.value })}
                  placeholder="https://example.com/sample.mp3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parameters">Voice Parameters (JSON)</Label>
                <Textarea
                  id="parameters"
                  value={formData.parameters}
                  onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
                  placeholder='{"speed": 1.0, "pitch": 0}'
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
                  <Label htmlFor="is_default">Default voice</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingVoice ? 'Update' : 'Create'} Voice
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Voices</CardTitle>
          <CardDescription>
            {voices.length} voice{voices.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voice</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No voices configured yet
                  </TableCell>
                </TableRow>
              ) : (
                voices.map((voice) => (
                  <TableRow key={voice.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{voice.voice_name}</div>
                        <div className="text-sm text-muted-foreground">{voice.voice_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{voice.provider?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{voice.language}</Badge>
                    </TableCell>
                    <TableCell>
                      {voice.gender ? (
                        <Badge variant="secondary">{voice.gender}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {voice.is_active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {voice.is_default ? (
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetDefault(voice.id)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {voice.sample_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(voice.sample_url!, '_blank')}
                            title="Play sample"
                          >
                            <Volume2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(voice)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(voice.id)}
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
