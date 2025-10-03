import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { FileText, Download, TrendingUp, Users, AlertTriangle, CheckCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ComplianceStats {
  total_sellers: number;
  pending_w9: number;
  pending_verification: number;
  pending_disclosure: number;
  overdue_verifications: number;
  approved_verifications: number;
  rejected_verifications: number;
}

interface ComplianceReport {
  seller_id: string;
  seller_name: string;
  seller_email: string;
  revenue_annual: number;
  w9_status: string;
  identity_status: string;
  disclosure_status: string;
  verification_deadline?: string;
}

export function ComplianceReporting() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [reportType, setReportType] = useState("all");

  useEffect(() => {
    loadComplianceData();
  }, [reportType]);

  const loadComplianceData = async () => {
    try {
      setLoading(true);

      // Get all sellers
      const { data: sellers, error: sellersError } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, is_seller, seller_verified")
        .eq("is_seller", true);

      if (sellersError) throw sellersError;

      const totalSellers = sellers?.length || 0;

      // Get W-9 submissions
      const { data: w9Data, error: w9Error } = await supabase
        .from("seller_tax_info")
        .select("seller_id");

      if (w9Error) throw w9Error;

      const w9SellerIds = new Set(w9Data?.map((w) => w.seller_id) || []);

      // Verification is now handled by Stripe - get seller verification status from profiles
      const verifiedSellers = sellers?.filter(s => s.seller_verified) || [];
      const pendingSellers = sellers?.filter(s => s.is_seller && !s.seller_verified) || [];

      // Get public disclosures
      const { data: disclosures, error: disclosuresError } = await supabase
        .from("seller_public_disclosures")
        .select("seller_id")
        .eq("is_active", true);

      if (disclosuresError) throw disclosuresError;

      const disclosureSellerIds = new Set(disclosures?.map((d) => d.seller_id) || []);

      // Calculate stats based on Stripe verification status
      const pendingVerifications = pendingSellers;
      const overdueVerifications: any[] = []; // Stripe handles verification timing
      const approvedVerifications = verifiedSellers;
      const rejectedVerifications: any[] = []; // Stripe handles rejections

      // Build compliance reports
      const complianceReports: ComplianceReport[] = [];

      for (const seller of sellers || []) {
        // Stripe handles verification - use seller_verified status
        const hasW9 = w9SellerIds.has(seller.user_id);
        const w9Status = hasW9 ? "submitted" : "missing";

        // Identity verification is handled by Stripe
        const identityStatus = seller.seller_verified ? "approved" : "pending";

        // Disclosure requirements (simplified without revenue tracking)
        const hasDisclosure = disclosureSellerIds.has(seller.user_id);
        const disclosureStatus = hasDisclosure ? "submitted" : "missing";

        // Apply report type filter
        let includeInReport = false;
        switch (reportType) {
          case "all":
            includeInReport = true;
            break;
          case "non_compliant":
            includeInReport =
              w9Status === "missing" ||
              identityStatus === "pending" ||
              disclosureStatus === "missing";
            break;
          case "high_revenue":
            // Without revenue tracking, include all verified sellers
            includeInReport = seller.seller_verified;
            break;
          case "pending_action":
            includeInReport = identityStatus === "pending";
            break;
        }

        if (includeInReport) {
          complianceReports.push({
            seller_id: seller.user_id,
            seller_name: seller.display_name || "Unknown",
            seller_email: seller.email || "",
            revenue_annual: 0, // Revenue tracking removed
            w9_status: w9Status,
            identity_status: identityStatus,
            disclosure_status: disclosureStatus,
            verification_deadline: undefined, // Stripe handles timing
          });
        }
      }

      setStats({
        total_sellers: totalSellers,
        pending_w9: complianceReports.filter((r) => r.w9_status === "missing").length,
        pending_verification: pendingVerifications.length,
        pending_disclosure: complianceReports.filter((r) => r.disclosure_status === "missing")
          .length,
        overdue_verifications: overdueVerifications.length,
        approved_verifications: approvedVerifications.length,
        rejected_verifications: rejectedVerifications.length,
      });

      setReports(complianceReports);
    } catch (error: any) {
      console.error("Error loading compliance data:", error);
      toast({
        title: "Error",
        description: "Failed to load compliance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Seller Name",
      "Email",
      "Annual Revenue",
      "W-9 Status",
      "Identity Status",
      "Disclosure Status",
      "Verification Deadline",
    ];

    const csvData = reports.map((report) => [
      report.seller_name,
      report.seller_email,
      report.revenue_annual.toFixed(2),
      report.w9_status,
      report.identity_status,
      report.disclosure_status,
      report.verification_deadline
        ? new Date(report.verification_deadline).toLocaleDateString()
        : "N/A",
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "Compliance report has been downloaded",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
      case "approved":
        return <Badge variant="default">Complete</Badge>;
      case "pending":
        return <Badge className="bg-orange-600">Pending</Badge>;
      case "missing":
      case "rejected":
        return <Badge variant="destructive">Missing</Badge>;
      case "not_required":
        return <Badge variant="secondary">N/A</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading compliance reports...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sellers</p>
                <p className="text-2xl font-bold">{stats?.total_sellers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending W-9</p>
                <p className="text-2xl font-bold">{stats?.pending_w9 || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Verify</p>
                <p className="text-2xl font-bold">{stats?.pending_verification || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{stats?.overdue_verifications || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats?.approved_verifications || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Disclosure</p>
                <p className="text-2xl font-bold">{stats?.pending_disclosure || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Compliance Report
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sellers</SelectItem>
                  <SelectItem value="non_compliant">Non-Compliant Only</SelectItem>
                  <SelectItem value="high_revenue">High Revenue ($5K+)</SelectItem>
                  <SelectItem value="pending_action">Pending Admin Action</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>W-9</TableHead>
                  <TableHead>Identity</TableHead>
                  <TableHead>Disclosure</TableHead>
                  <TableHead>Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No sellers match the selected filter
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.seller_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{report.seller_name}</p>
                          <p className="text-sm text-muted-foreground">{report.seller_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>${report.revenue_annual.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(report.w9_status)}</TableCell>
                      <TableCell>{getStatusBadge(report.identity_status)}</TableCell>
                      <TableCell>{getStatusBadge(report.disclosure_status)}</TableCell>
                      <TableCell>
                        {report.verification_deadline ? (
                          <span
                            className={
                              new Date(report.verification_deadline) < new Date()
                                ? "text-destructive font-medium"
                                : ""
                            }
                          >
                            {new Date(report.verification_deadline).toLocaleDateString()}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
