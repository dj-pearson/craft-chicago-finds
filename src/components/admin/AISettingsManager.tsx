import { useState, useEffect } from "react";
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
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AIModelRow = Database["public"]["Tables"]["ai_models"]["Row"];
type AISettingsRow = Database["public"]["Tables"]["ai_settings"]["Row"];
type AIGenerationLogRow = Database["public"]["Tables"]["ai_generation_logs"]["Row"];

export const AISettingsManager = () => {
  const [settings, setSettings] = useState<AISettingsRow | null>(null);
  const [logs, setLogs] = useState<AIGenerationLogRow[]>([]);
  const [models, setModels] = useState<AIModelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showModelDialog, setShowModelDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModelRow | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    content?: string;
    error?: string;
    tokens_used?: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    model_id: "",
    model_name: "claude-sonnet-4-5-20250929",
    model_provider: "anthropic",
    api_endpoint: "https://api.anthropic.com/v1/messages",
    max_tokens: 4000,
    temperature: 0.7,
    system_prompt: "",
    is_active: true,
  });

  const [modelFormData, setModelFormData] = useState({
    model_name: "",
    display_name: "",
    provider: "anthropic",
    api_endpoint: "https://api.anthropic.com/v1/messages",
    description: "",
    max_tokens: 4000,
    supports_vision: false,
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch AI models
      const { data: modelsData, error: modelsError } = await supabase
        .from("ai_models")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (modelsError) {
        console.error("Error fetching models:", modelsError);
      } else {
        setModels(modelsData || []);
      }

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
          model_id: settingsData.model_id || "",
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
      // Get selected model details
      const selectedModel = models.find((m) => m.id === formData.model_id);
      if (!selectedModel) {
        throw new Error("Please select a model");
      }

      const updateData = {
        model_id: formData.model_id,
        model_name: selectedModel.model_name,
        model_provider: selectedModel.provider,
        api_endpoint: selectedModel.api_endpoint,
        max_tokens: formData.max_tokens,
        temperature: formData.temperature,
        system_prompt: formData.system_prompt,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from("ai_settings")
          .update(updateData)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase.from("ai_settings").insert(updateData);

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
        description: error instanceof Error ? error.message : "Failed to save AI settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModel = async () => {
    try {
      if (editingModel) {
        // Update existing model
        const { error } = await supabase
          .from("ai_models")
          .update({
            ...modelFormData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingModel.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Model updated successfully",
        });
      } else {
        // Create new model
        const { error } = await supabase.from("ai_models").insert({
          ...modelFormData,
          model_type: "chat",
          supports_streaming: true,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Model added successfully",
        });
      }

      setShowModelDialog(false);
      setEditingModel(null);
      setModelFormData({
        model_name: "",
        display_name: "",
        provider: "anthropic",
        api_endpoint: "https://api.anthropic.com/v1/messages",
        description: "",
        max_tokens: 4000,
        supports_vision: false,
        is_active: true,
        is_default: false,
      });
      fetchData();
    } catch (error) {
      console.error("Error saving model:", error);
      toast({
        title: "Error",
        description: "Failed to save model",
        variant: "destructive",
      });
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm("Are you sure you want to delete this model?")) return;

    try {
      const { error } = await supabase
        .from("ai_models")
        .delete()
        .eq("id", modelId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Model deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error("Error deleting model:", error);
      toast({
        title: "Error",
        description: "Failed to delete model",
        variant: "destructive",
      });
    }
  };

  const handleSetDefaultModel = async (modelId: string) => {
    try {
      // Remove default from all models
      await supabase
        .from("ai_models")
        .update({ is_default: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // Set the selected model as default
      const { error } = await supabase
        .from("ai_models")
        .update({ is_default: true })
        .eq("id", modelId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default model updated",
      });

      fetchData();
    } catch (error) {
      console.error("Error setting default model:", error);
      toast({
        title: "Error",
        description: "Failed to set default model",
        variant: "destructive",
      });
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
              <Label htmlFor="model_id">Model</Label>
              <Select
                value={formData.model_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, model_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.display_name}
                      {model.is_default && " (Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {models.find((m) => m.id === formData.model_id)?.description}
              </p>
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
                    <p className="text-sm font-medium mb-1">
                      Generated Content:
                    </p>
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

      {/* AI Models Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Available AI Models
            </CardTitle>
            <Button
              onClick={() => {
                setEditingModel(null);
                setModelFormData({
                  model_name: "",
                  display_name: "",
                  provider: "anthropic",
                  api_endpoint: "https://api.anthropic.com/v1/messages",
                  description: "",
                  max_tokens: 4000,
                  supports_vision: false,
                  is_active: true,
                  is_default: false,
                });
                setShowModelDialog(true);
              }}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Model
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No models available
            </p>
          ) : (
            <div className="space-y-3">
              {models.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{model.display_name}</span>
                      {model.is_default && (
                        <Badge variant="default" className="text-xs">
                          Default
                        </Badge>
                      )}
                      {model.supports_vision && (
                        <Badge variant="outline" className="text-xs">
                          Vision
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {model.model_name}
                    </p>
                    {model.description && (
                      <p className="text-sm text-muted-foreground">
                        {model.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!model.is_default && (
                      <Button
                        onClick={() => handleSetDefaultModel(model.id)}
                        size="sm"
                        variant="ghost"
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setEditingModel(model);
                        setModelFormData({
                          model_name: model.model_name,
                          display_name: model.display_name,
                          provider: model.provider,
                          api_endpoint: model.api_endpoint,
                          description: model.description || "",
                          max_tokens: model.max_tokens,
                          supports_vision: model.supports_vision,
                          is_active: model.is_active,
                          is_default: model.is_default,
                        });
                        setShowModelDialog(true);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteModel(model.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                    {log.tokens_used > 0 && <div>{log.tokens_used} tokens</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Dialog */}
      <Dialog open={showModelDialog} onOpenChange={setShowModelDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingModel ? "Edit Model" : "Add New Model"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modal_model_name">Model Name</Label>
                <Input
                  id="modal_model_name"
                  value={modelFormData.model_name}
                  onChange={(e) =>
                    setModelFormData({
                      ...modelFormData,
                      model_name: e.target.value,
                    })
                  }
                  placeholder="claude-sonnet-4-5-20250929"
                />
              </div>
              <div>
                <Label htmlFor="modal_display_name">Display Name</Label>
                <Input
                  id="modal_display_name"
                  value={modelFormData.display_name}
                  onChange={(e) =>
                    setModelFormData({
                      ...modelFormData,
                      display_name: e.target.value,
                    })
                  }
                  placeholder="Claude Sonnet 4.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="modal_description">Description</Label>
              <Textarea
                id="modal_description"
                value={modelFormData.description}
                onChange={(e) =>
                  setModelFormData({
                    ...modelFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description of the model's capabilities"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modal_provider">Provider</Label>
                <Select
                  value={modelFormData.provider}
                  onValueChange={(value) =>
                    setModelFormData({ ...modelFormData, provider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="modal_max_tokens">Max Tokens</Label>
                <Input
                  id="modal_max_tokens"
                  type="number"
                  value={modelFormData.max_tokens}
                  onChange={(e) =>
                    setModelFormData({
                      ...modelFormData,
                      max_tokens: parseInt(e.target.value) || 4000,
                    })
                  }
                  min="100"
                  max="200000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="modal_api_endpoint">API Endpoint</Label>
              <Input
                id="modal_api_endpoint"
                value={modelFormData.api_endpoint}
                onChange={(e) =>
                  setModelFormData({
                    ...modelFormData,
                    api_endpoint: e.target.value,
                  })
                }
                placeholder="https://api.anthropic.com/v1/messages"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="modal_supports_vision"
                  checked={modelFormData.supports_vision}
                  onCheckedChange={(checked) =>
                    setModelFormData({
                      ...modelFormData,
                      supports_vision: checked,
                    })
                  }
                />
                <Label htmlFor="modal_supports_vision">Supports Vision</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="modal_is_active"
                  checked={modelFormData.is_active}
                  onCheckedChange={(checked) =>
                    setModelFormData({ ...modelFormData, is_active: checked })
                  }
                />
                <Label htmlFor="modal_is_active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="modal_is_default"
                  checked={modelFormData.is_default}
                  onCheckedChange={(checked) =>
                    setModelFormData({ ...modelFormData, is_default: checked })
                  }
                />
                <Label htmlFor="modal_is_default">Set as Default</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowModelDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveModel}>
                {editingModel ? "Update" : "Add"} Model
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
