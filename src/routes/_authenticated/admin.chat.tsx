import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/chat")({
  component: AdminChat,
});

function AdminChat() {
  const [shoppers, setShoppers] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("shoppers").select("id,username,phone").order("last_login_at",{ascending:false}).limit(100);
      setShoppers(data ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!active?.id) return;
    const t = setInterval(async () => {
      const { data } = await supabase.from("chat_messages").select("*").eq("shopper_id", active.id).order("created_at");
      setMessages(data ?? []);
    }, 4000);
    return () => clearInterval(t);
  }, [active?.id]);

  async function load(s: any) {
    setActive(s);
    const { data } = await supabase.from("chat_messages").select("*").eq("shopper_id", s.id).order("created_at");
    setMessages(data ?? []);
    await supabase.from("chat_messages").update({ read: true }).eq("shopper_id", s.id).eq("sender", "user").eq("read", false);
  }

  async function send() {
    if (!active || !text.trim()) return;
    const body = text.trim().slice(0,1000);
    setText("");
    await supabase.from("chat_messages").insert({ shopper_id: active.id, sender: "admin", body, read: true });
  }

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-4 h-[70vh]">
      <div className="glass rounded-2xl overflow-y-auto">
        {shoppers.map(s=>(
          <button key={s.id} onClick={()=>load(s)} className={`w-full text-left p-4 border-b border-border/40 hover:bg-secondary/30 ${active?.id===s.id?"bg-secondary/40":""}`}>
            <p className="font-semibold">{s.username}</p>
            <p className="text-xs text-muted-foreground">{s.phone}</p>
          </button>
        ))}
      </div>
      <div className="glass rounded-2xl flex flex-col">
        {active ? (
          <>
            <div className="border-b border-border/40 p-4"><p className="font-semibold">{active.username}</p><p className="text-xs text-muted-foreground">{active.phone}</p></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map(m=>(
                <div key={m.id} className={`flex ${m.sender==="admin"?"justify-end":"justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${m.sender==="admin"?"bg-primary text-primary-foreground":"glass"}`}>{m.body}</div>
                </div>
              ))}
            </div>
            <form onSubmit={(e)=>{e.preventDefault();send();}} className="border-t border-border/40 p-3 flex gap-2">
              <input value={text} onChange={e=>setText(e.target.value)} placeholder="Reply…"
                className="flex-1 bg-secondary/40 border border-border rounded-xl px-4 py-2.5 outline-none focus:border-primary"/>
              <button className="px-4 rounded-xl bg-primary text-primary-foreground"><Send className="size-4"/></button>
            </form>
          </>
        ) : <div className="flex-1 grid place-items-center text-muted-foreground text-sm">Select a shopper to chat</div>}
      </div>
    </div>
  );
}