-- ============================================================
-- HRMS Database Schema
-- Manipal University Jaipur HRMS Hackathon Project
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT,
  date_of_birth    DATE,
  phone            TEXT,
  email            TEXT,
  address          TEXT,
  profile_photo    TEXT,
  employee_id      TEXT UNIQUE,
  department       TEXT,
  designation      TEXT,
  joining_date     DATE,
  skills           TEXT[],
  education        JSONB DEFAULT '[]',
  experience       JSONB DEFAULT '[]',
  role             TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  profile_status   TEXT NOT NULL DEFAULT 'draft' CHECK (profile_status IN ('draft', 'pending', 'verified', 'changes_requested')),
  manager_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_comment    TEXT,
  verified_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DAILY TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  manager_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_date    DATE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  priority     TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  status       TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ATTENDANCE LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_locations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  latitude        FLOAT8 NOT NULL,
  longitude       FLOAT8 NOT NULL,
  allowed_radius  INTEGER NOT NULL DEFAULT 100, -- meters
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id               UUID REFERENCES daily_tasks(id) ON DELETE SET NULL,
  date                  DATE NOT NULL,
  check_in              TIMESTAMPTZ,
  check_in_latitude     FLOAT8,
  check_in_longitude    FLOAT8,
  check_in_distance     FLOAT8,
  check_out             TIMESTAMPTZ,
  check_out_latitude    FLOAT8,
  check_out_longitude   FLOAT8,
  check_out_distance    FLOAT8,
  working_hours         FLOAT8,
  status                TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day')),
  work_completed        TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate check-in per employee per date
  UNIQUE (employee_id, date)
);

-- ============================================================
-- SALARY STRUCTURES
-- ============================================================
CREATE TABLE IF NOT EXISTS salary_structures (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  basic_salary   NUMERIC(12,2) NOT NULL DEFAULT 0,
  hra            NUMERIC(12,2) NOT NULL DEFAULT 0,
  allowances     NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions     NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_salary     NUMERIC(12,2) GENERATED ALWAYS AS (basic_salary + hra + allowances - deductions) STORED,
  effective_from DATE NOT NULL,
  created_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type  TEXT NOT NULL CHECK (leave_type IN ('sick', 'casual', 'annual', 'unpaid')),
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED: Attendance Location — Manipal University Jaipur
-- ============================================================
INSERT INTO attendance_locations (name, latitude, longitude, allowed_radius, is_active)
VALUES ('Manipal University Jaipur', 26.84292, 75.56522, 100, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_daily_tasks_updated_at
  BEFORE UPDATE ON daily_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_salary_updated_at
  BEFORE UPDATE ON salary_structures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_leave_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- ─── profiles ────────────────────────────────────────────────────────────────

-- Users can read their own profile
CREATE POLICY "profiles_own_read" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Manager can read profiles of their assigned employees
CREATE POLICY "profiles_manager_read" ON profiles
  FOR SELECT USING (
    manager_id = auth.uid()
    OR id = auth.uid()
  );

-- Users can update their own profile (status changes handled by API)
CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin can update any profile
CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Profiles are created via trigger on auth.users insert
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── daily_tasks ─────────────────────────────────────────────────────────────

-- Employee can read their own tasks
CREATE POLICY "tasks_employee_read" ON daily_tasks
  FOR SELECT USING (employee_id = auth.uid());

-- Manager can read/write tasks they created
CREATE POLICY "tasks_manager_all" ON daily_tasks
  FOR ALL USING (manager_id = auth.uid());

-- Admin can read all tasks
CREATE POLICY "tasks_admin_read" ON daily_tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── attendance ───────────────────────────────────────────────────────────────

-- Employee can read their own attendance
CREATE POLICY "attendance_employee_read" ON attendance
  FOR SELECT USING (employee_id = auth.uid());

-- Admin can read all attendance
CREATE POLICY "attendance_admin_read" ON attendance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Manager can read attendance of their employees
CREATE POLICY "attendance_manager_read" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = attendance.employee_id
        AND profiles.manager_id = auth.uid()
    )
  );

-- Attendance records are created/updated via service role (API routes only)
CREATE POLICY "attendance_service_write" ON attendance
  FOR ALL USING (TRUE)
  WITH CHECK (TRUE);

-- ─── attendance_locations ────────────────────────────────────────────────────

-- Any authenticated user can read active locations (needed for QR validation page display)
CREATE POLICY "locations_authenticated_read" ON attendance_locations
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- Admin can manage locations
CREATE POLICY "locations_admin_all" ON attendance_locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── salary_structures ───────────────────────────────────────────────────────

-- Employee can read own salary
CREATE POLICY "salary_employee_read" ON salary_structures
  FOR SELECT USING (employee_id = auth.uid());

-- Admin can read and write all salaries
CREATE POLICY "salary_admin_all" ON salary_structures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── leave_requests ──────────────────────────────────────────────────────────

-- Employee can read their own leaves
CREATE POLICY "leave_employee_read" ON leave_requests
  FOR SELECT USING (employee_id = auth.uid());

-- Employee can create their own leave
CREATE POLICY "leave_employee_insert" ON leave_requests
  FOR INSERT WITH CHECK (employee_id = auth.uid());

-- Admin can read and update all leave requests
CREATE POLICY "leave_admin_all" ON leave_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, profile_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    'draft'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HELPER: Promote a user to admin by email
-- Usage: SELECT promote_to_admin('admin@example.com');
-- ============================================================
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET role = 'admin', profile_status = 'verified'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
