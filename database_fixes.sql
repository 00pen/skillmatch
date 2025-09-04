-- ============================================================================
-- Database Fixes for SkillMatch Application
-- This script fixes deletion permissions and creates activity tracking
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE ACTIVITIES TABLE FOR TRACKING USER ACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'application_deleted', 'job_saved', 'profile_updated', etc.
  title TEXT NOT NULL,
  description TEXT,
  related_id UUID, -- ID of related object (job, application, etc.)
  related_type TEXT, -- 'job', 'application', 'profile', etc.
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policy for activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities" ON activities
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own activities" ON activities
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- ENHANCED DELETE USER ACCOUNT FUNCTION WITH PROPER PERMISSIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  deletion_errors TEXT[] := '{}';
BEGIN
  -- Only allow users to delete their own account or system admin
  IF p_user_id != auth.uid() THEN
    SELECT json_build_object(
      'success', false,
      'message', 'You can only delete your own account'
    ) INTO result;
    RETURN result;
  END IF;

  -- Begin transaction for atomic deletion
  BEGIN
    -- Delete user activities
    DELETE FROM activities WHERE user_id = p_user_id;
    
    -- Delete user skills
    DELETE FROM user_skills WHERE user_id = p_user_id;
    
    -- Delete saved jobs
    DELETE FROM saved_jobs WHERE user_id = p_user_id;
    
    -- Delete messages (sent and received)
    DELETE FROM messages WHERE sender_id = p_user_id OR recipient_id = p_user_id;
    
    -- Delete conversations
    DELETE FROM conversations WHERE participant_1_id = p_user_id OR participant_2_id = p_user_id;
    
    -- Delete applications
    DELETE FROM applications WHERE user_id = p_user_id;
    
    -- Delete user profile
    DELETE FROM user_profiles WHERE id = p_user_id;
    
    SELECT json_build_object(
      'success', true,
      'message', 'Account deleted successfully'
    ) INTO result;
    
  EXCEPTION WHEN OTHERS THEN
    SELECT json_build_object(
      'success', false,
      'message', 'Error deleting account: ' || SQLERRM
    ) INTO result;
  END;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENHANCED APPLICATION DELETION WITH ACTIVITY TRACKING
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_application_with_activity(
  p_application_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  app_record applications%ROWTYPE;
  job_title TEXT;
  company_name TEXT;
BEGIN
  -- Get application details for activity tracking
  SELECT a.*, j.title, c.name 
  INTO app_record, job_title, company_name
  FROM applications a
  LEFT JOIN jobs j ON a.job_id = j.id
  LEFT JOIN companies c ON j.company_id = c.id
  WHERE a.id = p_application_id AND a.user_id = p_user_id;
  
  IF NOT FOUND THEN
    SELECT json_build_object(
      'success', false,
      'message', 'Application not found or you do not have permission to delete it'
    ) INTO result;
    RETURN result;
  END IF;
  
  -- Delete the application
  DELETE FROM applications WHERE id = p_application_id;
  
  -- Add activity record
  INSERT INTO activities (user_id, type, title, description, related_id, related_type)
  VALUES (
    p_user_id,
    'application_deleted',
    'Application Withdrawn',
    format('Withdrew application for %s at %s', 
           COALESCE(job_title, 'Unknown Position'), 
           COALESCE(company_name, 'Unknown Company')),
    p_application_id,
    'application'
  );
  
  SELECT json_build_object(
    'success', true,
    'message', 'Application deleted successfully'
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PROPER DELETION PERMISSIONS
-- ============================================================================

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_application_with_activity(UUID, UUID) TO authenticated;

-- ============================================================================
-- REFRESH SCHEMA CACHE TO RESOLVE COLUMN ISSUES
-- ============================================================================

-- Force schema refresh by updating column comments
COMMENT ON COLUMN user_profiles.certifications IS 'User certifications in JSONB format';
COMMENT ON COLUMN user_profiles.education IS 'User education history in JSONB format';
COMMENT ON COLUMN user_profiles.work_experience IS 'User work experience in JSONB format';
COMMENT ON COLUMN user_profiles.skills IS 'User skills in JSONB format';
COMMENT ON COLUMN user_profiles.languages IS 'User languages in JSONB format';

-- Ensure all JSONB columns have proper defaults
UPDATE user_profiles 
SET 
  certifications = COALESCE(certifications, '[]'::jsonb),
  education = COALESCE(education, '[]'::jsonb),
  work_experience = COALESCE(work_experience, '[]'::jsonb),
  skills = COALESCE(skills, '[]'::jsonb),
  languages = COALESCE(languages, '[]'::jsonb)
WHERE 
  certifications IS NULL OR
  education IS NULL OR
  work_experience IS NULL OR
  skills IS NULL OR
  languages IS NULL;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activities_user_id_created_at ON activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type_user_id ON activities(type, user_id);
CREATE INDEX IF NOT EXISTS idx_activities_related_id_type ON activities(related_id, related_type);

-- ============================================================================
-- COMPLETED FIXES
-- ============================================================================

COMMIT;