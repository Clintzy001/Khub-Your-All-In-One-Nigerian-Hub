-- =========================================
-- 1. PROFILES TABLE (REFERRAL SYSTEM)
-- =========================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by UUID,
  ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC NOT NULL DEFAULT 0;

-- Ensure referral_code is UNIQUE safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_referral_code_unique'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_referral_code_unique UNIQUE (referral_code);
  END IF;
END $$;

-- Foreign key (safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_referred_by_fkey'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_referred_by_fkey
    FOREIGN KEY (referred_by) REFERENCES public.profiles(user_id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);




-- =========================================
-- 2. REFERRALS TABLE (LOG SYSTEM)
-- =========================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  plan_type TEXT NOT NULL,
  reward_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate referrals
  CONSTRAINT unique_referral UNIQUE (referrer_id, referred_user_id)
);

-- Foreign keys
ALTER TABLE public.referrals
  ADD CONSTRAINT IF NOT EXISTS referrals_referrer_fkey
  FOREIGN KEY (referrer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.referrals
  ADD CONSTRAINT IF NOT EXISTS referrals_referred_fkey
  FOREIGN KEY (referred_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users view their referrals" ON public.referrals;
CREATE POLICY "Users view their referrals"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

DROP POLICY IF EXISTS "Admins manage referrals" ON public.referrals;
CREATE POLICY "Admins manage referrals"
  ON public.referrals
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));




-- =========================================
-- 3. REFERRAL CODE GENERATOR (IMPROVED)
-- =========================================

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    code := 'KH' || upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = code
    );
  END LOOP;
  RETURN code;
END;
$$;




-- =========================================
-- 4. HANDLE NEW USER (UPGRADED)
-- =========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ref_code TEXT;
  ref_by UUID;
  incoming_ref TEXT;
BEGIN
  ref_code := public.generate_referral_code();
  incoming_ref := NEW.raw_user_meta_data->>'referral_code';

  -- Find referrer safely
  IF incoming_ref IS NOT NULL AND incoming_ref <> '' THEN
    SELECT user_id INTO ref_by
    FROM public.profiles
    WHERE referral_code = incoming_ref
    LIMIT 1;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    referral_code,
    referred_by
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    ref_code,
    ref_by
  );

  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'buyer')
  );

  -- Create wallet
  INSERT INTO public.escrow_wallets (user_id)
  VALUES (NEW.id);

  -- Log referral (if exists)
  IF ref_by IS NOT NULL THEN
    INSERT INTO public.referrals (
      referrer_id,
      referred_user_id,
      plan_type,
      reward_amount,
      status
    )
    VALUES (
      ref_by,
      NEW.id,
      'free',
      0,
      'pending'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;




-- =========================================
-- 5. BACKFILL EXISTING USERS (SAFE)
-- =========================================

UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL;




-- =========================================
-- 6. REAL-TIME ENABLE (IMPORTANT)
-- =========================================

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.referrals REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
