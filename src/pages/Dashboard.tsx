import { Link } from "react-router-dom";
import { Plus, ChevronDown, Download, FileSpreadsheet } from "lucide-react";
import { motion } from "motion/react";
import React, { useState, useRef } from "react";
import { useApp } from "../contexts/AppContext";
import { Editable } from "../components/Editable";
import Papa from "papaparse";

/* ── EXACT colours from standalone HTML :root ──────────────────── */
const INK        = "#0c0d0e";
const INK_SOFT   = "#494d52";
const INK_FAINT  = "#737a82";
const ACCENT     = "#1c3f63";
const LINE       = "#e5e7ea";
const LINE_STRONG= "#d3d7db";
const COST       = "#a32c1c";
const PANEL      = "#f5f6f7";
const SURFACE    = "#ffffff";

/* ── EXACT fonts from :root ─────────────────────────────────────── */
const FONT_DISPLAY = "'Archivo', system-ui, sans-serif";
const FONT_MONO    = "'IBM Plex Mono', monospace";

/* ── Shared horizontal padding (responsive) ─────────────────────── */
const PX = "px-4 sm:px-8 md:px-[5vw] lg:px-[5vw]";

/* ── Default data seeds (from standalone HTML window.* globals) ── */
const DEFAULT_HEADLINES = [
  { id: "h1", v: "12",    k: "problems found & solved" },
  { id: "h2", v: "7",     k: "areas of the business"   },
  { id: "h3", v: "62%",   k: "biggest cycle-time cut"  },
  { id: "h4", v: "3d→2h", k: "fastest turnaround win"  },
];
const DEFAULT_METHOD = [
  { id: "m1", n: "01", t: "Watch the signals",      d: "Anomalies, repeat complaints, the spreadsheet everyone secretly relies on. Problems announce themselves before they hit a dashboard." },
  { id: "m2", n: "02", t: "Quantify the bleed",     d: "Turn the symptom into a number — rupees, percentage points, hours. If it can't be sized, it can't be prioritized." },
  { id: "m3", n: "03", t: "Frame the real problem", d: "Separate the symptom from the root cause. The obvious problem is rarely the expensive one underneath it." },
  { id: "m4", n: "04", t: "Ship the smallest fix",  d: "Design the minimal change that stops the bleed and proves the thesis — then scale what works." },
];

export default function Dashboard() {
  const { data, updateData, isEditing } = useApp();
  const { hero, nodes, specs } = data;
  const d = data as any;

  const headlines: typeof DEFAULT_HEADLINES = d.headlines ?? DEFAULT_HEADLINES;
  const method: typeof DEFAULT_METHOD       = d.method    ?? DEFAULT_METHOD;

  const [catFilter, setCatFilter] = useState("ALL");
  const casebookRef = useRef<HTMLElement>(null);
  const methodRef   = useRef<HTMLElement>(null);

  /* unique categories */
  const allCats: string[] = [
    "ALL",
    ...Array.from(new Set(
      (nodes || [])
        .map((n: any) => (n.content?.productBucket || "").trim())
        .filter((c: string) => c && c !== "Define Category")
    )) as string[]
  ];

  const filteredNodes = catFilter === "ALL"
    ? (nodes || [])
    : (nodes || []).filter((n: any) => (n.content?.productBucket || "").trim() === catFilter);

  /* animation */
  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const fadeUp  = {
    hidden: { opacity: 0, y: 18 },
    show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 26 } },
  };

  /* helpers for nested data updates */
  const updH = (fn: (h: typeof DEFAULT_HEADLINES) => typeof DEFAULT_HEADLINES) =>
    updateData((p: any) => ({ ...p, headlines: fn(p.headlines ?? DEFAULT_HEADLINES) }));
  const updM = (fn: (m: typeof DEFAULT_METHOD) => typeof DEFAULT_METHOD) =>
    updateData((p: any) => ({ ...p, method: fn(p.method ?? DEFAULT_METHOD) }));

  const handleExportDashboard = () => {
    const rows: { section: string, key: string, value: string }[] = [];
    
    // Hero
    Object.entries(data.hero || {}).forEach(([k, v]) => {
      rows.push({ section: 'hero', key: k, value: String(v) });
    });

    // Headlines
    (d.headlines || DEFAULT_HEADLINES).forEach((h: any, i: number) => {
      rows.push({ section: `headlines[${i}]`, key: 'v', value: h.v });
      rows.push({ section: `headlines[${i}]`, key: 'k', value: h.k });
      rows.push({ section: `headlines[${i}]`, key: 'id', value: h.id });
    });

    // Method
    rows.push({ section: 'dashboard', key: 'methodHeading', value: d.methodHeading || '' });
    rows.push({ section: 'dashboard', key: 'methodCadence', value: d.methodCadence || '' });
    (d.method || DEFAULT_METHOD).forEach((m: any, i: number) => {
      rows.push({ section: `method[${i}]`, key: 'n', value: m.n });
      rows.push({ section: `method[${i}]`, key: 't', value: m.t });
      rows.push({ section: `method[${i}]`, key: 'd', value: m.d });
      rows.push({ section: `method[${i}]`, key: 'id', value: m.id });
    });

    // Specs
    (specs || []).forEach((s: any, i: number) => {
      rows.push({ section: `specs[${i}]`, key: 'label', value: s.label });
      rows.push({ section: `specs[${i}]`, key: 'value', value: String(s.value) });
      rows.push({ section: `specs[${i}]`, key: 'id', value: s.id });
    });

    // Labels
    Object.entries(data.navLabels || {}).forEach(([k, v]) => {
      rows.push({ section: 'navLabels', key: k, value: String(v) });
    });

    // Protocols (Nodes)
    (d.nodes || []).forEach((node: any, i: number) => {
      // We need flattenNode here too, or just inline the logic
      rows.push({ section: `nodes[${i}]`, key: 'id', value: node.id || '' });
      rows.push({ section: `nodes[${i}]`, key: 'date', value: node.date || '' });
      rows.push({ section: `nodes[${i}]`, key: 'title', value: node.title || '' });
      rows.push({ section: `nodes[${i}]`, key: 'description', value: node.description || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.videoUrl', value: node.assets?.videoUrl || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.videoDuration', value: node.assets?.videoDuration || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.deckUrl', value: node.assets?.deckUrl || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.deckSize', value: node.assets?.deckSize || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.deckText', value: node.assets?.deckText || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.bgImageUrl', value: node.assets?.bgImageUrl || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.systemFlowUrl', value: node.assets?.systemFlowUrl || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.role', value: node.content?.role || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.scope', value: node.content?.scope || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.status', value: node.content?.status || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.headerId', value: node.content?.headerId || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.stat1Val', value: node.content?.stat1Val || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.stat1Lbl', value: node.content?.stat1Lbl || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.stat2Val', value: node.content?.stat2Val || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.stat2Lbl', value: node.content?.stat2Lbl || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.problem', value: node.content?.problem || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.solutions', value: node.content?.solutions || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.impact', value: node.content?.impact || '' });
      // Complex ones
      rows.push({ section: `nodes[${i}]`, key: 'content.solutionFlow', value: node.content?.solutionFlow ? JSON.stringify(node.content.solutionFlow) : '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.systemFlow', value: node.content?.systemFlow ? JSON.stringify(node.content.systemFlow) : '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.impactTiles', value: node.content?.impactTiles ? JSON.stringify(node.content.impactTiles) : '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.audiences', value: node.content?.audiences ? JSON.stringify(node.content.audiences) : '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.buckets', value: node.content?.buckets ? JSON.stringify(node.content.buckets) : '' });
    });

    rows.push({ section: 'dashboard', key: 'casebookTitle', value: d.casebookTitle || '' });
    rows.push({ section: 'dashboard', key: 'casebookSub', value: d.casebookSub || '' });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard_full_backup.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col flex-1 w-full min-w-0 overflow-x-hidden pb-20 md:pb-0"
      style={{ background: SURFACE, color: INK, fontFamily: FONT_DISPLAY }}
    >

      {/* ══ NAV ═══════════════════════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-20 flex items-center justify-between gap-6 ${PX} border-b`}
        style={{ borderColor: LINE_STRONG, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", padding: "12px clamp(15px,4vw,60px)" }}
      >
        <a href="#" className="flex items-center gap-3 text-inherit no-underline">
          <div className="w-8 h-8 md:w-9 md:h-9 grid place-items-center flex-none"
               style={{ background: INK, color: "#fff", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, letterSpacing: "0.02em" }}>
            AM
          </div>
          <div className="flex flex-col leading-tight">
            <span style={{ fontWeight: 700, fontSize: 13.5, letterSpacing: "-0.01em" }}>Anshul M.</span>
            <span className="hidden sm:block" style={{ fontFamily: FONT_MONO, fontSize: 10, color: INK_FAINT, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Problem Solver
            </span>
          </div>
        </a>
        <nav className="flex items-center gap-4 md:gap-7">
          <button onClick={() => methodRef.current?.scrollIntoView({ behavior: "smooth" })}
            style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, fontWeight: 500, color: INK_SOFT, background: "none", border: "none", cursor: "pointer" }}
            className="hover:text-[#0c0d0e] transition-colors hidden xs:block">Method</button>
          <button onClick={() => casebookRef.current?.scrollIntoView({ behavior: "smooth" })}
            style={{ fontFamily: FONT_DISPLAY, fontSize: 12.5, fontWeight: 600, color: "#fff", background: INK, padding: "8px 14px", border: "none", cursor: "pointer" }}
            className="hover:bg-[#1c3f63] transition-colors">Casebook</button>
        </nav>
      </header>

      {/* ══ TICKER ════════════════════════════════════════════════════ */}
      <div className="overflow-hidden whitespace-nowrap shrink-0" style={{ background: INK }}>
        <div className="py-1.5" style={{ fontFamily: FONT_MONO, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.6)" }}>
          {[0, 1].map(k => (
            <span key={k} className={`inline-block ${k === 1 ? "ml-6" : ""} animate-marquee`}>
              SYSTEM_UPTIME: 99.9% // NODES_ACTIVE: {(nodes || []).length} // LAST_SYNC: {new Date().toLocaleTimeString()} // PROTOCOL_VERSION: 2.1.0 //&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section className="border-b" style={{ borderColor: LINE_STRONG, padding: "clamp(48px,7vw,92px) clamp(20px,5vw,80px) 0" }}>

        {/* Availability status */}
        <div className="flex items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-2.5"
               style={{ fontFamily: FONT_MONO, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_SOFT }}>
            <span className="relative flex-none w-[7px] h-[7px] rounded-full" style={{ background: ACCENT }}>
              <span className="absolute inset-[-4px] rounded-full border animate-ping" style={{ borderColor: ACCENT, animationDuration: "2.4s" }} />
            </span>
            <Editable value={hero.terminal1 || "Taking on one problem a week"}
              onChange={v => updateData(p => ({ ...p, hero: { ...p.hero, terminal1: v } }))} />
          </div>

          {isEditing && (
            <button 
              onClick={handleExportDashboard}
              className="flex items-center gap-2 px-3 py-1.5 border hover:border-primary transition-all active:scale-95 group"
              style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: INK_FAINT, borderColor: LINE_STRONG, background: SURFACE }}
              title="Download Dashboard Content CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
              <span className="group-hover:text-primary transition-colors">EXPORT_DASH_CSV</span>
            </button>
          )}
        </div>

        <div className="mb-6 md:mb-7 pb-3 md:pb-4 border-b flex-none" style={{ borderColor: LINE, display: "inline-block" }}>
          <span className="font-mono text-[11px] md:text-[12px] uppercase tracking-[0.15em]" style={{ color: INK_FAINT }}>
            <Editable value={hero.terminal2 || "Product & Business Problem Solver"}
              onChange={v => updateData(p => ({ ...p, hero: { ...p.hero, terminal2: v } }))} />
          </span>
        </div>

        {/* Thesis — giant Archivo, name + role stacked */}
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.0 }}>
          <motion.span
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="block" style={{ fontSize: "clamp(34px, 6.4vw, 80px)", color: INK }}
          >
            <Editable value={hero.name} onChange={v => updateData(p => ({ ...p, hero: { ...p.hero, name: v } }))} />
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="block" style={{ fontSize: "clamp(28px, 5.2vw, 66px)", color: ACCENT }}
          >
            <Editable value={hero.role} onChange={v => updateData(p => ({ ...p, hero: { ...p.hero, role: v } }))} />
          </motion.span>
        </h1>

        {/* Pitch */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-7 mb-9"
          style={{ maxWidth: "58ch", fontSize: "clamp(16px,1.6vw,19px)", color: INK_SOFT, lineHeight: 1.55 }}
        >
          <Editable value={hero.desc} onChange={v => updateData(p => ({ ...p, hero: { ...p.hero, desc: v } }))} />
        </motion.p>

        {/* CTA buttons */}
        <motion.div className="flex flex-wrap gap-3 mb-14 md:mb-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <button
            onClick={() => casebookRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-2 transition-colors hover:bg-[#1c3f63]"
            style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, padding: "13px 22px", background: INK, color: "#fff", border: "1px solid transparent", cursor: "pointer" }}
          >
            See the casebook <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => methodRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-2 transition-colors hover:border-[#0c0d0e]"
            style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, padding: "13px 22px", background: "none", color: INK, border: `1px solid ${LINE_STRONG}`, cursor: "pointer" }}
          >
            How I work
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 border-t border-l mt-8"
          style={{ borderColor: LINE_STRONG }}
        >
          {headlines.map(h => (
            <div key={h.id} className="relative border-r border-b p-5 md:p-7"
                 style={{ borderColor: LINE }}>
              {isEditing && (
                <button onClick={() => updH(arr => arr.filter(x => x.id !== h.id))}
                  className="absolute top-1.5 right-1.5 text-red-400 hover:text-red-600"
                  style={{ fontFamily: FONT_MONO, fontSize: 10 }}>✕</button>
              )}
              {/* Value */}
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(28px,3.6vw,44px)", letterSpacing: "-0.03em", color: INK, fontVariantNumeric: "tabular-nums" }}>
                <Editable value={h.v} onChange={v => updH(arr => arr.map(x => x.id === h.id ? { ...x, v } : x))} />
              </div>
              {/* Key */}
              <div className="mt-2" style={{ fontFamily: FONT_MONO, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.06em", color: INK_FAINT }}>
                <Editable value={h.k} onChange={v => updH(arr => arr.map(x => x.id === h.id ? { ...x, k: v } : x))} />
              </div>
            </div>
          ))}
          {isEditing && (
            <button onClick={() => updH(arr => [...arr, { id: `h-${Date.now()}`, v: "—", k: "new stat" }])}
              className="border-r border-b p-6 flex items-center justify-center gap-1.5 border-dashed transition-colors hover:border-[#0c0d0e]"
              style={{ fontFamily: FONT_MONO, fontSize: 11, textTransform: "uppercase", color: INK_FAINT, borderColor: LINE, background: SURFACE }}>
              <Plus className="w-3.5 h-3.5" /> Add stat
            </button>
          )}
        </motion.div>
      </section>

      {/* ══ 01 / METHOD ══════════════════════════════════════════════ */}
      <section ref={methodRef} className="border-b" style={{ borderColor: LINE_STRONG, padding: "clamp(56px,7vw,100px) clamp(20px,5vw,80px)" }}>
        {/* Kicker */}
        <p style={{ fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: ACCENT, marginBottom: 20 }}>
          01 / Method
        </p>

        {/* Heading */}
        <h2 style={{ maxWidth: 820, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "clamp(23px,2.9vw,36px)", lineHeight: 1.1, letterSpacing: "-0.025em", color: INK }}>
          <Editable
            multiline
            value={d.methodHeading ?? "Anyone can solve an assigned problem.\nThe skill is finding the expensive one first."}
            onChange={v => updateData((p: any) => ({ ...p, methodHeading: v }))}
          />
        </h2>

        {/* Method cards grid */}
        <div className="mt-12 border-t-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
             style={{ borderColor: INK }}>
          {method.map((m, i) => (
            <div key={m.id} className="relative border-r last:border-r-0 border-b sm:border-b-0"
                 style={{ padding: "24px 26px 30px 0", borderColor: LINE }}>
              {isEditing && (
                <button onClick={() => updM(arr => arr.filter(x => x.id !== m.id))}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                  style={{ fontFamily: FONT_MONO, fontSize: 10 }}>✕</button>
              )}
              {/* Number — accent coloured */}
              <p style={{ fontFamily: FONT_MONO, fontSize: 12, color: ACCENT, letterSpacing: "0.08em", marginBottom: 16 }}>{m.n}</p>
              {/* Title */}
              <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18.5, letterSpacing: "-0.015em", lineHeight: 1.18, marginBottom: 11, color: INK }}>
                <Editable value={m.t} onChange={v => updM(arr => arr.map(x => x.id === m.id ? { ...x, t: v } : x))} />
              </h3>
              {/* Description */}
              <p style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, color: INK_SOFT, lineHeight: 1.6, maxWidth: "35ch" }}>
                <Editable multiline value={m.d} onChange={v => updM(arr => arr.map(x => x.id === m.id ? { ...x, d: v } : x))} />
              </p>
            </div>
          ))}
          {isEditing && (
            <button onClick={() => updM(arr => [...arr, { id: `m-${Date.now()}`, n: String(arr.length + 1).padStart(2, "0"), t: "New step", d: "Description." }])}
              className="p-6 flex items-center justify-center gap-1.5 border-dashed border-r last:border-r-0"
              style={{ fontFamily: FONT_MONO, fontSize: 11, color: INK_FAINT, borderColor: LINE }}>
              <Plus className="w-3.5 h-3.5" /> Add Step
            </button>
          )}
        </div>

        {/* Cadence */}
        <p className="mt-12 pt-5 border-t"
           style={{ borderColor: LINE, fontFamily: FONT_MONO, fontSize: 13, letterSpacing: "0.03em", color: INK_FAINT }}>
          <Editable
            value={d.methodCadence ?? "One real problem framed and solved every week."}
            onChange={v => updateData((p: any) => ({ ...p, methodCadence: v }))}
          />
        </p>
      </section>

      {/* ══ 02 / CASEBOOK ════════════════════════════════════════════ */}
      <section ref={casebookRef} style={{ background: PANEL, padding: "clamp(56px,7vw,100px) clamp(20px,5vw,80px)", borderTop: `1px solid ${LINE_STRONG}` }}>
        {/* Kicker */}
        <p style={{ fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: ACCENT, marginBottom: 20 }}>
          02 / Casebook
        </p>
        {/* Title */}
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "clamp(25px,3.3vw,40px)", lineHeight: 1.1, letterSpacing: "-0.025em", color: INK }}>
          <Editable
            value={d.casebookTitle ?? "Problems found, sized, and solved."}
            onChange={v => updateData((p: any) => ({ ...p, casebookTitle: v }))}
          />
        </h2>
        {/* Sub */}
        <p className="mt-4" style={{ color: INK_SOFT, fontSize: 16.5, maxWidth: "62ch", lineHeight: 1.6 }}>
          <Editable
            value={d.casebookSub ?? "Each one starts with a signal most teams miss — and ends with a number on the board."}
            onChange={v => updateData((p: any) => ({ ...p, casebookSub: v }))}
          />
        </p>

        {/* Category filter chips — IBM Plex Mono, matches HTML .chip style */}
        <div className="flex flex-wrap gap-2 mt-8 mb-4">
          {allCats.map(cat => {
            const count = cat === "ALL" ? (nodes || []).length : (nodes || []).filter((n: any) => (n.content?.productBucket || "").trim() === cat).length;
            const active = catFilter === cat;
            return (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className="inline-flex items-center gap-2 transition-all font-mono text-[10.5px] md:text-[12px] font-normal px-3 py-1.5 md:px-3.5 md:py-2"
                style={{
                  color:       active ? "#fff" : INK_SOFT,
                  background:  active ? INK   : SURFACE,
                  border:      `1px solid ${active ? INK : LINE_STRONG}`,
                  cursor:      "pointer",
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = INK; (e.currentTarget as HTMLButtonElement).style.color = INK; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.borderColor = LINE_STRONG; (e.currentTarget as HTMLButtonElement).style.color = INK_SOFT; } }}
              >
                {cat === "ALL" ? "All" : cat}
                <span style={{ fontSize: 11, opacity: active ? 0.8 : 0.55 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Case list */}
        <motion.div key={catFilter} variants={stagger} initial="hidden" animate="show"
          className="flex flex-col mt-6" style={{ borderTop: `2px solid ${INK}` }}>
          {(filteredNodes || []).map((node: any, idx: number) => (
            <motion.article key={node.id} variants={fadeUp}
              className="relative" style={{ borderBottom: `1px solid ${LINE_STRONG}`, padding: "40px 0" }}>

              {isEditing && (
                <button onClick={() => updateData(p => ({ ...p, nodes: (p.nodes || []).filter((n: any) => n.id !== node.id) }))}
                  className="absolute top-3 right-0 z-10 border hover:text-red-600 transition-colors"
                  style={{ fontFamily: FONT_MONO, fontSize: 10, color: COST, borderColor: COST, padding: "2px 8px", background: SURFACE }}>
                  REMOVE
                </button>
              )}

              {/* rail + main: flex-col mobile → 2-col grid desktop */}
              <div className="flex flex-col md:grid md:gap-11"
                   style={{ gridTemplateColumns: "210px 1fr" } as React.CSSProperties}>

                {/* ── RAIL ── */}
                <div className="flex flex-row flex-wrap items-baseline gap-x-4 gap-y-1.5 mb-6 md:mb-0 md:flex-col md:gap-3.5 md:sticky md:top-20 md:self-start">
                  {/* Case index */}
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: INK_FAINT }}>
                    Case {String(idx + 1).padStart(2, "0")}
                  </span>

                  {/* Primary Metric */}
                  <div className="flex flex-col gap-1">
                    <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(34px,3.4vw,46px)", lineHeight: 0.95, letterSpacing: "-0.04em", color: ACCENT, fontVariantNumeric: "tabular-nums" }}>
                      <Editable value={node.content?.railMetricVal || ""}
                        onChange={v => updateData(p => ({ ...p, nodes: (p.nodes || []).map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, railMetricVal: v } } : n) }))} />
                    </span>
                    {(node.content?.railMetricVal || isEditing) && (
                      <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: INK_FAINT }}>
                        <Editable value={node.content?.railMetricLbl || ""}
                          onChange={v => updateData(p => ({ ...p, nodes: (p.nodes || []).map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, railMetricLbl: v } } : n) }))} />
                      </span>
                    )}
                  </div>

                  {/* Category / Domain */}
                  <div className="md:border-t md:pt-2" style={{ borderColor: LINE }}>
                    <span className="block mb-0.5 hidden md:block" style={{ fontFamily: FONT_MONO, fontSize: 10, color: INK_FAINT, letterSpacing: "0.06em", textTransform: "uppercase" }}>Category</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_SOFT }}>
                      <Editable value={node.content?.productBucket || ""}
                        onChange={v => updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, productBucket: v } } : n) }))} />
                    </span>
                  </div>
                </div>

                {/* ── MAIN ── */}
                <div className="min-w-0">
                  {/* Case title */}
                  <h3 className="hover:text-[#1c3f63] transition-colors" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "clamp(20px,2.3vw,27px)", lineHeight: 1.16, letterSpacing: "-0.02em", color: INK, maxWidth: "26ch" }}>
                    <Editable multiline value={node.title}
                      onChange={v => updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, title: v } : n) }))} />
                  </h3>

                  {/* 2×2 Stat Grid */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-x-10">
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} className="flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between gap-2">
                           <span style={{ 
                             fontFamily: FONT_MONO, 
                             fontSize: 10.5, 
                             fontWeight: 500, 
                             letterSpacing: "0.12em", 
                             textTransform: "uppercase", 
                             color: (node.content?.[`stat${idx}Lbl`] || "").toUpperCase().includes("COST") ? "#f87171" : (idx === 1 ? ACCENT : INK_FAINT) 
                           }}>
                             <Editable value={node.content?.[`stat${idx}Lbl`] || "—"}
                               onChange={v => updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, [`stat${idx}Lbl`]: v } } : n) }))} />
                           </span>
                           <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600, color: INK }}>
                             <Editable value={node.content?.[`stat${idx}Val`] || ""}
                               onChange={v => updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, [`stat${idx}Val`]: v } } : n) }))} />
                           </span>
                        </div>
                        <p style={{ fontSize: 15.5, color: INK_SOFT, lineHeight: 1.55 }}>
                          <Editable multiline value={node.content?.[`stat${idx}Desc`] || (idx === 1 ? node.description : "—")}
                            onChange={v => updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, [`stat${idx}Desc`]: v } } : n) }))} />
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Skills tags etc. (rest of the design) */}
                  <div className="flex flex-wrap items-center gap-2 mt-6">
                    {(() => {
                      const skillsList = (node.content?.scope || "")
                        .split(",")
                        .map((s: string) => s.trim())
                        .filter(Boolean);

                      return (
                        <>
                          {skillsList.map((skill: string, si: number) => (
                            <span key={si} className="relative group/skill flex items-center" style={{ fontFamily: FONT_MONO, fontSize: 11, color: INK_SOFT, background: SURFACE, border: `1px solid ${LINE_STRONG}`, padding: "5px 11px" }}>
                              <Editable value={skill}
                                onChange={v => {
                                  const newList = [...skillsList];
                                  if (v.trim()) { newList[si] = v.trim(); } else { newList.splice(si, 1); }
                                  updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, scope: newList.join(", ") } } : n) }));
                                }} 
                              />
                              {isEditing && (
                                <button onClick={() => {
                                  const newList = [...skillsList];
                                  newList.splice(si, 1);
                                  updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, scope: newList.join(", ") } } : n) }));
                                }} className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white flex items-center justify-center rounded-full text-[8px] opacity-0 group-hover/skill:opacity-100 transition-opacity">✕</button>
                              )}
                            </span>
                          ))}
                          {isEditing && (
                            <button
                              onClick={() => {
                                const newList = [...skillsList, "New skill"];
                                updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, scope: newList.join(", ") } } : n) }));
                              }}
                              className="flex items-center justify-center gap-1 border-dashed transition-colors hover:border-[#0c0d0e]"
                              style={{ fontFamily: FONT_MONO, fontSize: 11, color: INK_FAINT, padding: "5px 11px", border: `1px dashed ${LINE_STRONG}` }}>
                              <Plus className="w-3 h-3" /> Add skill
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <Link to={`/protocol/${node.id}`}
                    className="mt-6 inline-flex items-center gap-2 group/cta transition-all"
                    style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, color: ACCENT, borderBottom: `1px solid ${ACCENT}20`, paddingBottom: 3, textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.borderBottomColor = ACCENT)}
                    onMouseLeave={e => (e.currentTarget.style.borderBottomColor = `${ACCENT}20`)}>
                    View protocol
                    <span className="transition-transform duration-150 group-hover/cta:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}

          {isEditing && (
            <button className="py-5 w-full flex items-center justify-center gap-2 border-2 border-dashed mt-4 transition-colors hover:border-[#0c0d0e]"
              style={{ fontFamily: FONT_MONO, fontSize: 11, textTransform: "uppercase", color: INK_FAINT, borderColor: LINE_STRONG }}
              onClick={() => updateData(p => ({
                ...p,
                nodes: [...(p.nodes || []), {
                  id: `node-${Date.now()}`, title: "New Protocol", date: "2024.Q1", description: "",
                  assets: { videoUrl: "", videoDuration: "", deckUrl: "", deckSize: "", bgImageUrl: "", systemFlowUrl: "" },
                  content: {
                    stat1Lbl: "", stat1Val: "", stat1Desc: "",
                    stat2Lbl: "", stat2Val: "", stat2Desc: "",
                    stat3Lbl: "", stat3Val: "", stat3Desc: "",
                    stat4Lbl: "", stat4Val: "", stat4Desc: "",
                    productBucket: "", role: "", scope: "", status: "Active Case Study",
                  }
                }]
              }))}>
              <Plus className="w-4 h-4" /> Add Case
            </button>
          )}
        </motion.div>
      </section>

      {/* ══ 03 / RANGE ════════════════════════════════════════════════ */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${LINE_STRONG}`, padding: "clamp(56px,7vw,100px) clamp(20px,5vw,80px)" }}>
        {/* Kicker */}
        <p style={{ fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: ACCENT, marginBottom: 20 }}>
          03 / Range
        </p>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "clamp(25px,3.3vw,40px)", lineHeight: 1.1, letterSpacing: "-0.025em", color: INK, maxWidth: 820 }}>
            <Editable
              value={d.rangeTitle ?? "Not one trick. Wherever the value is leaking."}
              onChange={v => updateData((p: any) => ({ ...p, rangeTitle: v }))}
            />
          </h2>
          {isEditing && (
            <button onClick={() => updateData(p => ({ ...p, specs: [...(p.specs || []), { id: `s-${Date.now()}`, label: "New skill", value: 50 }] }))}
              className="shrink-0 flex items-center gap-1 transition-colors hover:bg-[#1c3f63] hover:text-white"
              style={{ fontFamily: FONT_MONO, fontSize: 11, textTransform: "uppercase", color: ACCENT, border: `1px solid ${ACCENT}`, padding: "8px 14px", background: "none", cursor: "pointer" }}>
              <Plus className="w-3 h-3" /> Add
            </button>
          )}
        </div>

        {/* Range rows */}
        <div className="flex flex-col max-w-3xl" style={{ borderTop: `1px solid ${LINE}` }}>
          {(specs || []).map((spec: any, i: number) => (
            <div key={spec.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 py-4"
                 style={{ borderBottom: `1px solid ${LINE}` }}>
              {/* Label */}
              <div className="flex items-center gap-2 sm:w-52 shrink-0">
                {isEditing && (
                  <button onClick={() => updateData(p => ({ ...p, specs: (p.specs || []).filter((s: any) => s.id !== spec.id) }))}
                    className="text-red-400 hover:text-red-600 shrink-0" style={{ fontSize: 11 }}>✕</button>
                )}
                <span style={{ fontSize: 14.5, fontWeight: 500, color: INK }}>
                  <Editable value={spec.label}
                    onChange={v => updateData(p => ({ ...p, specs: (p.specs || []).map((s: any) => s.id === spec.id ? { ...s, label: v } : s) }))} />
                </span>
              </div>
              {/* Bar */}
              <div className="flex-1 h-2 overflow-hidden" style={{ background: PANEL }}>
                <motion.div className="h-full"
                  initial={{ width: 0 }} animate={{ width: `${spec.value}%` }}
                  transition={{ duration: 1, ease: [0.2, 0.7, 0.2, 1], delay: 0.2 + i * 0.07 }}
                  style={{ background: ACCENT }} />
              </div>
              {/* Value */}
              <span className="sm:w-11 sm:text-right" style={{ fontFamily: FONT_MONO, fontSize: 13, color: INK_FAINT }}>
                <Editable value={String(spec.value)}
                  onChange={v => updateData(p => ({ ...p, specs: (p.specs || []).map((s: any) => s.id === spec.id ? { ...s, value: Number(v) } : s) }))} />
              </span>
            </div>
          ))}
        </div>
      </section>

    </motion.div>
  );
}
