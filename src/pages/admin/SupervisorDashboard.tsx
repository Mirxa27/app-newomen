import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, XCircle, Eye, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { db } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import type { SupervisorReportWithRelations } from '@/types/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function SupervisorDashboard() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<SupervisorReportWithRelations[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    resolved: 0,
    dismissed: 0,
    bySeverity: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<SupervisorReportWithRelations | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reportsData, statsData] = await Promise.all([
        db.aiMgmtSupervisorReports.list(100, 0),
        db.aiMgmtSupervisorReports.getStats(),
      ]);
      setReports(reportsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading supervisor data:', error);
      toast.error('Failed to load supervisor reports');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (report: SupervisorReportWithRelations) => {
    setSelectedReport(report);
    setDetailsOpen(true);
  };

  const handleUpdateStatus = async (
    reportId: string,
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  ) => {
    try {
      await db.aiMgmtSupervisorReports.updateStatus(reportId, status, profile?.id);
      toast.success(`Report marked as ${status}`);
      loadData();
      setDetailsOpen(false);
    } catch (error) {
      console.error('Error updating report status:', error);
      toast.error('Failed to update report status');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && report.severity !== filterSeverity) return false;
    return true;
  });

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
        <h1 className="text-3xl font-bold">Supervisor AI Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and analyze AI interactions across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.bySeverity.critical || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Severity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Issues by Severity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{stats.bySeverity.critical || 0}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{stats.bySeverity.high || 0}</div>
              <div className="text-sm text-muted-foreground">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{stats.bySeverity.medium || 0}</div>
              <div className="text-sm text-muted-foreground">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.bySeverity.low || 0}</div>
              <div className="text-sm text-muted-foreground">Low</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Supervisor Reports</CardTitle>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Function</TableHead>
                <TableHead>Analysis Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge variant={getSeverityColor(report.severity)}>
                        {getSeverityIcon(report.severity)}
                        <span className="ml-1">{report.severity}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.function?.display_name || 'Unknown'}
                    </TableCell>
                    <TableCell>{report.analysis_type}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(report)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Supervisor Report Details</DialogTitle>
            <DialogDescription>
              Review the AI interaction analysis and take action
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Function</Label>
                  <p className="text-sm">{selectedReport.function?.display_name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Analysis Type</Label>
                  <p className="text-sm">{selectedReport.analysis_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Severity</Label>
                  <Badge variant={getSeverityColor(selectedReport.severity)}>
                    {selectedReport.severity}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="outline">{selectedReport.status}</Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Findings</Label>
                <div className="mt-2 p-4 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedReport.findings}</p>
                </div>
              </div>

              {selectedReport.suggestions && (
                <div>
                  <Label className="text-sm font-medium">Suggestions</Label>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{selectedReport.suggestions}</p>
                  </div>
                </div>
              )}

              {selectedReport.metrics && Object.keys(selectedReport.metrics).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Metrics</Label>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <pre className="text-sm">{JSON.stringify(selectedReport.metrics, null, 2)}</pre>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedReport.id, 'reviewed')}
                  disabled={selectedReport.status === 'reviewed'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Reviewed
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                  disabled={selectedReport.status === 'resolved'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Resolved
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                  disabled={selectedReport.status === 'dismissed'}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Dismiss
                </Button>
              </div>
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
