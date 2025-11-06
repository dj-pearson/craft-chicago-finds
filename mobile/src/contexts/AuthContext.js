import React, {createContext, useState, useEffect, useContext} from 'react';
import {supabase} from '../config/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({data: {session}}) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {data: {subscription}} = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const {data, error} = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return {data, error};
  };

  const signUp = async (email, password, metadata = {}) => {
    const {data, error} = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return {data, error};
  };

  const signOut = async () => {
    const {error} = await supabase.auth.signOut();
    return {error};
  };

  const resetPassword = async email => {
    const {data, error} = await supabase.auth.resetPasswordForEmail(email);
    return {data, error};
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
