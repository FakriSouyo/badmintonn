import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider effect running");
    
    const fetchSession = async () => {
      try {
        console.log("Getting initial session");
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        console.log("Initial session:", session);
        handleSession(session);
      } catch (error) {
        console.error('Error getting initial session:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth event:', event);
      handleSession(session);
    });

    return () => {
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSession = async (session) => {
    setSession(session);
    if (session) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;

        console.log("User data fetched:", userData);
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error.message);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging in:', error.message);
      throw error;
    }
  };

  const signup = async (email, password, userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: userData
        }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error signing up:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error logging out:', error.message);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}