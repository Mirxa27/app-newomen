import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Loader2, Activity, Clock, Zap } from 'lucide-react';
import { db } from '@/db/api';
import type { AiInteractionLogWithRelations } from '@/types/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function AiInteractionLogs() {
  const [logs, setLogs] = useState<AiInteractionLogWithRelations[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    error: 0,
    avgResponseTime: 0,
    totalTokens: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AiInteractionLogWithRelations | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      const [logsData, statsData] = await Promise.all([
        db.aiMgmtInteractionLogs.list(pageSize, page * pageSize),
        db.aiMgmtInteractionLogs.getStats(),
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading interaction logs:', error);
      toast.error('Failed to load interaction logs');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log: AiInteractionLogWithRelations) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'timeout':
        return 'secondary';
      default:
        return 'outline';
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
      <div>
        <h1 className="text-3xl font-bold">AI Interaction Logs</h1>
        <p className="text-muted-foreground mt-2">
          Monitor all AI interactions across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Total Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.error}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Total Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Interaction History</CardTitle>
          <CardDescription>Recent AI interactions with detailed metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Function</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No interaction logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {log.function?.display_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.provider?.name || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.model?.display_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {log.user?.nickname || log.user?.email || 'Anonymous'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.response_time_ms || 0}ms</TableCell>
                    <TableCell>{log.tokens_used || 0}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={logs.length < pageSize}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interaction Details</DialogTitle>
            <DialogDescription>
              Detailed view of the AI interaction
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Function</Label>
                  <p className="text-sm">{selectedLog.function?.display_name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Provider</Label>
                  <p className="text-sm">{selectedLog.provider?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Model</Label>
                  <p className="text-sm">{selectedLog.model?.display_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusColor(selectedLog.status)}>
                    {selectedLog.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Response Time</Label>
                  <p className="text-sm">{selectedLog.response_time_ms || 0}ms</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tokens Used</Label>
                  <p className="text-sm">{selectedLog.tokens_used || 0}</p>
                </div>
              </div>

              {selectedLog.input_text && (
                <div>
                  <Label className="text-sm font-medium">Input</Label>
                  <div className="mt-2 p-4 bg-muted rounded-md max-h-48 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{selectedLog.input_text}</p>
                  </div>
                </div>
              )}

              {selectedLog.output_text && (
                <div>
                  <Label className="text-sm font-medium">Output</Label>
                  <div className="mt-2 p-4 bg-muted rounded-md max-h-48 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{selectedLog.output_text}</p>
                  </div>
                </div>
              )}

              {selectedLog.error_message && (
                <div>
                  <Label className="text-sm font-medium">Error Message</Label>
                  <div className="mt-2 p-4 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive">{selectedLog.error_message}</p>
                  </div>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Metadata</Label>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <pre className="text-sm">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
