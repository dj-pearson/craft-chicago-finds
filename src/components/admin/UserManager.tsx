/* @ts-nocheck */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Users, 
  Shield, 
  Search, 
  Filter,
  Crown,
  UserCheck,
  UserX
} from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  is_seller: boolean;
  seller_verified: boolean;
  city_id: string | null;
  created_at: string;
  last_seen_at: string | null;
  cities?: {
    id: string;
    name: string;
  };
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'city_moderator' | 'buyer' | 'seller';
  city_id: string | null;
  is_active: boolean;
  granted_at: string;
  cities?: {
    id: string;
    name: string;
  };
}

interface City {
  id: string;
  name: string;
  slug: string;
}

export const UserManager = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Role assignment form
  const [roleFormData, setRoleFormData] = useState({
    role: 'city_moderator' as 'admin' | 'city_moderator',
    city_id: ''
  });

  const fetchData = async () => {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          cities:city_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          *,
          cities:city_id (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .in('role', ['admin', 'city_moderator']);

      if (rolesError) throw rolesError;

      // Fetch cities
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      if (citiesError) throw citiesError;

      setUsers(usersData || []);
      setUserRoles(rolesData || []);
      setCities(citiesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getUserRoles = (userId: string) => {
    return userRoles.filter(role => role.user_id === userId);
  };

  const hasRole = (userId: string, roleType: string) => {
    return userRoles.some(role => role.user_id === userId && role.role === roleType);
  };

  const handleAssignRole = async () => {
    if (!selectedUser) return;

    // Validate: can't assign city_moderator without city
    if (roleFormData.role === 'city_moderator' && !roleFormData.city_id) {
      toast.error('Please select a city for city moderator role');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.user_id,
          role: roleFormData.role,
          city_id: roleFormData.role === 'city_moderator' ? roleFormData.city_id : null,
          is_active: true
        });

      if (error) throw error;

      toast.success(`${roleFormData.role} role assigned successfully`);
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      setRoleFormData({ role: 'city_moderator', city_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Role revoked successfully');
      fetchData();
    } catch (error) {
      console.error('Error revoking role:', error);
      toast.error('Failed to revoke role');
    }
  };

  const handleToggleSellerVerification = async (user: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ seller_verified: !user.seller_verified })
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast.success(
        user.seller_verified 
          ? 'Seller verification removed' 
          : 'Seller verified successfully'
      );
      fetchData();
    } catch (error) {
      console.error('Error updating seller verification:', error);
      toast.error('Failed to update seller verification');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterRole === 'all') return matchesSearch;
    if (filterRole === 'admin') return matchesSearch && hasRole(user.user_id, 'admin');
    if (filterRole === 'moderator') return matchesSearch && hasRole(user.user_id, 'city_moderator');
    if (filterRole === 'seller') return matchesSearch && user.is_seller;
    if (filterRole === 'verified_seller') return matchesSearch && user.is_seller && user.seller_verified;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage user roles, permissions, and seller verification</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sellers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.is_seller).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Sellers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.is_seller && u.seller_verified).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRoles.filter(r => r.role === 'admin').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="moderator">City Moderators</SelectItem>
            <SelectItem value="seller">Sellers</SelectItem>
            <SelectItem value="verified_seller">Verified Sellers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const roles = getUserRoles(user.user_id);
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>
                          {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.display_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {roles.map((role) => (
                        <Badge 
                          key={role.id} 
                          variant={role.role === 'admin' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {role.role === 'admin' ? 'Admin' : 'Moderator'}
                          {role.cities && ` (${role.cities.name})`}
                        </Badge>
                      ))}
                      {user.is_seller && (
                        <Badge 
                          variant={user.seller_verified ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {user.seller_verified ? 'Verified Seller' : 'Seller'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.cities?.name || 'Not assigned'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.last_seen_at ? 'secondary' : 'outline'}>
                      {user.last_seen_at ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_seen_at 
                      ? new Date(user.last_seen_at).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Role</DialogTitle>
                            <DialogDescription>
                              Assign administrative roles to {user.display_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Role Type</Label>
                              <Select 
                                value={roleFormData.role} 
                                onValueChange={(value: 'admin' | 'city_moderator') => 
                                  setRoleFormData(prev => ({ ...prev, role: value, city_id: value === 'admin' ? '' : prev.city_id }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin (Global)</SelectItem>
                                  <SelectItem value="city_moderator">City Moderator</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {roleFormData.role === 'city_moderator' && (
                              <div className="space-y-2">
                                <Label>City</Label>
                                <Select 
                                  value={roleFormData.city_id} 
                                  onValueChange={(value) => setRoleFormData(prev => ({ ...prev, city_id: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a city" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {cities.map((city) => (
                                      <SelectItem key={city.id} value={city.id}>
                                        {city.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <Button onClick={handleAssignRole} disabled={submitting} className="w-full">
                              Assign Role
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {user.is_seller && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleSellerVerification(user)}
                          className="gap-1"
                        >
                          {user.seller_verified ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Active Roles Management */}
      {userRoles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Administrative Roles</CardTitle>
            <CardDescription>Manage current role assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userRoles.map((role) => {
                const user = users.find(u => u.user_id === role.user_id);
                return (
                  <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user?.display_name || 'Unknown User'}</div>
                        <div className="text-sm text-muted-foreground">
                          {role.role === 'admin' ? 'Global Admin' : `City Moderator - ${role.cities?.name || 'Unknown City'}`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeRole(role.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Revoke
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};