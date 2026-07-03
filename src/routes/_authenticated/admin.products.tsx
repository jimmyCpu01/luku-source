import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatKES } from "@/lib/cart";
import { Plus, Trash2, Star, Upload, Pencil, X, Loader2, FileUp, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
}

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10; // 10 years

type FormState = {
  name: string; category: string; subcategory: string; brand: string;
  price: string; condition: string; sizes: string; images: string[];
  description: string; stock: string; featured: boolean; sold_out: boolean;
};

const emptyForm: FormState = {
  name:"", category:"men", subcategory:"", brand:"", price:"", condition:"good",
  sizes:"", images:[], description:"", stock:"1", featured:false, sold_out:false,
};

function AdminProducts() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await supabase.from("products").select("*").order("created_at",{ascending:false})).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const csvImgRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{done:number;total:number}|null>(null);
  const [csvImages, setCsvImages] = useState<Record<string,string>>({});

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
  }

  function startEdit(p: any) {
    setEditingId(p.id);
    setForm({
      name: p.name ?? "",
      category: p.category ?? "men",
      subcategory: p.subcategory ?? "",
      brand: p.brand ?? "",
      price: String(p.price ?? ""),
      condition: p.condition ?? "good",
      sizes: (p.sizes ?? []).join(", "),
      images: p.images ?? [],
      description: p.description ?? "",
      stock: String(p.stock ?? 1),
      featured: !!p.featured,
      sold_out: !!p.sold_out,
    });
    setOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpload(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
        if (upErr) { toast.error(upErr.message); continue; }
        const { data: signed, error: sErr } = await supabase.storage.from("product-images").createSignedUrl(path, SIGNED_URL_TTL);
        if (sErr || !signed) { toast.error(sErr?.message || "Failed to sign URL"); continue; }
        urls.push(signed.signedUrl);
      }
      if (urls.length) {
        setForm(f => ({ ...f, images: [...f.images, ...urls] }));
        toast.success(`Uploaded ${urls.length} image${urls.length>1?"s":""}`);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage(idx: number) {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  async function save() {
    if (!form.name || !form.price) { toast.error("Name and price are required"); return; }
    const payload = {
      name: form.name,
      category: form.category as any,
      subcategory: form.subcategory || null,
      brand: form.brand || null,
      price: Number(form.price),
      condition: form.condition,
      sizes: form.sizes.split(",").map(s=>s.trim()).filter(Boolean),
      images: form.images,
      description: form.description || null,
      stock: Number(form.stock) || 1,
      featured: form.featured,
      sold_out: form.sold_out,
    };
    if (editingId) {
      const { error } = await supabase.from("products").update(payload as any).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Product updated");
    } else {
      const slug = slugify(form.name) + "-" + Math.random().toString(36).slice(2,6);
      const { error } = await supabase.from("products").insert({ ...payload, slug } as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Product added");
    }
    resetForm();
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  // ---------- CSV bulk import ----------
  async function uploadCsvImages(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    const map: Record<string,string> = { ...csvImages };
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
        if (upErr) { toast.error(`${file.name}: ${upErr.message}`); continue; }
        const { data: signed } = await supabase.storage.from("product-images").createSignedUrl(path, SIGNED_URL_TTL);
        if (signed) map[file.name] = signed.signedUrl;
      }
      setCsvImages(map);
      toast.success(`Uploaded ${Object.keys(map).length} image(s). Reference them in CSV by filename.`);
    } finally {
      setUploading(false);
      if (csvImgRef.current) csvImgRef.current.value = "";
    }
  }

  function parseCsv(text: string): Record<string,string>[] {
    const rows: string[][] = [];
    let cur: string[] = [], cell = "", inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"' && text[i+1] === '"') { cell += '"'; i++; }
        else if (c === '"') inQ = false;
        else cell += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ",") { cur.push(cell); cell = ""; }
        else if (c === "\n") { cur.push(cell); rows.push(cur); cur = []; cell = ""; }
        else if (c === "\r") {}
        else cell += c;
      }
    }
    if (cell.length || cur.length) { cur.push(cell); rows.push(cur); }
    const headers = (rows.shift() || []).map(h => h.trim().toLowerCase());
    return rows.filter(r => r.some(v => v.trim())).map(r => {
      const o: Record<string,string> = {};
      headers.forEach((h, i) => { o[h] = (r[i] ?? "").trim(); });
      return o;
    });
  }

  async function handleCsvImport(file: File) {
    setImporting(true);
    setImportProgress({ done: 0, total: 0 });
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) { toast.error("CSV is empty"); return; }
      setImportProgress({ done: 0, total: rows.length });
      let ok = 0, fail = 0;
      for (const r of rows) {
        if (!r.name || !r.price) { fail++; continue; }
        const imgs = (r.images || "").split("|").map(s=>s.trim()).filter(Boolean)
          .map(ref => csvImages[ref] || ref); // map filename -> uploaded URL, else use as-is
        const payload = {
          name: r.name,
          slug: slugify(r.name) + "-" + Math.random().toString(36).slice(2,6),
          category: (r.category || "men").toLowerCase(),
          subcategory: r.subcategory || null,
          brand: r.brand || null,
          price: Number(r.price) || 0,
          condition: r.condition || "good",
          sizes: (r.sizes || "").split("|").map(s=>s.trim()).filter(Boolean),
          images: imgs,
          description: r.description || null,
          stock: Number(r.stock) || 1,
          featured: /^(1|true|yes)$/i.test(r.featured || ""),
          sold_out: /^(1|true|yes)$/i.test(r.sold_out || ""),
        };
        const { error } = await supabase.from("products").insert(payload as any);
        if (error) { fail++; console.error(r.name, error.message); } else ok++;
        setImportProgress(p => p ? { ...p, done: p.done + 1 } : p);
      }
      toast.success(`Imported ${ok} product(s)${fail?`, ${fail} failed`:""}`);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (e:any) {
      toast.error(e.message || "Import failed");
    } finally {
      setImporting(false);
      setImportProgress(null);
      if (csvRef.current) csvRef.current.value = "";
    }
  }

  function downloadTemplate() {
    const headers = ["name","category","subcategory","brand","price","condition","sizes","stock","description","featured","sold_out","images"];
    const sample = ["Nike Air Max","men","sneakers","Nike","4500","good","40|41|42|43","3","Clean pair, barely worn","true","false","airmax-1.jpg|airmax-2.jpg"];
    const csv = headers.join(",") + "\n" + sample.map(v => `"${v.replace(/"/g,'""')}"`).join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "products-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function toggleFeatured(id: string, val: boolean) {
    const { error } = await supabase.from("products").update({ featured: !val }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function toggleSoldOut(id: string, val: boolean) {
    const { error } = await supabase.from("products").update({ sold_out: !val } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(!val ? "Marked sold out" : "Back in stock");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="display-font text-2xl font-bold">Products ({data?.length ?? 0})</h2>
        <button onClick={()=> open ? resetForm() : setOpen(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold">
          <Plus className="size-4"/> {open ? "Close" : "New Product"}
        </button>
      </div>

      {/* CSV Bulk Import */}
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><FileUp className="size-4"/> Bulk import from CSV</h3>
            <p className="text-xs text-muted-foreground mt-1">Upload images first (optional), then a CSV. Reference uploaded images in the CSV by filename, separated with <code className="px-1 bg-secondary/40 rounded">|</code>.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={downloadTemplate} className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg glass hover:text-primary">
              <Download className="size-3"/> Template
            </button>
            <label className={`inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg glass cursor-pointer hover:text-primary ${uploading?"opacity-50 pointer-events-none":""}`}>
              {uploading ? <Loader2 className="size-3 animate-spin"/> : <Upload className="size-3"/>}
              Images ({Object.keys(csvImages).length})
              <input ref={csvImgRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e=>uploadCsvImages(e.target.files)} disabled={uploading}/>
            </label>
            <label className={`inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground font-semibold cursor-pointer ${importing?"opacity-50 pointer-events-none":""}`}>
              {importing ? <Loader2 className="size-3 animate-spin"/> : <FileUp className="size-3"/>}
              {importing && importProgress ? `Importing ${importProgress.done}/${importProgress.total}` : "Import CSV"}
              <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden"
                onChange={e=>e.target.files?.[0] && handleCsvImport(e.target.files[0])} disabled={importing}/>
            </label>
          </div>
        </div>
        {Object.keys(csvImages).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1 max-h-20 overflow-auto">
            {Object.keys(csvImages).map(fn => (
              <span key={fn} className="text-[10px] px-2 py-0.5 rounded bg-secondary/40 border border-border">{fn}</span>
            ))}
            <button onClick={()=>setCsvImages({})} className="text-[10px] text-destructive hover:underline ml-2">Clear</button>
          </div>
        )}
      </div>

      {open && (
        <div className="glass rounded-2xl p-5 mb-6 grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 flex items-center justify-between">
            <h3 className="font-semibold">{editingId ? "Edit product" : "New product"}</h3>
            {editingId && <button onClick={resetForm} className="text-xs text-muted-foreground hover:text-foreground">Cancel edit</button>}
          </div>
          <In label="Name" v={form.name} on={v=>setForm({...form,name:v})}/>
          <In label="Brand" v={form.brand} on={v=>setForm({...form,brand:v})}/>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Category</label>
            <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
              className="mt-1 w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 outline-none">
              <option value="men">Men</option><option value="ladies">Ladies</option><option value="kids">Kids</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Type / Subcategory</label>
            <select value={form.subcategory} onChange={e=>setForm({...form,subcategory:e.target.value})}
              className="mt-1 w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 outline-none">
              <option value="">— None —</option>
              {form.category === "men" && <>
                <option value="sneakers">Sneakers</option>
                <option value="boots">Boots</option>
                <option value="loafers">Loafers</option>
                <option value="oxford">Oxford</option>
                <option value="derby">Derby</option>
                <option value="sandals">Sandals</option>
                <option value="slippers">Slippers</option>
                <option value="running">Running</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </>}
              {form.category === "ladies" && <>
                <option value="heels">Heels</option>
                <option value="sneakers">Sneakers</option>
                <option value="boots">Boots</option>
                <option value="flats">Flats</option>
                <option value="sandals">Sandals</option>
              </>}
              {form.category === "kids" && <>
                <option value="school">School</option>
                <option value="sport">Sport</option>
                <option value="sandals">Sandals</option>
                <option value="casual">Casual</option>
              </>}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Condition</label>
            <select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})}
              className="mt-1 w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 outline-none">
              <option value="new">New</option><option value="like-new">Like New</option><option value="good">Good</option><option value="fair">Fair</option>
            </select>
          </div>
          <In label="Price (KES)" v={form.price} on={v=>setForm({...form,price:v})}/>
          <In label="Stock" v={form.stock} on={v=>setForm({...form,stock:v})}/>
          <In label="Sizes (comma)" v={form.sizes} on={v=>setForm({...form,sizes:v})}/>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Product Images</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.images.map((url, i) => (
                <div key={i} className="relative size-20 rounded-lg overflow-hidden bg-secondary/30 border border-border group">
                  <img src={url} alt="" className="w-full h-full object-cover"/>
                  <button type="button" onClick={()=>removeImage(i)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                    <X className="size-3"/>
                  </button>
                  {i===0 && <span className="absolute bottom-0 inset-x-0 text-[10px] text-center bg-primary/80 text-primary-foreground">Main</span>}
                </div>
              ))}
              <label className="size-20 rounded-lg border-2 border-dashed border-border grid place-items-center cursor-pointer hover:border-primary text-muted-foreground hover:text-primary transition">
                {uploading ? <Loader2 className="size-5 animate-spin"/> : <Upload className="size-5"/>}
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e=>handleUpload(e.target.files)} disabled={uploading}/>
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Upload one or more images. First image is the main display.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3}
              className="mt-1 w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 outline-none"/>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/> Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.sold_out} onChange={e=>setForm({...form,sold_out:e.target.checked})}/> Sold out
          </label>
          <button onClick={save} disabled={uploading} className="sm:col-span-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold disabled:opacity-50">
            {editingId ? "Update Product" : "Save Product"}
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((p:any)=>(
          <div key={p.id} className="glass rounded-2xl p-4">
            <div className="relative aspect-square rounded-xl bg-secondary/30 overflow-hidden grid place-items-center">
              {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain p-3"/> : <span className="text-muted-foreground text-xs">No image</span>}
              {p.sold_out && <span className="absolute m-2 px-2 py-0.5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-md">SOLD OUT</span>}
            </div>
            <div className="mt-3 flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="font-semibold truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{p.category} · {p.condition}</p>
                <p className="text-primary font-bold mt-1">{formatKES(Number(p.price))}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={()=>toggleFeatured(p.id, p.featured)} title="Featured"
                  className={`p-1.5 rounded-lg ${p.featured?"bg-primary text-primary-foreground":"glass"}`}><Star className="size-4"/></button>
                <button onClick={()=>toggleSoldOut(p.id, p.sold_out)} title={p.sold_out ? "Mark in stock" : "Mark sold out"}
                  className={`p-1.5 rounded-lg text-[10px] font-bold ${p.sold_out?"bg-destructive text-destructive-foreground":"glass"}`}>SO</button>
                <button onClick={()=>startEdit(p)} title="Edit" className="p-1.5 rounded-lg glass hover:text-primary"><Pencil className="size-4"/></button>
                <button onClick={()=>remove(p.id)} className="p-1.5 rounded-lg glass hover:text-destructive"><Trash2 className="size-4"/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function In({label,v,on}:{label:string;v:string;on:(v:string)=>void}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input value={v} onChange={e=>on(e.target.value)}
        className="mt-1 w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary"/>
    </label>
  );
}