// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLog {
  id: string;
  created_at: string;
  actor_type: string;
  action_type: string;
  entity_type: string;
  seller_name?: string;
  details: any;
  actor_name?: string;
}

export function AuditLogViewer() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter, limit]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("compliance_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (actionFilter !== "all") {
        query = query.eq("action_type", actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch seller and actor names separately
      const logsWithNames = await Promise.all(
        (data || []).map(async (log: any) => {
          let sellerName = "Unknown";
          let actorName = log.actor_type === "system" ? "System" : "Unknown";

          if (log.seller_id) {
            const { data: sellerData } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("user_id", log.seller_id)
              .single();
            
            if (sellerData) sellerName = sellerData.display_name;
          }

          if (log.actor_id && log.actor_type !== "system") {
            const { data: actorData } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("user_id", log.actor_id)
              .single();
            
            if (actorData) actorName = actorData.display_name;
          }

          return {
            id: log.id,
            created_at: log.created_at,
            actor_type: log.actor_type,
            action_type: log.action_type,
            entity_type: log.entity_type,
            seller_name: sellerName,
            actor_name: actorName,
            details: log.details || {},
          };
        })
      );

      setLogs(logsWithNames);
    } catch (error: any) {
      console.error("Error loading audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (actionType: string) => {
    const actionMap: Record<string, { variant: any; label: string }> = {
      verification_approved: { variant: "default", label: "Approved" },
      verification_rejected: { variant: "destructive", label: "Rejected" },
      verification_submitted: { variant: "secondary", label: "Submitted" },
      w9_submitted: { variant: "default", label: "W-9 Filed" },
      disclosure_submitted: { variant: "default", label: "Disclosure Filed" },
      disclosure_status_changed: { variant: "secondary", label: "Status Changed" },
    };

    const action = actionMap[actionType] || { variant: "outline", label: actionType };
    return <Badge variant={action.variant}>{action.label}</Badge>;
  };

  const getActorBadge = (actorType: string) => {
    const typeMap: Record<string, { variant: any; label: string }> = {
      user: { variant: "secondary", label: "Seller" },
      admin: { variant: "destructive", label: "Admin" },
      system: { variant: "outline", label: "System" },
    };

    const type = typeMap[actorType] || { variant: "outline", label: actorType };
    return <Badge variant={type.variant}>{type.label}</Badge>;
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading audit logs...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance Audit Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="verification_approved">Approvals</SelectItem>
                <SelectItem value="verification_rejected">Rejections</SelectItem>
                <SelectItem value="verification_submitted">Submissions</SelectItem>
                <SelectItem value="w9_submitted">W-9 Filings</SelectItem>
                <SelectItem value="disclosure_submitted">Disclosures</SelectItem>
              </SelectContent>
            </Select>
            <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">Last 50</SelectItem>
                <SelectItem value="100">Last 100</SelectItem>
                <SelectItem value="250">Last 250</SelectItem>
                <SelectItem value="500">Last 500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by seller, action, or actor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm">
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action_type)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getActorBadge(log.actor_type)}
                        <span className="text-xs text-muted-foreground">{log.actor_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{log.seller_name}</TableCell>
                    <TableCell>
                      <div className="text-sm max-w-md">
                        {log.details.old_status && (
                          <div>
                            <span className="text-muted-foreground">Status: </span>
                            {log.details.old_status} → {log.details.new_status}
                          </div>
                        )}
                        {log.details.admin_notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Note: {log.details.admin_notes}
                          </div>
                        )}
                        {log.details.verification_type && (
                          <div>
                            Type: {log.details.verification_type}
                          </div>
                        )}
                        {log.details.revenue_annual && (
                          <div className="text-xs text-muted-foreground">
                            Revenue: ${log.details.revenue_annual.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length} total audit log entries
        </div>
      </CardContent>
    </Card>
  );
}
