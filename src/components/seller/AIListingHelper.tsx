import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2, FileText, Tags, DollarSign, RefreshCw, Star, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface AIListingHelperProps {
  imageUrl?: string;
  category?: string;
  currentTitle?: string;
  currentDescription?: string;
  currentTags?: string;
  onContentGenerated: (content: {
    title?: string;
    description?: string;
    tags?: string[];
  }) => void;
  className?: string;
}

interface GeneratedContent {
  title: string;
  description: string;
  tags: string[];
  suggested_price_range?: {
    min: number;
    max: number;
  };
}

interface SavedGeneration {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  tone: string;
  savedAt: number;
}

export const AIListingHelper = ({
  imageUrl,
  category,
  currentTitle = "",
  currentDescription = "",
  currentTags = "",
  onContentGenerated,
  className
}: AIListingHelperProps) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [sellerNotes, setSellerNotes] = useState("");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [selectedTone, setSelectedTone] = useState<string>("professional");
  const [regeneratingField, setRegeneratingField] = useState<string | null>(null);
  const [savedGenerations, setSavedGenerations] = useState<SavedGeneration[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  // Load saved generations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai_saved_generations');
    if (saved) {
      try {
        setSavedGenerations(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved generations:', e);
      }
    }
  }, []);

  const saveGeneration = () => {
    if (!generatedContent) return;

    const newSave: SavedGeneration = {
      id: Date.now().toString(),
      title: generatedContent.title,
      description: generatedContent.description,
      tags: generatedContent.tags,
      category: category || 'General',
      tone: selectedTone,
      savedAt: Date.now(),
    };

    const updated = [newSave, ...savedGenerations].slice(0, 10); // Keep last 10
    setSavedGenerations(updated);
    localStorage.setItem('ai_saved_generations', JSON.stringify(updated));

    toast({
      title: "Saved!",
      description: "AI generation saved to your favorites",
    });
  };

  const loadSavedGeneration = (saved: SavedGeneration) => {
    setGeneratedContent({
      title: saved.title,
      description: saved.description,
      tags: saved.tags,
      suggested_price_range: { min: 0, max: 0 }, // Not saved
    });
    setSelectedTone(saved.tone);
    setShowSaved(false);
    toast({
      title: "Loaded!",
      description: "Saved generation loaded. Click 'Use All' to apply.",
    });
  };

  const deleteSavedGeneration = (id: string) => {
    const updated = savedGenerations.filter(s => s.id !== id);
    setSavedGenerations(updated);
    localStorage.setItem('ai_saved_generations', JSON.stringify(updated));
    toast({
      title: "Deleted",
      description: "Saved generation removed",
    });
  };

  const regenerateField = async (field: 'title' | 'description' | 'tags') => {
    if (!generatedContent && !sellerNotes.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide seller notes first",
        variant: "destructive",
      });
      return;
    }

    setRegeneratingField(field);
    try {
      const fieldPrompts = {
        title: `Generate only a compelling, SEO-friendly product title (max 80 characters) in a ${selectedTone} tone.`,
        description: `Generate only a detailed product description (150-300 words) in a ${selectedTone} tone.`,
        tags: `Generate only 8-12 relevant searchability tags as a JSON array.`
      };

      const prompt = `
Context:
- Category: ${category || "General craft item"}
- Seller notes: ${sellerNotes}
- Tone: ${selectedTone}

${fieldPrompts[field]}

Product context: ${generatedContent?.title || currentTitle || "Handmade craft item"}

Return only the ${field} as plain text${field === 'tags' ? ' (JSON array format)' : ''}.
`;

      const { data, error } = await supabase.functions.invoke("ai-generate-content", {
        body: {
          prompt,
          generation_type: `listing_${field}`,
          context: { category, tone: selectedTone },
        },
      });

      if (error) throw error;

      // Update only the regenerated field
      setGeneratedContent(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        if (field === 'tags') {
          try {
            updated.tags = JSON.parse(data.content.replace(/```json|```/g, '').trim());
          } catch {
            updated.tags = data.content.split(',').map((t: string) => t.trim());
          }
        } else {
          updated[field] = data.content.trim();
        }
        return updated;
      });

      toast({
        title: `${field.charAt(0).toUpperCase() + field.slice(1)} regenerated!`,
        description: `New ${field} with ${selectedTone} tone generated successfully`,
      });
    } catch (error) {
      console.error(`Error regenerating ${field}:`, error);
      toast({
        title: "Regeneration failed",
        description: error instanceof Error ? error.message : `Failed to regenerate ${field}`,
        variant: "destructive",
      });
    } finally {
      setRegeneratingField(null);
    }
  };

  const generateContent = async () => {
    if (!imageUrl && !sellerNotes.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload an image or provide seller notes",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      // Create a comprehensive prompt for AI content generation
      const prompt = `
Generate compelling marketplace listing content for a handmade/craft item.

Context:
- Category: ${category || "General craft item"}
- Seller notes: ${sellerNotes}
- Current title: ${currentTitle}
- Current description: ${currentDescription}
- Current tags: ${currentTags}
- Has image: ${imageUrl ? "Yes" : "No"}
- Tone: ${selectedTone}

Please generate:
1. A compelling, SEO-friendly title (max 80 characters) in a ${selectedTone} tone
2. A detailed product description (150-300 words) in a ${selectedTone} tone that highlights:
   - What makes this item special/unique
   - Materials and craftsmanship details
   - Use cases and benefits
   - Care instructions if relevant
3. 8-12 relevant tags for searchability
4. Suggested price range based on category and description

Focus on:
- Local craft marketplace audience
- Handmade/artisan appeal
- Chicago market if relevant
- SEO keywords for discovery
- Emotional connection and storytelling

Format as JSON:
{
  "title": "Compelling title here",
  "description": "Detailed description here",
  "tags": ["tag1", "tag2", "tag3", ...],
  "suggested_price_range": {
    "min": 25,
    "max": 75
  }
}
`;

      const { data, error } = await supabase.functions.invoke("ai-generate-content", {
        body: {
          prompt,
          generation_type: "listing_content",
          context: {
            category,
            seller_notes: sellerNotes,
            has_image: !!imageUrl,
            tone: selectedTone,
            current_content: {
              title: currentTitle,
              description: currentDescription,
              tags: currentTags
            }
          },
        },
      });

      if (error) {
        throw error;
      }

      // Parse the AI response
      let parsedContent: GeneratedContent;
      try {
        // Try to extract JSON from the response
        const jsonMatch = data.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedContent = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback parsing if JSON is not properly formatted
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        // Fallback to manual parsing if JSON parsing fails
        parsedContent = {
          title: extractField(data.content, "title") || "AI-Generated Title",
          description: extractField(data.content, "description") || data.content.substring(0, 300),
          tags: extractTags(data.content),
          suggested_price_range: { min: 25, max: 75 }
        };
      }

      setGeneratedContent(parsedContent);
      
      toast({
        title: "Content generated!",
        description: `Generated ${data.tokens_used} tokens of content`,
      });
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const useGeneratedContent = () => {
    if (generatedContent) {
      onContentGenerated({
        title: generatedContent.title,
        description: generatedContent.description,
        tags: generatedContent.tags,
      });
      
      toast({
        title: "Content applied",
        description: "AI-generated content has been added to your listing",
      });
    }
  };

  const usePartialContent = (field: 'title' | 'description' | 'tags') => {
    if (generatedContent) {
      const content: any = {};
      if (field === 'tags') {
        content.tags = generatedContent.tags;
      } else {
        content[field] = generatedContent[field];
      }
      
      onContentGenerated(content);
      
      toast({
        title: `${field} applied`,
        description: `AI-generated ${field} has been added to your listing`,
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          AI Listing Helper
        </CardTitle>
        <CardDescription>
          Generate compelling titles, descriptions, and tags based on your product photos and notes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seller Notes Input */}
        <div className="space-y-2">
          <Label htmlFor="seller-notes">
            Tell us about your item
          </Label>
          <Textarea
            id="seller-notes"
            placeholder="Describe your item: materials used, inspiration, special techniques, what makes it unique..."
            value={sellerNotes}
            onChange={(e) => setSellerNotes(e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
            The more details you provide, the better the AI-generated content will be.
          </p>
        </div>

        {/* Tone Selection */}
        <div className="space-y-2">
          <Label htmlFor="tone">Writing Tone</Label>
          <Select value={selectedTone} onValueChange={setSelectedTone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly & Warm</SelectItem>
              <SelectItem value="casual">Casual & Relaxed</SelectItem>
              <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
              <SelectItem value="storytelling">Storytelling</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose the tone that matches your brand voice
          </p>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateContent}
          disabled={generating || (!imageUrl && !sellerNotes.trim())}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating content...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Listing Content
            </>
          )}
        </Button>

        {/* Generated Content Display */}
        {generatedContent && (
          <div className="space-y-6">
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Generated Content</h3>
              
              {/* Generated Title */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Title
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => regenerateField('title')}
                      disabled={regeneratingField === 'title'}
                    >
                      {regeneratingField === 'title' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => usePartialContent('title')}
                    >
                      Use Title
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{generatedContent.title}</p>
                </div>
              </div>

              {/* Generated Description */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => regenerateField('description')}
                      disabled={regeneratingField === 'description'}
                    >
                      {regeneratingField === 'description' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => usePartialContent('description')}
                    >
                      Use Description
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{generatedContent.description}</p>
                </div>
              </div>

              {/* Generated Tags */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Tags className="h-4 w-4" />
                    Tags
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => regenerateField('tags')}
                      disabled={regeneratingField === 'tags'}
                    >
                      {regeneratingField === 'tags' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => usePartialContent('tags')}
                    >
                      Use Tags
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {generatedContent.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Price Suggestion */}
              {generatedContent.suggested_price_range && (
                <div className="space-y-2 mb-4">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Suggested Price Range
                  </Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      ${generatedContent.suggested_price_range.min} - ${generatedContent.suggested_price_range.max}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on category and product description
                    </p>
                  </div>
                </div>
              )}

              {/* Use All Button */}
              <div className="flex gap-2">
                <Button onClick={useGeneratedContent} className="flex-1">
                  Use All Generated Content
                </Button>
                <Button
                  onClick={saveGeneration}
                  variant="outline"
                  className="gap-2"
                  title="Save this generation for later"
                >
                  <Star className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Generations */}
        {savedGenerations.length > 0 && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Saved Generations ({savedGenerations.length}/10)</h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSaved(!showSaved)}
              >
                {showSaved ? 'Hide' : 'Show'}
              </Button>
            </div>

            {showSaved && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedGenerations.map((saved) => (
                  <Card key={saved.id} className="p-3 hover:bg-muted/50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{saved.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {saved.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {saved.tone}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => loadSavedGeneration(saved)}
                            className="h-7 px-2"
                          >
                            Load
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSavedGeneration(saved.id)}
                            className="h-7 px-2 text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {saved.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(saved.savedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p><strong>Tips for better results:</strong></p>
          <p>• Include materials, techniques, and inspiration</p>
          <p>• Mention size, color, and unique features</p>
          <p>• Describe the intended use or occasion</p>
          <p>• Add any special care instructions</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions for parsing AI responses
function extractField(content: string, field: string): string | null {
  const regex = new RegExp(`"${field}":\\s*"([^"]*)"`, 'i');
  const match = content.match(regex);
  return match ? match[1] : null;
}

function extractTags(content: string): string[] {
  const tagsMatch = content.match(/"tags":\s*\[([^\]]*)\]/i);
  if (tagsMatch) {
    return tagsMatch[1]
      .split(',')
      .map(tag => tag.trim().replace(/"/g, ''))
      .filter(Boolean);
  }
  
  // Fallback: extract words that look like tags
  const words = content.toLowerCase().match(/\b\w+\b/g) || [];
  return words
    .filter(word => word.length > 2 && word.length < 20)
    .slice(0, 8);
}
