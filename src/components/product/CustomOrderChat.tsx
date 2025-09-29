import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageCircle, 
  Upload, 
  Send, 
  Pencil, 
  Eraser, 
  Undo, 
  Download,
  Check,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CustomOrderChatProps {
  listingId: string;
  sellerId: string;
  productTitle: string;
  className?: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  message_type: 'text' | 'image' | 'markup';
  content?: string;
  image_url?: string;
  markup_data?: any;
  created_at: string;
  sender?: {
    display_name: string;
  };
}

interface MarkupAnnotation {
  type: 'arrow' | 'circle' | 'text' | 'line';
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  radius?: number;
  text?: string;
  color: string;
  strokeWidth: number;
}

export const CustomOrderChat = ({ 
  listingId, 
  sellerId, 
  productTitle,
  className = "" 
}: CustomOrderChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'arrow' | 'circle' | 'text' | 'line'>('arrow');
  const [annotations, setAnnotations] = useState<MarkupAnnotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<MarkupAnnotation | null>(null);
  const [drawingColor, setDrawingColor] = useState('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [loading, setLoading] = useState(false);

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && user) {
      initializeChat();
    }
  }, [isOpen, user]);

  // Load messages when chat is initialized
  useEffect(() => {
    if (chatId) {
      loadMessages();
    }
  }, [chatId]);

  const initializeChat = async () => {
    if (!user) return;

    try {
      // Check if chat already exists
      const { data: existingChat, error: fetchError } = await supabase
        .from('custom_order_chats')
        .select('id')
        .eq('listing_id', listingId)
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .eq('status', 'active')
        .single();

      if (existingChat) {
        setChatId(existingChat.id);
        return;
      }

      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('custom_order_chats')
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: sellerId,
          status: 'active'
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating chat:', createError);
        toast({
          title: "Error",
          description: "Failed to start custom order discussion",
          variant: "destructive"
        });
        return;
      }

      setChatId(newChat.id);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const loadMessages = async () => {
    if (!chatId) return;

    try {
      const { data, error } = await supabase
        .from('custom_order_messages')
        .select(`
          id,
          sender_id,
          message_type,
          content,
          image_url,
          markup_data,
          created_at,
          sender:sender_id(display_name)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendTextMessage = async () => {
    if (!chatId || !newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('custom_order_messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          message_type: 'text',
          content: newMessage.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
        return;
      }

      setNewMessage("");
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      // Upload to Supabase storage
      const fileName = `custom-order-${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('temp-images')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('temp-images')
        .getPublicUrl(fileName);

      setUploadedImage(publicUrl);
      setAnnotations([]); // Reset annotations for new image
      
      // Send image message
      if (chatId) {
        await supabase
          .from('custom_order_messages')
          .insert({
            chat_id: chatId,
            sender_id: user.id,
            message_type: 'image',
            image_url: publicUrl
          });
        
        loadMessages();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!uploadedImage) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const newAnnotation: MarkupAnnotation = {
      type: drawingMode,
      x,
      y,
      color: drawingColor,
      strokeWidth
    };

    setCurrentAnnotation(newAnnotation);
    setIsDrawing(true);
  };

  const continueDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x2 = (event.clientX - rect.left) / rect.width;
    const y2 = (event.clientY - rect.top) / rect.height;

    if (drawingMode === 'line' || drawingMode === 'arrow') {
      setCurrentAnnotation({ ...currentAnnotation, x2, y2 });
    } else if (drawingMode === 'circle') {
      const radius = Math.sqrt(Math.pow(x2 - currentAnnotation.x, 2) + Math.pow(y2 - currentAnnotation.y, 2));
      setCurrentAnnotation({ ...currentAnnotation, radius });
    }

    drawCanvas();
  };

  const finishDrawing = () => {
    if (!isDrawing || !currentAnnotation) return;

    setAnnotations(prev => [...prev, currentAnnotation]);
    setCurrentAnnotation(null);
    setIsDrawing(false);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadedImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw all annotations
      [...annotations, currentAnnotation].filter(Boolean).forEach(annotation => {
        if (!annotation) return;
        
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = annotation.strokeWidth;
        ctx.lineCap = 'round';
        
        const x = annotation.x * canvas.width;
        const y = annotation.y * canvas.height;
        
        ctx.beginPath();
        
        switch (annotation.type) {
          case 'line':
            if (annotation.x2 !== undefined && annotation.y2 !== undefined) {
              const x2 = annotation.x2 * canvas.width;
              const y2 = annotation.y2 * canvas.height;
              ctx.moveTo(x, y);
              ctx.lineTo(x2, y2);
            }
            break;
          case 'arrow':
            if (annotation.x2 !== undefined && annotation.y2 !== undefined) {
              const x2 = annotation.x2 * canvas.width;
              const y2 = annotation.y2 * canvas.height;
              
              // Draw line
              ctx.moveTo(x, y);
              ctx.lineTo(x2, y2);
              
              // Draw arrowhead
              const angle = Math.atan2(y2 - y, x2 - x);
              const headLength = 15;
              ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
              ctx.moveTo(x2, y2);
              ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
            }
            break;
          case 'circle':
            if (annotation.radius !== undefined) {
              ctx.arc(x, y, annotation.radius * Math.min(canvas.width, canvas.height), 0, 2 * Math.PI);
            }
            break;
        }
        
        ctx.stroke();
      });
    };
    
    img.src = uploadedImage;
  };

  useEffect(() => {
    drawCanvas();
  }, [annotations, currentAnnotation, uploadedImage]);

  const saveMarkup = async () => {
    if (!chatId || !user || annotations.length === 0) return;

    try {
      const { error } = await supabase
        .from('custom_order_messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          message_type: 'markup',
          image_url: uploadedImage,
          markup_data: { annotations }
        });

      if (error) {
        console.error('Error saving markup:', error);
        toast({
          title: "Error",
          description: "Failed to save markup",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Markup saved successfully"
      });
      
      setAnnotations([]);
      setUploadedImage(null);
      loadMessages();
    } catch (error) {
      console.error('Error saving markup:', error);
    }
  };

  const clearMarkup = () => {
    setAnnotations([]);
    setCurrentAnnotation(null);
    drawCanvas();
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Discuss Custom Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Custom Order Discussion - {productTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
          {/* Chat Messages */}
          <div className="flex flex-col">
            <ScrollArea className="flex-1 p-4 border rounded-lg">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender_id === user.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.message_type === 'text' && (
                        <p className="text-sm">{message.content}</p>
                      )}
                      {message.message_type === 'image' && message.image_url && (
                        <img
                          src={message.image_url}
                          alt="Uploaded"
                          className="max-w-full h-auto rounded"
                        />
                      )}
                      {message.message_type === 'markup' && message.image_url && (
                        <div className="space-y-2">
                          <img
                            src={message.image_url}
                            alt="Markup"
                            className="max-w-full h-auto rounded"
                          />
                          <Badge variant="secondary" className="text-xs">
                            Markup annotations included
                          </Badge>
                        </div>
                      )}
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* Message Input */}
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                  className="flex-1"
                />
                <Button onClick={sendTextMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
            </div>
          </div>

          {/* Image Markup */}
          <div className="flex flex-col">
            <div className="flex-1 border rounded-lg p-4">
              {uploadedImage ? (
                <div className="space-y-4">
                  {/* Drawing Tools */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex gap-1">
                      {(['arrow', 'line', 'circle'] as const).map((mode) => (
                        <Button
                          key={mode}
                          variant={drawingMode === mode ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDrawingMode(mode)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                    
                    <Separator orientation="vertical" className="h-6" />
                    
                    <input
                      type="color"
                      value={drawingColor}
                      onChange={(e) => setDrawingColor(e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    
                    <Input
                      type="range"
                      min="1"
                      max="10"
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(Number(e.target.value))}
                      className="w-20"
                    />
                    
                    <Button variant="outline" size="sm" onClick={clearMarkup}>
                      <Eraser className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Canvas */}
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={400}
                      className="border rounded cursor-crosshair max-w-full"
                      onMouseDown={startDrawing}
                      onMouseMove={continueDrawing}
                      onMouseUp={finishDrawing}
                      onMouseLeave={finishDrawing}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button onClick={saveMarkup} disabled={annotations.length === 0}>
                      <Check className="h-4 w-4 mr-2" />
                      Send Markup
                    </Button>
                    <Button variant="outline" onClick={() => setUploadedImage(null)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Upload a photo to start marking up details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
