import { useState, useEffect } from "react";
import { getComplianceStatus } from "@/lib/compliance-utils";

export function useCompliance(sellerId: string | null) {
  const [compliance, setCompliance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    const loadCompliance = async () => {
      try {
        setLoading(true);
        const status = await getComplianceStatus(sellerId);
        setCompliance(status);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load compliance status"));
      } finally {
        setLoading(false);
      }
    };

    loadCompliance();
  }, [sellerId]);

  const refresh = async () => {
    if (!sellerId) return;
    try {
      const status = await getComplianceStatus(sellerId);
      setCompliance(status);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to refresh compliance status"));
    }
  };

  return {
    compliance,
    loading,
    error,
    refresh,
    isCompliant: compliance?.isCompliant ?? false,
    criticalIssues: compliance?.criticalIssues ?? [],
  };
}
