import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const phoneSchema = z.string().regex(/^254\d{9}$/, "Invalid phone");
const usernameSchema = z.string().min(2).max(40).regex(/^[a-zA-Z0-9_.-]+$/);
const sessionSchema = z.object({
  shopperId: z.string().uuid(),
  token: z.string().min(20).max(128),
});

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function verifyShopper(shopperId: string, token: string) {
  const db = await admin();
  const { data, error } = await db
    .from("shoppers")
    .select("id, blocked, session_token")
    .eq("id", shopperId)
    .maybeSingle();
  if (error) throw new Error("Unauthorized");
  if (!data || data.blocked || !data.session_token || data.session_token !== token) {
    throw new Error("Unauthorized");
  }
  return data;
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const loginShopper = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        username: usernameSchema,
        phone: phoneSchema,
        device: z.string().max(200).optional(),
        browser: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const token = randomToken();
    const { data: existing } = await db
      .from("shoppers")
      .select("id, blocked, username, phone")
      .eq("phone", data.phone)
      .maybeSingle();
    let shopper: { id: string; username: string; phone: string };
    if (existing) {
      if (existing.blocked) throw new Error("Account blocked. Contact support.");
      const { data: upd, error } = await db
        .from("shoppers")
        .update({
          username: data.username,
          last_login_at: new Date().toISOString(),
          session_token: token,
          device: data.device ?? null,
          browser: data.browser ?? null,
        })
        .eq("id", existing.id)
        .select("id, username, phone")
        .single();
      if (error) throw error;
      shopper = upd;
    } else {
      const { data: created, error } = await db
        .from("shoppers")
        .insert({
          username: data.username,
          phone: data.phone,
          device: data.device ?? null,
          browser: data.browser ?? null,
          session_token: token,
        })
        .select("id, username, phone")
        .single();
      if (error) throw error;
      shopper = created;
    }
    await db.from("shopper_sessions").insert({
      shopper_id: shopper.id,
      device: data.device ?? null,
      browser: data.browser ?? null,
    });
    return { shopper, token };
  });

export const getMyOrders = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => sessionSchema.parse(d))
  .handler(async ({ data }) => {
    await verifyShopper(data.shopperId, data.token);
    const db = await admin();
    const { data: orders, error } = await db
      .from("orders")
      .select("id, order_number, status, total, created_at")
      .eq("shopper_id", data.shopperId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return orders ?? [];
  });

const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  slug: z.string().max(120).optional(),
  name: z.string().max(200),
  image: z.string().max(500).optional(),
  size: z.string().max(20),
  qty: z.number().int().min(1).max(50),
});

const createOrderSchema = sessionSchema.extend({
  name: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  address: z.string().trim().min(5).max(300),
  notes: z.string().trim().max(500).optional(),
  items: z.array(cartItemSchema).min(1).max(50),
  mpesa_ref: z.string().trim().min(6).max(20),
});

const SHIPPING = 300;

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createOrderSchema.parse(d))
  .handler(async ({ data }) => {
    await verifyShopper(data.shopperId, data.token);
    const db = await admin();
    const ids = Array.from(new Set(data.items.map((i) => i.product_id)));
    const { data: prods, error: pe } = await db
      .from("products")
      .select("id, price, discount_pct, name")
      .in("id", ids);
    if (pe) throw pe;
    const priceMap = new Map(
      (prods ?? []).map((p) => [
        p.id,
        Math.round(Number(p.price) * (1 - (p.discount_pct || 0) / 100)),
      ]),
    );
    let subtotal = 0;
    const items = data.items.map((i) => {
      const price = priceMap.get(i.product_id);
      if (price == null) throw new Error("Invalid product in cart");
      subtotal += price * i.qty;
      return { ...i, price };
    });
    const total = subtotal + SHIPPING;
    const { data: order, error } = await db
      .from("orders")
      .insert({
        shopper_id: data.shopperId,
        customer_name: data.name,
        customer_phone: data.phone,
        customer_address: data.address,
        notes: data.notes ?? null,
        items: items as unknown as never,
        subtotal,
        shipping: SHIPPING,
        total,
        status: "pending",
      })
      .select("id, order_number")
      .single();
    if (error) throw error;
    const { error: pErr } = await db.from("payments").insert({
      order_id: order.id,
      reference: data.mpesa_ref,
      amount: total,
      status: "submitted",
    });
    if (pErr) throw pErr;
    return { order_number: order.order_number };
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        orderNumber: z.string().trim().regex(/^LL-[A-Z0-9]+$/i).max(40),
        phone: phoneSchema,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: order } = await db
      .from("orders")
      .select("order_number, status, total, customer_address, customer_phone, created_at")
      .eq("order_number", data.orderNumber.toUpperCase())
      .eq("customer_phone", data.phone)
      .maybeSingle();
    return order;
  });

export const listMyChat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => sessionSchema.parse(d))
  .handler(async ({ data }) => {
    await verifyShopper(data.shopperId, data.token);
    const db = await admin();
    const { data: msgs } = await db
      .from("chat_messages")
      .select("id, sender, body, created_at, read")
      .eq("shopper_id", data.shopperId)
      .order("created_at");
    return msgs ?? [];
  });

export const sendMyChat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    sessionSchema.extend({ body: z.string().trim().min(1).max(1000) }).parse(d),
  )
  .handler(async ({ data }) => {
    await verifyShopper(data.shopperId, data.token);
    const db = await admin();
    const { data: msg, error } = await db
      .from("chat_messages")
      .insert({
        shopper_id: data.shopperId,
        sender: "user",
        body: data.body,
      })
      .select("id, sender, body, created_at, read")
      .single();
    if (error) throw error;
    return msg;
  });