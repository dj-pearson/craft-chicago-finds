import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  CannedResponse,
  CannedResponseVariables,
  TicketCategory,
  CATEGORY_LABELS
} from '@/integrations/supabase/support-types';
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash,
  TrendingUp
} from 'lucide-react';

interface CannedResponseSelectorProps {
  onSelect: (content: string) => void;
  category?: TicketCategory;
  variables?: CannedResponseVariables;
}

export const CannedResponseSelector = ({
  onSelect,
  category,
  variables = {}
}: CannedResponseSelectorProps) => {
  const { toast } = useToast();
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<CannedResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>(category || 'all');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadResponses();
  }, []);

  useEffect(() => {
    filterResponses();
  }, [responses, searchTerm, filterCategory]);

  const loadResponses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_canned_responses')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setResponses((data || []) as CannedResponse[]);
    } catch (error) {
      console.error('Error loading canned responses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load canned responses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterResponses = () => {
    let filtered = responses;

    if (filterCategory !== 'all') {
      filtered = filtered.filter(r => r.category === filterCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.shortcode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredResponses(filtered);
  };

  const interpolateVariables = (template: string, vars: CannedResponseVariables): string => {
    let result = template;

    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || `[${key}]`);
    });

    // Replace remaining variables with placeholders
    result = result.replace(/{{(\w+)}}/g, '[$1]');

    return result;
  };

  const handleSelectResponse = async (response: CannedResponse) => {
    const interpolated = interpolateVariables(response.content, variables);
    onSelect(interpolated);
    setIsDialogOpen(false);

    // Increment usage count
    try {
      await supabase
        .from('support_canned_responses')
        .update({ usage_count: response.usage_count + 1 })
        .eq('id', response.id);
    } catch (error) {
      console.error('Error updating usage count:', error);
    }

    toast({
      title: 'Response inserted',
      description: 'Canned response has been added to your message'
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Insert Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Canned Responses</DialogTitle>
          <DialogDescription>
            Select a template to insert into your message. Variables will be automatically filled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search responses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Response List */}
          <ScrollArea className="h-96">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading responses...</p>
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  {searchTerm || filterCategory !== 'all'
                    ? 'No responses match your filters'
                    : 'No canned responses available'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {filteredResponses.map((response) => (
                  <div
                    key={response.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleSelectResponse(response)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{response.title}</h4>
                          {response.shortcode && (
                            <Badge variant="outline" className="text-xs">
                              /{response.shortcode}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {CATEGORY_LABELS[response.category]}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Used {response.usage_count} times
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded p-3 mt-2">
                      <p className="text-sm whitespace-pre-wrap line-clamp-3">
                        {interpolateVariables(response.content, variables)}
                      </p>
                    </div>

                    {response.variables && response.variables.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          Variables: {response.variables.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Component for managing canned responses (admin-only)
export const CannedResponseManager = () => {
  const { toast } = useToast();
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CannedResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_canned_responses')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      // Sort by title within each category
      const sortedData = (data || []).sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.title.localeCompare(b.title);
      });

      setResponses(sortedData as CannedResponse[]);
    } catch (error) {
      console.error('Error loading responses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load responses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: Partial<CannedResponse>) => {
    try {
      if (editing) {
        // Update existing response
        const { error } = await supabase
          .from('support_canned_responses')
          .update({
            title: data.title,
            content: data.content,
            category: data.category,
            shortcode: data.shortcode,
            variables: data.variables,
            is_active: data.is_active ?? true
          })
          .eq('id', editing.id);

        if (error) throw error;
      } else {
        // Create new response
        const { error } = await supabase
          .from('support_canned_responses')
          .insert({
            title: data.title,
            content: data.content,
            category: data.category,
            shortcode: data.shortcode,
            variables: data.variables || [],
            is_active: true,
            usage_count: 0
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: editing ? 'Response updated' : 'Response created'
      });
      setIsDialogOpen(false);
      setEditing(null);
      loadResponses();
    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: 'Error',
        description: 'Failed to save response',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this response?')) return;

    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('support_canned_responses')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Response deleted'
      });
      loadResponses();
    } catch (error) {
      console.error('Error deleting response:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete response',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Canned Responses</h2>
          <p className="text-muted-foreground">Manage quick response templates</p>
        </div>
        <Button onClick={() => { setEditing(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Response
        </Button>
      </div>

      <div className="space-y-2">
        {responses.map((response) => (
          <div key={response.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium">{response.title}</h3>
                <Badge variant="secondary" className="mt-1">
                  {CATEGORY_LABELS[response.category]}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {response.content}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditing(response); setIsDialogOpen(true); }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(response.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
