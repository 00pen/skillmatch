import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  userProfile: null,
  userRole: null,
  isAuthenticated: false,
  isLoading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  updateProfile: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { user: currentUser } = await auth.getCurrentUser();
        if (mounted && currentUser) {
          setUser(currentUser);
          const { error } = await loadUserProfile(currentUser.id);
          if (error) {
            console.error('Profile loading failed:', error);
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const authListener = auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      // Skip duplicate INITIAL_SESSION events if we already have a user
      if (event === 'INITIAL_SESSION' && user && session?.user?.id === user.id) {
        return;
      }
      
      // Handle auth state change asynchronously with proper error handling
      const handleAuthStateChange = async () => {
        try {
          if (mounted) {
            if (session?.user) {
              setUser(session.user);
              const { error } = await loadUserProfile(session.user.id);
              if (error) {
                console.error('Profile loading failed:', error);
              }
            } else {
              setUser(null);
              setUserProfile(null);
            }
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      };
      
      // Execute async function with error handling
      handleAuthStateChange().catch(error => {
        console.error('Unhandled error in auth state change:', error);
        if (mounted) {
          setIsLoading(false);
        }
      });
    });

    return () => {
      mounted = false;
      // Handle both Supabase and mock auth unsubscribe patterns
      if (authListener?.data?.subscription?.unsubscribe) {
        authListener.data.subscription.unsubscribe();
      } else if (authListener?.unsubscribe) {
        authListener.unsubscribe();
      }
    };
  }, [user?.id]);

  const loadUserProfile = async (userId) => {
    try {
      const { data: profile, error } = await db.getUserProfile(userId);
      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error loading user profile:', error);
        return { data: null, error };
      }
      setUserProfile(profile);
      return { data: profile, error: null };
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Set profile to null if there's an error to prevent infinite loading
      setUserProfile(null);
      return { data: null, error };
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      setIsLoading(true);
      const { data, error } = await auth.signUp(email, password, userData);
      
      if (error) throw error;
      
      if (data.user) {
        try {
          // Create user profile
          const profileData = {
            full_name: userData.fullName,
            role: userData.role,
            location: userData.location,
            current_job_title: userData.currentJobTitle,
            company_name: userData.companyName,
            industry: userData.industry
          };
          
          console.log('Registering user:', { ...userData, id: data.user.id });
          const { error: profileError } = await db.createUserProfile(data.user.id, profileData);
          if (profileError) {
            console.error('Error creating user profile:', profileError);
            // Don't throw error for profile creation failure, as auth was successful
          }
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
          // Don't throw error for profile creation failure
        }
      }
      
      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setIsLoading(true);
      const { data, error } = await auth.signIn(email, password);
      return { data, error };
    } catch (error) {
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await auth.signOut();
      
      // Always clear local state regardless of Supabase response
      // This ensures the UI updates immediately
      setUser(null);
      setUserProfile(null);
      
      return { error };
    } catch (error) {
      // Clear state even if signOut fails
      setUser(null);
      setUserProfile(null);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No authenticated user');
      
      const { data, error } = await db.updateUserProfile(user.id, updates);
      if (!error && data) {
        setUserProfile(data);
      }
      return { data, error };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  };

  const deleteAccount = async () => {
    try {
      setIsLoading(true);
      if (!user) throw new Error('No authenticated user');
      
      // Use the proper account deletion function from our SQL migration
      if (supabase) {
        const { error: deletionError } = await supabase.rpc('delete_user_account', {
          user_id_to_delete: user.id
        });
        if (deletionError) throw deletionError;
      } else {
        // Fallback for mock auth
        const { error: profileError } = await db.deleteUserAccount(user.id);
        if (profileError) throw profileError;
      }
      
      // Clear local state
      setUser(null);
      setUserProfile(null);
      
      return { error: null };
    } catch (error) {
      console.error('Account deletion error:', error);
      // Don't clear state if deletion fails - user should retry
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    userProfile,
    userRole: userProfile?.role,
    isAuthenticated: !!user,
    isLoading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;