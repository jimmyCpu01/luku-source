
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Shoppers (custom auth: username + phone only)
CREATE TABLE public.shoppers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  phone text NOT NULL,
  device text,
  browser text,
  ip text,
  blocked boolean NOT NULL DEFAULT false,
  last_login_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(phone)
);
GRANT SELECT, INSERT, UPDATE ON public.shoppers TO anon, authenticated;
GRANT ALL ON public.shoppers TO service_role;
ALTER TABLE public.shoppers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone register/login shopper" ON public.shoppers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone read shoppers for login" ON public.shoppers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone update last login" ON public.shoppers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admins delete shoppers" ON public.shoppers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Login sessions audit
CREATE TABLE public.shopper_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopper_id uuid NOT NULL REFERENCES public.shoppers(id) ON DELETE CASCADE,
  device text,
  browser text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.shopper_sessions TO anon, authenticated;
GRANT ALL ON public.shopper_sessions TO service_role;
ALTER TABLE public.shopper_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone log session" ON public.shopper_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read sessions" ON public.shopper_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category text NOT NULL CHECK (category IN ('kids','ladies','general')),
  subcategory text,
  brand text,
  sizes text[] NOT NULL DEFAULT '{}',
  condition text NOT NULL DEFAULT 'Excellent',
  price numeric(10,2) NOT NULL,
  discount_pct int NOT NULL DEFAULT 0,
  stock int NOT NULL DEFAULT 1,
  images text[] NOT NULL DEFAULT '{}',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT ('LL-' || upper(substring(replace(gen_random_uuid()::text,'-','') from 1 for 8))),
  shopper_id uuid REFERENCES public.shoppers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  shipping numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','confirmed','processing','shipped','delivered','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO anon, authenticated;
GRANT UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone create order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone read orders" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reference text NOT NULL,
  amount numeric(10,2) NOT NULL,
  receipt_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO anon, authenticated;
GRANT UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone submit payment" ON public.payments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone read payments" ON public.payments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins update payments" ON public.payments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shopper_id uuid REFERENCES public.shoppers(id) ON DELETE SET NULL,
  shopper_name text,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  reply text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO anon, authenticated;
GRANT UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read approved reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (status = 'approved' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "anyone write review" ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins manage reviews" ON public.reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete reviews" ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Chat
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopper_id uuid NOT NULL REFERENCES public.shoppers(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user','admin')),
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.chat_messages TO anon, authenticated;
GRANT DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone access chat" ON public.chat_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone send chat" ON public.chat_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone update chat" ON public.chat_messages FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "admins delete chat" ON public.chat_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Wishlist
CREATE TABLE public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopper_id uuid NOT NULL REFERENCES public.shoppers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shopper_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist TO anon, authenticated;
GRANT ALL ON public.wishlist TO service_role;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone access wishlist" ON public.wishlist FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
