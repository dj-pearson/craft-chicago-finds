import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserRole {
  role: 'admin' | 'city_moderator' | 'seller' | 'buyer';
  city_id?: string;
  is_active: boolean;
}

interface AdminContextType {
  isAdmin: boolean;
  isCityModerator: (cityId?: string) => boolean;
  userRoles: UserRole[];
  loading: boolean;
  checkAdminAccess: () => Promise<boolean>;
  refreshRoles: () => Promise<void>;
}

const AdminContext = React.createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserRoles = async () => {
    if (!user) {
      setUserRoles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, city_id, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching user roles:", error);
        setUserRoles([]);
      } else {
        setUserRoles(data || []);
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, [user]);

  const isAdmin = userRoles.some(role => role.role === 'admin' && role.is_active);

  const isCityModerator = (cityId?: string) => {
    if (isAdmin) return true; // Admins have access to all cities
    
    return userRoles.some(role => 
      role.role === 'city_moderator' && 
      role.is_active && 
      (!cityId || role.city_id === cityId)
    );
  };

  const checkAdminAccess = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('is_admin', {
        _user_id: user.id
      });
      
      if (error) {
        console.error("Error checking admin access:", error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error("Error checking admin access:", error);
      return false;
    }
  };

  const refreshRoles = async () => {
    await fetchUserRoles();
  };

  const value = {
    isAdmin,
    isCityModerator,
    userRoles,
    loading,
    checkAdminAccess,
    refreshRoles,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = React.useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};