-- ============================================================
-- Run this in Supabase SQL Editor to:
-- 1. Confirm email for an existing unconfirmed user
-- 2. Set their role to admin
-- ============================================================

-- Step 1: Confirm the email in auth.users
UPDATE auth.users
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'lalitdubey7023@gmail.com';

-- Step 2: Set their role to admin and mark profile as verified
UPDATE public.profiles
SET role = 'admin',
    profile_status = 'verified',
    updated_at = NOW()
WHERE email = 'lalitdubey7023@gmail.com';

-- Verify it worked:
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'lalitdubey7023@gmail.com';
SELECT id, email, role, profile_status FROM public.profiles WHERE email = 'lalitdubey7023@gmail.com';
