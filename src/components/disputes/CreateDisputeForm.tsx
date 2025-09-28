import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useDisputes } from '@/hooks/useDisputes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const disputeSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
  disputed_user_id: z.string().min(1, 'Disputed user ID is required'),
  dispute_type: z.enum(['quality', 'shipping', 'payment', 'description', 'other']),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
});

type DisputeFormData = z.infer<typeof disputeSchema>;

interface CreateDisputeFormProps {
  orderId?: string;
  disputedUserId?: string;
  onSuccess?: () => void;
}

export function CreateDisputeForm({ orderId, disputedUserId, onSuccess }: CreateDisputeFormProps) {
  const { user } = useAuth();
  const { createDispute } = useDisputes();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DisputeFormData>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      order_id: orderId || '',
      disputed_user_id: disputedUserId || '',
      dispute_type: 'quality',
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: DisputeFormData) => {
    if (!user) {
      toast.error('Please sign in to create a dispute');
      return;
    }

    setIsSubmitting(true);
    try {
      await createDispute({
        order_id: data.order_id,
        disputed_user_id: data.disputed_user_id,
        dispute_type: data.dispute_type,
        title: data.title,
        description: data.description,
        disputing_user_id: user.id,
        evidence_urls: [],
      });

      toast.success('Dispute created successfully');
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error('Failed to create dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  const disputeTypeOptions = [
    { value: 'quality', label: 'Product Quality' },
    { value: 'shipping', label: 'Shipping Issues' },
    { value: 'payment', label: 'Payment Problems' },
    { value: 'description', label: 'Incorrect Description' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="order_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter order ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="disputed_user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disputed User ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter user ID you have a dispute with" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dispute_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dispute Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dispute type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {disputeTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Brief description of the issue" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide detailed information about the dispute..."
                  className="min-h-32"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating Dispute...' : 'Create Dispute'}
        </Button>
      </form>
    </Form>
  );
}