-- ============================================================================
-- SkillMatch Database Fixes
-- Run this in your Supabase SQL editor to fix schema issues
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- FIX USER_PROFILES TABLE
-- ============================================================================

-- Drop and recreate user_profiles table with correct schema
DROP TABLE IF EXISTS user_profiles CASCADE;

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    role TEXT CHECK (role IN ('job_seeker', 'employer')) DEFAULT 'job_seeker',
    location TEXT,
    phone TEXT,
    bio TEXT,
    date_of_birth DATE,
    gender TEXT,
    nationality TEXT,
    current_job_title TEXT,
    company_name TEXT,
    industry TEXT,
    years_experience INTEGER,
    experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
    expected_salary_min INTEGER,
    expected_salary_max INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    employment_type_preferences TEXT[],
    remote_work_preference TEXT,
    availability TEXT,
    notice_period TEXT,
    website_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    skills TEXT[],
    languages TEXT[],
    certifications TEXT[],
    education JSONB[],
    work_experience JSONB[],
    resume_url TEXT,
    cover_letter_url TEXT,
    profile_image_url TEXT,
    profile_completion INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FIX APPLICATIONS TABLE
-- ============================================================================

-- Drop and recreate applications table
DROP TABLE IF EXISTS applications CASCADE;

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status TEXT CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn')) DEFAULT 'pending',
    cover_letter TEXT,
    resume_url TEXT,
    portfolio_url TEXT,
    salary_expectation INTEGER,
    available_start_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, user_id)
);

-- ============================================================================
-- FIX SAVED_JOBS TABLE
-- ============================================================================

-- Drop and recreate saved_jobs table
DROP TABLE IF EXISTS saved_jobs CASCADE;

CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    job_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, job_id)
);

-- ============================================================================
-- FIX JOBS TABLE
-- ============================================================================

-- Drop and recreate jobs table
DROP TABLE IF EXISTS jobs CASCADE;

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    responsibilities TEXT,
    benefits TEXT,
    location TEXT,
    job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship', 'freelance')),
    employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship', 'freelance')),
    experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    is_remote BOOLEAN DEFAULT false,
    skills_required TEXT[],
    application_deadline DATE,
    start_date DATE,
    contact_email TEXT,
    contact_phone TEXT,
    is_urgent BOOLEAN DEFAULT false,
    application_instructions TEXT,
    company_id UUID,
    created_by UUID,
    status TEXT CHECK (status IN ('draft', 'active', 'paused', 'closed', 'expired')) DEFAULT 'active',
    application_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FIX COMPANIES TABLE
-- ============================================================================

-- Drop and recreate companies table
DROP TABLE IF EXISTS companies CASCADE;

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    size TEXT,
    founded INTEGER,
    headquarters TEXT,
    website TEXT,
    logo_url TEXT,
    created_by UUID,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Applications foreign keys
ALTER TABLE applications 
ADD CONSTRAINT fk_applications_job_id 
FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE applications 
ADD CONSTRAINT fk_applications_user_id 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Saved jobs foreign keys
ALTER TABLE saved_jobs 
ADD CONSTRAINT fk_saved_jobs_user_id 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE saved_jobs 
ADD CONSTRAINT fk_saved_jobs_job_id 
FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

-- Jobs foreign keys
ALTER TABLE jobs 
ADD CONSTRAINT fk_jobs_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE jobs 
ADD CONSTRAINT fk_jobs_created_by 
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Companies foreign keys
ALTER TABLE companies 
ADD CONSTRAINT fk_companies_created_by 
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- ============================================================================
-- ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);

-- Saved jobs indexes
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = id);

-- Applications policies
CREATE POLICY "Users can view their own applications" ON applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" ON applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications" ON applications
    FOR DELETE USING (auth.uid() = user_id);

-- Employers can view applications for their jobs
CREATE POLICY "Employers can view applications for their jobs" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = applications.job_id 
            AND jobs.created_by = auth.uid()
        )
    );

-- Saved jobs policies
CREATE POLICY "Users can view their saved jobs" ON saved_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs" ON saved_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave jobs" ON saved_jobs
    FOR DELETE USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Anyone can view active jobs" ON jobs
    FOR SELECT USING (status = 'active');

CREATE POLICY "Employers can view their own jobs" ON jobs
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Employers can create jobs" ON jobs
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Employers can update their own jobs" ON jobs
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Employers can delete their own jobs" ON jobs
    FOR DELETE USING (created_by = auth.uid());

-- Companies policies
CREATE POLICY "Anyone can view companies" ON companies
    FOR SELECT USING (true);

CREATE POLICY "Users can create companies" ON companies
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own companies" ON companies
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own companies" ON companies
    FOR DELETE USING (created_by = auth.uid());

-- ============================================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INSERT SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Insert sample companies
INSERT INTO companies (id, name, description, industry, size, founded, headquarters, website, is_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'TechCorp', 'Leading technology company', 'Technology', '500-1000', 2010, 'San Francisco, CA', 'https://techcorp.com', true),
('550e8400-e29b-41d4-a716-446655440002', 'InnovateSoft', 'Software development company', 'Technology', '100-500', 2015, 'Austin, TX', 'https://innovatesoft.com', true),
('550e8400-e29b-41d4-a716-446655440003', 'DataFlow', 'Data analytics and consulting', 'Consulting', '50-100', 2018, 'New York, NY', 'https://dataflow.com', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample jobs
INSERT INTO jobs (id, title, description, location, job_type, experience_level, salary_min, salary_max, company_id, status) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Senior Software Engineer', 'Build scalable web applications', 'San Francisco, CA', 'full-time', 'senior', 120000, 180000, '550e8400-e29b-41d4-a716-446655440001', 'active'),
('660e8400-e29b-41d4-a716-446655440002', 'Frontend Developer', 'Create beautiful user interfaces', 'Austin, TX', 'full-time', 'mid', 80000, 120000, '550e8400-e29b-41d4-a716-446655440002', 'active'),
('660e8400-e29b-41d4-a716-446655440003', 'Data Scientist', 'Analyze complex datasets', 'New York, NY', 'full-time', 'senior', 100000, 150000, '550e8400-e29b-41d4-a716-446655440003', 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'applications', 'saved_jobs', 'jobs', 'companies');

-- Verify columns exist
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'certifications';

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'applications', 'saved_jobs', 'jobs', 'companies');