import { supabase } from "@/integrations/supabase/client";

/**
 * Check if seller needs to submit W-9 based on revenue thresholds
 * IRS requires W-9 for sellers expected to earn $600+ per year
 */
export async function checkW9Requirement(sellerId: string): Promise<boolean> {
  try {
    // Check orders from the last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: orders } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("seller_id", sellerId)
      .gte("created_at", oneYearAgo.toISOString());

    if (!orders) return false;

    const annualRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentOrders } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("seller_id", sellerId)
      .gte("created_at", thirtyDaysAgo.toISOString());

    const revenue30Day = recentOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
    const projectedAnnual = revenue30Day * 12;

    return annualRevenue >= 600 || projectedAnnual >= 600;
  } catch (error) {
    console.error("Error checking W9 requirement:", error);
    return false;
  }
}

/**
 * Check if seller needs 1099-K form
 * IRS threshold: $20,000 in gross revenue AND 200+ transactions
 */
export async function check1099KRequirement(
  sellerId: string,
  taxYear: number
): Promise<{ required: boolean; transactions: number; revenue: number }> {
  try {
    const { data } = await supabase
      .from("tax_form_1099k")
      .select("total_transactions, gross_revenue, form_required")
      .eq("seller_id", sellerId)
      .eq("tax_year", taxYear)
      .maybeSingle();

    if (!data) {
      return { required: false, transactions: 0, revenue: 0 };
    }

    const required = data.gross_revenue >= 20000 && data.total_transactions >= 200;

    return {
      required,
      transactions: data.total_transactions,
      revenue: data.gross_revenue,
    };
  } catch (error) {
    console.error("Error checking 1099-K requirement:", error);
    return { required: false, transactions: 0, revenue: 0 };
  }
}

/**
 * Check if seller needs public disclosure (INFORM Consumers Act)
 * Required for high-volume sellers: $20,000+ in annual sales
 */
export async function checkPublicDisclosureRequirement(
  sellerId: string
): Promise<boolean> {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: orders } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("seller_id", sellerId)
      .gte("created_at", oneYearAgo.toISOString());

    const annualRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
    return annualRevenue >= 20000;
  } catch (error) {
    console.error("Error checking disclosure requirement:", error);
    return false;
  }
}

/**
 * Check seller verification status and deadline
 */
export async function checkVerificationDeadline(sellerId: string): Promise<{
  status: string;
  deadline: Date | null;
  daysRemaining: number | null;
}> {
  // Verification now handled by Stripe Connect
  return {
    status: "verified",
    deadline: null,
    daysRemaining: null
  };
}

/**
 * Get seller's performance score and standards compliance
 */
export async function checkPerformanceStandards(sellerId: string): Promise<{
  meetsStandards: boolean;
  overallScore: number;
  issues: string[];
}> {
  try {
    const { data } = await supabase
      .from("seller_performance_metrics")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return { meetsStandards: true, overallScore: 100, issues: [] };
    }

    const issues: string[] = [];
    
    if (data.average_rating && data.average_rating < 4.0) {
      issues.push("Average rating below 4.0 stars");
    }
    
    const onTimeRate = data.total_orders > 0 
      ? (data.on_time_shipments / data.total_orders) * 100 
      : 100;
    if (onTimeRate < 90) {
      issues.push("On-time shipping rate below 90%");
    }

    const responseRate = data.total_messages > 0
      ? (data.messages_responded_24h / data.total_messages) * 100
      : 100;
    if (responseRate < 80) {
      issues.push("24-hour response rate below 80%");
    }

    if (data.response_time_avg_hours && data.response_time_avg_hours > 24) {
      issues.push("Average response time over 24 hours");
    }

    const disputeRate = data.total_orders > 0
      ? (data.disputes_filed / data.total_orders) * 100
      : 0;
    if (disputeRate > 2) {
      issues.push("Dispute rate above 2%");
    }

    return {
      meetsStandards: data.meets_standards,
      overallScore: data.overall_score || 0,
      issues,
    };
  } catch (error) {
    console.error("Error checking performance standards:", error);
    return { meetsStandards: false, overallScore: 0, issues: ["Error checking standards"] };
  }
}

/**
 * Get comprehensive compliance status for a seller
 */
export async function getComplianceStatus(sellerId: string) {
  const [
    w9Required,
    needs1099K,
    needsDisclosure,
    verificationStatus,
    performanceStatus,
  ] = await Promise.all([
    checkW9Requirement(sellerId),
    check1099KRequirement(sellerId, new Date().getFullYear()),
    checkPublicDisclosureRequirement(sellerId),
    checkVerificationDeadline(sellerId),
    checkPerformanceStandards(sellerId),
  ]);

  // Check if W9 is submitted
  const { data: taxInfo } = await supabase
    .from("seller_tax_info")
    .select("w9_submitted_at")
    .eq("seller_id", sellerId)
    .maybeSingle();

  // Check if disclosure is submitted (if required)
  const { data: disclosure } = await supabase
    .from("seller_public_disclosures")
    .select("is_active")
    .eq("seller_id", sellerId)
    .maybeSingle();

  const compliance = {
    identity: {
      required: true,
      complete: verificationStatus.status === "verified",
      status: verificationStatus.status,
      deadline: verificationStatus.deadline,
      daysRemaining: verificationStatus.daysRemaining,
    },
    taxW9: {
      required: w9Required,
      complete: !!taxInfo?.w9_submitted_at,
    },
    tax1099K: {
      required: needs1099K.required,
      transactions: needs1099K.transactions,
      revenue: needs1099K.revenue,
    },
    publicDisclosure: {
      required: needsDisclosure,
      complete: needsDisclosure ? !!disclosure?.is_active : true,
    },
    performance: {
      meetsStandards: performanceStatus.meetsStandards,
      score: performanceStatus.overallScore,
      issues: performanceStatus.issues,
    },
  };

  // Calculate overall compliance
  const criticalIssues = [];
  if (compliance.identity.required && !compliance.identity.complete) {
    criticalIssues.push("Identity verification required");
  }
  if (compliance.taxW9.required && !compliance.taxW9.complete) {
    criticalIssues.push("W-9 tax form required");
  }
  if (compliance.publicDisclosure.required && !compliance.publicDisclosure.complete) {
    criticalIssues.push("Public business disclosure required");
  }
  if (!compliance.performance.meetsStandards) {
    criticalIssues.push("Performance below standards");
  }

  return {
    compliance,
    isCompliant: criticalIssues.length === 0,
    criticalIssues,
  };
}
