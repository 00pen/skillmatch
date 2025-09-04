import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
}

console.log('Supabase Configuration:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl?.substring(0, 20) + '...'
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };
export default supabase;

// Auth helpers - Supabase only, no mock fallbacks
export const auth = {
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helpers - Supabase only, no mock fallbacks
export const db = {
  // Users
  createUserProfile: async (userId, profileData) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{ id: userId, ...profileData }])
      .select()
      .single();
    return { data, error };
  },

  getUserProfile: async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return { data, error };
  },

  updateUserProfile: async (userId, updates) => {
    try {
      // Force schema refresh by doing a simple select first
      await supabase.from('user_profiles').select('id').eq('id', userId).limit(1);
      
      // Prepare updates with proper defaults for JSONB fields
      const profileUpdates = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Ensure JSONB fields have proper format
      if (updates.certifications !== undefined) {
        profileUpdates.certifications = Array.isArray(updates.certifications) 
          ? updates.certifications 
          : [];
      }
      if (updates.education !== undefined) {
        profileUpdates.education = Array.isArray(updates.education) 
          ? updates.education 
          : [];
      }
      if (updates.work_experience !== undefined) {
        profileUpdates.work_experience = Array.isArray(updates.work_experience) 
          ? updates.work_experience 
          : [];
      }
      if (updates.skills !== undefined) {
        profileUpdates.skills = Array.isArray(updates.skills) 
          ? updates.skills 
          : [];
      }
      if (updates.languages !== undefined) {
        profileUpdates.languages = Array.isArray(updates.languages) 
          ? updates.languages 
          : [];
      }
      if (updates.employment_type_preferences !== undefined) {
        profileUpdates.employment_type_preferences = Array.isArray(updates.employment_type_preferences) 
          ? updates.employment_type_preferences 
          : [];
      }
    
      // First, check if profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { data, error } = await supabase
          .from('user_profiles')
          .insert([{ id: userId, ...profileUpdates }])
          .select()
          .single();
        return { data, error };
      } else {
        // Update existing profile
        const { data, error } = await supabase
          .from('user_profiles')
          .update(profileUpdates)
          .eq('id', userId)
          .select()
          .single();
        return { data, error };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { data: null, error };
    }
  },

  deleteUserAccount: async (userId) => {
    try {
      // First try to delete using the stored procedure
      const { data, error } = await supabase.rpc('delete_user_account', {
        p_user_id: userId
      });
      
      if (!error) {
        return { data: { success: true }, error: null };
      }
      
      console.warn('RPC function not found, performing manual deletion:', error);
      
      // Manual cleanup if RPC function doesn't exist
      const deletions = [
        supabase.from('saved_jobs').delete().eq('user_id', userId),
        supabase.from('applications').delete().eq('user_id', userId),
        supabase.from('messages').delete().eq('sender_id', userId),
        supabase.from('messages').delete().eq('recipient_id', userId),
        supabase.from('user_profiles').delete().eq('id', userId)
      ];
      
      // Execute all deletions
      const results = await Promise.allSettled(deletions);
      const errors = results.filter(r => r.status === 'rejected').map(r => r.reason);
      
      if (errors.length > 0) {
        console.error('Some deletions failed:', errors);
        return { error: errors[0] };
      }
      
      return { data: { success: true }, error: null };
    } catch (err) {
      console.error('Account deletion failed:', err);
      return { error: err };
    }
  },

  // Jobs
  getJobs: async (filters = {}) => {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        companies (
          id,
          name,
          logo_url,
          industry,
          size,
          description
        ),
        job_skills (
          skills (
            name
          )
        )
      `)
      .eq('status', 'active');

    if (filters.keywords) {
      query = query.or(`title.ilike.%${filters.keywords}%,description.ilike.%${filters.keywords}%`);
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (filters.jobTypes?.length > 0) {
      query = query.in('job_type', filters.jobTypes);
    }
    if (filters.experienceLevel) {
      query = query.eq('experience_level', filters.experienceLevel);
    }
    if (filters.remoteOnly) {
      query = query.eq('is_remote', true);
    }
    if (filters.salaryMin) {
      query = query.gte('salary_min', filters.salaryMin);
    }
    if (filters.salaryMax) {
      query = query.lte('salary_max', filters.salaryMax);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  },

  getJobById: async (jobId) => {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        companies (
          id,
          name,
          logo_url,
          industry,
          size,
          description,
          website,
          founded,
          headquarters
        ),
        job_skills (
          is_required,
          skills (
            name,
            category
          )
        )
      `)
      .eq('id', jobId)
      .maybeSingle();
    return { data, error };
  },

  createJob: async (jobData) => {
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single();
    return { data, error };
  },

  updateJob: async (jobId, updates) => {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();
    return { data, error };
  },

  deleteJob: async (jobId) => {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);
    return { error };
  },

  // Applications
  createApplication: async (applicationData) => {
    try {
      // Use the enhanced application function if available
      const { data, error } = await supabase.rpc('submit_job_application', {
        p_job_id: applicationData.job_id,
        p_user_id: applicationData.user_id,
        p_full_name: applicationData.full_name,
        p_email: applicationData.email,
        p_phone: applicationData.phone,
        p_location: applicationData.location,
        p_cover_letter: applicationData.cover_letter,
        p_resume_url: applicationData.resume_url,
        p_portfolio_url: applicationData.portfolio_url,
        p_salary_expectation: applicationData.salary_expectation,
        p_available_start_date: applicationData.available_start_date,
        p_notes: applicationData.notes
      });
      
      if (error) {
        console.error('Application function error:', error);
        // Fallback to direct insert
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('applications')
          .insert([{
            id: crypto.randomUUID(),
            ...applicationData,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select(`
            *,
            jobs (
              id,
              title,
              location,
              job_type,
              companies (
                name,
                logo_url
              )
            )
          `)
          .single();
        
        return { data: fallbackData, error: fallbackError };
      }
      
      return { data: data.success ? { id: data.application_id, status: 'pending', ...applicationData } : null, error: data.success ? null : { message: data.message } };
    } catch (err) {
      console.error('Application submission error:', err);
      return { data: null, error: err };
    }
  },

  getUserApplications: async (userId) => {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (
          id,
          title,
          location,
          job_type,
          salary_min,
          salary_max,
          companies (
            name,
            logo_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getJobApplications: async (jobId) => {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        user_profiles (
          full_name,
          current_job_title,
          location
        )
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  updateApplicationStatus: async (applicationId, status) => {
    const { data, error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .select()
      .single();
    return { data, error };
  },

  deleteApplication: async (applicationId, userId) => {
    try {
      // Direct deletion from applications table
      const { error: deleteError } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId)
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('Application deletion error:', deleteError);
        return { error: deleteError };
      }
      
      return { data: { success: true }, error: null };
    } catch (err) {
      console.error('Application deletion error:', err);
      return { error: err };
    }
  },

  // Companies
  createCompany: async (companyData) => {
    const { data, error } = await supabase
      .from('companies')
      .insert([companyData])
      .select()
      .single();
    return { data, error };
  },

  getCompanyById: async (companyId) => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    return { data, error };
  },

  getCompanyJobs: async (companyId) => {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        companies (
          name,
          logo_url
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  updateCompany: async (companyId, updates) => {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single();
    return { data, error };
  },

  deleteCompany: async (companyId) => {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);
    return { error };
  },

  // Saved Jobs
  saveJob: async (userId, jobId) => {
    const { data, error } = await supabase
      .from('saved_jobs')
      .insert([{ user_id: userId, job_id: jobId }])
      .select()
      .single();
    return { data, error };
  },

  unsaveJob: async (userId, jobId) => {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('user_id', userId)
      .eq('job_id', jobId);
    return { error };
  },

  getSavedJobs: async (userId) => {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select(`
        *,
        jobs (
          *,
          companies (
            name,
            logo_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  checkJobSaved: async (userId, jobId) => {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .maybeSingle();
    return { data: !!data, error };
  },

  // File Upload functionality
  uploadFile: async (file, bucket, filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return { data: { ...data, publicUrl }, error: null };
    } catch (err) {
      console.error('File upload error:', err);
      return { data: null, error: err };
    }
  },

  deleteFile: async (bucket, filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);
      
      return { data, error };
    } catch (err) {
      console.error('File deletion error:', err);
      return { data: null, error: err };
    }
  },

  getFileUrl: async (bucket, filePath) => {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return { data, error: null };
    } catch (err) {
      console.error('Get file URL error:', err);
      return { data: null, error: err };
    }
  },

  // Skills
  getSkills: async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('name');
    return { data, error };
  },

  createSkill: async (skillData) => {
    const { data, error } = await supabase
      .from('skills')
      .insert([skillData])
      .select()
      .single();
    return { data, error };
  },

  getUserSkills: async (userId) => {
    const { data, error } = await supabase
      .from('user_skills')
      .select(`
        *,
        skills (
          name,
          category
        )
      `)
      .eq('user_id', userId);
    return { data, error };
  },

  addUserSkill: async (userId, skillId, proficiencyLevel, yearsExperience) => {
    const { data, error } = await supabase
      .from('user_skills')
      .insert([{
        user_id: userId,
        skill_id: skillId,
        proficiency_level: proficiencyLevel,
        years_experience: yearsExperience
      }])
      .select()
      .single();
    return { data, error };
  },

  removeUserSkill: async (userId, skillId) => {
    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', userId)
      .eq('skill_id', skillId);
    return { error };
  },

  // Analytics and Stats
  getApplicationStats: async (userId) => {
    const { data, error } = await supabase
      .from('applications')
      .select('status')
      .eq('user_id', userId);
    
    if (error) return { data: null, error };
    
    const stats = data.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});
    
    return { data: stats, error: null };
  },

  getJobStats: async (createdBy) => {
    const { data, error } = await supabase
      .from('jobs')
      .select('status, application_count, view_count')
      .eq('created_by', createdBy);
    
    if (error) return { data: null, error };
    
    const stats = {
      totalJobs: data.length,
      activeJobs: data.filter(job => job.status === 'active').length,
      totalApplications: data.reduce((sum, job) => sum + (job.application_count || 0), 0),
      totalViews: data.reduce((sum, job) => sum + (job.view_count || 0), 0)
    };
    
    return { data: stats, error: null };
  },

  // Activity Tracking
  addActivity: async (userId, activityData) => {
    const { data, error } = await supabase
      .from('activities')
      .insert([{
        user_id: userId,
        ...activityData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  getUserActivities: async (userId, limit = 10) => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  deleteActivity: async (activityId) => {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);
    return { error };
  }
};