ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
UPDATE public.products SET category = 'men' WHERE category = 'general';
ALTER TABLE public.products ADD CONSTRAINT products_category_check CHECK (category IN ('kids','ladies','men'));