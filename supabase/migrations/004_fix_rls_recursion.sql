-- ============================================================
-- FIX RLS INFINITE RECURSION
-- Issue: The admin read policy queried the `profiles` table itself,
-- causing an infinite recursion when users read their own profile.
-- Fix: Use a SECURITY DEFINER function to bypass RLS when checking roles.
-- ============================================================

-- 1. Create a function to securely fetch the user's role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 2. Fix `profiles` policies
DROP POLICY IF EXISTS "profiles_admin_read" ON profiles;
CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT USING ( public.get_auth_user_role() = 'admin' );

DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE USING ( public.get_auth_user_role() = 'admin' );

-- 3. Fix `daily_tasks` policies
DROP POLICY IF EXISTS "tasks_admin_read" ON daily_tasks;
CREATE POLICY "tasks_admin_read" ON daily_tasks
  FOR SELECT USING ( public.get_auth_user_role() = 'admin' );

-- 4. Fix `attendance` policies
DROP POLICY IF EXISTS "attendance_admin_read" ON attendance;
CREATE POLICY "attendance_admin_read" ON attendance
  FOR SELECT USING ( public.get_auth_user_role() = 'admin' );

-- 5. Fix `attendance_locations` policies
DROP POLICY IF EXISTS "locations_admin_all" ON attendance_locations;
CREATE POLICY "locations_admin_all" ON attendance_locations
  FOR ALL USING ( public.get_auth_user_role() = 'admin' );

-- 6. Fix `salary_structures` policies
DROP POLICY IF EXISTS "salary_admin_read" ON salary_structures;
CREATE POLICY "salary_admin_read" ON salary_structures
  FOR SELECT USING ( public.get_auth_user_role() = 'admin' );

-- 7. Fix `leave_requests` policies
DROP POLICY IF EXISTS "leaves_admin_read" ON leave_requests;
CREATE POLICY "leaves_admin_read" ON leave_requests
  FOR SELECT USING ( public.get_auth_user_role() = 'admin' );
