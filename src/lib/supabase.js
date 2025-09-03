import { createClient } from '@supabase/supabase-js';
import { mockAuth } from './database.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use hybrid approach: PostgreSQL database with mock auth and local file storage
const USE_MOCK_AUTH = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project');
const USE_LOCAL_DB = true; // Force local database usage for Replit environment

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
    if (USE_MOCK_AUTH || !supabase || USE_LOCAL_DB) {
      return await mockAuth.getUserProfile(userId);
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  updateUserProfile: async (userId, updates) => {
    if (USE_MOCK_AUTH || !supabase || USE_LOCAL_DB) {
      return await mockAuth.updateUserProfile(userId, updates);
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    return { data, error };
  },

  deleteUserAccount: async (userId) => {
    if (USE_MOCK_AUTH || !supabase) {
      return await mockAuth.deleteUserAccount(userId);
    }
    
    // This will cascade and delete related records
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);
    return { error };
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
      .single();
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
    const { data, error } = await supabase
      .from('applications')
      .insert([applicationData])
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
    return { data, error };
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
      .single();
    return { data: !!data, error };
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
  }
};