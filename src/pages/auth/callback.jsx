import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, db } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Icon from '../../components/AppIcon';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Authentication failed. Please try again.');
          setStatus('error');
          return;
        }

        if (!session?.user) {
          console.error('No user in session');
          setError('Authentication failed. No user found.');
          setStatus('error');
          return;
        }

        // Check if user profile exists
        const { data: existingProfile, error: profileError } = await db.getUserProfile(session.user.id);
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile check error:', profileError);
        }

        // Get role from URL params (passed during OAuth initiation)
        const roleParam = searchParams.get('role');
        
        // Extract user info from OAuth provider
        const userMetadata = session.user.user_metadata || {};
        const identities = session.user.identities || [];
        const primaryIdentity = identities[0] || {};
        
        console.log('Full session user object:', session.user);
        console.log('OAuth user metadata:', userMetadata);
        console.log('OAuth identities:', identities);
        console.log('Primary identity:', primaryIdentity);
        console.log('Identity data:', primaryIdentity.identity_data);
        
        // Determine user info based on OAuth provider
        let fullName = userMetadata.full_name || userMetadata.name;
        let avatarUrl = userMetadata.avatar_url || userMetadata.picture;
        
        // Handle different OAuth providers with better name extraction
        if (primaryIdentity.provider === 'google') {
          // Check identity_data for Google-specific fields
          const identityData = primaryIdentity.identity_data || {};
          console.log('Google identity data:', identityData);
          
          // Google provides name in multiple formats - check all possible sources
          fullName = fullName || 
                   userMetadata.name || 
                   identityData.name ||
                   identityData.full_name ||
                   (userMetadata.given_name && userMetadata.family_name ? 
                    `${userMetadata.given_name} ${userMetadata.family_name}` : null) ||
                   (identityData.given_name && identityData.family_name ? 
                    `${identityData.given_name} ${identityData.family_name}` : null) ||
                   userMetadata.display_name ||
                   identityData.display_name;
                   
          avatarUrl = avatarUrl || 
                     userMetadata.picture || 
                     identityData.picture ||
                     userMetadata.avatar_url ||
                     identityData.avatar_url;
        } else if (primaryIdentity.provider === 'github') {
          const identityData = primaryIdentity.identity_data || {};
          fullName = fullName || userMetadata.name || identityData.name || userMetadata.user_name || identityData.login;
        } else if (primaryIdentity.provider === 'linkedin_oidc') {
          const identityData = primaryIdentity.identity_data || {};
          fullName = fullName || 
                   identityData.name ||
                   (userMetadata.given_name && userMetadata.family_name ? 
                    `${userMetadata.given_name} ${userMetadata.family_name}` : null) ||
                   (identityData.given_name && identityData.family_name ? 
                    `${identityData.given_name} ${identityData.family_name}` : null);
        }
        
        console.log('Final extracted name:', fullName);
        console.log('Final extracted avatar:', avatarUrl);

        // Create or update user profile
        if (!existingProfile) {
          const profileData = {
            full_name: fullName || session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            role: roleParam?.replace('-', '_') || 'job_seeker',
            profile_picture_url: avatarUrl,
            oauth_provider: primaryIdentity.provider,
            profile_completion: 25 // Basic info from OAuth
          };

          const { data: newProfile, error: createError } = await db.createUserProfile(session.user.id, profileData);
          
          if (createError) {
            console.error('Profile creation error:', createError);
            // Continue anyway - profile might be created by trigger
          }
        } else {
          // Update existing profile with OAuth info if not already set
          const updates = {};
          if (!existingProfile.profile_picture_url && avatarUrl) {
            updates.profile_picture_url = avatarUrl;
          }
          if (!existingProfile.oauth_provider) {
            updates.oauth_provider = primaryIdentity.provider;
          }
          
          if (Object.keys(updates).length > 0) {
            await db.updateUserProfile(session.user.id, updates);
          }
        }

        setStatus('success');
        
        // Navigate to appropriate dashboard after a brief delay
        setTimeout(() => {
          const role = existingProfile?.role || roleParam?.replace('-', '_') || 'job_seeker';
          if (role === 'employer') {
            navigate('/employer-dashboard');
          } else {
            navigate('/job-seeker-dashboard');
          }
        }, 1500);

      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Something went wrong during authentication. Please try again.');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  const handleRetry = () => {
    navigate('/login');
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-card border border-border rounded-lg shadow-card p-8">
            <div className="flex justify-center mb-6">
              <LoadingSpinner size="lg" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Completing Authentication
            </h2>
            <p className="text-text-secondary">
              Please wait while we set up your account...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-card border border-border rounded-lg shadow-card p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
                <Icon name="Check" size={32} color="white" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Authentication Successful!
            </h2>
            <p className="text-text-secondary mb-4">
              Welcome to SkillMatch. Redirecting you to your dashboard...
            </p>
            <div className="flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-card border border-border rounded-lg shadow-card p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-error rounded-full flex items-center justify-center">
                <Icon name="AlertCircle" size={32} color="white" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Authentication Failed
            </h2>
            <p className="text-text-secondary mb-6">
              {error || 'Something went wrong during authentication.'}
            </p>
            <button
              onClick={handleRetry}
              className="w-full bg-secondary text-white py-2 px-4 rounded-lg hover:bg-secondary/90 transition-colors duration-150"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
