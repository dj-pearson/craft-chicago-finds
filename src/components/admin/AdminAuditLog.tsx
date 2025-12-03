/**
 * Admin Audit Log Component
 * Displays comprehensive admin action history with filtering
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  FileText,
  Search,
  Calendar as CalendarIcon,
  RefreshCw,
  Download,
  Eye,
  Shield,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  useAdminAudit,
  AUDIT_ACTION_TYPES,
  AUDIT_TARGET_TYPES,
  AuditLogFilters,
  AuditLogEntry,
  AuditSeverity,
} from '@/hooks/useAdminAudit';

export function AdminAuditLog() {
  const {
    useAuditLogs,
    getActionDisplayName,
    getSeverityClass,
  } = useAdminAudit();

  // Filter state
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  // Fetch audit logs
  const { data: logs = [], isLoading, refetch } = useAuditLogs({
    ...filters,
    fromDate,
    toDate,
  });

  // Filter logs by search term
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action_type.toLowerCase().includes(search) ||
      log.target_type.toLowerCase().includes(search) ||
      log.admin_email?.toLowerCase().includes(search) ||
      log.admin_name?.toLowerCase().includes(search) ||
      JSON.stringify(log.target_details).toLowerCase().includes(search)
    );
  });

  // Get severity icon
  const getSeverityIcon = (severity: AuditSeverity) => {
    switch (severity) {
      case 'critical':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Export logs as CSV
  const exportLogs = () => {
    const headers = ['Timestamp', 'Action', 'Target', 'Admin', 'Severity', 'Details'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      getActionDisplayName(log.action_type),
      `${log.target_type}${log.target_id ? ` (${log.target_id})` : ''}`,
      log.admin_email || 'Unknown',
      log.severity,
      JSON.stringify(log.target_details),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Admin Audit Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Action Type Filter */}
          <Select
            value={filters.actionType || 'all'}
            onValueChange={(v) => setFilters(f => ({
              ...f,
              actionType: v === 'all' ? undefined : v,
            }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Object.entries(AUDIT_ACTION_TYPES).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {getActionDisplayName(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Target Type Filter */}
          <Select
            value={filters.targetType || 'all'}
            onValueChange={(v) => setFilters(f => ({
              ...f,
              targetType: v === 'all' ? undefined : v,
            }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Target Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Targets</SelectItem>
              {Object.entries(AUDIT_TARGET_TYPES).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {key.charAt(0) + key.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Severity Filter */}
          <Select
            value={filters.severity || 'all'}
            onValueChange={(v) => setFilters(f => ({
              ...f,
              severity: v === 'all' ? undefined : v as AuditSeverity,
            }))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[150px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fromDate ? format(fromDate, 'MMM d') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={setFromDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[150px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {toDate ? format(toDate, 'MMM d') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={toDate}
                onSelect={setToDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{getSeverityIcon(log.severity)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm">
                        {format(new Date(log.created_at), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'HH:mm:ss')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getActionDisplayName(log.action_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium capitalize">
                        {log.target_type}
                      </div>
                      {log.target_id && (
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {log.target_id}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.admin_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.admin_email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('capitalize', getSeverityClass(log.severity))}>
                        {log.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEntry(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Audit Log Details</DialogTitle>
                          </DialogHeader>
                          <AuditLogDetails entry={log} />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!filters.offset || filters.offset === 0}
              onClick={() => setFilters(f => ({
                ...f,
                offset: Math.max(0, (f.offset || 0) - (f.limit || 50)),
              }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filteredLogs.length < (filters.limit || 50)}
              onClick={() => setFilters(f => ({
                ...f,
                offset: (f.offset || 0) + (f.limit || 50),
              }))}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Audit Log Details Component
 */
function AuditLogDetails({ entry }: { entry: AuditLogEntry }) {
  const { getActionDisplayName } = useAdminAudit();

  return (
    <ScrollArea className="max-h-[500px]">
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
            <p className="text-sm">
              {format(new Date(entry.created_at), 'PPpp')}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Severity</label>
            <p className="text-sm capitalize">{entry.severity}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Action</label>
            <p className="text-sm">{getActionDisplayName(entry.action_type)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Target Type</label>
            <p className="text-sm capitalize">{entry.target_type}</p>
          </div>
        </div>

        {/* Admin Info */}
        <div>
          <label className="text-sm font-medium text-muted-foreground">Performed By</label>
          <p className="text-sm">
            {entry.admin_name || 'Unknown'} ({entry.admin_email || 'No email'})
          </p>
        </div>

        {/* Target ID */}
        {entry.target_id && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Target ID</label>
            <p className="text-sm font-mono bg-muted p-2 rounded">{entry.target_id}</p>
          </div>
        )}

        {/* IP Address */}
        {entry.ip_address && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">IP Address</label>
            <p className="text-sm font-mono">{entry.ip_address}</p>
          </div>
        )}

        {/* Target Details */}
        {Object.keys(entry.target_details).length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Target Details</label>
            <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
              {JSON.stringify(entry.target_details, null, 2)}
            </pre>
          </div>
        )}

        {/* Changes */}
        {Object.keys(entry.changes).length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Changes</label>
            <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
              {JSON.stringify(entry.changes, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export default AdminAuditLog;
