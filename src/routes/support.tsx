import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { useShopper } from "@/lib/session";
import { listMyChat, sendMyChat } from "@/lib/shopper.functions";
import { Send } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — LUKU LEGIT" }] }),
  component: SupportPage,
});

type Msg = { id: string; sender: "user"|"admin"; body: string; created_at: string };

function SupportPage() {
  const shopper = useShopper();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shopper?.token) return;
    let active = true;
    const load = async () => {
      try {
        const data = await listMyChat({ data: { shopperId: shopper.id, token: shopper.token! } });
        if (active) setMessages(data as any);
      } catch {}
    };
    load();
    const t = setInterval(load, 4000);
    return () => { active = false; clearInterval(t); };
  }, [shopper?.id]);

  useEffect(() => { scroller.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [messages.length]);

  async function send() {
    if (!shopper?.token || !text.trim()) return;
    const body = text.trim().slice(0, 1000);
    setText("");
    try {
      const msg = await sendMyChat({ data: { shopperId: shopper.id, token: shopper.token, body } });
      if (msg) setMessages(m => [...m, msg as any]);
    } catch {}
  }

  if (!shopper) return (
    <SiteShell><section className="container mx-auto px-4 py-16 max-w-md text-center">
      <h1 className="display-font text-3xl font-bold">Sign in to chat</h1>
      <p className="text-muted-foreground mt-2">Sign in so we can keep your conversation in one place.</p>
      <Link to="/login" className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold">Sign in</Link>
    </section></SiteShell>
  );

  return (
    <SiteShell>
      <section className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="display-font text-4xl font-bold">Customer Support</h1>
        <div className="mt-6 glass rounded-2xl flex flex-col h-[60vh]">
          <div ref={scroller} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">Start the conversation — we usually reply within minutes.</p>}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.sender==="user"?"justify-end":"justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${m.sender==="user"?"bg-primary text-primary-foreground":"glass"}`}>{m.body}</div>
              </div>
            ))}
          </div>
          <form onSubmit={(e)=>{e.preventDefault(); send();}} className="border-t border-border/40 p-3 flex gap-2">
            <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message…" maxLength={1000}
              className="flex-1 bg-secondary/40 border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary"/>
            <button className="px-4 rounded-xl bg-primary text-primary-foreground"><Send className="size-4"/></button>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}