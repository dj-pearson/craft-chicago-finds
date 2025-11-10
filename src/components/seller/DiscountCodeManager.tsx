import { useState } from 'react';
import { useDiscountCodes } from '@/hooks/useDiscountCodes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  TrendingUp,
  Calendar,
  DollarSign,
  Tag,
  Users,
  Percent,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { DiscountCode, CreateDiscountCodeInput, DiscountType } from '@/types/discount';

export function DiscountCodeManager() {
  const {
    discountCodes,
    stats,
    loading,
    createDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
    toggleDiscountCode,
  } = useDiscountCodes();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState<CreateDiscountCodeInput>({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    minimum_purchase_amount: 0,
    usage_per_customer: 1,
  });

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      minimum_purchase_amount: 0,
      usage_per_customer: 1,
    });
    setEditingCode(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error('Please enter a discount code');
      return;
    }

    if (formData.discount_value <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    if (editingCode) {
      const success = await updateDiscountCode({
        id: editingCode.id,
        ...formData,
      });
      if (success) {
        setIsCreateDialogOpen(false);
        resetForm();
      }
    } else {
      const success = await createDiscountCode(formData);
      if (success) {
        setIsCreateDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      minimum_purchase_amount: code.minimum_purchase_amount,
      maximum_discount_amount: code.maximum_discount_amount,
      usage_limit: code.usage_limit,
      usage_per_customer: code.usage_per_customer,
      start_date: code.start_date,
      end_date: code.end_date,
      internal_note: code.internal_note,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string, code: string) => {
    if (confirm(`Are you sure you want to delete the discount code "${code}"?`)) {
      await deleteDiscountCode(id);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const getStatusBadge = (code: DiscountCode) => {
    const now = new Date();
    const endDate = code.end_date ? new Date(code.end_date) : null;

    if (!code.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (endDate && endDate < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (code.usage_limit && code.used_count >= code.usage_limit) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }

    return <Badge className="bg-green-500">Active</Badge>;
  };

  const getDiscountDisplay = (code: DiscountCode) => {
    switch (code.discount_type) {
      case 'percentage':
        return `${code.discount_value}% off`;
      case 'fixed_amount':
        return `$${code.discount_value} off`;
      case 'free_shipping':
        return 'Free shipping';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_codes}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_codes} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_uses}</div>
              <p className="text-xs text-muted-foreground">Across all codes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Discount Given</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.total_discount_given.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Total savings for customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg per Use</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.total_uses > 0 ? (stats.total_discount_given / stats.total_uses).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Average discount amount</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Discount Codes</CardTitle>
              <CardDescription>
                Create and manage promotional discount codes for your products
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
                    </DialogTitle>
                    <DialogDescription>
                      Set up a promotional discount code for your customers
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    {/* Code */}
                    <div className="grid gap-2">
                      <Label htmlFor="code">
                        Discount Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="WELCOME10"
                        maxLength={50}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Use uppercase letters and numbers (e.g., SAVE20, SUMMER2025)
                      </p>
                    </div>

                    {/* Discount Type & Value */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="discount_type">Discount Type</Label>
                        <Select
                          value={formData.discount_type}
                          onValueChange={(value: DiscountType) =>
                            setFormData({ ...formData, discount_type: value })
                          }
                        >
                          <SelectTrigger id="discount_type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage Off</SelectItem>
                            <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                            <SelectItem value="free_shipping">Free Shipping</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.discount_type !== 'free_shipping' && (
                        <div className="grid gap-2">
                          <Label htmlFor="discount_value">
                            {formData.discount_type === 'percentage' ? 'Percentage' : 'Amount ($)'}
                          </Label>
                          <Input
                            id="discount_value"
                            type="number"
                            value={formData.discount_value}
                            onChange={(e) =>
                              setFormData({ ...formData, discount_value: parseFloat(e.target.value) })
                            }
                            min="0"
                            step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                            max={formData.discount_type === 'percentage' ? '100' : undefined}
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* Minimum Purchase */}
                    <div className="grid gap-2">
                      <Label htmlFor="minimum_purchase">Minimum Purchase Amount ($)</Label>
                      <Input
                        id="minimum_purchase"
                        type="number"
                        value={formData.minimum_purchase_amount}
                        onChange={(e) =>
                          setFormData({ ...formData, minimum_purchase_amount: parseFloat(e.target.value) || 0 })
                        }
                        min="0"
                        step="0.01"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave at 0 for no minimum
                      </p>
                    </div>

                    {/* Maximum Discount (for percentage) */}
                    {formData.discount_type === 'percentage' && (
                      <div className="grid gap-2">
                        <Label htmlFor="max_discount">Maximum Discount Amount ($) - Optional</Label>
                        <Input
                          id="max_discount"
                          type="number"
                          value={formData.maximum_discount_amount || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maximum_discount_amount: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          min="0"
                          step="0.01"
                          placeholder="No cap"
                        />
                        <p className="text-xs text-muted-foreground">
                          Cap the maximum discount (e.g., 10% off, max $50)
                        </p>
                      </div>
                    )}

                    {/* Usage Limits */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="usage_limit">Total Usage Limit - Optional</Label>
                        <Input
                          id="usage_limit"
                          type="number"
                          value={formData.usage_limit || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              usage_limit: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          min="1"
                          placeholder="Unlimited"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="usage_per_customer">Uses per Customer</Label>
                        <Input
                          id="usage_per_customer"
                          type="number"
                          value={formData.usage_per_customer}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              usage_per_customer: parseInt(e.target.value) || 1,
                            })
                          }
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="start_date">Start Date - Optional</Label>
                        <Input
                          id="start_date"
                          type="datetime-local"
                          value={formData.start_date ? format(new Date(formData.start_date), "yyyy-MM-dd'T'HH:mm") : ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              start_date: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                            })
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="end_date">End Date - Optional</Label>
                        <Input
                          id="end_date"
                          type="datetime-local"
                          value={formData.end_date ? format(new Date(formData.end_date), "yyyy-MM-dd'T'HH:mm") : ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              end_date: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Internal Note */}
                    <div className="grid gap-2">
                      <Label htmlFor="internal_note">Internal Note - Optional</Label>
                      <Textarea
                        id="internal_note"
                        value={formData.internal_note || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, internal_note: e.target.value })
                        }
                        placeholder="Note to yourself about this promotion (not visible to customers)"
                        rows={2}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingCode ? 'Update Code' : 'Create Code'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {loading && discountCodes.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : discountCodes.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No discount codes yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first discount code to start offering promotions
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Code
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discountCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-sm">{code.code}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCode(code.code)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        {code.minimum_purchase_amount > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Min. purchase: ${code.minimum_purchase_amount}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {code.discount_type === 'percentage' && <Percent className="h-3 w-3" />}
                          {code.discount_type === 'fixed_amount' && <DollarSign className="h-3 w-3" />}
                          <span>{getDiscountDisplay(code)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{code.used_count} uses</div>
                          {code.usage_limit && (
                            <div className="text-xs text-muted-foreground">
                              of {code.usage_limit} limit
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {code.start_date && (
                            <div>Start: {format(new Date(code.start_date), 'MMM d, yyyy')}</div>
                          )}
                          {code.end_date && (
                            <div>End: {format(new Date(code.end_date), 'MMM d, yyyy')}</div>
                          )}
                          {!code.start_date && !code.end_date && <div>No expiration</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(code)}
                          <Switch
                            checked={code.is_active}
                            onCheckedChange={(checked) => toggleDiscountCode(code.id, checked)}
                            disabled={loading}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(code)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(code.id, code.code)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
