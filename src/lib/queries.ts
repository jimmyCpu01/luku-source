import { supabase } from "@/integrations/supabase/client";
import type { Product } from "./types";

export async function fetchProducts(category?: "kids" | "ladies" | "men" | "all", subcategory?: string) {
  let q = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (category && category !== "all") q = q.eq("category", category);
  if (subcategory) q = q.eq("subcategory", subcategory);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as unknown as Product[];
}

export async function fetchFeatured() {
  const { data, error } = await supabase.from("products").select("*").eq("featured", true).limit(8);
  if (error) throw error;
  return (data || []) as unknown as Product[];
}

export async function fetchProductBySlug(slug: string) {
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as unknown as Product | null;
}