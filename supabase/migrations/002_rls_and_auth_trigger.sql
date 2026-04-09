-- ============================================
-- RLS Policies and Auth Trigger
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_labs ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text OR email = auth.jwt()->>'email');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text OR email = auth.jwt()->>'email');

CREATE POLICY "Service can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Interview sessions policies
CREATE POLICY "Users can view own sessions"
  ON interview_sessions FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Users can insert own sessions"
  ON interview_sessions FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Users can update own sessions"
  ON interview_sessions FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

-- Scorecards policies
CREATE POLICY "Users can view own scorecards"
  ON scorecards FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Users can insert own scorecards"
  ON scorecards FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

-- Completed labs policies
CREATE POLICY "Users can view own completed labs"
  ON completed_labs FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Users can insert own completed labs"
  ON completed_labs FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

-- ============================================
-- Auto-create user record on Supabase Auth signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL),
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, users.display_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
