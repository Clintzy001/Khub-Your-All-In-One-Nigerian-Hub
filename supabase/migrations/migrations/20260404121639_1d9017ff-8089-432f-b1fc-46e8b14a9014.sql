DO $$
BEGIN
  -- ORDERS
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'orders'
  ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN
      -- already added, ignore
      NULL;
    END;
  END IF;

  -- ESCROW WALLETS
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'escrow_wallets'
  ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_wallets;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  -- NOTIFICATIONS
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

  -- PRODUCTS
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'products'
  ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;

END $$;
