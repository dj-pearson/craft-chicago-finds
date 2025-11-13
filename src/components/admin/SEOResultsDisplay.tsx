import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, AlertTriangle, XCircle } from "lucide-react";

interface SEOResultsDisplayProps {
  results: {
    overall_score: number;
    technical_score: number;
    content_score: number;
    performance_score: number;
    accessibility_score: number;
    best_practices_score: number;
    issues: any[];
    warnings: any[];
    recommendations: any[];
    passed_checks: any[];
    meta: any;
    headings: any;
  };
}

export function SEOResultsDisplay({ results }: SEOResultsDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle>Overall SEO Score</CardTitle>
          <CardDescription>Comprehensive SEO health assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-6xl font-bold ${getScoreColor(results.overall_score)}`}>
              {results.overall_score}
            </div>
            <div className="flex-1">
              <Progress value={results.overall_score} className="h-4" />
              <p className="text-sm text-muted-foreground mt-2">
                {results.overall_score >= 80
                  ? "Excellent! Your SEO is in great shape."
                  : results.overall_score >= 60
                  ? "Good, but there's room for improvement."
                  : "Needs attention. Several issues require fixing."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Technical SEO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(results.technical_score)}`}>
              {results.technical_score}/100
            </div>
            <Progress value={results.technical_score} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Content Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(results.content_score)}`}>
              {results.content_score}/100
            </div>
            <Progress value={results.content_score} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(results.performance_score)}`}>
              {results.performance_score}/100
            </div>
            <Progress value={results.performance_score} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Accessibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(results.accessibility_score)}`}>
              {results.accessibility_score}/100
            </div>
            <Progress value={results.accessibility_score} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(results.best_practices_score)}`}>
              {results.best_practices_score}/100
            </div>
            <Progress value={results.best_practices_score} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Issues */}
      {results.issues && results.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Critical Issues ({results.issues.length})
            </CardTitle>
            <CardDescription>These issues need immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.issues.map((issue, index) => (
              <Alert key={index} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">{issue.type}:</span> {issue.message}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {results.warnings && results.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Warnings ({results.warnings.length})
            </CardTitle>
            <CardDescription>Recommended improvements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.warnings.map((warning, index) => (
              <Alert key={index}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">{warning.type}:</span> {warning.message}
                  {warning.value && <span className="ml-2 text-muted-foreground">({warning.value})</span>}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Passed Checks */}
      {results.passed_checks && results.passed_checks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Passed Checks ({results.passed_checks.length})
            </CardTitle>
            <CardDescription>What you're doing right</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {results.passed_checks.map((check, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{check.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {results.recommendations && results.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
            <CardDescription>Prioritized recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge
                  variant={
                    rec.priority === "critical"
                      ? "destructive"
                      : rec.priority === "high"
                      ? "default"
                      : "secondary"
                  }
                >
                  {rec.priority}
                </Badge>
                <p className="text-sm flex-1">{rec.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Meta Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Page Metadata</CardTitle>
          <CardDescription>Current meta tags and heading structure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Title</h4>
            <p className="text-sm text-muted-foreground">
              {results.meta?.title || "Not found"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Meta Description</h4>
            <p className="text-sm text-muted-foreground">
              {results.meta?.description || "Not found"}
            </p>
          </div>
          {results.meta?.canonical && (
            <div>
              <h4 className="text-sm font-medium mb-1">Canonical URL</h4>
              <p className="text-sm text-muted-foreground">{results.meta.canonical}</p>
            </div>
          )}
          {results.headings?.h1 && results.headings.h1.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">H1 Tags ({results.headings.h1.length})</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {results.headings.h1.map((h1: string, index: number) => (
                  <li key={index}>• {h1}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
