-- S0-A1: Core Tables Migration
-- Creates profiles, applications, documents, and usage tables
-- with triggers, RLS policies, and indexes.

-- =============================================================================
-- TABLES
-- =============================================================================

-- profiles: 1:1 with auth.users, auto-created on signup via trigger
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  headline TEXT,
  summary TEXT,
  work_history JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  skills_experiences JSONB DEFAULT '[]',
  cover_letter_template TEXT,
  target_industries TEXT[] DEFAULT '{}',
  target_roles TEXT[] DEFAULT '{}',
  culture_values TEXT[] DEFAULT '{}',
  career_aspirations TEXT,
  hobbies_interests TEXT,
  preferred_tone TEXT DEFAULT 'professional' CHECK (preferred_tone IN ('professional', 'conversational', 'assertive')),
  email_notifications BOOLEAN DEFAULT true,
  onboarding_complete BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- applications: one per job application submission
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_description TEXT NOT NULL,
  job_url TEXT,
  hiring_manager_name TEXT,
  documents_requested TEXT[] NOT NULL DEFAULT '{research,cv,cover_letter,intro_email}',
  cover_letter_length TEXT DEFAULT 'standard' CHECK (cover_letter_length IN ('short', 'standard', 'detailed')),
  cover_letter_max_words INT,
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('professional', 'conversational', 'assertive')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  application_status TEXT DEFAULT 'saved' CHECK (application_status IN ('saved', 'applied', 'interview', 'offer', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- documents: one row per generated document, append-only versioning
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('research', 'cv', 'cover_letter', 'intro_email')),
  content TEXT,
  edited_content TEXT,
  version INT NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- usage: tracks monthly application usage per user for freemium enforcement
CREATE TABLE usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period DATE NOT NULL, -- first day of month e.g. 2026-02-01
  applications_generated INT DEFAULT 0,
  UNIQUE (user_id, period)
);

-- =============================================================================
-- TRIGGERS & FUNCTIONS
-- =============================================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Applications
CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON applications FOR UPDATE USING (auth.uid() = user_id);

-- Documents
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid() = user_id);

-- Usage
CREATE POLICY "Users can view own usage" ON usage FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX idx_documents_application_id ON documents(application_id);
CREATE INDEX idx_documents_type_version ON documents(application_id, type, version DESC);
CREATE INDEX idx_usage_user_period ON usage(user_id, period);
