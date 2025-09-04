import { createClient } from '@supabase/supabase-js';
import { mockAuth } from './database.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have real Supabase credentials
const USE_MOCK_AUTH = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project') || supabaseUrl.includes('localhost');
const USE_LOCAL_DB = USE_MOCK_AUTH; // Use local DB only when we don't have real Supabase

console.log('Supabase Configuration:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  useMockAuth: USE_MOCK_AUTH,
  url: supabaseUrl?.substring(0, 20) + '...' || 'not set'
});

let supabase = null;
if (!USE_MOCK_AUTH) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn('Failed to create Supabase client, falling back to mock auth:', error);
  }
}

export { supabase };

// Auth helpers - with fallback to mock auth for development
export const auth = {
  signUp: async (email, password, userData = {}) => {
    if (USE_MOCK_AUTH || !supabase) {
      return await mockAuth.signUp(email, password, userData);
    }
    
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
    if (USE_MOCK_AUTH || !supabase) {
      return await mockAuth.signIn(email, password);
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    if (USE_MOCK_AUTH || !supabase) {
      return await mockAuth.signOut();
    }
    
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    if (USE_MOCK_AUTH || !supabase) {
      return await mockAuth.getCurrentUser();
    }
    
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback) => {
    if (USE_MOCK_AUTH || !supabase) {
      return mockAuth.onAuthStateChange(callback);
    }
    
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helpers - with fallback to mock for development
export const db = {
  // Users
  createUserProfile: async (userId, profileData) => {
    if (USE_MOCK_AUTH || !supabase) {
      return await mockAuth.createUserProfile(userId, profileData);
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{ user_id: userId, ...profileData }])
      .select()
      .single();
    return { data, error };
  },

  getUserProfile: async (userId) => {
    if (USE_MOCK_AUTH || !supabase) {
      return await mockAuth.getUserProfile(userId);
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return { data, error };
  },

  updateUserProfile: async (userId, updates) => {
    if (USE_MOCK_AUTH || !supabase) {
      return await mockAuth.updateUserProfile(userId, updates);
    }
    
    // Comprehensive list of allowed fields for user profiles
    const allowedFields = [
      'full_name', 'role', 'location', 'current_job_title', 'company_name', 
      'industry', 'bio', 'website_url', 'linkedin_url', 'github_url', 
      'portfolio_url', 'phone', 'date_of_birth', 'gender', 'nationality',
      'years_experience', 'expected_salary_min', 'expected_salary_max',
      'salary_currency', 'employment_type_preferences', 'remote_work_preference',
      'availability', 'notice_period', 'skills', 'languages', 'certifications',
      'education', 'work_experience', 'resume_url', 'cover_letter_url',
      'profile_image_url', 'experience_level'
    ];
    
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key))
    );
    
    // Ensure updated_at is set
    filteredUpdates.updated_at = new Date().toISOString();
    
    // First, check if profile exists, if not create it
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (!existingProfile) {
      // Create profile if it doesn't exist
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{ id: userId, ...filteredUpdates }])
        .select()
        .single();
      return { data, error };
    } else {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update(filteredUpdates)
        .eq('id', userId)
        .select()
        .single();
      return { data, error };
    }
  },

  deleteUserAccount: async (userId) => {
    if (USE_MOCK_AUTH || !supabase) {
      return await mockAuth.deleteUserAccount(userId);
    }
    
    try {
      // Use the database function for proper account deletion
      const { data, error } = await supabase.rpc('delete_user_account', {
        p_user_id: userId
      });
      
      if (error) {
        console.error('Database deletion error:', error);
        // Fallback to direct deletion if function doesn't exist
        const { error: deleteError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', userId);
        return { error: deleteError };
      }
      
      return { data, error: null };
    } catch (err) {
      console.error('Account deletion failed:', err);
      return { error: err };
    }
  },

  // Jobs
  getJobs: async (filters = {}) => {
    if (USE_MOCK_AUTH || !supabase) {
      // Return mock jobs data for development
      return {
        data: [
          {
            id: 1,
            title: 'Senior Software Engineer',
            description: 'We are looking for a Senior Software Engineer to join our growing team.',
            location: 'San Francisco, CA',
            job_type: 'full-time',
            experience_level: 'senior',
            salary_min: 120000,
            salary_max: 150000,
            salary_currency: 'USD',
            is_remote: true,
            created_at: '2024-01-15T10:00:00Z',
            companies: {
              id: 1,
              name: 'TechCorp Inc.',
              logo_url: null,
              industry: 'technology',
              size: '100-500',
              description: 'Leading technology company'
            },
            skills_required: ['React', 'Node.js', 'JavaScript', 'Python']
          },
          {
            id: 2,
            title: 'Product Marketing Manager',
            description: 'Join our marketing team to drive product growth and user engagement.',
            location: 'New York, NY',
            job_type: 'full-time',
            experience_level: 'mid',
            salary_min: 90000,
            salary_max: 110000,
            salary_currency: 'USD',
            is_remote: false,
            created_at: '2024-01-14T15:30:00Z',
            companies: {
              id: 2,
              name: 'StartupXYZ',
              logo_url: null,
              industry: 'technology',
              size: '50-100',
              description: 'Fast-growing startup'
            },
            skills_required: ['Product Marketing', 'Analytics', 'A/B Testing']
          }
        ],
        error: null
      };
    }
    
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
    if (USE_MOCK_AUTH || !supabase) {
      // Return mock job detail for development
      const mockJob = {
        id: parseInt(jobId),
        title: 'Senior Software Engineer',
        description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for building scalable web applications and leading technical initiatives.',
        requirements: 'Bachelor\'s degree in Computer Science or related field. 5+ years of experience with React, Node.js, and cloud technologies.',
        responsibilities: 'Lead development of new features, mentor junior developers, collaborate with product team, ensure code quality and best practices.',
        benefits: 'Competitive salary, equity, health insurance, 401k matching, flexible PTO, remote work options.',
        location: 'San Francisco, CA',
        job_type: 'full-time',
        employment_type: 'full-time',
        experience_level: 'senior',
        salary_min: 120000,
        salary_max: 150000,
        salary_currency: 'USD',
        is_remote: true,
        skills_required: ['React', 'Node.js', 'JavaScript', 'Python', 'AWS'],
        application_deadline: '2024-03-01',
        start_date: '2024-03-15',
        contact_email: 'hiring@techcorp.com',
        contact_phone: '+1 (555) 123-4567',
        is_urgent: false,
        application_instructions: 'Please include your portfolio and a brief cover letter.',
        created_at: '2024-01-15T10:00:00Z',
        companies: {
          id: 1,
          name: 'TechCorp Inc.',
          logo_url: null,
          industry: 'technology',
          size: '100-500',
          description: 'Leading technology company focused on innovative solutions.',
          website: 'https://techcorp.com',
          founded: '2010',
          headquarters: 'San Francisco, CA'
        }
      };
      return { data: mockJob, error: null };
    }
    
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
    if (USE_MOCK_AUTH || !supabase) {
      // Mock application for development
      return {
        data: {
          id: `mock-app-${Date.now()}`,
          status: 'pending',
          created_at: new Date().toISOString(),
          ...applicationData
        },
        error: null
      };
    }
    
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

  deleteApplication: async (applicationId) => {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId);
    return { error };
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
    if (USE_MOCK_AUTH || !supabase) {
      // Mock file upload for development
      return {
        data: { path: `/mock-uploads/${bucket}/${filePath}` },
        error: null
      };
    }
    
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
    if (USE_MOCK_AUTH || !supabase) {
      return { error: null };
    }
    
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
    if (USE_MOCK_AUTH || !supabase) {
      return { data: { publicUrl: `/mock-uploads/${bucket}/${filePath}` }, error: null };
    }
    
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
    if (USE_MOCK_AUTH || !supabase) {
      return { data: [], error: null };
    }
    
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
  }
};