
-- 1) Add session_token to shoppers for server-side validation
ALTER TABLE public.shoppers ADD COLUMN IF NOT EXISTS session_token text;
CREATE INDEX IF NOT EXISTS shoppers_session_token_idx ON public.shoppers(session_token);

-- 2) shoppers: drop permissive policies, keep admin policies
DROP POLICY IF EXISTS "anyone read shoppers for login" ON public.shoppers;
DROP POLICY IF EXISTS "anyone register/login shopper" ON public.shoppers;
DROP POLICY IF EXISTS "anyone update last login" ON public.shoppers;
CREATE POLICY "admins read shoppers" ON public.shoppers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update shoppers" ON public.shoppers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) shopper_sessions: only admins SELECT; INSERTs only via server (service role)
DROP POLICY IF EXISTS "anyone log session" ON public.shopper_sessions;

-- 4) orders: only admins direct access; INSERTs/SELECTs for shoppers via server
DROP POLICY IF EXISTS "anyone create order" ON public.orders;
DROP POLICY IF EXISTS "anyone read orders" ON public.orders;
CREATE POLICY "admins read orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5) payments: only admins direct access
DROP POLICY IF EXISTS "anyone read payments" ON public.payments;
DROP POLICY IF EXISTS "anyone submit payment" ON public.payments;
CREATE POLICY "admins read payments" ON public.payments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert payments" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6) chat_messages: only admins direct access
DROP POLICY IF EXISTS "anyone access chat" ON public.chat_messages;
DROP POLICY IF EXISTS "anyone send chat" ON public.chat_messages;
DROP POLICY IF EXISTS "anyone update chat" ON public.chat_messages;
CREATE POLICY "admins read chat" ON public.chat_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins write chat" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins modify chat" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7) wishlist: lock down (no client wiring exists; admins only direct)
DROP POLICY IF EXISTS "anyone access wishlist" ON public.wishlist;
CREATE POLICY "admins read wishlist" ON public.wishlist
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 8) reviews: only admins can insert/modify; public can still read approved (existing SELECT policy)
DROP POLICY IF EXISTS "anyone write review" ON public.reviews;
CREATE POLICY "admins write reviews" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9) Realtime: remove sensitive tables from broadcast
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;
  END IF;
END $$;

-- 10) Revoke EXECUTE on has_role from anon/authenticated; RLS evaluator still calls it.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
