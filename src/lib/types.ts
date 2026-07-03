export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: 'kids' | 'ladies' | 'men';
  subcategory: string | null;
  brand: string | null;
  sizes: string[];
  condition: string;
  price: number;
  discount_pct: number;
  stock: number;
  images: string[];
  featured: boolean;
  sold_out: boolean;
  created_at: string;
};

export type CartItem = {
  product_id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  size: string;
  qty: number;
};

export type Shopper = {
  id: string;
  username: string;
  phone: string;
  token?: string;
};