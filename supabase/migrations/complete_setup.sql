-- ============================================
-- COMPLETE KHUB DATABASE SETUP
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ============================================
-- EMAIL OTP SYSTEM
-- ============================================

-- Create email OTP table
CREATE TABLE public.email_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT CHECK (purpose IN ('verification', 'password_reset', 'login', '2fa')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
    is_used BOOLEAN DEFAULT false,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    INDEX idx_email_otps_email_code (email, otp_code),
    INDEX idx_email_otps_expires (expires_at)
);

-- Function to clean expired OTPs
CREATE OR REPLACE FUNCTION clean_expired_otps()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.email_otps WHERE expires_at < now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-clean OTPs
CREATE TRIGGER trigger_clean_otps
    AFTER INSERT ON public.email_otps
    EXECUTE FUNCTION clean_expired_otps();

-- ============================================
-- STORAGE BUCKETS SETUP
-- Run these commands in Supabase Storage UI or via SQL
-- ============================================

-- Create storage buckets (Run these separately in the storage UI or via API)
-- Bucket names: 
--   1. avatars - for profile pictures
--   2. product-images - for product photos
--   3. kyc-documents - for KYC submissions
--   4. chat-media - for chat images/files
--   5. receipts - for generated receipts

-- Storage bucket policies
-- avatars bucket policies
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- Storage policies
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Sellers can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Users can upload own KYC docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- COMPLETE TABLES (Additional missing tables)
-- ============================================

-- Booking system for services
CREATE TABLE public.service_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES public.services(id) NOT NULL,
    client_id UUID REFERENCES public.profiles(id) NOT NULL,
    provider_id UUID REFERENCES public.profiles(id) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    amount DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Logistics rides
CREATE TABLE public.rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES public.profiles(id),
    customer_id UUID REFERENCES public.profiles(id) NOT NULL,
    pickup_location JSONB NOT NULL,
    dropoff_location JSONB NOT NULL,
    distance_km DECIMAL(8,2),
    price DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Logistics deliveries
CREATE TABLE public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES public.profiles(id),
    customer_id UUID REFERENCES public.profiles(id) NOT NULL,
    pickup_location JSONB NOT NULL,
    dropoff_location JSONB NOT NULL,
    package_details JSONB,
    price DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
    tracking_number TEXT UNIQUE,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Receipts table
CREATE TABLE public.receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    vat DECIMAL(12,2) DEFAULT 0,
    khub_fee DECIMAL(12,2) DEFAULT 0,
    total_paid DECIMAL(12,2) NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'paid',
    metadata JSONB DEFAULT '{}',
    pdf_url TEXT,
    qr_code TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices for vendors
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id TEXT UNIQUE NOT NULL,
    vendor_id UUID REFERENCES public.profiles(id) NOT NULL,
    vendor_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    items JSONB NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    vat DECIMAL(12,2) DEFAULT 0,
    khub_fee DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    payout_amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    due_date DATE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Support tickets
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    ticket_number TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
    assigned_to UUID REFERENCES public.staff_users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ticket replies
CREATE TABLE public.ticket_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    staff_id UUID REFERENCES public.staff_users(id),
    message TEXT NOT NULL,
    attachments TEXT[],
    is_staff BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- AI detection logs
CREATE TABLE public.ai_detection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_type TEXT CHECK (listing_type IN ('product', 'service', 'job', 'rental')),
    listing_id UUID NOT NULL,
    risk_score INTEGER,
    flags TEXT[],
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- API keys for external access
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    rate_limit INTEGER DEFAULT 1000,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- API usage logs
CREATE TABLE public.api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID REFERENCES public.api_keys(id),
    endpoint TEXT NOT NULL,
    method TEXT,
    status_code INTEGER,
    response_time INTEGER,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Monthly reports
CREATE TABLE public.monthly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type TEXT CHECK (report_type IN ('user', 'vendor', 'admin', 'financial')),
    user_id UUID REFERENCES public.profiles(id),
    month DATE NOT NULL,
    data JSONB NOT NULL,
    pdf_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- EMAIL TEMPLATES TABLE
-- ============================================

CREATE TABLE public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, html_content) VALUES
('welcome_email', 'Welcome to KHUB! 🎉', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #5B2EFF, #FF5E2E); padding: 30px; text-align: center;"><h1 style="color: white;">Welcome to KHUB!</h1></div><div style="padding: 30px;"><h2>Hello {{full_name}},</h2><p>Thank you for joining KHUB - Africa''s premier marketplace platform!</p><p>Your account has been successfully created. Here''s what you can do next:</p><ul><li>Complete your profile</li><li>Verify your identity (KYC)</li><li>Start exploring marketplace</li><li>List your first product/service</li></ul><div style="text-align: center;"><a href="{{verification_link}}" style="background: #5B2EFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Your Email</a></div><p style="margin-top: 30px;">Best regards,<br>The KHUB Team</p></div><div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;"><p>© 2024 KHUB. All rights reserved.</p></div></div>'),

('password_reset', 'Reset Your KHUB Password', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #5B2EFF, #FF5E2E); padding: 30px; text-align: center;"><h1 style="color: white;">Reset Password</h1></div><div style="padding: 30px;"><h2>Hello {{full_name}},</h2><p>We received a request to reset your password. Click the button below to create a new password:</p><div style="text-align: center;"><a href="{{reset_link}}" style="background: #5B2EFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a></div><p>This link will expire in 1 hour.</p><p>If you didn''t request this, please ignore this email.</p><p>Best regards,<br>The KHUB Team</p></div></div>'),

('kyc_approved', 'Your KYC Application Has Been Approved ✅', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #00D4A8, #5B2EFF); padding: 30px; text-align: center;"><h1 style="color: white;">KYC Approved!</h1></div><div style="padding: 30px;"><h2>Congratulations {{full_name}}!</h2><p>Your KYC verification has been approved. You now have full access to all KHUB features including:</p><ul><li>Withdraw funds from your wallet</li><li>Higher transaction limits</li><li>Verified badge on your profile</li><li>Priority support</li></ul><div style="text-align: center;"><a href="{{dashboard_link}}" style="background: #5B2EFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Go to Dashboard</a></div></div></div>'),

('payment_receipt', 'Your KHUB Payment Receipt #{{receipt_id}}', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #5B2EFF; padding: 30px; text-align: center;"><h1 style="color: white;">Payment Receipt</h1></div><div style="padding: 30px;"><h2>Thank you for your payment!</h2><p>Dear {{full_name}},</p><p>Your payment has been successfully processed.</p><div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;"><p><strong>Receipt ID:</strong> {{receipt_id}}</p><p><strong>Amount:</strong> ₦{{amount}}</p><p><strong>Transaction Type:</strong> {{transaction_type}}</p><p><strong>Date:</strong> {{date}}</p><p><strong>Status:</strong> {{status}}</p></div><div style="text-align: center;"><a href="{{receipt_url}}" style="background: #5B2EFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Download Receipt</a></div></div></div>'),

('referral_bonus', 'You Earned a Referral Bonus! 🎉', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #FF5E2E, #5B2EFF); padding: 30px; text-align: center;"><h1 style="color: white;">Referral Bonus!</h1></div><div style="padding: 30px;"><h2>Congratulations {{full_name}}!</h2><p>Someone you referred just {{action}} and you earned <strong style="color: #5B2EFF;">₦{{bonus_amount}}</strong>!</p><p>Your total referral earnings: <strong>₦{{total_earnings}}</strong></p><div style="text-align: center;"><a href="{{referral_dashboard}}" style="background: #5B2EFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">View Dashboard</a></div></div></div>');

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to generate receipt ID
CREATE OR REPLACE FUNCTION generate_receipt_id()
RETURNS TEXT AS $$
DECLARE
    receipt_id TEXT;
BEGIN
    receipt_id := 'KHUB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
    RETURN receipt_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TEXT AS $$
DECLARE
    tracking TEXT;
BEGIN
    tracking := 'KHD-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
    RETURN tracking;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to process referral rewards
CREATE OR REPLACE FUNCTION process_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
    referrer_id UUID;
    reward_amount DECIMAL;
BEGIN
    -- Get referrer from profiles
    SELECT referred_by INTO referrer_id FROM public.profiles WHERE id = NEW.user_id;
    
    IF referrer_id IS NOT NULL THEN
        -- Check if this is a subscription upgrade
        IF TG_TABLE_NAME = 'subscriptions' AND NEW.plan_type != 'free' THEN
            -- Reward based on plan
            IF NEW.plan_type = 'verified' THEN
                reward_amount := 500;
            ELSIF NEW.plan_type = 'premium' THEN
                reward_amount := 1000;
            END IF;
            
            -- Add reward to referrer's wallet
            UPDATE public.wallets 
            SET balance = balance + reward_amount 
            WHERE user_id = referrer_id;
            
            -- Insert reward transaction
            INSERT INTO public.transactions (user_id, type, amount, status, reference, metadata)
            VALUES (referrer_id, 'commission', reward_amount, 'completed', 
                   'REF-' || gen_random_uuid()::TEXT,
                   jsonb_build_object('type', 'referral_reward', 'referred_user', NEW.user_id, 'plan', NEW.plan_type));
            
            -- Update referral record
            UPDATE public.referrals 
            SET status = 'completed', reward_amount = reward_amount
            WHERE referred_user_id = NEW.user_id AND status = 'pending';
            
            -- Create notification for referrer
            INSERT INTO public.notifications (user_id, title, message, type)
            VALUES (referrer_id, 'Referral Bonus Earned!', 
                   'Your referral just upgraded to ' || NEW.plan_type || ' plan! You earned ₦' || reward_amount,
                   'referral');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for referral rewards on subscription
CREATE TRIGGER trigger_referral_reward
    AFTER INSERT ON public.subscriptions
    FOR EACH ROW
    WHEN (NEW.plan_type != 'free')
    EXECUTE FUNCTION process_referral_reward();

-- ============================================
-- ROW LEVEL SECURITY POLICIES (Complete)
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
    
CREATE POLICY "Public profiles are viewable" ON public.profiles
    FOR SELECT USING (true);

-- Wallets policies
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Anyone can view approved products" ON public.products
    FOR SELECT USING (status = 'approved');
    
CREATE POLICY "Sellers can manage own products" ON public.products
    FOR ALL USING (auth.uid() = seller_id);

-- Services policies
CREATE POLICY "Anyone can view approved services" ON public.services
    FOR SELECT USING (status = 'approved');
    
CREATE POLICY "Providers can manage own services" ON public.services
    FOR ALL USING (auth.uid() = provider_id);

-- Jobs policies
CREATE POLICY "Anyone can view active jobs" ON public.jobs
    FOR SELECT USING (status = 'active');
    
CREATE POLICY "Employers can manage own jobs" ON public.jobs
    FOR ALL USING (auth.uid() = employer_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Support tickets policies
CREATE POLICY "Users can view own tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can create tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_created_at ON public.products(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_price ON public.services(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_provider ON public.services(provider_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_category ON public.jobs(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_location ON public.jobs(location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rentals_type ON public.rentals(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rentals_price ON public.rentals(price);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status ON public.transactions(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender ON public.messages(sender_id, receiver_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kyc_submissions_status ON public.kyc_submissions(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kyc_submissions_user ON public.kyc_submissions(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_active ON public.subscriptions(user_id, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_expires ON public.subscriptions(expires_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_staff ON public.audit_logs(staff_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipts_user ON public.receipts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipts_receipt_id ON public.receipts(receipt_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_vendor ON public.invoices(vendor_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_email);

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

CREATE OR REPLACE VIEW public.user_analytics AS
SELECT 
    DATE(p.created_at) as date,
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT CASE WHEN p.verification_status = 'verified' THEN p.id END) as verified_users,
    COUNT(DISTINCT CASE WHEN array_length(p.roles, 1) > 1 THEN p.id END) as multi_role_users,
    COUNT(DISTINCT s.id) as active_subscriptions
FROM public.profiles p
LEFT JOIN public.subscriptions s ON p.id = s.user_id AND s.is_active = true
GROUP BY DATE(p.created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW public.financial_analytics AS
SELECT 
    DATE(t.created_at) as date,
    COUNT(t.id) as total_transactions,
    SUM(CASE WHEN t.type = 'funding' AND t.status = 'completed' THEN t.amount ELSE 0 END) as total_funding,
    SUM(CASE WHEN t.type = 'withdrawal' AND t.status = 'completed' THEN t.amount ELSE 0 END) as total_withdrawals,
    SUM(t.fee) as total_fees,
    SUM(CASE WHEN t.type = 'subscription' AND t.status = 'completed' THEN t.amount ELSE 0 END) as subscription_revenue,
    SUM(CASE WHEN t.type = 'escrow' AND t.status = 'completed' THEN t.amount ELSE 0 END) as escrow_amount
FROM public.transactions t
GROUP BY DATE(t.created_at)
ORDER BY date DESC;

-- ============================================
-- SEARCH FUNCTION (Full-text search)
-- ============================================

-- Add search columns to tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update search vectors
CREATE OR REPLACE FUNCTION update_product_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_search_update
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Create search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search ON public.products USING GIN(search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_search ON public.services USING GIN(search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_search ON public.jobs USING GIN(search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rentals_search ON public.rentals USING GIN(search_vector);
