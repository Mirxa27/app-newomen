import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  BarChart3,
  Loader2,
  Eye,
} from 'lucide-react';
import { db } from '@/db/api';
import { toast } from 'sonner';
import type {
  ABExperiment,
  ABVariant,
  ABExperimentWithVariants,
  ExperimentStatus,
  SuccessMetric,
} from '@/types/types';
import { formatDistanceToNow } from 'date-fns';

export default function ABTesting() {
  const [experiments, setExperiments] = useState<ABExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState<ABExperiment | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<ABExperimentWithVariants | null>(null);
  const [currentExperimentId, setCurrentExperimentId] = useState<string | null>(null);
  const [functionConfigs, setFunctionConfigs] = useState<any[]>([]);
  const [functions, setFunctions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    function_key: '',
    status: 'draft' as ExperimentStatus,
    traffic_split: { A: 50, B: 50 } as Record<string, number>,
    start_date: '',
    end_date: '',
    success_metric: 'response_time' as SuccessMetric,
    min_sample_size: 100,
  });

  const [variantFormData, setVariantFormData] = useState({
    variant_name: '',
    function_config_id: '',
    traffic_percentage: 50,
    is_control: false,
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [experimentsData, functionsData] = await Promise.all([
        db.abTesting.listExperiments().catch((err) => {
          // Handle case where migration hasn't been run yet
          if (err?.code === 'PGRST116' || err?.message?.includes('does not exist') || err?.message?.includes('404')) {
            console.warn('A/B testing tables not found. Please run migration 14_create_ab_testing_system.sql');
            return [];
          }
          throw err;
        }),
        db.aiMgmtFunctions.list(),
      ]);
      setExperiments(experimentsData || []);
      setFunctions(functionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('does not exist') || errorMessage.includes('404')) {
        toast.error('A/B testing tables not found. Please run the database migration: 14_create_ab_testing_system.sql', {
          duration: 10000,
        });
      } else {
        toast.error('Failed to load experiments');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFunctionConfigs = async (functionKey: string) => {
    try {
      const func = await db.aiMgmtFunctions.getByKey(functionKey);
      if (func) {
        const configs = await db.aiMgmtFunctionConfigs.listByFunction(func.id);
        setFunctionConfigs(configs);
      } else {
        setFunctionConfigs([]);
      }
    } catch (error) {
      console.error('Error loading function configs:', error);
      toast.error('Failed to load function configurations');
    }
  };

  const loadExperimentDetails = async (id: string) => {
    try {
      const experiment = await db.abTesting.getExperiment(id);
      setSelectedExperiment(experiment);
    } catch (error) {
      console.error('Error loading experiment details:', error);
      toast.error('Failed to load experiment details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Experiment name is required');
      return;
    }

    if (!formData.function_key) {
      toast.error('Function key is required');
      return;
    }

    // Validate traffic split totals 100%
    const totalTraffic = Object.values(formData.traffic_split).reduce((sum, val) => sum + val, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      toast.error('Traffic split must total 100%');
      return;
    }

    try {
      if (editingExperiment) {
        await db.abTesting.updateExperiment(editingExperiment.id, formData);
        toast.success('Experiment updated successfully');
      } else {
        await db.abTesting.createExperiment({
          ...formData,
          created_by: null, // Will be set by RLS
        });
        toast.success('Experiment created successfully');
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving experiment:', error);
      toast.error('Failed to save experiment');
    }
  };

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentExperimentId) {
      toast.error('No experiment selected');
      return;
    }

    if (!variantFormData.variant_name.trim()) {
      toast.error('Variant name is required');
      return;
    }

    if (!variantFormData.function_config_id) {
      toast.error('Function configuration is required');
      return;
    }

    try {
      await db.abTesting.createVariant({
        experiment_id: currentExperimentId,
        variant_name: variantFormData.variant_name,
        function_config_id: variantFormData.function_config_id,
        traffic_percentage: variantFormData.traffic_percentage,
        is_control: variantFormData.is_control,
        description: variantFormData.description || null,
      });

      toast.success('Variant created successfully');
      setVariantDialogOpen(false);
      resetVariantForm();
      if (currentExperimentId) {
        loadExperimentDetails(currentExperimentId);
      }
    } catch (error) {
      console.error('Error saving variant:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate')) {
        toast.error('A variant with this name already exists for this experiment');
      } else {
        toast.error('Failed to save variant');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experiment? This will also delete all variants and results.')) {
      return;
    }

    try {
      await db.abTesting.deleteExperiment(id);
      toast.success('Experiment deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting experiment:', error);
      toast.error('Failed to delete experiment');
    }
  };

  const handleStatusChange = async (id: string, newStatus: ExperimentStatus) => {
    try {
      const updates: Partial<ABExperiment> = { status: newStatus };
      
      if (newStatus === 'active') {
        updates.start_date = new Date().toISOString();
      } else if (newStatus === 'completed' || newStatus === 'cancelled') {
        updates.end_date = new Date().toISOString();
      }

      await db.abTesting.updateExperiment(id, updates);
      toast.success(`Experiment ${newStatus}`);
      loadData();
    } catch (error) {
      console.error('Error updating experiment status:', error);
      toast.error('Failed to update experiment status');
    }
  };

  const handleCalculateResults = async (experimentId: string) => {
    try {
      await db.abTesting.calculateResults(experimentId);
      toast.success('Results calculated successfully');
      loadExperimentDetails(experimentId);
    } catch (error) {
      console.error('Error calculating results:', error);
      toast.error('Failed to calculate results');
    }
  };

  const resetForm = () => {
    setEditingExperiment(null);
    setFormData({
      name: '',
      description: '',
      function_key: '',
      status: 'draft',
      traffic_split: { A: 50, B: 50 },
      start_date: '',
      end_date: '',
      success_metric: 'response_time',
      min_sample_size: 100,
    });
  };

  const resetVariantForm = () => {
    setVariantFormData({
      variant_name: '',
      function_config_id: '',
      traffic_percentage: 50,
      is_control: false,
      description: '',
    });
  };

  const getStatusColor = (status: ExperimentStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
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
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">A/B Testing</h1>
          <p className="text-muted-foreground">
            Create and manage A/B tests for AI configurations
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-muted-foreground">
            {experiments.length} experiment{experiments.length !== 1 ? 's' : ''}
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Experiment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingExperiment ? 'Edit Experiment' : 'Create New A/B Test'}
                </DialogTitle>
                <DialogDescription>
                  Configure an A/B test to compare different AI configurations
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Experiment Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Chat Response Time Test"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what you're testing..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="function_key">AI Function</Label>
                    <Select
                      value={formData.function_key}
                      onValueChange={(value) => {
                        setFormData({ ...formData, function_key: value });
                        loadFunctionConfigs(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select function" />
                      </SelectTrigger>
                      <SelectContent>
                        {functions.map((func) => (
                          <SelectItem key={func.id} value={func.function_key}>
                            {func.display_name || func.function_key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="success_metric">Success Metric</Label>
                    <Select
                      value={formData.success_metric}
                      onValueChange={(value) => setFormData({ ...formData, success_metric: value as SuccessMetric })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="response_time">Response Time</SelectItem>
                        <SelectItem value="success_rate">Success Rate</SelectItem>
                        <SelectItem value="cost">Cost</SelectItem>
                        <SelectItem value="user_satisfaction">User Satisfaction</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date (Optional)</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date (Optional)</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_sample_size">Minimum Sample Size</Label>
                  <Input
                    id="min_sample_size"
                    type="number"
                    min="10"
                    max="10000"
                    value={formData.min_sample_size}
                    onChange={(e) => setFormData({ ...formData, min_sample_size: parseInt(e.target.value) || 100 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum number of interactions needed for statistical significance
                  </p>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingExperiment ? 'Save Changes' : 'Create Experiment'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading experiments...</p>
          </div>
        ) : experiments.length === 0 ? (
          <Card className="text-center py-8">
            <CardTitle className="text-xl">No A/B Tests Created</CardTitle>
            <CardDescription className="mt-2">
              Create your first A/B test to compare different AI configurations.
            </CardDescription>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Function</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead>Success Metric</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {experiments.map((experiment) => (
                    <TableRow key={experiment.id}>
                      <TableCell className="font-medium">{experiment.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{experiment.function_key}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(experiment.status)}>
                          {experiment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {Object.keys(experiment.traffic_split).length} variant{Object.keys(experiment.traffic_split).length !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{experiment.success_metric.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(experiment.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              setCurrentExperimentId(experiment.id);
                              await loadExperimentDetails(experiment.id);
                              setResultsDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {experiment.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(experiment.id, 'active')}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          {experiment.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(experiment.id, 'paused')}
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingExperiment(experiment);
                              setFormData({
                                name: experiment.name,
                                description: experiment.description || '',
                                function_key: experiment.function_key,
                                status: experiment.status,
                                traffic_split: experiment.traffic_split,
                                start_date: experiment.start_date || '',
                                end_date: experiment.end_date || '',
                                success_metric: experiment.success_metric,
                                min_sample_size: experiment.min_sample_size,
                              });
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(experiment.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Experiment Details Dialog */}
        <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedExperiment?.name || 'Experiment Details'}</DialogTitle>
              <DialogDescription>
                View variants, results, and manage this A/B test
              </DialogDescription>
            </DialogHeader>
            {selectedExperiment && (
              <div className="space-y-6 mt-4">
                {/* Experiment Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedExperiment.status)}>
                      {selectedExperiment.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Metric</p>
                    <p className="text-sm capitalize">{selectedExperiment.success_metric.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Function</p>
                    <Badge variant="secondary">{selectedExperiment.function_key}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Min Sample Size</p>
                    <p className="text-sm">{selectedExperiment.min_sample_size}</p>
                  </div>
                </div>

                {/* Variants Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Variants</h3>
                    <Button
                      size="sm"
                      onClick={() => {
                        setVariantDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Variant
                    </Button>
                  </div>
                  {selectedExperiment.variants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No variants configured yet</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedExperiment.variants.map((variant) => {
                        const result = variant.results;
                        return (
                          <Card key={variant.id} className="glass-card">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                  Variant {variant.variant_name}
                                  {variant.is_control && (
                                    <Badge variant="secondary" className="ml-2">Control</Badge>
                                  )}
                                </CardTitle>
                                <Badge>{variant.traffic_percentage}% traffic</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {variant.description && (
                                  <p className="text-sm text-muted-foreground">{variant.description}</p>
                                )}
                                {variant.function_config && (
                                  <div className="text-sm">
                                    <p className="font-medium">Configuration:</p>
                                    <p className="text-muted-foreground">
                                      Provider: {(variant.function_config.provider as any)?.name || 'N/A'}
                                    </p>
                                    <p className="text-muted-foreground">
                                      Model: {(variant.function_config.model as any)?.model_name || variant.function_config.model_id}
                                    </p>
                                  </div>
                                )}
                                {result && (
                                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Total Interactions</p>
                                      <p className="text-sm font-medium">{result.total_interactions}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Success Rate</p>
                                      <p className="text-sm font-medium text-green-500">
                                        {result.total_interactions > 0
                                          ? `${Math.round((result.successful_interactions / result.total_interactions) * 100)}%`
                                          : '0%'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Avg Response Time</p>
                                      <p className="text-sm font-medium">{Math.round(result.avg_response_time_ms)}ms</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Estimated Cost</p>
                                      <p className="text-sm font-medium">${result.estimated_cost.toFixed(2)}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Results Section */}
                {selectedExperiment.results && selectedExperiment.results.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Results</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCalculateResults(selectedExperiment.id)}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Recalculate
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Variant</TableHead>
                            <TableHead>Interactions</TableHead>
                            <TableHead>Success Rate</TableHead>
                            <TableHead>Avg Response</TableHead>
                            <TableHead>Total Tokens</TableHead>
                            <TableHead>Cost</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedExperiment.results.map((result) => {
                            const variant = selectedExperiment.variants.find((v) => v.id === result.variant_id);
                            return (
                              <TableRow key={result.id}>
                                <TableCell className="font-medium">
                                  {variant?.variant_name || 'Unknown'}
                                </TableCell>
                                <TableCell>{result.total_interactions}</TableCell>
                                <TableCell>
                                  <span className="text-green-500">
                                    {result.total_interactions > 0
                                      ? `${Math.round((result.successful_interactions / result.total_interactions) * 100)}%`
                                      : '0%'}
                                  </span>
                                </TableCell>
                                <TableCell>{Math.round(result.avg_response_time_ms)}ms</TableCell>
                                <TableCell>{result.total_tokens.toLocaleString()}</TableCell>
                                <TableCell>${result.estimated_cost.toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {(!selectedExperiment.results || selectedExperiment.results.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No results yet. Start the experiment and wait for interactions to accumulate.</p>
                    <Button
                      className="mt-4"
                      onClick={() => handleCalculateResults(selectedExperiment.id)}
                    >
                      Calculate Results
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Variant Dialog */}
        <Dialog open={variantDialogOpen} onOpenChange={(open) => {
          setVariantDialogOpen(open);
          if (!open) resetVariantForm();
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Variant</DialogTitle>
              <DialogDescription>
                Add a new variant to compare in this A/B test
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVariantSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="variant_name">Variant Name</Label>
                <Input
                  id="variant_name"
                  value={variantFormData.variant_name}
                  onChange={(e) => setVariantFormData({ ...variantFormData, variant_name: e.target.value.toUpperCase() })}
                  placeholder="e.g., A, B, C"
                  maxLength={10}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="function_config_id">Function Configuration</Label>
                <Select
                  value={variantFormData.function_config_id}
                  onValueChange={(value) => setVariantFormData({ ...variantFormData, function_config_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select configuration" />
                  </SelectTrigger>
                  <SelectContent>
                    {functionConfigs.length === 0 ? (
                      <SelectItem value="" disabled>No configurations available</SelectItem>
                    ) : (
                      functionConfigs.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          {(config.provider as any)?.name || 'Unknown'} - {(config.model as any)?.model_name || config.model_id}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select the AI configuration to use for this variant. Make sure to select a function first to see available configurations.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="traffic_percentage">Traffic Percentage</Label>
                <Input
                  id="traffic_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={variantFormData.traffic_percentage}
                  onChange={(e) => setVariantFormData({ ...variantFormData, traffic_percentage: parseFloat(e.target.value) || 0 })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Percentage of traffic to route to this variant (0-100)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={variantFormData.description}
                  onChange={(e) => setVariantFormData({ ...variantFormData, description: e.target.value })}
                  placeholder="Describe what makes this variant different..."
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="is_control"
                  type="checkbox"
                  checked={variantFormData.is_control}
                  onChange={(e) => setVariantFormData({ ...variantFormData, is_control: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <Label htmlFor="is_control">Mark as Control Variant</Label>
              </div>
              <DialogFooter>
                <Button type="submit">Add Variant</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

