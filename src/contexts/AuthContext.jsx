import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, supabase } from '../lib/supabase';

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
      
      // If no profile exists, create a basic one
      if (!profile) {
        const { data: newProfile, error: createError } = await db.createUserProfile(userId, {
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
          email: user?.email,
          role: user?.user_metadata?.role || 'job_seeker'
        });
        
        if (createError) {
          console.error('Error creating user profile:', createError);
          return { data: null, error: createError };
        }
        
        setUserProfile(newProfile);
        return { data: newProfile, error: null };
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
      
      // Use the proper account deletion function from Supabase
      const { data, error: deletionError } = await db.deleteUserAccount(user.id);
      if (deletionError) throw deletionError;
      
      // Clear local state immediately
      setUser(null);
      setUserProfile(null);
      
      // Force sign out to ensure user is logged out
      await auth.signOut();
      
      return { data, error: null };
    } catch (error) {
      console.error('Account deletion error:', error);
      // Clear state even if deletion fails to prevent further issues
      setUser(null);
      setUserProfile(null);
      await auth.signOut();
      return { data: null, error };
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