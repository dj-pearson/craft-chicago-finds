import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  Brain,
  TestTube,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  Zap,
  History,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AISettings {
  id: string;
  model_name: string;
  model_provider: string;
  api_endpoint: string;
  max_tokens: number;
  temperature: number;
  system_prompt: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AILog {
  id: string;
  user_id: string;
  model_used: string;
  prompt: string;
  response: string;
  tokens_used: number;
  success: boolean;
  error_message?: string;
  generation_type: string;
  created_at: string;
}

export const AISettingsManager = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    content?: string;
    error?: string;
    tokens_used?: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    model_name: "claude-3-5-sonnet-20241022",
    model_provider: "anthropic",
    api_endpoint: "https://api.anthropic.com/v1/messages",
    max_tokens: 4000,
    temperature: 0.7,
    system_prompt: "",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch current AI settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("ai_settings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        throw settingsError;
      }

      if (settingsData) {
        setSettings(settingsData);
        setFormData({
          model_name: settingsData.model_name,
          model_provider: settingsData.model_provider,
          api_endpoint: settingsData.api_endpoint,
          max_tokens: settingsData.max_tokens,
          temperature: settingsData.temperature,
          system_prompt: settingsData.system_prompt || "",
          is_active: settingsData.is_active,
        });
      }

      // Fetch recent AI generation logs
      const { data: logsData, error: logsError } = await supabase
        .from("ai_generation_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (logsError) {
        console.error("Error fetching logs:", logsError);
      } else {
        setLogs(logsData || []);
      }
    } catch (error) {
      console.error("Error fetching AI settings:", error);
      toast({
        title: "Error",
        description: "Failed to load AI settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from("ai_settings")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase.from("ai_settings").insert(formData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "AI settings saved successfully",
      });

      fetchData();
    } catch (error) {
      console.error("Error saving AI settings:", error);
      toast({
        title: "Error",
        description: "Failed to save AI settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const testPrompt = `Generate a brief, engaging social media post for a local craft marketplace launching in Chicago. The post should be friendly, community-focused, and encourage people to support local artisans. Keep it under 280 characters and include relevant hashtags.`;

      const response = await supabase.functions.invoke("ai-generate-content", {
        body: {
          prompt: testPrompt,
          generation_type: "test",
          context: {
            test: true,
            timestamp: new Date().toISOString(),
          },
          override_settings: {
            model_name: formData.model_name,
            max_tokens: formData.max_tokens,
            temperature: formData.temperature,
            system_prompt: formData.system_prompt,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "AI test failed");
      }

      const result = response.data;
      setTestResult({
        success: true,
        content: result.content,
        tokens_used: result.tokens_used,
      });

      toast({
        title: "Test Successful",
        description: "AI model is working correctly",
      });
    } catch (error) {
      console.error("AI test error:", error);
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      toast({
        title: "Test Failed",
        description: "AI model test failed",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading AI settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            AI Model Configuration
          </h2>
          <p className="text-muted-foreground">
            Centralized AI settings for all social media and content generation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleTest}
            disabled={testing}
            variant="outline"
            className="gap-2"
          >
            {testing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            Test AI Model
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Model Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Model Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="model_name">Model Name</Label>
              <Select
                value={formData.model_name}
                onValueChange={(value) =>
                  setFormData({ ...formData, model_name: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3-5-sonnet-20241022">
                    Claude 3.5 Sonnet (Latest)
                  </SelectItem>
                  <SelectItem value="claude-3-sonnet-20240229">
                    Claude 3 Sonnet
                  </SelectItem>
                  <SelectItem value="claude-3-haiku-20240307">
                    Claude 3 Haiku
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="api_endpoint">API Endpoint</Label>
              <Input
                id="api_endpoint"
                value={formData.api_endpoint}
                onChange={(e) =>
                  setFormData({ ...formData, api_endpoint: e.target.value })
                }
                placeholder="https://api.anthropic.com/v1/messages"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_tokens">Max Tokens</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  value={formData.max_tokens}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_tokens: parseInt(e.target.value) || 4000,
                    })
                  }
                  min="100"
                  max="8000"
                />
              </div>
              <div>
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      temperature: parseFloat(e.target.value) || 0.7,
                    })
                  }
                  min="0"
                  max="2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="system_prompt">System Prompt</Label>
              <Textarea
                id="system_prompt"
                value={formData.system_prompt}
                onChange={(e) =>
                  setFormData({ ...formData, system_prompt: e.target.value })
                }
                placeholder="Enter system prompt to guide AI behavior..."
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Active Configuration</Label>
            </div>
          </CardContent>
        </Card>

        {/* Test Results & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Model Status & Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Current Model:
                  </span>
                  <Badge variant="outline">{settings.model_name}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={settings.is_active ? "default" : "secondary"}>
                    {settings.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Updated:
                  </span>
                  <span className="text-sm">
                    {new Date(settings.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            <Separator />

            {testResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {testResult.success ? "Test Successful" : "Test Failed"}
                  </span>
                </div>

                {testResult.success && testResult.content && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Generated Content:</p>
                    <p className="text-sm">{testResult.content}</p>
                    {testResult.tokens_used && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Tokens used: {testResult.tokens_used}
                      </p>
                    )}
                  </div>
                )}

                {!testResult.success && testResult.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{testResult.error}</p>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleTest}
              disabled={testing}
              className="w-full gap-2"
              variant="outline"
            >
              {testing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              {testing ? "Testing..." : "Run Test"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent AI Generation Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent AI Generations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No AI generations yet
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {log.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {log.generation_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {log.model_used}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {log.prompt.substring(0, 100)}...
                    </p>
                    {log.error_message && (
                      <p className="text-xs text-red-600 mt-1">
                        {log.error_message}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{new Date(log.created_at).toLocaleDateString()}</div>
                    {log.tokens_used > 0 && (
                      <div>{log.tokens_used} tokens</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
